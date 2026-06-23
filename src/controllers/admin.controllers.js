import { Activity } from "../models/activities.model.js";
import { Admin } from "../models/admin.models.js";
import { Teacher } from "../models/teacher.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from 'jsonwebtoken'

//Generate Tokens
const genrateAccessAndRefreshTokens = async (userId, type) => {
    try {
        if (type === 'Non-Teacher') {
            const admin = await Admin.findById(userId)
            const accessToken = admin.genrateAccessToken()
            const refreshToken = admin.genrateRefreshToken()


            admin.refreshToken = refreshToken
            admin.save({ validateBeforeSave: false })

            return { accessToken, refreshToken }
        } else if (type === 'Teacher') {
            const teacher = await Teacher.findById(userId)
            const accessToken = teacher.genrateAccessToken()
            const refreshToken = teacher.genrateRefreshToken()


            teacher.refreshToken = refreshToken
            teacher.save({ validateBeforeSave: false })

            return { accessToken, refreshToken }
        }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}
//Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    const type = req.body.type

    if (!incomingRefreshToken) {
        throw new ApiError(401, "REFRESH_TOKEN_EXPIRED")
    }

    try {
        if (type === 'employee' || type === 'admin') {
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
        } else if (type === 'teacher') {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )

            const teacher = await Teacher.findById(decodedToken._id)


            if (!teacher) {
                throw new ApiError(401, "REFRESH_TOKEN_EXPIRED")
            }

            if (incomingRefreshToken !== teacher?.refreshToken) {
                throw new ApiError(401, "REFRESH_TOKEN_EXPIRED")
            }

            const options = {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            }

            const accessToken = teacher.genrateAccessToken()

            return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .json(
                    new ApiResponse(200, { accessToken }, "Access token refreshed")
                )
        }

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

    if (admin.userStatus === 'terminated') {
        throw new ApiError(403, `User in ${admin.userType} mode Access Denied`)
    }

    const isPasswordValid = await admin.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid Credentials')
    }

    const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(admin._id, 'Non-Teacher')

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
//Teacher Login 
const TeacherLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        throw new ApiError(400, 'Required Fields')
    }

    const findTeacher = await Teacher.findOne({ mobile: username })

    if (!findTeacher) {
        throw new ApiError(401, 'Invalid Credentials')
    }

    if (findTeacher.status !== 'Active') {
        throw new ApiError(401, 'Unauthorised Acccess')
    }

    const isPasswordValid = await findTeacher.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid Credentials')
    }

    const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(findTeacher._id, 'Teacher')

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
                    accessToken, refreshToken, type: 'Teacher'
                },
                "User logged In Successfully"
            )
        )


})
//Get User Details
const getUserDetails = asyncHandler(async (req, res) => {
    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
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

    const _id = req?.admin?._id || req?.employee?._id

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

const teacherLogout = asyncHandler(async (req, res) => {
    const _id = req?.teacher?._id

    await Teacher.findByIdAndUpdate(_id,
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

const searchQuery = asyncHandler(async (req, res) => {
    const { query } = req.query

    if (!query || query === '') {
        throw new ApiError(400, 'Query is required')
    }

    const searchResults = await Admin.find({
        $or: [
            { username: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
        ],
        userType: { $in: ['Employee', 'Teacher'] }
    }).select('-password')

    return res
        .status(200)
        .json(
            new ApiResponse(200, { results: searchResults }, 'Search Results')
        )
})

const getUserById = asyncHandler(async (req, res) => {
    const { username } = req.query

    if (!username || username === '') {
        throw new ApiError(400, 'User ID is required')
    }

    const user = await Admin.findOne({ username: username }).select('-password')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { user }, 'User Details')
        )
})

const removeUser = asyncHandler(async (req, res) => {
    const { _id } = req.body

    if (!_id) {
        throw new ApiError(400, 'ID is Null')
    }

    const getUser = await Admin.findById(_id)

    if (!getUser) {
        throw new ApiError(404, 'User Data Missing')
    }

    getUser.userStatus = 'terminated'
    getUser.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'User Terminated Successfully')
        )
})

const getActivity = asyncHandler(async (req, res) => {
    const { _id } = req.query

    if (!_id) {
        throw new ApiError(400, 'Required User ID')
    }

    const getUser = await Activity.find({ user_id: _id })

    if (!getUser) {
        throw new ApiError(404, 'No Activities Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, getUser, 'Activities Found')
        )
})

const getActivityRange = asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query

    if (!start_date || !end_date) {
        throw new ApiError(400, 'Required Date Range')
    }

    const getUserActivity = await Activity.find({
        activityDate: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
        }
    })

    if (!getUserActivity) {
        throw new ApiError(404, 'No Activities Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, getUserActivity, 'Activities Found')
        )
})

const updateUser = asyncHandler(async (req, res) => {
    const { _id, username, mobile, name, userStatus } = req.body

    if (
        [_id, username, mobile, name, userStatus].some((item) => !item || item === '')
    ) {
        throw new ApiError(400, 'Required Inputs')
    }

    const findUser = await Admin.findById(_id)

    if (!findUser) {
        throw new ApiError(404, 'User Not Found')
    }

    findUser.username = username
    findUser.mobile = mobile
    findUser.name = name
    findUser.userStatus = userStatus
    findUser.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'User Updated Successfully')
        )
})

