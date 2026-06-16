import { Router } from "express";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js"
import { convertFeeModule } from "../controllers/fees.controllers.js";

const router = Router()

router.route('/transformsDiscounts').post(convertFeeModule)

export default router; 