

import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

interface AuthLimiterOptions
{
    windowMs: number;
    max: number;
    label: string; // for logging which limiter tripped
}

const createAuthLimiter = ( { windowMs, max, label }: AuthLimiterOptions ) =>
{
    return rateLimit( {
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: ( req: Request ) =>
        {
            const clientIp = ( req as Request & { clientIp?: string } ).clientIp;
            return ipKeyGenerator( clientIp ?? req.ip ?? "unknown" );
        },
        handler: ( req: Request, res: Response ) =>
        {
            const clientIp = ( req as Request & { clientIp?: string } ).clientIp;
            logger.warn( `Rate limit exceeded: ${ label }`, { ip: clientIp ?? req.ip, path: req.path } );
            return res
                .status( 429 )
                .json( new ApiError( 429, "Too many requests", [ "Too many requests, please try again later" ] ) );
        },
    } );
};

export const loginLimiter = createAuthLimiter( {
    windowMs: 20 * 60 * 1000,
    max: 5,
    label: "login",
} );

export const registerLimiter = createAuthLimiter( {
    windowMs: 20 * 60 * 1000,
    max: 5,
    label: "register",
} );

export const verifyEmailLimiter = createAuthLimiter( {
    windowMs: 20 * 60 * 1000,
    max: 8,    // 10 times per 15 minutes
    label: "verify-email",
} );

export const resendCodeLimiter = createAuthLimiter( {
    windowMs: 20 * 60 * 1000,
    max: 5,
    label: "resend-verification-code",
} );

export const forgotPasswordLimiter = createAuthLimiter( {
    windowMs: 20 * 60 * 1000,
    max: 5,
    label: "forgot-password",
} );
