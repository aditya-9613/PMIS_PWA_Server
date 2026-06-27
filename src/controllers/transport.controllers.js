import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Vehicle } from "../models/vehicles.models.js"
import { Route } from '../models/route.models.js'
import { TransportFees } from '../models/transport_fees.models.js'
import { getCurrentSchoolSession } from "../utils/CurrentSession.js";
import { SpecialDiscount } from "../models/special_discount.models.js";
import { CreateActivity } from "../utils/Activity.js";

const addTransportRoute = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { vehicle_number, vehicle_type, capacity, driver_name, driver_mobile, status, route_name, start_location, end_location, description, amount } = req.body

    if (
        [vehicle_number, vehicle_type, capacity, driver_name, driver_mobile, route_name, start_location, end_location, amount].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Required fields")
    }

    const existingVehicle = await Vehicle.findOne({ vehicle_number });

    if (existingVehicle) {
        throw new ApiError(409, "Vehicle already exists")
    }

    const saveVehicle = await Vehicle.create({
        vehicle_number: vehicle_number,
        vehicle_type: vehicle_type,
        capacity: capacity,
        driver_name: driver_name,
        driver_mobile: driver_mobile,
        status: status,
        session: session,
    });

    const addRoute = await Route.create({
        route_name: route_name,
        start_location: start_location,
        end_location: end_location,
        vehicle_number: vehicle_number,
        description: description || null,
        session: session
    });
    const addTransportFees = await TransportFees.create({
        route_name: route_name,
        amount: amount,
        vehicle_number: vehicle_number,
        session: session
    });

    if (!saveVehicle || !addRoute || !addTransportFees) {
        throw new ApiError(500, "Server Not Working Properly")
    }

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Create', `Transport Route added for Vehicle No ${vehicle_number}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Route Added Successfully")
        )
})

const getTransportRoutes = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession();

    const allRoutes = await Route.find({ session: session }).lean();

    if (!allRoutes || allRoutes.length === 0) {
        throw new ApiError(404, "No Routes Found")
    }

    const allRoutesDetails = await Route.aggregate([
        {
            $match: { session: session }  // current session routes only
        },
        {
            $lookup: {
                from: "vehicles",
                let: { vehicle_num: "$vehicle_number", sess: "$session" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$vehicle_number", "$$vehicle_num"] },
                                    { $eq: ["$session", "$$sess"] }  // ✅ match session
                                ]
                            }
                        }
                    }
                ],
                as: "result",
            },
        },
        { $unwind: "$result" },

        {
            $lookup: {
                from: "transportfees",
                let: { vehicle_num: "$vehicle_number", sess: "$session" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$vehicle_number", "$$vehicle_num"] },
                                    { $eq: ["$session", "$$sess"] }  // ✅ match session
                                ]
                            }
                        }
                    }
                ],
                as: "result1",
            },
        },
        { $unwind: "$result1" },

        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: ["$$ROOT", "$result", "$result1"],
                },
            },
        },
        {
            $project: { result: 0, result1: 0 },
        },
    ]);

    const formattedRoutes = allRoutesDetails.map(doc => ({
        ...doc,
        _id: doc._id?.toString(),
    }));

    return res
        .status(200)
        .json(
            new ApiResponse(200, { routes: formattedRoutes }, "Details Of All Routes")
        )
});

