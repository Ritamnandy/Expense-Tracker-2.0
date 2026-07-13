
import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// logger.ts is at server/src/utils/logger.ts
// go up 3 levels: utils -> src -> server (project root)
const logDir = path.resolve( __dirname, "../../../logs" );

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isProduction = process.env.NODE_ENV === "production";



// Human-readable format for local development

const devFormat = combine(
    colorize(),
    timestamp( { format: "YYYY-MM-DD HH:mm:ss" } ),
    errors( { stack: true } ),
    printf( ( { level, message, timestamp, stack, ...meta } ) =>
    {
        const metaStr = Object.keys( meta ).length ? JSON.stringify( meta ) : ""
        return `[${ timestamp }] ${ level }: ${ stack || message } ${ metaStr }`
    } )
);

// Structured JSON format for production (log aggregators expect this)
const prodFormat = combine(
    timestamp(),
    errors( { stack: true } ),
    json()
);

const transports: winston.transport[] = [
    new winston.transports.Console( {
        format: isProduction ? prodFormat : devFormat,
    } )
]


// File transports only in production (avoid cluttering local disk during dev)

if ( isProduction )
{
    transports.push(
        new DailyRotateFile( {
            dirname: logDir,
            filename: "error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            level: "error",
            maxFiles: "30d",
            maxSize: "20m",
            zippedArchive: true,
            format: prodFormat,
        } ),
        new DailyRotateFile( {
            dirname: logDir,
            filename: "combined-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxFiles: "14d",
            maxSize: "20m",
            zippedArchive: true,
            format: prodFormat,
        } )
    );
}

export const logger = winston.createLogger( {
    level: process.env.LOG_LEVEL || ( isProduction ? "info" : "debug" ),
    format: isProduction ? prodFormat : devFormat,
    transports,
    exitOnError: false, // don't crash the process on a logging error
} );

// Catch unhandled rejections/exceptions so they're logged, not swallowed
process.on( "unhandledRejection", ( reason ) =>
{
    logger.error( "Unhandled Rejection:", reason );
} );

process.on( "uncaughtException", ( error ) =>
{
    logger.error( "Uncaught Exception:", error );
    // Give the logger a moment to flush before exiting
    setTimeout( () => process.exit( 1 ), 1000 );
} );