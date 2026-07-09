
import { v2 as Cloudinary } from "cloudinary"
import fs from "fs"

const name: string = process.env.CLOUDINARY_CLOUD_NAME as string
const apiKey: string = process.env.CLOUDINARY_API_KEY as string
const apiSecret: string = process.env.CLOUDINARY_API_SECRET as string


Cloudinary.config( {
    cloud_name: name,
    api_key: apiKey,
    api_secret: apiSecret,
} )

const uploadImage = async ( imagepath: string | null ) =>
{
    if ( !imagepath )
    {
        return null
    }
    try
    {
        const response = await Cloudinary.uploader
            .upload( imagepath, {
                resource_type: "auto",
            } )

        const result = response.url
        fs.unlinkSync( imagepath )
        return result
    } catch ( error )
    {
        if ( error instanceof Error )
        {
            fs.unlinkSync( imagepath )
            throw new Error( error.message )
        } else
        {
            fs.unlinkSync( imagepath )
            throw new Error( "Something went wrong" )
        }
    }
}

export { uploadImage }