const changePassword = asyncHandler(async (req, res) => {
    const { username, oldPassword, newPassword, mobile } = req.body

    if (
        [username, oldPassword, newPassword, mobile].some((item) => !item || item?.trim() === '')
    ) {
        throw new ApiError(400, 'Required Inputs')
    }

    const admin = req?.admin || req?.employee

    const findUser = await Admin.findOne({ username: username, mobile: mobile })

    if (!findUser) {
        throw new ApiError(404, 'User Credentials Invalid')
    }

    if (admin.username !== findUser.username || admin.mobile !== findUser.mobile) {
        throw new ApiError(401, 'Invalid Credentials')
    }

    const isPasswordValid = await findUser.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid Old Password')
    }

    findUser.password = newPassword
    await findUser.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Password Changed Successfully')
        )
})

const changeTeacherPassword = asyncHandler(async (req, res) => {
    const { username, oldPassword, newPassword, adharNumber } = req.body

    if (
        [username, oldPassword, newPassword, adharNumber].some((item) => !item || item?.trim() === '')
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    const teacher = req?.teacher

    const findTeacher = await Teacher.findOne({ mobile: username })

    if (teacher.mobile !== findTeacher.mobile) {
        throw new ApiError(401, 'Invalid Credentials')
    }

    const isPasswordValid = await findTeacher.isPasswordValid(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid Credentials')
    }

    findTeacher.password = newPassword
    await findTeacher.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Password Changed Successfully')
        )
})

const updateBulkTeacher = asyncHandler(async (req, res) => {
    const { json } = req.body

    if (json.length === 0) {
        throw new ApiError(400, 'Empty array')
    }
    var v = 1;

    for (const teacher of json) {
        const createTeacher = await Teacher.create({
            email: teacher.email,
            name: teacher.name,
            password: teacher.password,
            mobile: teacher.mobile,
            dob: parseDOBToIST(teacher.dob),
            status: teacher.status,
            address: teacher.address,
            gender: teacher.gender,
            adharNumber: teacher.adharNumber,
            class: teacher.class,
            type: teacher.type
        })

        if (createTeacher) {
            console.log('Teacher Update Count', v)
            v++
        } else {
            throw new ApiError(500, 'Server Error')
        }
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Teacher Data Updated ')
        )
})

function parseDOBToIST(dob) {
    const parts = dob.split(/[-\/]/);

    if (parts.length !== 3) {
        throw new Error('Invalid date format. Expected DD-MM-YYYY or DD/MM/YYYY');
    }

    const [day, month, year] = parts.map(Number);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error('Invalid date values');
    }

    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

export {
    refreshAccessToken,
    createUser,
    LoginUser,
    getUserDetails,
    logoutUser,
    teacherLogout,
    TeacherLogin,
    searchQuery,
    getUserById,
    removeUser,
    getActivity,
    getActivityRange,
    updateUser,
    changePassword,
    changeTeacherPassword,
    updateBulkTeacher
}