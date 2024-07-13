import { Router } from "express";
import {
  Logout,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { LoginUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), //bich me middleware
  registerUser
);

router.route("/login").post(LoginUser);

//secured Routes
router.route("/logout").post(verifyJWT, Logout); //verifyJwt wale me jo next diya h vo bta rha h ki verify ke bad 1 aur run kro jo ki Logout h

router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage);
//jb data params se aa rha ho
// niche jo username h vo getUserProfile se aa rha h
router.route("/c/:username").get(verifyJWT, getUserProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
