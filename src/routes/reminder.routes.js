import { Router } from "express";
import { createReminder, getReminders } from "../controllers/reminder.controllers.js";
import { adminVerifyJWT, employeeVerifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

//Admin Routes
router.route('/admin/createReminder').post(adminVerifyJWT, createReminder)
router.route('/admin/getReminders').get(adminVerifyJWT, getReminders)

//Employee Routes
router.route('/employee/createReminder').post(employeeVerifyJWT, createReminder)
router.route('/employee/getReminders').get(employeeVerifyJWT, getReminders)

export default router; 