
import { Category, type CategoryDocument } from "../models/categories.models.js";
import { Transaction } from "../models/transactions.models.js";
import { redis } from "../db/redisconnect.db.js"
import { type Types } from "mongoose";
import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthRequest } from "../middlewares/auth.middlewares.js";
import type { UserDocument } from "../models/user.models.js";
import { TransactionType } from "../constants.js";


const allCategoriesKey = ( id: Types.ObjectId ): string => `categories:${ id }`

interface createCategoryBody
{
    name: string,
    icon: string,
    type: TransactionType
}

const createCategory = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const user: UserDocument | undefined = req.user
    const { name, icon, type } = req.body as createCategoryBody
    if ( !user )
    {
        logger.warn( "create category request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    const existingCategory: CategoryDocument | null = await Category.findOne( { name: name, ownerId: user._id, } )
    if ( existingCategory )
    {
        logger.warn( "create category request attempt with existing category" );
        return res.status( 409 ).json( new ApiError( 409, "Category already exists", [ "Category already exists" ] ) )
    }
    const category: CategoryDocument | null = await Category.create( {
        name,
        icon,
        type,
        ownerId: user._id
    } )
    if ( !category )
    {
        logger.error( "Category.create returned falsy value", { userId: user._id } );
        return res.status( 500 ).json( new ApiError( 500, "Failed to create category", [ "Failed to create category" ] ) );
    }

    logger.info( "Category created", { userId: user._id, categoryId: category._id } );
    await redis.del( allCategoriesKey( user._id ) );
    return res.status( 201 ).json( new ApiResponse( 201, "Category created successfully", category ) );
} )

interface UpdateCategoryBody
{
    name?: string;
    icon?: string;
    type?: TransactionType;
}

const updateCategory = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const user: UserDocument | undefined = req.user
    const { categoryId } = req.params
    const { name, icon, type } = req.body as UpdateCategoryBody

    if ( !user )
    {
        logger.warn( "create category request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }

    if ( !name && !icon && !type )
    {
        logger.warn( "update category request attempt with no data" );
        return res.status( 400 ).json( new ApiError( 400, "No data provided", [ "No data provided" ] ) )
    }

    const category: CategoryDocument | null = await Category.findOne( { _id: categoryId, ownerId: user._id } )

    if ( !category )
    {
        logger.warn( "update category request attempt with non-existent category" );
        return res.status( 404 ).json( new ApiError( 404, "Category not found", [ "Category not found" ] ) )
    }
    if ( category.isDefault )
    {
        logger.warn( "update category request attempt with default category" );
        return res.status( 403 ).json( new ApiError( 403, "Cannot update default category", [ "Cannot update default category" ] ) )
    }
    if ( name ) category.name = name
    if ( icon ) category.icon = icon
    if ( type ) category.type = type
    await category.save()
    logger.info( "Category updated", { userId: user._id, categoryId: category._id } );
    await redis.del( allCategoriesKey( user._id ) );
    return res.status( 200 ).json( new ApiResponse( 200, "Category updated successfully", category ) );


} )

type TransactionExistsResult = {
    _id: Types.ObjectId;
} | null;


const deleteCategory = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const user: UserDocument | undefined = req.user
    const { categoryId } = req.params
    if ( !user )
    {
        logger.warn( "create category request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }

    const category: CategoryDocument | null = await Category.findOne( { _id: categoryId, ownerId: user._id } )
    if ( !category )
    {
        logger.warn( "delete category request attempt with non-existent category" );
        return res.status( 404 ).json( new ApiError( 404, "Category not found", [ "Category not found" ] ) )
    }
    if ( category.isDefault )
    {
        logger.warn( "delete category request attempt with default category" );
        return res.status( 403 ).json( new ApiError( 403, "Cannot delete default category", [ "Cannot delete default category" ] ) )
    }
    const hasTransactions: TransactionExistsResult = await Transaction.exists( {
        ownerId: user._id,
        categoryId: category._id
    } );

    if ( hasTransactions )
    {
        logger.warn( "delete category request attempt with transactions" );
        return res.status( 409 ).json( new ApiError( 409, "Cannot delete category with existing transactions", [ "Cannot delete category with existing transactions" ] ) )
    }

    await category.deleteOne()

    logger.info
        ( "Category deleted", { userId: user._id, categoryId: category._id } );

    await redis.del( allCategoriesKey( user._id ) );

    return res.status( 200 ).json( new ApiResponse( 200, "Category deleted successfully", category ) );
} )


const getCategories = asyncHandler( async ( req: AuthRequest, res: Response ) =>
{
    const user: UserDocument | undefined = req.user
    if ( !user )
    {
        logger.warn( "get categories request attempt with non-existent user" );
        return res.status( 401 ).json( new ApiError( 401, "Unauthorized request", [ "Unauthorized request please login or signup" ] ) )
    }
    const rawData = await redis.get( allCategoriesKey( user._id ) )

    if ( rawData )
    {
        const cachedCategories: CategoryDocument[] = JSON.parse( rawData );
        logger.info( "Categories fetched from cache", { userId: user._id } );
        return res.status( 200 ).json( new ApiResponse( 200, "Categories fetched successfully", cachedCategories ) );
    }

    const categoriesFromDB: CategoryDocument[] = await Category.find( { ownerId: user._id } );


    if ( !categoriesFromDB )
    {
        logger.error( "Category.find returned falsy value", { userId: user._id } );
        return res.status( 500 ).json( new ApiError( 500, "Failed to fetch categories", [ "Failed to fetch categories" ] ) );
    }
    await redis.set( allCategoriesKey( user._id ), JSON.stringify( categoriesFromDB ), "EX", 60 * 10 );

    logger.info( "Categories fetched", { userId: user._id } );
    return res.status( 200 ).json( new ApiResponse( 200, "Categories fetched successfully", categoriesFromDB ) );
} )


export
{
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories
}