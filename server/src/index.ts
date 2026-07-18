
import './configs/env.configs.js'
import { connectDB } from './db/mongoconnect.db.js'
import app from './app.js'
import { logger } from './utils/logger.js'
const PORT = Number( process.env.PORT as string )


connectDB().then( () =>
{
    app.listen( PORT, () =>
    {
        logger.info( `server is running on port http://localhost:${ PORT }` )
    } )
} ).catch( ( error ) =>
{
    logger.error( ( error as Error ).message )
} )