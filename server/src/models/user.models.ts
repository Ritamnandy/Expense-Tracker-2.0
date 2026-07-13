
import mongoose, { Schema, Model, Types, type HydratedDocument } from "mongoose"
import bcrypt from "bcrypt"
import jwt, { type SignOptions, type Secret } from "jsonwebtoken"
import { User_LoginType } from "../constants.js"
interface IUser
{
    firstName: string
    lastName: string
    email: string
    password: string
    loginType: User_LoginType
    isVerified: boolean
    refreshToken: string | null,
    avatar: string | null,
    googleId: string | null,
}

interface IUserMethods
{
    generateAccessToken: () => string
    generateRefreshToken: () => string
    comparePassword: ( password: string ) => Promise<boolean>
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>
type UserModel = Model<IUser, {}, IUserMethods>


const userSchema = new Schema<IUser, UserModel, IUserMethods>(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            trim: true,
            required: function ()
            {
                return this.loginType === User_LoginType.EMAIL_PASSWORD
            }
        },
        loginType: {
            type: String,
            enum: User_LoginType,
            default: User_LoginType.EMAIL_PASSWORD,
        },
        googleId: {
            type: String,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
            default: null
        },
        avatar: {
            type: String,
            default: null
        },

    }, { timestamps: true }
)

userSchema.pre( "save", async function ()
{
    if ( !this.isModified( "password" ) ) return
    this.password = await bcrypt.hash( this.password as string, Number( process.env.BCRYPT_SALT_ROUNDS as string ) )
} )

userSchema.methods.comparePassword = async function ( password: string ): Promise<boolean>
{
    return await bcrypt.compare( password, this.password )
}

export interface TokenPayload
{
    id: Types.ObjectId
    email: string
    loginType: User_LoginType
    firstName: string
    lastName: string
}
const JWT_SECRET = process.env.JWT_TOKEN_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_TOKEN_EXPIRES_IN;

if ( !JWT_SECRET )
    throw new Error( "JWT_TOKEN_SECRET missing" );

if ( !JWT_EXPIRES_IN )
    throw new Error( "JWT_TOKEN_EXPIRES_IN missing" );

export const jwtConfig = {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN as SignOptions[ "expiresIn" ],
};
userSchema.methods.generateAccessToken = function (): string
{
    const payload: TokenPayload = {
        id: this._id,
        email: this.email,
        loginType: this.loginType,
        firstName: this.firstName,
        lastName: this.lastName
    }
    return jwt.sign(
        payload,
        jwtConfig.secret,
        {
            expiresIn: jwtConfig.expiresIn
        } as SignOptions
    )
}

const REFRESH_TOKEN_SECRETS = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRES_IN;

if ( !REFRESH_TOKEN_SECRETS )
    throw new Error( "REFRESH_TOKEN_SECRET missing" );

if ( !REFRESH_TOKEN_EXPIRY )
    throw new Error( "REFRESH_TOKEN_EXPIRY missing" );

export const rftConfig = {
    secret: REFRESH_TOKEN_SECRETS,
    expiresIn: REFRESH_TOKEN_EXPIRY as SignOptions[ "expiresIn" ],
};


userSchema.methods.generateRefreshToken = function (): string
{
    const payload: TokenPayload = {
        id: this._id,
        email: this.email,
        loginType: this.loginType,
        firstName: this.firstName,
        lastName: this.lastName
    }
    return jwt.sign(
        payload,
        rftConfig.secret,
        {
            expiresIn: rftConfig.expiresIn
        } as SignOptions
    )
}

export const User = mongoose.model<IUser, UserModel>( "User", userSchema )