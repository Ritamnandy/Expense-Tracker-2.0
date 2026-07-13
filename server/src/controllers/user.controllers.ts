
import type { Request, Response, CookieOptions } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User, type UserDocument } from "../models/user.models.js";
import { redis } from "../db/redisconnect.db.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto"
import { redisQueue } from "../jobs/queue.jobs.js";
import { logger } from "../utils/logger.js";
import { type AuthRequest } from "../middlewares/auth.middlewares.js";
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
    return crypto.randomBytes( 3 ).toString( "hex" )
}

const AccessTokenOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 6 * 60 * 60 * 1000,
}
const RefreshTokenOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 14 * 24 * 60 * 60 * 1000, //14 days
}

const otpKey = ( email: string ) => `otp:${ email }`

const signUpKey = ( email: string ) => `user:signup:${ email }`

const resendCooldownKey = ( email: string ) => `user:resend:cooldown:${ email }`

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
    await redis.set( otpKey( email ), otpCode, "EX", 60 * 10 )

    const data: registerBody = {
        firstName,
        lastName,
        email,
        password,

    }
    const userName = `${ firstName } ${ lastName }`

    await redis.set( signUpKey( email ), JSON.stringify( data ), "EX", 60 * 30 )

    await redisQueue.add( "send-email-verification-mail",
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
    const { accessToken, refreshToken } = await getTokenPair( createdUser )
    if ( !accessToken || !refreshToken )
    {
        logger.error( "Failed to issue token pair after user creation", { userId: createdUser._id } );
        return res.status( 400 ).json( new ApiError( 400, "Error createing User", [ "Error creating User" ] ) )
    }
    const { password: _password, googleId: _googleId, refreshToken: _oldRefreshToken, isVerified: _isVerified, loginType: _loginType, ...rest } = createdUser.toObject()

    await redis.del( otpKey( email ) )
    await redis.del( signUpKey( email ) )

    logger.info( "User registered and verified", { userId: createdUser._id } );

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
    await redis.set( otpKey( email ), otpCode, "EX", 60 * 10 )   // OTP validity: 10 min

    await redis.set( resendCooldownKey( email ), "true", "EX", 60 )  // resend cooldown: 60 sec — independent of otp cooldown

    await redis.expire( signUpKey( email ), 30 * 60 )  // keep signup session alive for 30 min

    const userName = `${ firstName } ${ lastName }`
    await redisQueue.add( "send-email-verification-mail",
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