import { Router } from "express";
import { adminVerifyJWT, employeeVerifyJWT } from "../middlewares/auth.middlewares.js";
import { findStudentsQuery, findStudentWithId, newAddmission, updateStudentDetails } from "../controllers/students.controllers.js";

const router = Router()

//Admin Routes
router.route('/admin/newAdmission').post(adminVerifyJWT, newAddmission)
router.route('/admin/studentQuery').get(adminVerifyJWT, findStudentsQuery)
router.route('/admin/studentDetails').get(adminVerifyJWT, findStudentWithId)
router.route('/admin/studentUpdate').put(adminVerifyJWT, updateStudentDetails)

//Employee Routes 
router.route('/employee/newAdmission').post(employeeVerifyJWT, newAddmission)
router.route('/employee/studentQuery').get(employeeVerifyJWT, findStudentsQuery)
router.route('/employee/studentDetails').get(employeeVerifyJWT, findStudentWithId)
router.route('/employee/studentUpdate').put(employeeVerifyJWT, updateStudentDetails)


export default router; 