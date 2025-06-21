import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudianry = async (localFilePath) => {
  try {
    if(!localFilePath) return null
    // Upload the file on cloudianry
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    // File has been uploaded successfull
    console.log("file is uploaded on cloudinary ", response.url);
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath) // remove the locally saved temparory file ad the upload operation faild
    return null
  }
}

export {uploadOnCloudianry}