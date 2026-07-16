
import nodemailer from "nodemailer"
import mailgen from "mailgen"
import { logger } from "./logger.js"

const transporter = nodemailer.createTransport( {
    service: "gmail",
    auth: {
        user: process.env.EMAIL as string,
        pass: process.env.APP_PASSWORD as string,
    },
} );

const mailGenerator = new mailgen( {
    theme: "default",
    product: {
        name: "Expense Tracker",
        link: "https://expense-tracker-ten.vercel.app/",
    },
} );

const sendEmailVerificationMail = async ( userEmail: string, userName: string, token: string ) =>
{

    const email = {
        body: {
            name: userName,
            intro: "Welcome to our Expense Tracker App! We're very excited to have you on board.",
            action: {
                instructions: "To verify your account, use this code:",
                button: {
                    color: "#bc621d",
                    text: token,
                    link: "#",
                },
            },
            outro: "This code will expire in 10 minutes.\nNeed help, or have questions? Just reply to this email, we'd love to help.",
        },
    };

    const mailOptions = {
        from: process.env.EMAIL as string,
        to: userEmail,
        subject: "Expense Tracker App - Email Verification",
        html: mailGenerator.generate( email ),
        text: mailGenerator.generatePlaintext( email ),
    };

    try
    {
        await transporter.sendMail( mailOptions );
        logger.info( "Verification email sent", { to: userEmail } );
    } catch ( error )
    {
        logger.error( "Failed to send verification email", {
            to: userEmail,
            error: error instanceof Error ? error.message : "Unknown error",
        } );
        // Always rethrow — swallowing this would mark the BullMQ job
        // "completed" even though the email never sent, defeating retries.
        throw error instanceof Error ? error : new Error( "Failed to send verification email" );
    }


}



const sendForgetPasswordMail = async ( userEmail: string, userName: string, link: string ) =>
{

    const email = {
        body: {
            name: userName,
            intro: "We received a request to reset your password.",
            action: {
                instructions: "Click the button below to reset your password:",
                button: {
                    color: "#bc621d",
                    text: "Reset Password",
                    link,
                },
            },
            outro:
                "This link will expire in 15 minutes.\nIf you didn't request this, you can safely ignore this email.",
        },
    };

    const mailOptions = {
        from: process.env.EMAIL as string,
        to: userEmail,
        subject: "Expense Tracker App - Password Reset Request",
        html: mailGenerator.generate( email ),
        text: mailGenerator.generatePlaintext( email ),
    };

    try
    {
        await transporter.sendMail( mailOptions );
        logger.info( "Password reset email sent", { to: userEmail } );
    } catch ( error )
    {
        logger.error( "Failed to send password reset email", {
            to: userEmail,
            error: error instanceof Error ? error.message : "Unknown error",
        } );
        throw error instanceof Error ? error : new Error( "Failed to send password reset email" );
    }

}

const sentPasswordChangedMail = async ( userEmail: string, userName: string ) =>
{
    const email = {
        body: {
            name: userName,
            intro: "Your password has been changed successfully.",
            outro: "If you did not perform this action, please contact support immediately.",
        },
    };

    const mailOptions = {
        from: process.env.EMAIL as string,
        to: userEmail,
        subject: "Expense Tracker App - Your Password Was Changed",
        html: mailGenerator.generate( email ),
        text: mailGenerator.generatePlaintext( email ),
    };

    try
    {
        await transporter.sendMail( mailOptions );
        logger.info( "Password-changed notification sent", { to: userEmail } );
    } catch ( error )
    {
        logger.error( "Failed to send password-changed notification", {
            to: userEmail,
            error: error instanceof Error ? error.message : "Unknown error",
        } );
        throw error instanceof Error ? error : new Error( "Failed to send password-changed notification" );
    }


}

export
{
    sendEmailVerificationMail,
    sendForgetPasswordMail,
    sentPasswordChangedMail
}