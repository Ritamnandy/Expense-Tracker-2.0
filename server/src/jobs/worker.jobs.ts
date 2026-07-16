
import { Worker, type Job } from "bullmq";
import { connection } from "../db/redisconnect.db.js"
import { sendEmailVerificationMail, sendForgetPasswordMail, sentPasswordChangedMail } from "../utils/mail.js";
import { logger } from "../utils/logger.js"
interface VerificationJobData
{
    email: string;
    userName: string;
    token: string;

}

interface ForgotPasswordJobData
{
    email: string;
    userName: string;
    link: string;
}

interface PasswordChangedJobData
{
    email: string
    userName: string
}

const worker = new Worker( "TaskQueue", async ( job: Job ) =>
{
    switch ( job.name )
    {
        case "send-email-verification-mail": {
            const { email, userName, token } = job.data as VerificationJobData;
            await sendEmailVerificationMail( email, userName, token );
            break;
        }
        case "send-forgot-password-mail": {
            const { email, userName, link } = job.data as ForgotPasswordJobData;
            await sendForgetPasswordMail( email, userName, link );
            break;
        }
        case "send-password-changed-mail": {
            const { email, userName } = job.data as PasswordChangedJobData;
            await sentPasswordChangedMail( email, userName );
            break;
        }
        default:
            logger.warn( `Unknown job name: ${ job.name }` );
    }


}, { connection, concurrency: 5 } )

worker.on( "error", ( error ) =>
{
    logger.error( "Worker error:", error );
} );

worker.on( "completed", ( job ) =>
{
    logger.info( `Job ${ job.id }:${ job.name } completed` );
} );

worker.on( "failed", ( job, error ) =>
{
    logger.error( `Job ${ job?.id }:${ job?.name } failed`, error );
} );

const shutdown = async () =>
{
    logger.info( "Shutting down worker gracefully..." );
    await worker.close();
    process.exit( 0 );
};

process.on( "SIGTERM", shutdown );
process.on( "SIGINT", shutdown );
