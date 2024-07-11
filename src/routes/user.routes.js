import { Router } from "express";
import { Logout, registerUser,refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {LoginUser} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/Auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }

    ]) ,                       //bich me middleware
    registerUser,
)

router.route("/login").post(LoginUser)


//secured Routes
router.route("/logout").post( verifyJWT, Logout)//verifyJwt wale me jo next diya h vo bta rha h ki verify ke bad 1 aur run kro jo ki Logout h

router.route("/refresh-token").post(refreshAccessToken)

export default router