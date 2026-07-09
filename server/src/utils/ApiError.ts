

class ApiError extends Error
{
    private statusCode: number
    message: string
    private errors: ( object | string )[]
    private success: boolean
    private data: null
    stack?: string
    constructor (
        statusCode: number,
        message: string,
        errors: ( object | string )[] = [ 'Something went wrong' ],
        stack: string = ""
    )
    {
        super( message )
        this.statusCode = statusCode
        this.success = false
        this.data = null
        this.message = message
        this.errors = errors
        if ( stack )
        {
            this.stack = stack
        } else
        {
            Error.captureStackTrace( this, this.constructor )
        }
    }
}

export { ApiError }