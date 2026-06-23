import { ApiError } from "../utils/ApiError.js"
import { Admin } from "../models/admin.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from 'jsonwebtoken'
import { Teacher } from "../models/teacher.models.js"

export const adminVerifyJWT = asyncHandler(async (req, _, next) => {
    try {

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "ACCESS_TOKEN_EXPIRED")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const admin = await Admin.findById(decodedToken?._id).select("-password -refreshToken")


        if (!admin) {
            throw new ApiError(401, "ACCESS_TOKEN_EXPIRED")
        }

        req.admin = admin
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "ACCESS_TOKEN_EXPIRED")
        }
        throw new ApiError(401, error?.message || "ACCESS_TOKEN_EXPIRED")
    }
})

export const employeeVerifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "ACCESS_TOKEN_EXPIRED")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const employee = await Admin.findById(decodedToken?._id).select("-password")

        if (!employee) {
            throw new ApiError(401, "ACCESS_TOKEN_EXPIRED")
        }

        req.employee = employee
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "ACCESS_TOKEN_EXPIRED")
    }
})

export const teacherVerifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "ACCESS_TOKEN_EXPIRED")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const teacher = await Teacher.findById(decodedToken?._id).select("-password")

        if (!teacher) {
            throw new ApiError(401, "ACCESS_TOKEN_EXPIRED")
        }

        req.teacher = teacher
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "ACCESS_TOKEN_EXPIRED")
    }
})