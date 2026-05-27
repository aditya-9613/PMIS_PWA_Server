import { Router } from "express";
import { addTransportRoute, getTransportRoutes, updateTransportRoute, addStudentToBus, removeStudentFromBus, changeVehicleStatus, isStudentPresent, getStudentDetails, updateFromPrevious } from "../controllers/transport.controllers.js";
import { adminVerifyJWT, employeeVerifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()

//Admin Routes
router.route('/admin/addTransportRoute').post(adminVerifyJWT, addTransportRoute)
router.route('/admin/getTransportRoutes').get(adminVerifyJWT, getTransportRoutes)
router.route('/admin/updateTransportRoute').put(adminVerifyJWT, updateTransportRoute)
router.route('/admin/addStudentToBus').post(adminVerifyJWT, addStudentToBus)
router.route('/admin/removeStudentFromBus').delete(adminVerifyJWT, removeStudentFromBus)
router.route('/admin/changeVehicleStatus').put(adminVerifyJWT, changeVehicleStatus)
router.route('/admin/isStudentPresent').get(adminVerifyJWT, isStudentPresent)
router.route('/admin/getStudentDetails').get(adminVerifyJWT, getStudentDetails)
router.route('/admin/updateFromPrevious').post(adminVerifyJWT, updateFromPrevious)

//Employee Routes
router.route('/employee/addTransportRoute').post(employeeVerifyJWT, addTransportRoute)
router.route('/employee/getTransportRoutes').get(employeeVerifyJWT, getTransportRoutes)
router.route('/employee/updateTransportRoute').put(employeeVerifyJWT, updateTransportRoute)
router.route('/employee/addStudentToBus').post(employeeVerifyJWT, addStudentToBus)
router.route('/employee/removeStudentFromBus').delete(employeeVerifyJWT, removeStudentFromBus)
router.route('/employee/changeVehicleStatus').put(employeeVerifyJWT, changeVehicleStatus)
router.route('/employee/isStudentPresent').get(employeeVerifyJWT, isStudentPresent)
router.route('/employee/getStudentDetails').get(employeeVerifyJWT, getStudentDetails)
router.route('/employee/updateFromPrevious').post(employeeVerifyJWT, updateFromPrevious)



export default router; 