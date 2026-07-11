
import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) =>
{
    let error = err
    if ( !( error as ApiError ) )
    {
        let statusCode = 500
        let message = "Something went wrong"
        let errors = [ "Something went wrong" ]
        if ( error instanceof mongoose.Error.CastError )
        {
            statusCode = 400
            message = `Invalid ${ error.path } ${ error.value }`
            errors = [ message ]

        } else if ( ( error as any )?.code === 11000 )
        {
            // Mongo duplicate key error
            statusCode = 409;
            const field = Object.keys( ( error as any ).keyValue || {} ).join( ", " );
            message = `Duplicate value for field: ${ field }`;
            errors = [ message ];
        } else if ( error instanceof mongoose.Error.ValidationError )
        {
            statusCode = 400;
            message = Object.values( error.errors )
                .map( ( val ) => val.message )
                .join( ", " );
            errors = [ message ];
        } else if ( error instanceof jwt.TokenExpiredError )
        {
            statusCode = 401;
            message = "Access token expired";
            errors = [ 'Unauthorized request please login or signup' ];
        } else if ( error instanceof Error )
        {
            statusCode = ( error as any ).statusCode || 500;
            message = error.message || message;
            errors = [ message ];
        }
        error = new ApiError(
            statusCode,
            message,
            [],
            error instanceof Error ? error.stack : undefined
        );
    }
    const apiError = error as ApiError;

    const response = {
        success: false,
        message: apiError.message,
        errors: apiError.errors || [],
        data: apiError.data,
        ...( process.env.NODE_ENV === "development" ? { stack: apiError.stack } : {} ),
    };
    // Log server-side for debugging (use a proper logger like winston/pino in real prod)
    if ( apiError.statusCode >= 500 )
    {
        console.error( apiError );
    }
    return res.status( apiError.statusCode || 500 ).json( response );
}

export { errorHandler }