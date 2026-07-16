
import { body, param, type ValidationChain } from "express-validator";
import { TransactionType } from "../../constants.js";

const createCategoryValidators = (): ValidationChain[] =>
{
    return [
        body( 'name' )
            .trim()
            .notEmpty()
            .withMessage( 'Name is required' )
            .bail()
            .isString()
            .withMessage( 'Name must be a string' )
            .isLength( { min: 1, max: 20 } )
            .withMessage( 'Name must be at most 100 characters long' ),
        body( 'icon' )
            .trim()
            .notEmpty()
            .withMessage( 'Icon is required' )
            .bail()
            .isString()
            .withMessage( 'Icon must be a string' )
            .isLength( { min: 1, max: 100 } )
            .withMessage( 'Icon must be at most 100 characters long' ),
        body( "type" )
            .trim()
            .notEmpty()
            .withMessage( "Type is required" )
            .bail()
            .isString()
            .withMessage( "Type must be a string" )
            .isIn( Object.values( TransactionType ) )
            .withMessage( "Type must be either 'income' or 'expense'" ),
    ]
}

const updateCategoryValidators = (): ValidationChain[] =>
{
    return [
        body( 'name' )
            .trim()
            .optional()
            .isString()
            .withMessage( 'Name must be a string' )
            .isLength( { min: 1, max: 20 } )
            .withMessage( 'Name must be at most 100 characters long' ),
        body( 'icon' )
            .trim()
            .optional()
            .isString()
            .withMessage( 'Icon must be a string' )
            .isLength( { max: 100 } )
            .withMessage( 'Icon must be at most 100 characters long' ),
        body( "type" )
            .trim()
            .optional()
            .isString()
            .withMessage( "Type must be a string" )
            .isIn( Object.values( TransactionType ) )
            .withMessage( "Type must be either 'income' or 'expense'" ),
        param( 'categoryId' )
            .isMongoId()
            .withMessage( "Invalid category id" ),
    ]
}

const deleteCategoryValidators = (): ValidationChain[] =>
{
    return [
        param( 'categoryId' )
            .isMongoId()
            .withMessage( "Invalid category id" ),
    ]
}





export
{
    createCategoryValidators,
    updateCategoryValidators,
    deleteCategoryValidators
}