import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // saving in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong in genertaing Token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user detail from frontend
  // check for empty forms
  // check if user already exist : username,email
  // check for images , must for avatar
  //upload images on cloudanary , and sure for avatar is uploadesd
  //create userObject in db
  // remove password and refreshToken from response
  //check for user creation
  //return response

  //destructring frontend data
  //frontend ka pura data req.body se mil jata h
  const { username, email, fullName, password } = req.body;
  console.log("email:", email);
  //validation
  //we can use simple if and else to check or validate
  if (
    [fullName, username, password, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(409, "all fields are compulsary");
  }
  //checkking if user already exist
  // only User can communicate with database so we use User.findOne to find if data already exist
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // this is for checking by two fields we can siply provide multiple check or single check
  });
  if (existedUser) {
    //if data is already found then throw error
    throw new ApiError(409, "User already existed");
  }
  //checking images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path; // this is giving undefined so ->
  //custom check for above line
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  //checking for avatar
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is needed");
  }
  //uploading on cloudinary
  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);
  //check avatar again
  if (!avatar) {
    throw new ApiError(400, "avatar is not uploaded");
  }
  // entry in db
  const user = await User.create({
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // ho skta h ki user ne upload na kiya ho
    email,
    username: username.toLowerCase(),
  });
  //checking if user created
  const checkUser = await User.findById(user._id).select(
    //kya kya nhi chahiye response me jo user ko dikhana h
    "-password -refreshToken"
  );
  if (!checkUser) {
    throw new ApiError(500, "error while creating user");
  }
  // returning res
  return res
    .status(201)
    .json(new ApiResponse(200, "user Resistered Successfully", checkUser));
});

const LoginUser = asyncHandler(async (req, res) => {
  //get deatils from frontendend
  // check for empty fields
  // find the user
  //tally from DB
  // generate access and refresh token
  //send cookie
  const { email, username, password } = req.body;
  // console.log(username)
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const userToLogin = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!userToLogin) {
    throw new ApiError(404, "user not found");
  }
  const isPassValid = await userToLogin.isPasswordCorrect(password);
  //  const isPassValid = async(password)=>{
  //    return await bcrypt.compare(password,userToLogin.password)
  //  }

  if (!isPassValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }
  console.log(userToLogin._id);

  // generate tokens
  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    userToLogin._id
  );

  // removing unwanted infor from res
  const loggedUser = await User.findById(userToLogin._id).select(
    " -password -refreshToken"
  );

  // send cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options) // aap.js me cookieParser as a middleWare pass kiya h isliye req.cookie aur res.cookie kr pa rhe h
    .json(
      new ApiResponse(
        200,
        {
          user: loggedUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const Logout = asyncHandler(async (req, res) => {
  //clear cookies
  // refresh token clear
  // user ko logout krne ke liye usko dundna padega pr hmare pas kuch nhi h to hme user._id ka access chahihiye hoga islie 1 middleware banana padega
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },// removes field from doc
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    //matching
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessandRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newrefreshToken,
          },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(400, "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPassValid = await user.isPasswordCorrect(oldPassword);
  if (!isPassValid) {
    throw new ApiError(400, "Invakid Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated Successfully"));
  // needed old password => uske liye user chahiye agr user update password pr h mtlb wo login h agr login h to authMiddleware chala hoga to mai req.user se data le skta hu
});

const getCurrentUser = asyncHandler(async (req, res) => {
  //req.user se  le lo
  const user = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched succesfully"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "all fields are required");
  }
  const user = req.user;
  await User.findByIdAndUpdate(
    user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated Successfully"));
});

//Delete purani image
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "error while uploading avatr on cloud");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage file is missing");
  }
  const coverImage = await uploadCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading CoverImage on cloud");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  //extract username jisse query lga pao
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username not found");
  }

  //pipeline
const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      //subsctiber count
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", // want to select
        as: "subscribers", //used to calculate
      },
    },
    {
      //subscribed channel count
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", // want to select
        as: "subscribedTo", // use in calc
      },
    },
    {
      // add extra new fields in DB
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            // for checking
            if: {
              //normal if block
              $in: [req.user?._id, "$subscribers.subscriber"], // $in method to check present or not (id ko dundna hai pr kisme jo subscribers ka arry h usme dund lo)
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        email: 1,
        coverImage: 1,
      },
    },
     ]);
  if (!channel?.length) {
    throw new ApiError(400, "channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel fetched Successfully")
    );
});


//getWatchHistory
const getWatchHistory = asyncHandler(async(req,res)=>{
   const user = await User.aggregate([
      {
         $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            //for getting owner field
            pipeline:[
               {
                  $lookup:{
                     from:"users",
                     localField:"owner",
                     foreignField:"_id",
                     as:"owner",
                     pipeline:[
                        {
                           $project:{
                              fullName:1,
                              username:1,
                              avatar:1,
                           }
                        }
                     ]
                  }
               },
               {//for arranging array
                  $addFields:{
                     owner:{
                        $first:"$owner"
                     }
                  }
               }
            ]
         }
      }
   ])

   return res.status(200)
   .json(
      new ApiResponse(200,
         user[0].watchHistory,
         "watchHistory fetched Successfylly"
      )
   )
})




export {
  registerUser,
  LoginUser,
  Logout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserProfile,
  getWatchHistory
};
