import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("No local file path provided for Cloudinary upload.");
            return null;
        }

        // File upload to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File uploaded successfully
        // console.log("File is uploaded on Cloudinary:", cloudinaryResponse.url);
        
        // Attempt to remove the locally saved temporary file
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
                // console.log("Local temporary file deleted:", localFilePath);
            }
        } catch (unlinkError) {
            console.error("Error deleting local temporary file:", unlinkError);
            // Decide if this error should prevent returning the Cloudinary response
            // For now, we'll still return the response as the upload was successful
        }
        
        return cloudinaryResponse;

    } catch (error) {
        console.error("Cloudinary upload error:", error);
        // Attempt to remove the locally saved temporary file if upload failed
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
                // console.log("Local temporary file deleted after failed upload:", localFilePath);
            }
        } catch (unlinkError) {
            console.error("Error deleting local temporary file after failed upload:", unlinkError);
        }
        return null;
    }
};

export { uploadOnCloudinary };