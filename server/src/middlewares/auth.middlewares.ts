
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express";
import { type UserDocument, type TokenPayload, User } from "../models/user.models.js"
import { logger } from "../utils/logger.js";
export interface AuthRequest extends Request
{
    user?: UserDocument;
}

export const verifyJWT = asyncHandler( async ( req: AuthRequest, res: Response, next: NextFunction ) =>
{
    try
    {
        const token = req.header( "Authorization" )?.replace( "Bearer ", "" ) || req.cookies.AccessToken
        if ( !token )
        {
            return res.status( 400 ).json( new ApiError( 400, "Access token not found", [ "Access token not found" ] ) )
        }
        const decodedToken: TokenPayload = jwt.verify( token, process.env.JWT_TOKEN_SECRET as string ) as TokenPayload

        const user: UserDocument | null = await User.findById( decodedToken?.id )
        if ( !user || !user.isVerified )
        {
            return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
        }

        req.user = user
        
        next()

    } catch ( error )
    {
        if ( error instanceof jwt.TokenExpiredError )
        {
            logger.warn( "Access token expired", { message: error.message } );

        } else if ( error instanceof jwt.JsonWebTokenError )
        {
            logger.warn( "Invalid or tampered access token", { message: error.message } );
        } else
        {
            logger.error( "Error verifying access token", { message: ( error as Error ).message } )

        }
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
} )