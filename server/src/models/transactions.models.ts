
import mongoose, { Model, Schema, Types, type HydratedDocument } from "mongoose";
import { TransactionType, PaymentMethod } from "../constants.js";

export interface ITransactions
{
    type: TransactionType,
    amount: number,
    ownerId: Types.ObjectId,
    categoryId: Types.ObjectId,
    transactionDate: Date,
    description: string,
    currency: string,
    paymentMethod: PaymentMethod
}

export type TransactionsDocument = HydratedDocument<ITransactions>
type TransactionsModel = Model<ITransactions>

const transactionSchema = new Schema<ITransactions, TransactionsModel>(
    {
        type: {
            type: String,
            enum: TransactionType,
            required: true,
            lowercase: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        transactionDate: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },
        currency: {
            type: String,
            required: true,
            uppercase: true,
            match: /^[A-Z]{3}$/
        },
        paymentMethod: {
            type: String,
            enum: PaymentMethod,
            required: true,
        },
    },
    { timestamps: true }

)
transactionSchema.index( { ownerId: 1, transactionDate: -1 } );
transactionSchema.index( { ownerId: 1, categoryId: 1 } );
transactionSchema.index( { ownerId: 1, type: 1, transactionDate: -1 } );

export const Transaction = mongoose.model<ITransactions, TransactionsModel>( "Transaction", transactionSchema )
