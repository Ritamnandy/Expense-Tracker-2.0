
import { body, type ValidationChain } from "express-validator"
import type { Request } from "express";

const ALLOWED_MIME_TYPES = [ "image/jpeg", "image/png", "image/webp", "image/jpg" ];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — keep in sync with my Multer config
const registerValidators = (): ValidationChain[] =>
{
    return [
        body( 'firstName' )
            .trim()
            .notEmpty()
            .withMessage( 'First name is required' )
            .bail()
            .isString()
            .withMessage( 'First name must be a string' )
            .isLength( { min: 3, max: 20 } )
            .withMessage( 'First name must be between 3 and 20 characters long' )
            .matches( /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/ )
            .withMessage( 'First name can only contain letters and spaces' ),
        body( 'lastName' )
            .trim()
            .notEmpty()
            .withMessage( 'Last name is required' )
            .bail()
            .isString()
            .withMessage( 'Last name must be a string' )
            .isLength( { min: 3, max: 20 } )
            .withMessage( 'Last name must be between 3 and 20 characters long' )
            .matches( /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/ )
            .withMessage( 'Last name can only contain letters and spaces' ),
        body( 'email' )
            .trim()
            .notEmpty()
            .withMessage( 'Email is required' )
            .bail()
            .isEmail()
            .withMessage( 'Email must be a valid email address' )
            .isLength( { max: 254 } )
            .withMessage( 'Email must be at most 254 characters long' )
            .normalizeEmail(),
        body( 'password' )
            .notEmpty()
            .withMessage( 'Password is required' )
            .bail()
            .isString()
            .withMessage( 'Password must be a string' )
            .isLength( { min: 8, max: 128 } )
            .withMessage( 'Password must be between 8 and 128 characters long' )
            .matches( /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).+$/ )
            .withMessage( 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character' ),
    ]
}

const verifyEmailValidators = (): ValidationChain[] =>
{
    return [
        body( 'token' )
            .trim()
            .notEmpty()
            .withMessage( 'Token is required' )
            .bail()
            .isString()
            .withMessage( 'Token must be a string' ),
        body( 'email' )
            .trim()
            .notEmpty()
            .withMessage( 'Email is required' )
            .bail()
            .isEmail()
            .withMessage( 'Email must be a valid email address' )
            .isLength( { max: 254 } )
            .withMessage( 'Email must be at most 254 characters long' )
            .normalizeEmail(),


    ]
}

const loginValidators = (): ValidationChain[] =>
{
    return [
        body( 'email' )
            .trim()
            .notEmpty()
            .withMessage( 'Email is required' )
            .bail()
            .isEmail()
            .withMessage( 'Email must be a valid email address' )
            .isLength( { max: 254 } )
            .withMessage( 'Email must be at most 254 characters long' )
            .normalizeEmail(),
        body( 'password' )
            .notEmpty()
            .withMessage( 'Password is required' )
            .bail()
            .isString()
            .withMessage( 'Password must be a string' )
            .isLength( { min: 8, max: 128 } )
            .withMessage( 'Password must be between 8 and 128 characters long' )
            .matches( /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).+$/ )
            .withMessage( 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character' ),
    ]
}

const reSendVerificationCodeValidators = (): ValidationChain[] =>
{
    return [
        body( 'email' )
            .trim()
            .notEmpty()
            .withMessage( 'Email is required' )
            .bail()
            .isEmail()
            .withMessage( 'Email must be a valid email address' )
            .isLength( { max: 254 } )
            .withMessage( 'Email must be at most 254 characters long' )
            .normalizeEmail(),
    ]
}

const refreshAccessTokenValidators = () =>
{
    return [
        body( 'refreshToken' )
            .trim()
            .notEmpty()
            .withMessage( 'Refresh token is required' )
            .bail()
            .isString()
            .withMessage( 'Refresh token must be a string' ),
    ]
}


const setAvatarValidators = (): ValidationChain[] =>
{
    return [
        body( "file" ).custom( ( _, { req } ) =>
        {
            const request = req as Request;

            if ( !request.file )
            {
                throw new Error( "Avatar image is required" );
            }

            if ( !ALLOWED_MIME_TYPES.includes( request.file.mimetype ) )
            {
                throw new Error( "Only JPEG, PNG, or WEBP images are allowed" );
            }

            if ( request.file.size > MAX_FILE_SIZE_BYTES )
            {
                throw new Error( "Image must be smaller than 5MB" );
            }

            return true;
        } ),
    ];
};

const forgetPasswordValidators = (): ValidationChain[] =>
{
    return [
        body( 'email' )
            .trim()
            .notEmpty()
            .withMessage( 'Email is required' )
            .bail()
            .isEmail()
            .withMessage( 'Email must be a valid email address' )
            .isLength( { max: 254 } )
            .withMessage( 'Email must be at most 254 characters long' )
            .normalizeEmail(),
    ]
}

const resetPasswordValidators = (): ValidationChain[] =>
{
    return [
        body( 'token' )
            .trim()
            .notEmpty()
            .withMessage( 'Token is required' )
            .bail()
            .isString()
            .withMessage( 'Token must be a string' ),
        body( 'email' )
            .trim()
            .notEmpty()
            .withMessage( 'Email is required' )
            .bail()
            .isEmail()
            .withMessage( 'Email must be a valid email address' )
            .isLength( { max: 254 } )
            .withMessage( 'Email must be at most 254 characters long' )
            .normalizeEmail(),
        body( 'newPassword' )
            .notEmpty()
            .withMessage( 'Password is required' )
            .bail()
            .isString()
            .withMessage( 'Password must be a string' )
            .isLength( { min: 8, max: 128 } )
            .withMessage( 'Password must be between 8 and 128 characters long' )
            .matches( /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).+$/ )
            .withMessage( 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character' ),
    ]
}






export
{
    registerValidators,
    verifyEmailValidators,
    loginValidators,
    reSendVerificationCodeValidators,
    refreshAccessTokenValidators,
    setAvatarValidators,
    forgetPasswordValidators,
    resetPasswordValidators
}