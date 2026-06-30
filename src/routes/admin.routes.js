import { Router } from "express";
import { LoginUser, TeacherLogin, changePassword, changeTeacherPassword, createTeacher, createUser, fetchProfile, getActivity, getActivityRange, getUserById, getUserDetails, logoutUser, profileUpdated, refreshAccessToken, removeUser, searchQuery, teacherLogout, updateTeacher, updateUser } from "../controllers/admin.controllers.js";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route('/login').post(LoginUser)
router.route('/teacherLogin').post(TeacherLogin)

//Admin Routes
router.route('/CreateUser').post(adminVerifyJWT, createUser)
router.route('/getAdmin').get(adminVerifyJWT, getUserDetails)
router.route('/refreshAccessTokenAdmin').post(refreshAccessToken)
router.route('/adminLogout').post(adminVerifyJWT, logoutUser)
router.route('/searchQuery').get(adminVerifyJWT, searchQuery)
router.route('/getUserById').get(adminVerifyJWT, getUserById)
router.route('/removeUser').put(adminVerifyJWT, removeUser)
router.route('/getActivity').get(adminVerifyJWT, getActivity)
router.route('/updateUser').put(adminVerifyJWT, updateUser)
router.route('/changePassword').put(adminVerifyJWT, changePassword)
router.route('/getActivityRange').get(adminVerifyJWT, getActivityRange)
router.route('/fetchProfile').get(adminVerifyJWT, fetchProfile)
router.route('/updatProfile').put(adminVerifyJWT, profileUpdated)
router.route('/createTeacher').post(adminVerifyJWT, createTeacher)
router.route('/updateTeacher').put(adminVerifyJWT, updateTeacher)

//Employee Routes
router.route('/getEmployee').get(employeeVerifyJWT, getUserDetails)
router.route('/refreshAccessTokenEmployee').post(refreshAccessToken)
router.route('/employeeLogout').post(employeeVerifyJWT, logoutUser)
router.route('/empChangePassword').put(employeeVerifyJWT, changePassword)
router.route('/employee/fetchProfile').get(employeeVerifyJWT, fetchProfile)
router.route('/employee/updatProfile').put(employeeVerifyJWT, profileUpdated)

//Teacher Routes 
router.route('/teacherLogout').post(teacherVerifyJWT, teacherLogout)
router.route('/teacher/changePassword').put(teacherVerifyJWT, changeTeacherPassword)
router.route('/teacher/fetchProfile').get(teacherVerifyJWT, fetchProfile)
router.route('/teacher/updatProfile').put(teacherVerifyJWT, profileUpdated)

export default router;