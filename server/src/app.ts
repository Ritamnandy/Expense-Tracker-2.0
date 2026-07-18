import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import requestIp from "request-ip";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { errorHandler } from "./middlewares/error.middlewares.js";
import { notFound } from "./middlewares/notfound.middlewares.js";
import { ApiError } from "./utils/ApiError.js";
import { logger } from "./utils/logger.js";

import "./jobs/worker.jobs.js"

const app: Express = express();

app.use( helmet() );

app.use(
    cors( {
        origin: process.env.CORS_ORIGIN as string,
        credentials: true,
    } )
);

app.use( express.json( { limit: "20kb" } ) );
app.use( express.urlencoded( { extended: true, limit: "20kb" } ) );
app.use( cookieParser() );
app.use( compression() );
app.use( requestIp.mw() );
app.use( express.static( "public" ) );

// Pipe morgan's HTTP request logs through winston instead of raw stdout,
// so request logs land in the same place as everything else.
app.use(
    morgan( "combined", {
        stream: {
            write: ( message: string ) => logger.info( message.trim() ),
        },
    } )
);

// General baseline limiter — applies to all routes.
// Stricter, route-specific limiters (e.g. on /login, /forgot-password)
// should be added directly on those routers, in addition to this one.
const globalLimiter = rateLimit( {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ( req: Request ) =>
    {
        return ipKeyGenerator( req.clientIp ?? req.ip ?? "unknown" );
    },
    handler: ( req: Request, res: Response ) =>
    {
        logger.warn( "Rate limit exceeded", { ip: req.clientIp ?? req.ip, path: req.path } );
        return res.status( 429 ).json( new ApiError( 429, "Too many requests", [ "Too many requests, please try again later" ] ) );
    },
} );

app.use( globalLimiter );

import userRouter from "./routes/user.routes.js";
import categoryRouter from "./routes/categories.routes.js";
import transactionRouter from "./routes/transctions.routes.js";



// Routes — must be registered BEFORE notFound/errorHandler

app.use( "/api/v1/users", userRouter );
app.use( "/api/v1/categories", categoryRouter );
app.use( "/api/v1/transactions", transactionRouter );

// notFound must come after all real routes — catches anything unmatched
app.use( notFound );

// errorHandler must always be LAST — Express only reaches this via next(err)
app.use( errorHandler );

export default app;