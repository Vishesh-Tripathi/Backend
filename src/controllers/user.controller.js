import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadCloudinary} from "../utils/cloudnary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async(req,res) => {
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
   const {username ,email,fullname,password}=req.body
   console.log("email:",email);
   //validation
   if(
      [fullname,username,password,email].some((field)=>field?.trim()==="")
   ){
      throw new ApiError(409,"all fields arr compulsary")
   }
   //checkking if user already exist
   const existedUser =User.findOne(
      {
         $or:[{username},{email}]
      }
   )
   if(existedUser){
      throw new ApiError(409,"User already existed");
   }
   //checkiing images
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //checking for avatar
  if(!avatarLocalPath){
   throw new ApiError(400,"avatar is needed")
  }
  //uploading on cloudinary
   const avatar = await uploadCloudinary(avatarLocalPath)
   const coverImage = await uploadCloudinary(coverImageLocalPath)
   //check avatar again
   if(!avatar){
      throw new ApiError(400,"avatar is not uploaded")
   }
   // entry in db
  const user = await User.create({
      fullname,
      avatar:avatar.url,
      coverImage:coverImage?.url || "", // ho skta h ki user ne upload na kiya ho
      email,
      username: username.toLowerCase()
   })
   //checking if user created
   const checkUser =await User.findById(user._id).select(
      //kya kya nhi chahiye
      "-password -refreshToken"
   );
   if(!checkUser){
      throw new ApiError(500,"error while creating user")
   }
   // returning res
   return res.status(201).json(
      new ApiResponse(200,"user Resistered Successfully",checkUser)
   )
})

export {registerUser}