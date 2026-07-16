
import type { Request, Response, CookieOptions } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User, type UserDocument, type TokenPayload } from "../models/user.models.js";
import { redis } from "../db/redisconnect.db.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto"
import { EmailQueue } from "../jobs/queue.jobs.js";
import { logger } from "../utils/logger.js";
import { type AuthRequest } from "../middlewares/auth.middlewares.js";
import jwt from "jsonwebtoken"
import { uploadImage, deleteImage } from "../utils/uploadCloudinary.js";
import { seedDefaultCategories } from "../services/categories.services.js";
import { type CategoryDocument } from "../models/categories.models.js";

interface TokenPair
{
    accessToken: string | null
    refreshToken: string | null
}
const getTokenPair = async ( user: UserDocument ): Promise<TokenPair> =>
{
    try
    {
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        if ( !accessToken || !refreshToken )
        {
            logger.error( "Error generating token pair", {
                userId: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
            } );
            return { accessToken: null, refreshToken: null }
        }
        user.refreshToken = refreshToken
        await user.save( { validateBeforeSave: false } )
        return { accessToken, refreshToken }
    } catch ( error )
    {
        logger.error( "Error generating token pair", {
            error: ( error as Error ).message,
            stack: ( error as Error ).stack,
        } );
        return { accessToken: null, refreshToken: null }

    }
}

const getCode = (): string =>
{
    return crypto.randomInt( 100000, 999999 ).toString()
}

const AccessTokenOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 6 * 60 * 60 * 1000, //6 hours
}
const RefreshTokenOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 14 * 24 * 60 * 60 * 1000, //14 days
}

const otpKey = ( email: string ) => `otp:${ email }`

const signUpKey = ( email: string ) => `user:signup:${ email }`

const resendCooldownKey = ( email: string ) => `email:resend:cooldown:${ email }`

// password reset keys

const hashToken = ( token: string ): string =>
{
    return crypto.createHash( "sha256" ).update( token ).digest( "hex" )
}

const resetCooldownKey = ( email: string ) => `password:reset:cooldown:${ email }`

const resetTokenKey = ( hashToken: string ) => `password:reset:${ hashToken }`



interface registerBody
{
    firstName: string
    lastName: string
    email: string
    password: string
}

interface verifyEmailBody
{
    email: string
    token: string
}

interface loginBody
{
    email: string
    password: string
}



const registerUser = asyncHandler( async ( req: Request, res: Response ) =>
{
    const { firstName, lastName, email, password } = req.body as registerBody

    const exsistingUser: UserDocument | null = await User.findOne( { email } )
    if ( exsistingUser )
    {
        logger.warn( "Registration attempt with existing email", {
            email
        } )
        return res.status( 400 ).json( new ApiError( 400, "User already exists", [ "User already exists" ] ) )
    }
    const otpCode = getCode()
    await redis.set( otpKey( email ), otpCode, "EX", 60 * 15 )

    const data: registerBody = {
        firstName,
        lastName,
        email,
        password,

    }
    const userName = `${ firstName } ${ lastName }`

    await redis.set( signUpKey( email ), JSON.stringify( data ), "EX", 60 * 30 )

    await EmailQueue.add( "send-email-verification-mail",
        {
            email,
            userName,
            token: otpCode
        },
        {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        }
    )
    // no token/password logged
    logger.info( "Registration OTP issued", { email } );

    return res.status( 200 ).json( new ApiResponse( 200, "Verification code sent to your email.", [ "Please verify your email to complete registration." ] ) )

} )



