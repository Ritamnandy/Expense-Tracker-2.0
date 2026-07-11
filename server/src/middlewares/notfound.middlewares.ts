// if routes not found
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

const notFound = ( req: Request, res: Response, next: NextFunction ) =>
{
    next( new ApiError( 404, `Route not found: ${ req.originalUrl }` ) );
};

export { notFound };