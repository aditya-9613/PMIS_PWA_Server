import { Router } from "express";
import { createCourse, viewCourse, getCourse, allotCourse, getCourseById, updateCourseById, getStudentWithSubjects } from "../controllers/course.controllers.js"
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

//Admin Routes
router.route('/admin/createCourse').post(adminVerifyJWT, createCourse)
router.route('/admin/viewCourse').get(adminVerifyJWT, viewCourse)
router.route('/admin/getCourse').get(adminVerifyJWT, getCourse)
router.route('/admin/allotCourse').post(adminVerifyJWT, allotCourse)
router.route('/admin/getCourseById').get(adminVerifyJWT, getCourseById)
router.route('/admin/updateCourseById').put(adminVerifyJWT, updateCourseById)
router.route('/admin/getStudentWithSubjects').get(adminVerifyJWT, getStudentWithSubjects)

//Employee Routes
router.route('/employee/createCourse').post(employeeVerifyJWT, createCourse)
router.route('/employee/viewCourse').get(employeeVerifyJWT, viewCourse)
router.route('/employee/getCourse').get(employeeVerifyJWT, getCourse)
router.route('/employee/allotCourse').post(employeeVerifyJWT, allotCourse)
router.route('/employee/getCourseById').get(employeeVerifyJWT, getCourseById)
router.route('/employee/updateCourseById').put(employeeVerifyJWT, updateCourseById)
router.route('/employee/getStudentWithSubjects').get(employeeVerifyJWT, getStudentWithSubjects)

//Teacher Routes
router.route('/teacher/getStudentWithSubjects').get(teacherVerifyJWT, getStudentWithSubjects)


export default router; 