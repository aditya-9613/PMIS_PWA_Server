import { Router } from "express";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js";
import { admissionReport, assignRollNo, classImageList, findStudentsQuery, findStudentWithId, getClassStrength, getNotPromotedList, newAddmission, previousStudentList, promoteStudents, studentReport, swiftSection, updateClassList, updateImageOnCloud, updateStudentDetails } from "../controllers/students.controllers.js";

const router = Router()

//Admin Routes
router.route('/admin/newAdmission').post(adminVerifyJWT, newAddmission)
router.route('/admin/studentQuery').get(adminVerifyJWT, findStudentsQuery)
router.route('/admin/studentDetails').get(adminVerifyJWT, findStudentWithId)
router.route('/admin/studentUpdate').put(adminVerifyJWT, updateStudentDetails)
router.route('/admin/getImageList').get(adminVerifyJWT, classImageList)
router.route('/admin/imageUpload').put(adminVerifyJWT, updateImageOnCloud)
router.route('/admin/updateClass').put(adminVerifyJWT, updateClassList)
router.route('/admin/assignRollNo').put(adminVerifyJWT, assignRollNo)
router.route('/admin/classStrength').get(adminVerifyJWT, getClassStrength)
router.route('/admin/getNonPromoted').get(adminVerifyJWT, getNotPromotedList)
router.route('/admin/promoteStudents').put(adminVerifyJWT, promoteStudents)
router.route('/admin/swiftSection').put(adminVerifyJWT, swiftSection)
router.route('/admin/admissionReport').get(adminVerifyJWT, admissionReport)
router.route('/admin/previousStudentList').get(adminVerifyJWT, previousStudentList)
router.route('/admin/studentReport').get(adminVerifyJWT, studentReport)

//Employee Routes 
router.route('/employee/newAdmission').post(employeeVerifyJWT, newAddmission)
router.route('/employee/studentQuery').get(employeeVerifyJWT, findStudentsQuery)
router.route('/employee/studentDetails').get(employeeVerifyJWT, findStudentWithId)
router.route('/employee/studentUpdate').put(employeeVerifyJWT, updateStudentDetails)
router.route('/employee/getImageList').get(employeeVerifyJWT, classImageList)
router.route('/employee/imageUpload').put(employeeVerifyJWT, updateImageOnCloud)
router.route('/employee/updateClass').put(employeeVerifyJWT, updateClassList)
router.route('/employee/assignRollNo').put(employeeVerifyJWT, assignRollNo)
router.route('/employee/classStrength').get(employeeVerifyJWT, getClassStrength)
router.route('/employee/getNonPromoted').get(employeeVerifyJWT, getNotPromotedList)
router.route('/employee/promoteStudents').put(employeeVerifyJWT, promoteStudents)
router.route('/employee/swiftSection').put(employeeVerifyJWT, swiftSection)
router.route('/employee/admissionReport').get(employeeVerifyJWT, admissionReport)
router.route('/employee/previousStudentList').get(employeeVerifyJWT, previousStudentList)
router.route('/employee/studentReport').get(employeeVerifyJWT, studentReport)

//Teacher Routes

router.route('/teacher/classStrength').get(teacherVerifyJWT, getClassStrength)
router.route('/teacher/assignRollNo').put(teacherVerifyJWT, assignRollNo)

export default router; 