const updateTransportRoute = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    var { _id, vehicle_number, vehicle_type, capacity, route_name, driver_name, driver_mobile, status, start_location, end_location, description, amount } = req.body

    if (
        [vehicle_number, vehicle_type, capacity, driver_name, driver_mobile, status, start_location, end_location, description, amount].some((item) => item.trim() === "")
    ) {
        throw new ApiError(400, "Required Fields")
    }

    const chargeDetails = await TransportFees.findById({ _id })

    if (vehicle_number === chargeDetails.vehicle_number) {
        //Matching has to be done by Vehicle Number
        chargeDetails.amount = amount
        chargeDetails.route_name = route_name
        chargeDetails.save({ validateBeforeSave: false })
        const updateVehicle = await Vehicle.updateOne({ vehicle_number: vehicle_number, session: session },
            {
                vehicle_type: vehicle_type,
                capacity: capacity,
                driver_name: driver_name,
                driver_mobile: driver_mobile,
                status: status
            }
        )
        const updateRoute = await Route.updateOne({ vehicle_number: vehicle_number, session: session },
            {
                route_name: route_name,
                start_location: start_location,
                end_location: end_location,
                description: description
            }
        )

        if (!updateRoute.acknowledged || !updateVehicle.acknowledged) {
            throw new ApiError(500, "Server Not Working Properly")
        }

    } else {

        const previousVehicle = await TransportFees.findOne({ vehicle_number: vehicle_number, session: session })
        if (previousVehicle) {
            throw new ApiError(422, "Vehicle Number Already Exists")
        }
        //Matching has to be done by _id
        const routeDetails = await Route.findOne({ vehicle_number: chargeDetails.vehicle_number, session: session })
        const vehicleDetails = await Vehicle.findOne({ vehicle_number: chargeDetails.vehicle_number, session: session })
        const allStudentIds = vehicleDetails.student_id
        allStudentIds.map(async (item) => {
            await Student.updateOne({ student_id: item }, { vehicle_number: vehicle_number })
        })
        chargeDetails.vehicle_number = vehicle_number
        chargeDetails.amount = amount
        chargeDetails.route_name = route_name

        chargeDetails.save({ validateBeforeSave: false })

        routeDetails.route_name = route_name
        routeDetails.vehicle_number = vehicle_number
        routeDetails.start_location = start_location
        routeDetails.end_location = end_location
        routeDetails.description = description

        routeDetails.save({ validateBeforeSave: false })

        vehicleDetails.vehicle_type = vehicle_type
        vehicleDetails.vehicle_number = vehicle_number
        vehicleDetails.capacity = capacity
        vehicleDetails.driver_name = driver_name
        vehicleDetails.driver_mobile = driver_mobile
        vehicleDetails.status = status

        vehicleDetails.save({ validateBeforeSave: false })

    }

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Update', `Transport Details Updated for Vehicle No ${vehicle_number}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Route Details Updated")
        )
})

const addStudentToBus = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { vehicle_number, student_id } = req.body

    if (!vehicle_number || !student_id) {
        throw new ApiError(400, "Required Fields")
    }

    const studentIdCheck = await Student.findOne({ student_id: student_id })

    if (!studentIdCheck) {
        throw new ApiError(401, "Wrong Student Id")
    }

    const previousAddedStudent = await Vehicle.findOne({
        vehicle_number: vehicle_number,
        student_id: student_id,
        session: session
    })

    if (previousAddedStudent) {
        throw new ApiError(409, "Student added Previously")
    }

    const studentInAnyBus = await Vehicle.find({ student_id: student_id, session: session });
    if (studentInAnyBus.length) {
        throw new ApiError(410, `Student already added in ${studentInAnyBus[0].vehicle_number}`)
    }

    const updateStudentInBus = await Vehicle.updateOne({ vehicle_number: vehicle_number, session: session },
        {
            $push: { student_id: student_id }
        })

    if (!updateStudentInBus.acknowledged) {
        throw new ApiError(500, "Server Not Working")
    }

    const amount = await TransportFees.findOne({ vehicle_number: vehicle_number, session: session })
    const transportOpted = await TransportationHistory.findOne({ student_id: student_id, session: session })
    var months = (new Date().getMonth() + 1).toString().padStart(2, '0')

    if (transportOpted) {

        var monthsArr = transportOpted.months
        var transport_opted = transportOpted.transport_opted
        if (currentMonth < Number(monthsArr[monthsArr.length - 1])) {
            monthsArr.splice(-2)
            transport_opted.splice(-2)
            await TransportationHistory.updateOne({ student_id: student_id },
                {
                    $set: {
                        months: monthsArr,
                        transport_opted: transport_opted
                    }
                }
            )
        }
        const addStatus = await TransportationHistory.updateOne({ student_id: student_id, session: session },
            {
                $push: {
                    months: months,
                    transport_opted: true,
                }
            }
        )
    } else {
        const createStatus = await TransportationHistory.create({
            student_id: student_id,
            months: [months],
            transport_opted: [true],
            amount: amount.amount,
            session: studentIdCheck.session
        })
    }
    studentIdCheck.vehicle_number = vehicle_number
    studentIdCheck.save({ validateBeforeSave: false })

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Add', `Student ${student_id} added to Bus ${vehicle_number}`)


    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Student Added Successfully")
        )
})

