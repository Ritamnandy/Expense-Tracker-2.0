
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"

const envUrl = fileURLToPath( new URL( `../.env`, import.meta.url ) )


dotenv.config( { path: envUrl, quiet: true } )