const verifyEmail = asyncHandler( async ( req: Request, res: Response ) =>
{
    const { email, token } = req.body as verifyEmailBody

    const otpCode = await redis.get( otpKey( email ) )
    if ( !otpCode || otpCode !== token )
    {
        return res.status( 400 ).json( new ApiError( 400, "Invalid verification code", [ "Invalid verification code" ] ) )
    }
    const data = await redis.get( signUpKey( email ) )
    if ( !data )
    {
        return res.status( 400 ).json( new ApiError( 400, "Verification session expired", [ "Verification session expired" ] ) )
    }
    const userDetails: registerBody = JSON.parse( data as string )
    const createdUser = await User.create( {
        ...userDetails,
        isVerified: true
    } )
    if ( !createdUser )
    {
        logger.error( "User.create returned falsy value", { email } );
        return res.status( 400 ).json( new ApiError( 400, "Error creating user", [ "Error creating user" ] ) )
    }
    const defaultsCategory: CategoryDocument[] | null = await seedDefaultCategories( createdUser._id )
    const { accessToken, refreshToken } = await getTokenPair( createdUser )
    if ( !accessToken || !refreshToken )
    {
        logger.error( "Failed to issue token pair after user creation", { userId: createdUser._id } );
        return res.status( 400 ).json( new ApiError( 400, "Error createing User", [ "Error creating User" ] ) )
    }
    const { password: _password, googleId: _googleId, refreshToken: _oldRefreshToken, isVerified: _isVerified, loginType: _loginType, ...rest } = createdUser.toObject()

    await redis.del( otpKey( email ) )
    await redis.del( signUpKey( email ) )

    logger.info( "User registered and verified", [ { userId: createdUser._id }, { categories: defaultsCategory } ] );

    res.cookie( "AccessToken", accessToken, AccessTokenOptions )
    res.cookie( "RefreshToken", refreshToken, RefreshTokenOptions )
    return res.status( 201 ).json( new ApiResponse( 201, "User registered successfully", [ "User registered successfully", { userdetails: rest } ] ) )
} )


interface ResendCodeBody
{
    email: string;
}


const reSendVerificationCode = asyncHandler( async ( req: Request, res: Response ) =>
{
    const { email } = req.body as ResendCodeBody

    const onCooldown = await redis.get( resendCooldownKey( email ) )

    if ( onCooldown )
    {
        logger.warn( "Resend OTP requested during cooldown", { email } );
        return res
            .status( 429 )
            .json( new ApiError( 429, "Please wait before requesting another code", [ "Please wait 60 seconds before requesting another code" ] ) );
    }
    const data = await redis.get( signUpKey( email ) )
    if ( !data )
    {
        logger.warn( "Resend OTP requested during session expired", { email } );
        return res.status( 400 ).json( new ApiError( 400, "Verification session expired", [ "Verification session expired" ] ) )
    }
    const userDetails: registerBody = JSON.parse( data as string )

    const { firstName, lastName } = userDetails

    const otpCode = getCode()
    await redis.set( otpKey( email ), otpCode, "EX", 60 * 15 )   // OTP validity: 10 min

    await redis.set( resendCooldownKey( email ), "true", "EX", 60 )  // resend cooldown: 60 sec — independent of otp cooldown

    await redis.expire( signUpKey( email ), 30 * 60 )  // keep signup session alive for 30 min

    const userName = `${ firstName } ${ lastName }`
    await EmailQueue.add( "send-email-verification-mail",
        {
            email,
            userName,
            token: otpCode
        },
        {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        }
    )
    // no token/password logged
    logger.info( "Registration OTP resend", { email } );

    return res.status( 200 ).json( new ApiResponse( 200, "Verification code sent to your email.", [ "Please verify your email to complete registration." ] ) )

} )


const loginUser = asyncHandler( async ( req: Request, res: Response ) =>
{
    const { email, password } = req.body as loginBody

    const user: UserDocument | null = await User.findOne( { email } )
    if ( !user )
    {
        logger.warn( "Login attempt with non-existent user", { email } );
        return res.status( 400 ).json( new ApiError( 400, "Email or password is incorrect", [ "Email or password is incorrect" ] ) )
    }
    if ( !user.isVerified )
    {
        logger.warn( "Login attempt with unverified user", { email } );
        return res.status( 400 ).json( new ApiError( 400, "User not found", [ "User not found" ] ) )
    }
    const isPasswordValid = await user.comparePassword( password )
    if ( !isPasswordValid )
    {
        logger.warn( "Login attempt with invalid password", { email } );
        return res.status( 400 ).json( new ApiError( 400, "Invalid password", [ "Invalid password" ] ) )
    }
    const { accessToken, refreshToken } = await getTokenPair( user )
    if ( !accessToken || !refreshToken )
    {
        logger.error( "Failed to issue token pair after user login", { userId: user._id } );
        return res.status( 400 ).json( new ApiError( 400, "Error logging in", [ "Error logging in" ] ) )
    }
    const {
        password: _password,
        googleId: _googleId,
        refreshToken: _oldRefreshToken,
        isVerified: _isVerified,
        loginType: _loginType,
        ...rest
    } = user.toObject()

    res.cookie( "AccessToken", accessToken, AccessTokenOptions )
    res.cookie( "RefreshToken", refreshToken, RefreshTokenOptions )

    logger.info( "User logged in", { userId: user._id } );

    return res.status( 200 ).json( new ApiResponse( 200, "User logged in successfully", [ "User logged in successfully", { userdetails: rest } ] ) )
} )

