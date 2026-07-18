

import { body, param, type ValidationChain } from "express-validator"
import { TransactionType, PaymentMethod } from "../../constants.js";



const createTransactionValidators = (): ValidationChain[] =>
{
    return [
        body( 'type' )
            .trim()
            .notEmpty()
            .withMessage( 'Title is required' )
            .bail()
            .isString()
            .withMessage( 'Title must be a string' )
            .isLength( { max: 100 } )
            .withMessage( 'Title must be at most 100 characters long' )
            .isIn( Object.values( TransactionType ) )
            .withMessage( "Type must be either 'income' or 'expense'" ),
        body( 'amount' )
            .trim()
            .notEmpty()
            .withMessage( 'Amount is required' )
            .bail()
            .isNumeric()
            .withMessage( 'Amount must be a number' )
            .isFloat( { min: 0 } )
            .withMessage( 'Amount must be a positive number' ),
        body( 'transactionDate' )
            .trim()
            .notEmpty()
            .withMessage( 'Transaction date is required' )
            .bail()
            .isDate()
            .withMessage( 'Transaction date must be a valid date' )
            .isISO8601()
            .withMessage( 'Transaction date must be in ISO 8601 format' ),
        body( 'description' )
            .trim()
            .notEmpty()
            .withMessage( 'Description is required' )
            .bail()
            .isString()
            .withMessage( 'Description must be a string' )
            .isLength( { max: 100 } )
            .withMessage( 'Description must be at most 100 characters long' ),
        body( 'currency' )
            .trim()
            .notEmpty()
            .withMessage( 'Currency is required' )
            .bail()
            .isString()
            .withMessage( 'Currency must be a string' )
            .isLength( { max: 3 } )
            .withMessage( 'Currency must be at most 3 characters long' )
            .matches( /^[A-Z]{3}$/ )
            .withMessage( 'Currency must be a valid ISO 4217 currency code' ),
        body( 'paymentMethod' )
            .trim()
            .notEmpty()
            .withMessage( 'Payment method is required' )
            .bail()
            .isString()
            .withMessage( 'Payment method must be a string' )
            .isLength( { max: 50 } )
            .withMessage( 'Payment method must be at most 50 characters long' )
            .isIn( Object.values( PaymentMethod ) )
            .withMessage( "Payment method must be allowed payment methods" ),
        param( 'categoryId' )
            .isMongoId()
            .withMessage( "Invalid category id" ),
    ]
}

const updateTransactionValidators = (): ValidationChain[] =>
{
    return [
        param( 'transactionId' )
            .isMongoId()
            .withMessage( "Invalid transaction id" ),
        body( 'type' )
            .trim()
            .optional()
            .isString()
            .withMessage( 'Title must be a string' )
            .isLength( { max: 100 } )
            .withMessage( 'Title must be at most 100 characters long' )
            .isIn( Object.values( TransactionType ) )
            .withMessage( "Type must be either 'income' or 'expense'" ),
        body( 'amount' )
            .trim()
            .optional()
            .isNumeric()
            .withMessage( 'Amount must be a number' )
            .isFloat( { min: 0 } )
            .withMessage( 'Amount must be a positive number' ),
        body( 'transactionDate' )
            .trim()
            .optional()
            .isDate()
            .withMessage( 'Transaction date must be a valid date' )
            .isISO8601()
            .withMessage( 'Transaction date must be in ISO 8601 format' ),
        body( 'description' )
            .trim()
            .optional()
            .isString()
            .withMessage( 'Description must be a string' )
            .isLength( { max: 100 } )
            .withMessage( 'Description must be at most 100 characters long' ),
        body( 'currency' )
            .trim()
            .optional()
            .isString()
            .withMessage( 'Currency must be a string' )
            .isLength( { max: 3 } )
            .withMessage( 'Currency must be at most 3 characters long' )
            .matches( /^[A-Z]{3}$/ )
            .withMessage( 'Currency must be a valid ISO 4217 currency code' ),
        body( 'paymentMethod' )
            .trim()
            .optional()
            .isString()
            .withMessage( 'Payment method must be a string' )
            .isLength( { max: 50 } )
            .withMessage( 'Payment method must be at most 50 characters long' )
            .isIn( Object.values( PaymentMethod ) )
            .withMessage( "Payment method must be allowed payment methods" ),
    ]
}


const deleteTransactionValidators = (): ValidationChain[] =>
{
    return [
        param( 'transactionId' )
            .isMongoId()
            .withMessage( "Invalid transaction id" ),
    ]
}


const TransactionsByCategoryValidators = (): ValidationChain[] =>
{
    return [
        param( 'categoryId' )
            .isMongoId()
            .withMessage( "Invalid category id" ),
    ]
}


export
{
    createTransactionValidators,
    updateTransactionValidators,
    deleteTransactionValidators,
    TransactionsByCategoryValidators
}