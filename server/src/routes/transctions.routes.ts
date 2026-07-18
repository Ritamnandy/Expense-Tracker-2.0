
import { Router } from "express"
import { validate } from "../validators/validate.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

import
{
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactions,
    getTransactionsByCategory
} from "../controllers/transctions.controllers.js"

import
{
    createTransactionValidators,
    updateTransactionValidators,
    deleteTransactionValidators,
    TransactionsByCategoryValidators
} from "../validators/others/transctions.validators.js"

const router = Router()

router.route( '/' ).post( verifyJWT, createTransactionValidators(), validate, createTransaction )

router.route( '/' ).get( verifyJWT, getTransactions )

router.route( '/:transactionId' )
    .patch( verifyJWT, updateTransactionValidators(), validate, updateTransaction )
    .delete( verifyJWT, deleteTransactionValidators(), validate, deleteTransaction )


router.route( '/by-category' ).get( verifyJWT, TransactionsByCategoryValidators(), validate, getTransactionsByCategory )

export default router