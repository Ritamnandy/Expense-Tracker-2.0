
import nodemailer from "nodemailer"
import mailgen from "mailgen"


const sendEmailVErificationMail = async ( userEmail: string, userName: string, token: string ) =>
{

    const transporter = nodemailer.createTransport( {
        service: "gmail",
        auth: {
            user: process.env.EMAIL as string,
            pass: process.env.APP_PASSWORD as string,
        }
    } )

    const mailGenerator = new mailgen( {
        theme: "default",
        product: {
            name: "Expense Tracker",
            link: "https://expense-tracker-ten.vercel.app/"
        }
    } )
    const email = {
        body: {
            name: userName,
            intro: "Welcome to our Expense Tracker App! We're very excited to have you on board.",
            action: {
                instructions: "To verify your account, Use this code:",
                button: {
                    color: "#bc621d",
                    text: token.toString(),
                    link: "#",
                },
            },
            outro: "Code will expire in 5 minutes.\nNeed help, or have questions? Just reply to this email, we\'d love to help.",
        },
    };

    const emailBody = mailGenerator.generate( email );
    const emailText = mailGenerator.generate( email )

    const mailOptions = {
        from: process.env.EMAIL as string,
        to: userEmail,
        subject: "Expense Tracker App - Email Verification",
        html: emailBody,
        text: emailText
    };
    try
    {
        await transporter.sendMail( mailOptions );
    } catch ( error )
    {
        if ( error instanceof Error )
        {
            throw new Error( error.message )
        } else
            console.log( error );
    }

}



const sendForgotPasswordMail = async ( userEmail: string, userName: string, token: string ) =>
{

    const transporter = nodemailer.createTransport( {
        service: "gmail",
        auth: {
            user: process.env.EMAIL as string,
            pass: process.env.APP_PASSWORD as string,
        }
    } )

    const mailGenerator = new mailgen( {
        theme: "default",
        product: {
            name: "Expense Tracker",
            link: "https://expense-tracker-ten.vercel.app/"
        }
    } )
    const email = {
        body: {
            name: userName,
            intro: "Welcome to our Expense Tracker App! We're very excited to have you on board.",
            action: {
                instructions: "To reset your password, Use this code:",
                button: {
                    color: "#bc621d",
                    text: token.toString(),
                    link: "#",
                },
            },
            outro: "Code will expire in 5 minutes.\nNeed help, or have questions? Just reply to this email, we\'d love to help.",
        },
    };

    const emailBody = mailGenerator.generate( email );
    const emailText = mailGenerator.generate( email )

    const mailOptions = {
        from: process.env.EMAIL as string,
        to: userEmail,
        subject: "Expense Tracker App - Email Verification",
        html: emailBody,
        text: emailText
    };
    try
    {
        await transporter.sendMail( mailOptions );
    } catch ( error )
    {
        if ( error instanceof Error )
        {
            throw new Error( error.message )
        } else
            console.log( error );
    }

}


export { sendEmailVErificationMail, sendForgotPasswordMail }