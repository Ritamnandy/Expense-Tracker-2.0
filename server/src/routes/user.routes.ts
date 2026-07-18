
import
{
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    reSendVerificationCode,
    verifyEmail,
    setAavatar,
    forgetPassword,
    resetPassword,
    getCurrentUser
} from "../controllers/user.controllers.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { validate } from "../validators/validate.js"
import
{
    registerValidators,
    verifyEmailValidators,
    loginValidators,
    reSendVerificationCodeValidators,
    refreshAccessTokenValidators,
    setAvatarValidators,
    forgetPasswordValidators,
    resetPasswordValidators
} from "../validators/auth/auth.validators.js"
import { Router } from "express"
import
{
    loginLimiter,
    registerLimiter,
    verifyEmailLimiter,
    resendCodeLimiter,
    forgotPasswordLimiter
} from "../middlewares/rateLimiters.middlewares.js"




const router = Router()

// public routes
router.route( '/register' ).post( registerLimiter, registerValidators(), validate, registerUser )

router.route( '/verify-email' ).post( verifyEmailLimiter, verifyEmailValidators(), validate, verifyEmail )

router.route( '/re-send-verification-code' ).post( resendCodeLimiter, reSendVerificationCodeValidators(), validate, reSendVerificationCode )

router.route( '/login' ).post( loginLimiter, loginValidators(), validate, loginUser )

router.route( '/forget-password' ).post( forgotPasswordLimiter, forgetPasswordValidators(), validate, forgetPassword )

router.route( '/reset-password' ).post( resetPasswordValidators(), validate, resetPassword )

router.route( '/refresh-access-token' ).post( refreshAccessTokenValidators(), validate, refreshAccessToken )

// protected routes
router.route( '/logout' ).post( verifyJWT, logOutUser )

router.route( '/set-avatar' ).post( verifyJWT, upload.single( 'avatar' ), setAvatarValidators(), validate, setAavatar )

router.route( '/current-user' ).get( verifyJWT, getCurrentUser )

export default router