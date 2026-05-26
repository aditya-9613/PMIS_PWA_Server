import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const removeFromCloudinary = async (imageURL) => {
    try {
        const URLarray = imageURL.split('/');
        const image = URLarray[URLarray.length - 1];
        const imagename = image.split('.')[0];
        const response = await cloudinary.uploader.destroy(imagename);
        return response;
    } catch (error) {
        return null
    }
}


export {
    uploadOnCloudinary,
    removeFromCloudinary
}