const removeStudentFromBus = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { vehicle_number, student_id } = req.body

    if (!vehicle_number || !student_id) {
        throw new ApiError(400, "Required Fields")
    }

    const studentIdCheck = await Student.findOne({ student_id: student_id })

    if (!studentIdCheck) {
        throw new ApiError(401, "Invalid Student Id")
    }

    const studentPresent = await Vehicle.find({ vehicle_number: vehicle_number, student_id: student_id, session: session })

    if (!studentPresent.length) {
        throw new ApiError(410, "This Student Id is Not Present In this Vehicle Number")
    }

    const updateStudentInBus = await Vehicle.updateOne({ vehicle_number: vehicle_number, session: session },
        {
            $pull: { student_id: student_id }
        }
    )

    if (!updateStudentInBus.acknowledged) {
        throw new ApiError(404, "Student Already Removed")
    }

    var months = (new Date().getMonth() + 1).toString().padStart(2, '0')
    const findMonths = await TransportationHistory.findOne({ student_id: student_id, session: session })
    const monthArr = findMonths.months

    if (monthArr[monthArr.length - 1] === months) {
        months = (new Date().getMonth() + 2).toString().padStart(2, '0')
    }

    const transportOpted = await TransportationHistory.updateOne({ student_id: student_id, session: session },
        {
            $push: {
                months: months,
                transport_opted: false
            }
        }
    )

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Removal', `Student ${student_id} Removed from Bus ${vehicle_number}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Student Removed Successfully")
        )
})

const changeVehicleStatus = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { vehicle_number, status } = req.body

    if (!vehicle_number || !status) {
        throw new ApiError(400, "Required Fields")
    }

    const vehicle = await Vehicle.findOne({ vehicle_number: vehicle_number, session: session })

    if (!vehicle) {
        throw new ApiError(404, "Vehicle Not Registered")
    }

    const updateStatus = await Vehicle.updateOne({ vehicle_number: vehicle_number, session: session },
        {
            status: status
        }
    )

    if (!updateStatus.acknowledged) {
        throw new ApiError(500, "Server Not Working")
    }

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Changed', `${vehicle_number} status changed to ${status}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Vehicle Status Changed")
        )
})

const isStudentPresent = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { student_id } = req.body

    if (student_id === "") {
        throw new ApiError(400, "Required Fields")
    }

    const findStudent = await Vehicle.find({ student_id: student_id, session: session })
    var check = false

    if (findStudent.length) {
        check = true
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { isPresent: check }, "Student Presence Status")
        )
})

