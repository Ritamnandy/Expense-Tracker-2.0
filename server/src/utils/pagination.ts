
import type { Request, Response } from "express";

interface PaginationParams
{
    page: number;
    limit: number;
    skip: number;
}

const getPaginationParams = ( req: Request, maxLimit = 100, defaultLimit = 20 ): PaginationParams =>
{
    const page = Math.max( 1, parseInt( req.query.page as string ) || 1 );
    const limit = Math.min( maxLimit, Math.max( 1, parseInt( req.query.limit as string ) || defaultLimit ) );
    const skip = ( page - 1 ) * limit;
    return { page, limit, skip };
};

export { getPaginationParams };