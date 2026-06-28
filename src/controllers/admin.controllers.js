import { Activity } from "../models/activities.model.js";
import { Admin } from "../models/admin.models.js";
import { Teacher } from "../models/teacher.models.js";
import { CreateActivity } from "../utils/Activity.js";
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
    await CreateActivity(req?.admin?._id, 'admin', 'Creation', 'User Created By Admin')

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
    await CreateActivity(admin._id, type, 'Login', 'User Logged In')

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

    await CreateActivity(findTeacher._id, 'teacher', 'Login', 'User Logged In')

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

    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Logged Out', 'User Logged Out from ERP')

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

    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Logged Out', 'User Logged Out from ERP')

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

    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Remove', 'User Removed from status set to terminated')

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

    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Update', 'User Details Updated')

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

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Update', 'User changed the password')

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

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Update', 'Teacher Updated the Password')

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Password Changed Successfully')
        )
})

const fetchProfile = asyncHandler(async (req, res) => {
    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null

    let profile
    if (type === 'admin' || type === 'employee') {
        const fetchProfile = await Admin.findById(user_id).select('-password')
        profile = fetchProfile
    } else if (type === 'teacher') {
        const fetchProfile = await Teacher.findById(user_id).select('-password')
        profile = fetchProfile
    }

    if (!profile) {
        throw new ApiError(404, 'Profile not found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, profile, 'Profile Details')
        )
})

const profileUpdated = asyncHandler(async (req, res) => {
    const { name, mobile, email, dob, gender, address, adharNumber, qualification } = req.body

    if (!name || !mobile) {
        throw new ApiError(400, 'Name and mobile are required.')
    }

    let updated

    if (req.admin) {
        // Admin or Employee — same Admin model
        updated = await Admin.findByIdAndUpdate(
            req.admin._id,
            { $set: { name, mobile } },
            { new: true, runValidators: true }
        ).select('-password -refreshToken')

    } else if (req.teacher) {
        // Teacher — full profile fields
        updated = await Teacher.findByIdAndUpdate(
            req.teacher._id,
            { $set: { name, email, mobile, dob, gender, address, adharNumber, qualification } },
            { new: true, runValidators: true }
        ).select('-password -refreshToken')
    }

    if (!updated) throw new ApiError(404, 'User not found.')

    return res
        .status(200)
        .json(
            new ApiResponse(200, updated, 'Profile updated successfully.')
        )
})

const createTeacher = asyncHandler(async (req, res) => {
    const {
        email, name, password, mobile, dob,
        status, address, gender, adharNumber,
        qualification, classTeacher, subjects
    } = req.body

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!email || !name || !password || !mobile || !dob || !status || !address || !gender || !adharNumber) {
        throw new ApiError(400, 'All required fields must be provided.')
    }

    // ── Check duplicate email / mobile / aadhaar ──────────────────────────────
    const existingTeacher = await Teacher.findOne({
        $or: [{ email }, { mobile }, { adharNumber }]
    })
    if (existingTeacher) {
        if (existingTeacher.email === email) throw new ApiError(409, 'A teacher with this email already exists.')
        if (existingTeacher.mobile === mobile) throw new ApiError(409, 'A teacher with this mobile number already exists.')
        if (existingTeacher.adharNumber === adharNumber) throw new ApiError(409, 'A teacher with this Aadhaar number already exists.')
    }

    // ── Class teacher conflict check ──────────────────────────────────────────
    if (classTeacher?.alloted && classTeacher?.class) {
        const classTeacherConflict = await Teacher.findOne({
            status: 'Active',
            'classTeacher.alloted': true,
            'classTeacher.class': classTeacher.class
        })
        if (classTeacherConflict) {
            throw new ApiError(409, `A class teacher is already assigned to class ${classTeacher.class}.`)
        }
    }

    // ── Subject conflict check ────────────────────────────────────────────────
    if (subjects?.length > 0) {
        for (const sub of subjects) {
            if (!sub.subjectName || !sub.classes) continue
            const subjectConflict = await Teacher.findOne({
                status: 'Active',
                subjects: {
                    $elemMatch: {
                        subjectName: sub.subjectName,
                        classes: sub.classes
                    }
                }
            })
            if (subjectConflict) {
                throw new ApiError(409, `${sub.subjectName} is already assigned to another teacher for class ${sub.classes}.`)
            }
        }
    }

    // ── Create teacher ────────────────────────────────────────────────────────
    const teacher = await Teacher.create({
        email, name, password, mobile, dob,
        status, address, gender, adharNumber,
        qualification: qualification || '',
        classTeacher: classTeacher || { alloted: false },
        subjects: subjects || []
    })

    const created = await Teacher.findById(teacher._id).select('-password -refreshToken')

    return res.status(201).json(new ApiResponse(201, created, 'Teacher created successfully.'))
})

const updateTeacher = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status, classTeacher, subjects } = req.body

    // ── Check teacher exists ──────────────────────────────────────────────────
    const teacher = await Teacher.findById(id)
    if (!teacher) {
        throw new ApiError(404, 'Teacher not found.')
    }

    // ── At least one field required ───────────────────────────────────────────
    if (status === undefined && classTeacher === undefined && subjects === undefined) {
        throw new ApiError(400, 'At least one field (status, classTeacher, subjects) must be provided.')
    }

    const updatePayload = {}

    // ── Status update ─────────────────────────────────────────────────────────
    if (status !== undefined) {
        updatePayload.status = status
    }

    // ── Determine effective status for conflict checks ─────────────────────────
    // If status is being changed in this same request, use the incoming value,
    // otherwise fall back to the teacher's current status in DB
    const effectiveStatus = status !== undefined ? status : teacher.status

    // ── Class teacher conflict check ──────────────────────────────────────────
    if (classTeacher !== undefined) {
        if (classTeacher?.alloted && classTeacher?.class) {

            // Only check conflict if the teacher will be Active after this update
            if (effectiveStatus === 'Active') {
                const classTeacherConflict = await Teacher.findOne({
                    _id: { $ne: id },
                    status: 'Active',
                    'classTeacher.alloted': true,
                    'classTeacher.class': classTeacher.class
                })
                if (classTeacherConflict) {
                    throw new ApiError(409, `A class teacher is already assigned to class ${classTeacher.class}.`)
                }
            }
        }

        updatePayload.classTeacher = classTeacher?.alloted
            ? { alloted: true, class: classTeacher.class }
            : { alloted: false }
    }

    // ── Subject conflict check ────────────────────────────────────────────────
    if (subjects !== undefined) {
        if (!Array.isArray(subjects)) {
            throw new ApiError(400, 'Subjects must be an array.')
        }

        // Only check conflict if the teacher will be Active after this update
        if (effectiveStatus === 'Active') {
            for (const sub of subjects) {
                if (!sub.subjectName || !sub.classes) continue
                const subjectConflict = await Teacher.findOne({
                    _id: { $ne: id },
                    status: 'Active',
                    subjects: {
                        $elemMatch: {
                            subjectName: sub.subjectName,
                            classes: sub.classes
                        }
                    }
                })
                if (subjectConflict) {
                    throw new ApiError(409, `${sub.subjectName} is already assigned to another teacher for class ${sub.classes}.`)
                }
            }
        }

        updatePayload.subjects = subjects
    }

    // ── Apply update ──────────────────────────────────────────────────────────
    const updated = await Teacher.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true, runValidators: true }
    ).select('-password -refreshToken')

    return res.status(200).json(new ApiResponse(200, updated, 'Teacher updated successfully.'))
})

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
    fetchProfile,
    profileUpdated,
    createTeacher,
    updateTeacher
}