const logOutUser = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const user: UserDocument | undefined = req.user
    if ( !user )
    {
        logger.warn( "Logout attempt with Unauthorized user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )

    }
    user.refreshToken = null
    await user.save( { validateBeforeSave: false } )
    res.clearCookie( "AccessToken", AccessTokenOptions )
    res.clearCookie( "RefreshToken", RefreshTokenOptions )
    logger.info( "User logged out", { userId: user._id } );
    return res.status( 200 ).json( new ApiResponse( 200, "User logged out successfully", [ "User logged out successfully" ] ) )
} )

const refreshAccessToken = asyncHandler( async ( req: Request, res: Response ) =>
{
    const token = req.cookies.refreshToken || req.body.refreshToken as string
    if ( !token )
    {
        logger.warn( "Refresh token not found" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    try
    {
        const decodedToken: TokenPayload = jwt.verify( token, process.env.REFRESH_TOKEN_SECRET as string ) as TokenPayload
        const user: UserDocument | null = await User.findById( decodedToken?.id )

        if ( !user )
        {
            logger.warn( "Refresh token not found" );
            return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
        }
        const { accessToken, refreshToken } = await getTokenPair( user )
        if ( !accessToken || !refreshToken )
        {
            logger.error( "Failed to issue token pair after user login", { userId: user._id } );
            return res.status( 400 ).json( new ApiError( 400, "Error logging in", [ "Error logging in" ] ) )
        }
        res.cookie( "AccessToken", accessToken, AccessTokenOptions )
        res.cookie( "RefreshToken", refreshToken, RefreshTokenOptions )

        logger.info( "AccessToken refreshed", { userId: user._id } );

        return res.status( 200 ).json( new ApiResponse( 200, "raccessToken refreshed successfully", [ "raccessToken refreshed successfully", {
            accessToken: accessToken,
            refreshToken: refreshToken
        } ] ) )


    } catch ( error )
    {
        logger.error( "Error refreshing access token", { error: ( error as Error ).message } );
        return res.status( 400 ).json( new ApiError( 400, "refresh token not found", [ "refresh token not found" ] ) )
    }
} )



const setAavatar = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const user: UserDocument | undefined = req.user
    const file: Express.Multer.File | undefined = req.file
    const imagePath: string | undefined = file?.path
    if ( !user )
    {
        logger.warn( "upload avatar attempt with Unauthorized user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    if ( !imagePath )
    {
        logger.warn( "Set avatar attempt with no file uploaded", { userId: user._id } );
        return res.status( 400 ).json( new ApiError( 400, "Avatar image is required", [ "Please upload an image file" ] ) );
    }
    const cloudinaryResponse = await uploadImage( imagePath )
    if ( !cloudinaryResponse )
    {
        logger.error( "Error uploading avatar", { userId: user._id } );
        return res.status( 500 ).json( new ApiError( 500, "Error uploading avatar", [ "Error uploading avatar" ] ) );
    }
    const oldImageId = user.avatarId
    const avatarImageUrl = cloudinaryResponse.url.replace( 'https:', '' )
    logger.debug( 'avatar image reference ', avatarImageUrl );

    user.avatar = avatarImageUrl
    user.avatarId = cloudinaryResponse.publicId
    await user.save( { validateBeforeSave: false } )

    await deleteImage( oldImageId )

    logger.info( "Avatar set successfully", { userId: user._id } );

    return res.status( 200 ).json( new ApiResponse( 200, "Avatar set successfully", { avatarUrl: avatarImageUrl } ) )

} )

interface forgotPasswordBody
{
    email: string
}

const forgetPassword = asyncHandler( async ( req: Request, res: Response ) =>
{
    const { email } = req.body as forgotPasswordBody
    const genericResponse = () =>
        res.status( 200 ).json(
            new ApiResponse(
                200,
                "If an account exists with this email, a password reset link has been sent.",
                {}
            )
        );

    const onCooldown = await redis.get( resetCooldownKey( email ) )
    if ( onCooldown )
    {
        logger.warn( "Password reset attempt on cooldown", { email: email } );
        return genericResponse()
    }

    const user: UserDocument | null = await User.findOne( { email: email } );
    if ( !user )
    {
        logger.warn( "Password reset attempt with non-existent email", { email: email } );
        await redis.set( resetCooldownKey( email ), "1", 'EX', 60 )
        return genericResponse()
    }

    if ( !user.isVerified )
    {
        logger.warn( "Password reset attempt with unverified email", { email: email } );
        await redis.set( resetCooldownKey( email ), "1", 'EX', 60 )
        return genericResponse()
    }

    const rowToken = crypto.randomBytes( 32 ).toString( "hex" );

    const hashedToken = hashToken( rowToken );

    await redis.set( resetTokenKey( hashedToken ), user._id.toString(), 'EX', 60 * 10 )
    const resetLink = `${ process.env.FONTEND_RESET_PASSWORD_URL as string }?token=${ rowToken }&email=${ encodeURIComponent( email ) }`

    await EmailQueue.add(
        "send-forgot-password-mail",
        {
            email,
            userName: `${ user.firstName } ${ user.lastName }`,
            resetLink,
        },
        {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 },
        }
    );
    logger.info( "Password reset link issued", { userId: user._id } ); // never log rawToken/resetLink

    return genericResponse();
} )

interface resetPasswordBody extends forgotPasswordBody
{
    token: string
    newPassword: string
}


const resetPassword = asyncHandler( async ( req: Request, res: Response ) =>
{
    const { email, token, newPassword } = req.body as resetPasswordBody
    const hashedToken = hashToken( token )

    const userId: string | null = await redis.get( resetTokenKey( hashedToken ) )
    if ( !userId )
    {
        logger.warn( "Reset-password attempted with invalid or expired token", { email } );
        return res
            .status( 400 )
            .json( new ApiError( 400, "Invalid or expired reset link", [ "This reset link is invalid or has expired, please request a new one" ] ) );
    }

    const user: UserDocument | null = await User.findById( userId )

    if ( !user || user.email !== email )
    {
        logger.warn( "Reset-password attempted with invalid or expired token/user mismatch", { email } );
        return res
            .status( 400 )
            .json( new ApiError( 400, "Invalid or expired reset link", [ "This reset link is invalid or has expired, please request a new one" ] ) );
    }

    user.password = newPassword
    user.refreshToken = null
    await user.save( { validateBeforeSave: false } )
    await redis.del( resetTokenKey( hashedToken ) )
    await EmailQueue.add(
        "send-password-changed-mail",
        {
            email: user.email,
            userName: `${ user.firstName } ${ user.lastName }`,
        },
        {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 },
        }
    );

    logger.info( "Password reset successful", { userId: user._id } );

    return res
        .status( 200 )
        .json( new ApiResponse( 200, "Password reset successfully , please log in with your new password", {} ) );

} )

const getCurrentUser = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const user: UserDocument | undefined = req.user;
    if ( !user )
    {
        logger.warn( "get current user attempt with Unauthorized user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    const { password, refreshToken, googleId, isVerified, avatarId, ...rest } = user.toObject()
    return res.status( 200 ).json( new ApiResponse( 200, "Current user", { user: rest } ) )
} )













export
{
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    reSendVerificationCode,
    verifyEmail,
    setAavatar,
    forgetPassword,
    resetPassword,
    getCurrentUser
}