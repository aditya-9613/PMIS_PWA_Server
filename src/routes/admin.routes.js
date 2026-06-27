import { Router } from "express";
import { LoginUser, TeacherLogin, changePassword, changeTeacherPassword, createUser, getActivity, getActivityRange, getUserById, getUserDetails, logoutUser, refreshAccessToken, removeUser, searchQuery, teacherLogout, updateUser } from "../controllers/admin.controllers.js";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route('/login').post(LoginUser)
router.route('/teacherLogin').post(TeacherLogin)

//Admin Routes
router.route('/CreateUser').post(adminVerifyJWT,createUser)
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

//Employee Routes
router.route('/getEmployee').get(employeeVerifyJWT, getUserDetails)
router.route('/refreshAccessTokenEmployee').post(refreshAccessToken)
router.route('/employeeLogout').post(employeeVerifyJWT, logoutUser)
router.route('/empChangePassword').put(employeeVerifyJWT, changePassword)

//Teacher Routes 
router.route('/teacherLogout').post(teacherVerifyJWT, teacherLogout)
router.route('/teacher/changePassword').put(teacherVerifyJWT, changeTeacherPassword)


export default router;