
import { DEFAULT_CATEGORIES } from "../utils/defaultCategories.js"
import { Category, type CategoryDocument } from "../models/categories.models.js"
import { logger } from "../utils/logger.js"
import type { Types } from "mongoose"

const seedDefaultCategories = async ( userId: Types.ObjectId ): Promise<CategoryDocument[] | null> =>
{
    const categoriesToInsert = DEFAULT_CATEGORIES.map( ( category ) => ( {
        ...category,
        ownerId: userId,
        isDefault: true,
    } ) );
    try
    {
        const categories: CategoryDocument[] = await Category.insertMany( categoriesToInsert, { ordered: false } )
        logger.info( "Default categories seeded", { count: categoriesToInsert.length, userId: userId } )
        return categories
    } catch ( error )
    {
        logger.error( "Failed to seed default categories", {
            userId,
            error: error instanceof Error ? error.message : "Unknown error",
        } );
        return null
    }
}

export { seedDefaultCategories }