
import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Transaction, type TransactionsDocument } from "../models/transactions.models.js";
import { Category, type CategoryDocument } from "../models/categories.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { redis } from "../db/redisconnect.db.js";
import { type UserDocument } from "../models/user.models.js";
import { type AuthRequest } from "../middlewares/auth.middlewares.js";
import { PaymentMethod, TransactionType } from "../constants.js";
import { Types } from "mongoose";


const getTransactionsKey = ( userId: Types.ObjectId ): string =>
    `transactions:${ userId }`;

const getTransactionsByCategoryKey = ( userId: Types.ObjectId, categaryId: string ): string => `get-transactions-ByCategory${ userId }:${ categaryId }`



interface createTransactionBody
{
    type: TransactionType;
    amount: number;
    transactionDate: Date;
    description: string;
    currency: string;
    paymentMethod: PaymentMethod;
}

type pramsType = {
    categoryId: string;
}

const createTransaction = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const { type, amount, transactionDate, description, currency, paymentMethod } = req.body as createTransactionBody;
    const { categoryId } = req.params as pramsType;
    const user: UserDocument | undefined = req.user;
    if ( !user )
    {
        logger.warn( "create transaction request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    const category: CategoryDocument | null = await Category.findOne( { _id: categoryId, ownerId: user._id } )
    if ( !category )
    {
        logger.warn( "create transaction request attempt with non-existent category" );
        return res.status( 404 ).json( new ApiError( 404, "Category not found", [ "Category not found" ] ) )
    }
    const transaction: TransactionsDocument | null = await Transaction.create( {
        type,
        amount,
        transactionDate,
        description,
        currency,
        paymentMethod,
        ownerId: user._id,
        categoryId: category._id
    } )
    if ( !transaction )
    {
        logger.error( "Transaction.create returned falsy value", { userId: user._id } );
        return res.status( 500 ).json( new ApiError( 500, "Failed to create transaction", [ "Failed to create transaction" ] ) );
    }
    logger.info( "Transaction created", { userId: user._id, transactionId: transaction._id } );

    await redis.del( getTransactionsKey( user._id ) )

    return res.status( 201 ).json( new ApiResponse( 201, "Transaction created successfully", [ transaction ] ) );
} );

interface updateTransactionBody
{
    type?: TransactionType;
    amount?: number;
    transactionDate?: Date;
    description?: string;
    currency?: string;
    paymentMethod?: PaymentMethod;
}
type updatepramsType = {
    transactionId: string
}


const updateTransaction = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const { type, amount, transactionDate, description, currency, paymentMethod } = req.body as updateTransactionBody;
    const { transactionId } = req.params as updatepramsType;
    const user: UserDocument | undefined = req.user;
    if ( !user )
    {
        logger.warn( "update transaction request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    if ( !type && !amount && !transactionDate && !description && !currency && !paymentMethod )
    {
        logger.warn( "update transaction request attempt with no data" );
        return res.status( 400 ).json( new ApiError( 400, "No data provided", [ "No data provided" ] ) )
    }
    const transaction: TransactionsDocument | null = await Transaction.findOne( { _id: transactionId, ownerId: user._id } )
    if ( !transaction )
    {
        logger.warn( "update transaction request attempt with non-existent transaction" );
        return res.status( 404 ).json( new ApiError( 404, "Transaction not found", [ "Transaction not found" ] ) )
    }
    if ( type ) transaction.type = type;
    if ( amount ) transaction.amount = amount;
    if ( transactionDate ) transaction.transactionDate = transactionDate;
    if ( description ) transaction.description = description;
    if ( currency ) transaction.currency = currency;
    if ( paymentMethod ) transaction.paymentMethod = paymentMethod;
    await transaction.save();
    logger.info( "Transaction updated", { userId: user._id, transactionId: transaction._id } );

    await redis.del( getTransactionsKey( user._id ) )

    return res.status( 200 ).json( new ApiResponse( 200, "Transaction updated successfully", [ transaction ] ) );

} )


const deleteTransaction = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const { transactionId } = req.params as updatepramsType;
    const user: UserDocument | undefined = req.user;
    if ( !user )
    {
        logger.warn( "delete transaction request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    const transaction: TransactionsDocument | null = await Transaction.findOne( { _id: transactionId, ownerId: user._id } )
    if ( !transaction )
    {
        logger.warn( "delete transaction request attempt with non-existent transaction" );
        return res.status( 404 ).json( new ApiError( 404, "Transaction not found", [ "Transaction not found" ] ) )
    }
    await transaction.deleteOne();
    logger.info( "Transaction deleted", { userId: user._id, transactionId: transaction._id } );

    await redis.del( getTransactionsKey( user._id ) )

    return res.status( 200 ).json( new ApiResponse( 200, "Transaction deleted successfully", [ "Transaction deleted successfully" ] ) );
} )


const getTransactions = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const user: UserDocument | undefined = req.user;
    if ( !user )
    {
        logger.warn( "get transaction request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }

    const rawdata = await redis.get( getTransactionsKey( user._id ) );
    if ( rawdata )
    {
        logger.info( "Transaction fetched from cache", { userId: user._id } );
        return res.status( 200 ).json( new ApiResponse( 200, "Transactions fetched successfully", JSON.parse( rawdata ) ) );
    }
    const transactions: TransactionsDocument[] = await Transaction.find( { ownerId: user._id } ).sort( { transactionDate: -1 } )

    if ( !transactions || transactions.length === 0 )
    {
        logger.warn( "get transaction request attempt with non-existent transactions" );
        return res.status( 404 ).json( new ApiError( 404, "Transactions not found", [ "Transactions not found" ] ) )
    }


    await redis.set( getTransactionsKey( user._id ), JSON.stringify( transactions ), "EX", 60 * 3 );

    logger.info( "Transactions fetched from DB", { userId: user._id, count: transactions.length } );

    return res.status( 200 ).json( new ApiResponse( 200, "Transactions found successfully", transactions ) );
} )

const getTransactionsByCategory = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const { categoryId } = req.params as pramsType;
    const user: UserDocument | undefined = req.user;
    if ( !user )
    {
        logger.warn( "get transaction by category request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    const rawdata = await redis.get( getTransactionsByCategoryKey( user._id, categoryId ) );
    if ( rawdata )
    {
        logger.info( "Transaction by category fetched from cache", { userId: user._id } );
        return res.status( 200 ).json( new ApiResponse( 200, "Transactions fetched successfully", JSON.parse( rawdata ) ) );
    }
    const allTransactions: TransactionsDocument[] = await Transaction.find( { ownerId: user._id, categoryId } );
    if ( !allTransactions || allTransactions.length === 0 )
    {
        logger.warn( "get transaction by category request attempt with non-existent transactions" );
        return res.status( 404 ).json( new ApiError( 404, "Transactions not found", [ "Transactions not found" ] ) )
    }

    await redis.set( getTransactionsByCategoryKey( user._id, categoryId ), JSON.stringify( allTransactions ), "EX", 60 * 3 );

    logger.info( "Transactions by category fetched from DB", { userId: user._id, count: allTransactions.length } );
    return res.status( 200 ).json( new ApiResponse( 200, "Transactions found successfully", allTransactions ) );


} )


export
{
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactions,
    getTransactionsByCategory
}