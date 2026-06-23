import { Router } from "express";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js"
import { addPenalty, createFeeModule, editFeesStructure, getClassFeeStructure, getFeeModule, getFeesStructure, getPenalty, setupFees, studentFeeData, updateFeeModule } from "../controllers/fees.controllers.js";

const router = Router()

// router.route('/transformsDiscounts').post(convertFeeModule)
//Admin Routes
router.route('/admin/setupFees').post(adminVerifyJWT, setupFees)
router.route('/admin/getFeesStructure').get(adminVerifyJWT, getFeesStructure)
router.route('/admin/classFeeStructure').get(adminVerifyJWT, getClassFeeStructure)
router.route('/admin/editFeesStructure').put(adminVerifyJWT, editFeesStructure)
router.route('/admin/createFeeModule').post(adminVerifyJWT, createFeeModule)
router.route('/admin/updateFeeModule').put(adminVerifyJWT, updateFeeModule)
router.route('/admin/getFeeModule').get(adminVerifyJWT, getFeeModule)
router.route('/admin/customPenalty').post(adminVerifyJWT, addPenalty)
router.route('/admin/getCustomPenalty').get(adminVerifyJWT, getPenalty)
router.route('/admin/studentFee').get(adminVerifyJWT, studentFeeData)

//Employee Routes
router.route('/employee/getFeesStructure').get(employeeVerifyJWT, getFeesStructure)
router.route('/employee/classFeeStructure').get(employeeVerifyJWT, getClassFeeStructure)
router.route('/employee/updateFeeModule').put(employeeVerifyJWT, updateFeeModule)
router.route('/employee/getFeeModule').get(employeeVerifyJWT, getFeeModule)
router.route('/employee/customPenalty').post(employeeVerifyJWT, addPenalty)
router.route('/employee/getCustomPenalty').get(employeeVerifyJWT, getPenalty)
router.route('/employee/studentFee').get(employeeVerifyJWT, studentFeeData)

export default router; 