const getStudentDetails = asyncHandler(async (req, res) => {
    const session = await getCurrentSchoolSession()
    const { vehicle_number } = req.query

    if (vehicle_number === "") {
        throw new ApiError(400, "Required Fields")
    }

    //const student_ids = await Vehicle.findOne({ vehicle_number: vehicle_number }, { _id: 0, student_id: 1 }).lean()
    const result = await Vehicle.aggregate([
        // Match the vehicle
        {
            $match: {
                vehicle_number: vehicle_number,
                session: session
            }
        },

        // Unwind student_id array to get one document per student
        { $unwind: "$student_id" },

        // Lookup each student
        {
            $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "student_id",
                as: "student"
            }
        },
        { $unwind: "$student" },

        // Lookup route info
        {
            $lookup: {
                from: "routes",
                localField: "vehicle_number",
                foreignField: "vehicle_number",
                as: "route"
            }
        },
        { $unwind: "$route" },

        // Project final output
        {
            $project: {
                _id: 0,
                student_id: "$student.student_id",
                name: "$student.name",
                grade: "$student.grade",
                section: "$student.section",
                gender: "$student.gender",
                description: "$route.description",
                route_name: "$route.route_name",
                start_location: "$route.start_location",
                end_location: "$route.end_location",
                vehicle_number: "$route.vehicle_number"
            }
        }
    ])

    var finalResult = []

    for (let i = 0; i < (result.length); i++) {
        const element = result[i];

        var discountDetails = await SpecialDiscount.findOne({ student_id: element.student_id, session: session })

        var discount_amount = 0

        if (discountDetails === null) {
            discount_amount = 0;
        } else if (discountDetails.discount_status) {
            if (discountDetails.description === 'Composite_Transportation') {
                var amount = discountDetails.discount_amount
                discount_amount = Number(amount.split('/')[1])
            } else if (discountDetails.description === 'Transportation Fees') {
                discount_amount = Number(discountDetails.discount_amount)
            }
        } else if (!discountDetails.discount_status) {
            discount_amount = 0
        }

        finalResult.push({
            student_id: element.student_id,
            name: element.name,
            grade: element.grade,
            section: element.section,
            gender: element.gender,
            description: element.description,
            route_name: element.route_name,
            start_location: element.start_location,
            end_location: element.end_location,
            vehicle_number: element.vehicle_number,
            discount_amount: `${500 - Number(discount_amount)}`,
        })

    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { students: finalResult }, "Details Of All Students In This Vehicle")
        )
})

const updateFromPrevious = asyncHandler(async (req, res) => {
    var currentSession = await getCurrentSchoolSession();
    const allVehicles = await Vehicle.find({ session: '2025-2026' })
    const allRoutes = await Route.find({ session: "2025-2026" })
    const transportFees = await TransportFees.find({ session: "2025-2026" })
    const transportationHistory = await TransportationHistory.find({ session: "2025-2026" })

    for (const route of allRoutes) {
        const newRoutes = await Route.create({
            route_name: route.route_name,
            start_location: route.start_location,
            end_location: route.end_location,
            vehicle_number: route.vehicle_number,
            description: route.description,
            session: currentSession,
        })
        if (!newRoutes) {
            throw new ApiError(500, 'Server Not Working Properly in routes')
        }
    }

    for (const vehicle of allVehicles) {
        const newSessionVehicle = await Vehicle.create({
            vehicle_number: vehicle.vehicle_number,
            vehicle_type: vehicle.vehicle_type,
            capacity: vehicle.capacity,
            driver_name: vehicle.driver_name,
            driver_mobile: vehicle.driver_mobile,
            student_id: vehicle.student_id,
            status: vehicle.status,
            session: currentSession,
        })

        if (!newSessionVehicle) {
            throw new ApiError(500, 'Server Not Working Properly in vehicles')
        }
    }

    for (const history of transportationHistory) {
        if (history.transport_opted[history.transport_opted?.length - 1] === true) {
            const newHistory = await TransportationHistory.create({
                student_id: history.student_id,
                months: ['04'],
                transport_opted: [true],
                amount: history.amount,
                session: currentSession,
            })

            if (!newHistory) {
                throw new ApiError(500, 'Server Not Working Properly in transportation history')
            }
        }
    }

    for (const fees of transportFees) {
        const newFees = await TransportFees.create({
            route_name: fees.route_name,
            amount: fees.amount,
            vehicle_number: fees.vehicle_number,
            session: currentSession,
        })

        if (!newFees) {
            throw new ApiError(500, 'Server Not Working Properly in transport fees')
        }
    }

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id,type,'Bulk Updation','Bulk Transport Upadtion Done')

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Updated From Previous Session")
        )
})

export {
    addTransportRoute,
    getTransportRoutes,
    updateTransportRoute,
    addStudentToBus,
    removeStudentFromBus,
    changeVehicleStatus,
    isStudentPresent,
    getStudentDetails,
    updateFromPrevious
}