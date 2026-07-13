
import { body, type ValidationChain } from "express-validator"

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

const verifyEmailValidators = () =>
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

const loginValidators = () =>
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


export { registerValidators, verifyEmailValidators, loginValidators }