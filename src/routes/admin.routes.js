import { Router } from "express";
import { LoginUser, createUser, getActivity, getUserById, getUserDetails, logoutUser, refreshAccessToken, removeUser, searchQuery, updateUser } from "../controllers/admin.controllers.js";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route('/login').post(LoginUser)

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

//Employee Routes
router.route('/getEmployee').get(employeeVerifyJWT, getUserDetails)
router.route('/refreshAccessTokenEmployee').post(refreshAccessToken)
router.route('/employeeLogout').post(employeeVerifyJWT, logoutUser)

//Teacher Routes 
router.route('/teacherLogout').post(teacherVerifyJWT, logoutUser)
export default router;