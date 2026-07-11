
import multer, { type FileFilterCallback, type StorageEngine } from "multer"
import { type Request } from "express"
import path from "path";


const storage: StorageEngine = multer.diskStorage( {
    destination: function ( req: Request, file: Express.Multer.File, cb: ( error: Error | null, destination: string ) => void )
    {
        cb( null, "/src/public/temp/" );
    },
    filename: function ( req: Request, file: Express.Multer.File, cb: ( error: Error | null, filename: string ) => void )
    {
        cb( null, file.originalname );
    }
} )


const fileFilter = ( req: Request, file: Express.Multer.File, cb: FileFilterCallback ) =>
{
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const isValidExt = allowedTypes.test(
        path.extname( file.originalname ).toLowerCase()
    );
    const isValidMime = allowedTypes.test( file.mimetype );

    if ( isValidExt && isValidMime )
    {
        cb( null, true );
    } else
    {
        cb( new Error( "Unsupported file type" ) );
    }
}

export const upload = multer(
    {
        storage, fileFilter,
        limits: {
            fileSize: 1024 * 1024 * 5
        }
    } );