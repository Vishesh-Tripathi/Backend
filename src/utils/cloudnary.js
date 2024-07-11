import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// Upload an file
 const uploadCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null; // checking if path exist
        //upload
       const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        // file uploaded
        // console.log("file uploaded successfully",response.url)
         fs.unlinkSync(localFilePath)
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally save temprory file as the upload operation get  failed
        return null
        
    }
 }

export {uploadCloudinary}
