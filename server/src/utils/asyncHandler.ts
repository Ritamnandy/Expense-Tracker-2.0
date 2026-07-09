
import type { Request, Response, NextFunction } from 'express';

type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<unknown>;

export const asyncHandler = ( requestHandler: AsyncHandler ) =>
{
    return ( req: Request, res: Response, next: NextFunction ): void =>
    {
        Promise.resolve( requestHandler( req, res, next ) )
            .catch( next );
    };
}