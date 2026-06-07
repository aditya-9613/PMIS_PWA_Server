import { Router } from "express";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js"
import { defineExam, getExams, scheduleExam } from "../controllers/exam.controllers.js";

const router = Router()

//Admin Routes
router.route('/admin/defineExam').post(adminVerifyJWT, defineExam)
router.route('/admin/getExams').get(adminVerifyJWT, getExams)
router.route('/admin/scheduleExam').post(adminVerifyJWT, scheduleExam)

//Employee Routes
router.route('/employee/defineExam').post(employeeVerifyJWT, defineExam)
router.route('/employee/getExams').get(employeeVerifyJWT, getExams)
router.route('/employee/scheduleExam').post(employeeVerifyJWT, scheduleExam)

//Teacher Routes
router.route('/teacher/defineExam').post(teacherVerifyJWT, defineExam)
router.route('/teacher/getExams').get(teacherVerifyJWT, getExams)
router.route('/teacher/scheduleExam').post(teacherVerifyJWT, scheduleExam)

export default router; 