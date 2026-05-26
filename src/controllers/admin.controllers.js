import { Admin } from "../models/admin.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from 'jsonwebtoken'

//Generate Tokens
const genrateAccessAndRefreshTokens = async (userId) => {
    try {
        const admin = await Admin.findById(userId)
        const accessToken = admin.genrateAccessToken()
        const refreshToken = admin.genrateRefreshToken()


        admin.refreshToken = refreshToken
        admin.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}
//Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "REFRESH_TOKEN_EXPIRED")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const admin = await Admin.findById(decodedToken._id)


        if (!admin) {
            throw new ApiError(401, "REFRESH_TOKEN_EXPIRED")
        }

        if (incomingRefreshToken !== admin?.refreshToken) {
            throw new ApiError(401, "REFRESH_TOKEN_EXPIRED")
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        }

        const accessToken = admin.genrateAccessToken()

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(200, { accessToken }, "Access token refreshed")
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "REFRESH_TOKEN_EXPIRED")
    }
})
// Create User
const createUser = asyncHandler(async (req, res) => {
    const { username, password, mobile, name, userType } = req.body

    if (username === '' || password === '' || mobile === '' || name === '' || userType === '') {
        throw new ApiError(400, 'Required Fields')
    }

    const existingUser = await Admin.findOne({ username: username })

    if (existingUser) {
        throw new ApiError(400, 'Username already exists')
    }

    const newUser = await Admin.create({
        username,
        password,
        mobile,
        name,
        userType
    })

    if (!newUser) {
        throw new ApiError(500, 'Error while creating user')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'User created successfully')
        )
})
//Login User
const LoginUser = asyncHandler(async (req, res) => {
    const { username, password, type } = req.body

    if (
        [username, password, type].some((item) => !item || item === '' || item === null)
    ) {
        throw new ApiError(400, 'Required Inputs')
    }

    const admin = await Admin.findOne({ username: username })

    if (!admin || admin.userType !== type) {
        throw new ApiError(401, "Invalid Credentials");
    }

    if (admin.userStatus === 'suspended' || admin.userStatus === 'terminated') {
        throw new ApiError(403, `User in ${admin.userType} mode Access Denied`)
    }

    const isPasswordValid = await admin.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid Credentials')
    }

    const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(admin._id)

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken, type: admin.userType
                },
                "User logged In Successfully"
            )
        )
})
//Get User Details
const getUserDetails = asyncHandler(async (req, res) => {
    const _id = req.admin._id || req.employee._id
    const findUser = await Admin.findById(_id).select('-password')

    if (findUser.userStatus === 'suspended' || findUser.userStatus === 'terminated') {
        throw new ApiError(403, 'Access Denied')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { user: findUser }, 'User Details')
        )
})
//Logout Controllers
const logoutUser = asyncHandler(async (req, res) => {

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id

    await Admin.findByIdAndUpdate(_id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User Logged Out Successfully")
        )
})

export {
    refreshAccessToken,
    createUser,
    LoginUser,
    getUserDetails,
    logoutUser
}