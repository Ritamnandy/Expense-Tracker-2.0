
import './configs/env.configs.js'
import { connectDB } from './db/mongoconnect.db.js'
import app from './app.js'

const PORT = Number( process.env.PORT as string )


connectDB().then( () =>
{
    app.listen( PORT, () =>
    {
        console.log( `server is running on port http://localhost:${ PORT }` )
    } )
} ).catch( ( error ) =>
{
    console.error( ( error as Error ).message )
} )