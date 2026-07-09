
class ApiResponse
{
    private statusCode: number;
    private success: boolean;
    private message: string;
    private data: ( string | object )[];
    private errer: null
    constructor ( statusCode: number, message: string, data: ( string | object )[] )
    {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
        this.errer = null
    }
}

export { ApiResponse }