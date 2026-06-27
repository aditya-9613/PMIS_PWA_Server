import { Router } from "express";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js"
import { defineExam, genrateAdmitCards, getExams, getSchedule, scheduleExam, upsertExamMarks, getExamMarks, saveScholasticMarks, getScholasticMarks, classTopper, getResultData, dailyAttendanceUpdates, getAttendanceRecords, saveTotalAttendance, updateAttendanceTime, getAttendanceTime, createImportant } from "../controllers/exam.controllers.js";

const router = Router()
router.route('/createImportant').post(createImportant)
//Admin Routes
router.route('/admin/defineExam').post(adminVerifyJWT, defineExam)
router.route('/admin/getExams').get(adminVerifyJWT, getExams)
router.route('/admin/scheduleExam').post(adminVerifyJWT, scheduleExam)
router.route('/admin/getExamSchedule').get(adminVerifyJWT, getSchedule)
router.route('/admin/getAdmitCard').get(adminVerifyJWT, genrateAdmitCards)
router.route('/admin/upsertExamMarks').put(adminVerifyJWT, upsertExamMarks)
router.route('/admin/getExamMarks').get(adminVerifyJWT, getExamMarks)
router.route('/admin/saveScholasticMarks').post(adminVerifyJWT, saveScholasticMarks)
router.route('/admin/getScholasticMarks').get(adminVerifyJWT, getScholasticMarks)
router.route('/admin/classTopper').get(adminVerifyJWT, classTopper)
router.route('/admin/getResultData').get(adminVerifyJWT, getResultData)
router.route('/admin/dailyAttendance').post(adminVerifyJWT, dailyAttendanceUpdates)
router.route('/admin/getAttendance').get(adminVerifyJWT, getAttendanceRecords)
router.route('/admin/totalAttendance').post(adminVerifyJWT, saveTotalAttendance)
router.route('/admin/updateAttendanceTime').put(updateAttendanceTime)
router.route('/admin/getAttendanceTime').get(adminVerifyJWT, getAttendanceTime)

//Employee Routes
router.route('/employee/defineExam').post(employeeVerifyJWT, defineExam)
router.route('/employee/getExams').get(employeeVerifyJWT, getExams)
router.route('/employee/scheduleExam').post(employeeVerifyJWT, scheduleExam)
router.route('/employee/getExamSchedule').get(employeeVerifyJWT, getSchedule)
router.route('/employee/getAdmitCard').get(employeeVerifyJWT, genrateAdmitCards)
router.route('/employee/upsertExamMarks').put(employeeVerifyJWT, upsertExamMarks)
router.route('/employee/getExamMarks').get(employeeVerifyJWT, getExamMarks)
router.route('/employee/saveScholasticMarks').post(employeeVerifyJWT, saveScholasticMarks)
router.route('/employee/getScholasticMarks').get(employeeVerifyJWT, getScholasticMarks)
router.route('/employee/classTopper').get(employeeVerifyJWT, classTopper)
router.route('/employee/getResultData').get(employeeVerifyJWT, getResultData)
router.route('/employee/dailyAttendance').post(employeeVerifyJWT, dailyAttendanceUpdates)
router.route('/employee/getAttendance').get(employeeVerifyJWT, getAttendanceRecords)
router.route('/employee/totalAttendance').post(employeeVerifyJWT, saveTotalAttendance)
router.route('/employee/getAttendanceTime').get(adminVerifyJWT, getAttendanceTime)

//Teacher Routes
router.route('/teacher/defineExam').post(teacherVerifyJWT, defineExam)
router.route('/teacher/getExams').get(teacherVerifyJWT, getExams)
router.route('/teacher/scheduleExam').post(teacherVerifyJWT, scheduleExam)
router.route('/teacher/getExamSchedule').get(teacherVerifyJWT, getSchedule)
router.route('/teacher/getAdmitCard').get(teacherVerifyJWT, genrateAdmitCards)
router.route('/teacher/upsertExamMarks').put(teacherVerifyJWT, upsertExamMarks)
router.route('/teacher/getExamMarks').get(teacherVerifyJWT, getExamMarks)
router.route('/teacher/saveScholasticMarks').post(teacherVerifyJWT, saveScholasticMarks)
router.route('/teacher/getScholasticMarks').get(teacherVerifyJWT, getScholasticMarks)
router.route('/teacher/classTopper').get(teacherVerifyJWT, classTopper)
router.route('/teacher/getResultData').get(teacherVerifyJWT, getResultData)
router.route('/teacher/dailyAttendance').post(teacherVerifyJWT, dailyAttendanceUpdates)
router.route('/teacher/getAttendance').get(teacherVerifyJWT, getAttendanceRecords)
router.route('/teacher/totalAttendance').post(teacherVerifyJWT, saveTotalAttendance)
router.route('/teacher/getAttendanceTime').get(adminVerifyJWT, getAttendanceTime)

export default router; 