
import mongoose from "mongoose";
import { dbName } from "../constants.js";


const URL = process.env.MONGODB_URL as string;

export const connectDB = async () =>
{
    try
    {
        const response = await mongoose.connect( `${ URL }/${ dbName }` );
        console.log( 'mongoDB running on port ' + response.connection.port );

    } catch ( error )
    {
        throw new Error( ( error as Error ).message )
    }
}