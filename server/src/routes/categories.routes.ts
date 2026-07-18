

import { Router } from "express"
import { validate } from "../validators/validate.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import
{
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories
} from "../controllers/categories.controllers.js"
import
{
    createCategoryValidators,
    updateCategoryValidators,
    deleteCategoryValidators
} from "../validators/others/category.validators.js"

const router = Router()

router.route( '/' ).post( verifyJWT, createCategoryValidators(), validate, createCategory )

router.route( '/' ).get( verifyJWT, getCategories )

router.route( '/:categoryId' )
    .patch( verifyJWT, updateCategoryValidators(), validate, updateCategory )
    .delete( verifyJWT, deleteCategoryValidators(), validate, deleteCategory )


export default router