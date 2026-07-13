
import { validationResult, type ValidationError } from "express-validator"
import type { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/ApiError.js";


export const validate = ( req: Request, res: Response, next: NextFunction ) =>
{
    const errors = validationResult( req ).array( { onlyFirstError: true } );
    if ( errors.length === 0 )
    {
        return next();
    }
    const extractedErrors: object[] = [];
    errors
        .map( ( err: ValidationError ) => extractedErrors.push( { [ err.type ]: err.msg } ) );

    return res.status( 422 ).json( new ApiError( 422, "Received data is not valid", extractedErrors ) )
}

