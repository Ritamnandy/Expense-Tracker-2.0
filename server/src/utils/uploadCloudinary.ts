
import { v2 as Cloudinary } from "cloudinary"
import fs from "fs"
import { logger } from "./logger.js"

const name: string = process.env.CLOUDINARY_CLOUD_NAME as string
const apiKey: string = process.env.CLOUDINARY_API_KEY as string
const apiSecret: string = process.env.CLOUDINARY_API_SECRET as string


Cloudinary.config( {
    cloud_name: name,
    api_key: apiKey,
    api_secret: apiSecret,
} )
interface UploadResult
{
    url: string;
    publicId: string;
}
const uploadImage = async ( imagePath: string | undefined ): Promise<UploadResult | null> =>
{
    if ( !imagePath )
    {
        return null
    }
    try
    {
        const response = await Cloudinary.uploader
            .upload( imagePath, {
                resource_type: "auto",
            } )

        const result = response.secure_url
        await fs.unlink( imagePath, ( err ) =>
        {
            // Log but never let cleanup failure mask a successful upload
            logger.warn( "Failed to remove local file after successful upload", {
                imagePath,
                error: ( err as Error ).message,
            } );
        } )

        logger.info( "Image uploaded to Cloudinary", { publicId: response.public_id } );
        return {
            url: result,
            publicId: response.public_id,
        }
    } catch ( error )
    {
        logger.error( "Cloudinary upload failed", {
            imagePath,
            error: error instanceof Error ? error.message : "Unknown error",
        } );
        await fs.unlink( imagePath, ( err ) =>
        {
            // Log but never let cleanup failure mask a successful upload
            logger.warn( "Failed to remove local file after successful upload", {
                imagePath,
                error: ( err as Error ).message,
            } );
        } )
        throw error instanceof Error ? error : new Error( "Something went wrong during image upload" );
        return null
    }
}

const deleteImage = async ( imageId: string | undefined | null ) =>
{
    if ( !imageId ) return
    try
    {
        const response = await Cloudinary.uploader.destroy( imageId )

        if ( response.result !== "ok" && response.result !== "not found" )
        {
            logger.warn( "Cloudinary destroy returned unexpected result", { imageId, result: response.result } );
        } else
        {
            logger.info( "Old avatar deleted from Cloudinary", { imageId } );
        }


    } catch ( error )
    {

        logger.error( "Failed to delete old avatar from Cloudinary", {
            imageId,
            error: error instanceof Error ? error.message : "Unknown error",
        } );

    }
}



export { uploadImage, deleteImage }