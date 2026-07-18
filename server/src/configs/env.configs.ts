import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );



// e.g. server/src/configs/env.config.ts -> project root is two levels up.
const envPath = path.resolve( __dirname, "../../.env" );

const result = dotenv.config( { path: envPath, quiet: true } );

if ( result.error )
{
    // Use console here, not the winston logger — the logger itself may depend
    // on env vars (log level, log dir) that haven't loaded yet at this point.
    logger.error( `Failed to load .env file from ${ envPath }:`, result.error.message );
    process.exit( 1 );
}



