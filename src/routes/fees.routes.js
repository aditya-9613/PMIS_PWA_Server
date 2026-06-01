import { Router } from "express";
import { adminVerifyJWT, employeeVerifyJWT, teacherVerifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router()

export default router; 