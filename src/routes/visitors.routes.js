import { Router } from "express";
import { createVisitor, getVisitorDetails } from "../controllers/visitors.controllers.js";
import { adminVerifyJWT, employeeVerifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

//Admin Routes
router.route('/admin/createVisitor').post(adminVerifyJWT, createVisitor)
router.route('/admin/getVisitorDetails').post(adminVerifyJWT, getVisitorDetails)

//Employee Routes
router.route('/employee/createVisitor').post(employeeVerifyJWT, createVisitor)
router.route('/employee/getVisitorDetails').post(employeeVerifyJWT, getVisitorDetails)

export default router; 