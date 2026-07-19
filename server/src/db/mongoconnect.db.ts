
import mongoose from "mongoose";
import { dbName } from "../constants.js";
import { logger } from "../utils/logger.js";

const URL = process.env.MONGODB_URL as string;

export const connectDB = async () =>
{
    try
    {
        const response = await mongoose.connect( `${ URL }/${ dbName }` );
        logger.info( 'mongoDB running on port ', { port: response.connection.port } );

    } catch ( error )
    {
        if ( error instanceof mongoose.Error )
        {
            logger.error( 'Failed to connect to mongoDB', { error: error.message } )
        } else
            logger.error( ( error as Error ).message )
    }
}