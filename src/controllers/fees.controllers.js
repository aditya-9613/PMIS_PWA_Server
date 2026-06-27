import { Admin } from "../models/admin.models.js";
import { ClosingBalance } from "../models/closing_balance.models.js";
import { Discount } from "../models/fee_discount.models.js";
import { FeeModule } from "../models/feeModule.models.js";
import { FeeStructure } from "../models/fees_structure.models.js";
import { Payment } from "../models/payments.models.js";
import { SpecialDiscount } from "../models/special_discount.models.js";
import { Student } from "../models/students.models.js";
import { TransportationHistory } from "../models/transportation_history.models.js";
import { CreateActivity } from "../utils/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getCurrentSchoolSession } from "../utils/CurrentSession.js";


const setupFees = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { fee_Amount, grade, admissionFees, resgistrationFees, examFees, annualCharges } = req.body

    if (
        [fee_Amount, grade, admissionFees, resgistrationFees].some((fields) => fields.trim() === "")
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    const previousClass = await FeeStructure.findOne({ grade: grade, session: session })

    if (previousClass) {
        throw new ApiError(409, 'Class Fees Structure added Previously')
    }

    const saveFees = await FeeStructure.create({
        fee_Amount: fee_Amount,
        grade: grade,
        admissionFees: admissionFees,
        resgistrationFees: resgistrationFees,
        examFees: examFees,
        annualCharges: annualCharges,
        session: session
    })

    if (!saveFees) {
        throw new ApiError(500, 'Server Error')
    }

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Create', `Fees setup done for class ${grade}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Fees Structure Added Successfully')
        )
})

const getFeesStructure = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const feeStructureData = await FeeStructure.find({ session: session }, { _id: 0, __v: 0 }).lean()

    return res
        .status(200)
        .json(
            new ApiResponse(200, feeStructureData, 'Fees Structure Fetched Successfully')
        )
})

const getClassFeeStructure = asyncHandler(async (req, res) => {
    const { grade } = req.query

    var session = await getCurrentSchoolSession()

    if (!grade) {
        throw new ApiError(400, 'Required Fields')
    }

    const feeStructure = await FeeStructure.findOne({ grade, session })

    if (!feeStructure) {
        throw new ApiError(404, 'Fee Structure Missing')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, feeStructure, 'Fee Structure')
        )
})

const editFeesStructure = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { grade, admissionFees, fee_Amount, annualCharges, resgistrationFees, examFees } = req.body

    if (
        [fee_Amount, admissionFees, resgistrationFees, examFees, annualCharges].some((fields) => fields.trim() === "")
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    const updateFees = await FeeStructure.updateOne({ grade: grade, session: session }, {
        fee_Amount: fee_Amount,
        admissionFees: admissionFees,
        resgistrationFees: resgistrationFees,
        examFees: examFees,
        annualCharges: annualCharges
    })

    if (!updateFees) {
        throw new ApiError(500, 'Server Error')
    }

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Update', `Fees Structure  updated for class ${grade}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Fees Structure Updated Successfully')
        )
})

const setupFeeModule = asyncHandler(async (req, res) => {
    const { student_id} = req.body

    if (!student_id) {
        throw new ApiError(400, 'Required fields')
    }

    const session = await getCurrentSchoolSession()

    // ── 1. Validate student ──────────────────────────────────────────────────
    const student = await Student.findOne({ student_id })

    if (!student) {
        throw new ApiError(404, 'Student not found')
    }

    if (student.status === 'Suspended') {
        throw new ApiError(400, 'Student status is Suspended')
    }

    // ── 2. Prevent duplicate setup ───────────────────────────────────────────
    const existingModule = await FeeModule.findOne({ student_id, session })

    if (existingModule) {
        throw new ApiError(409, 'Fee module already set up for this student in the current session')
    }

    // ── 3. Fetch fee structure ───────────────────────────────────────────────
    const feeStructure = await FeeStructure.findOne({ grade: student.grade, session })

    if (!feeStructure) {
        throw new ApiError(404, `No fee structure defined for grade ${student.grade} in session ${session}`)
    }

    const MONTHS = [
        { monthName: 'April', monthCode: 4 },
        { monthName: 'May', monthCode: 5 },
        { monthName: 'June', monthCode: 6 },
        { monthName: 'July', monthCode: 7 },
        { monthName: 'August', monthCode: 8 },
        { monthName: 'September', monthCode: 9 },
        { monthName: 'October', monthCode: 10 },
        { monthName: 'November', monthCode: 11 },
        { monthName: 'December', monthCode: 12 },
        { monthName: 'January', monthCode: 1 },
        { monthName: 'February', monthCode: 2 },
        { monthName: 'March', monthCode: 3 },
    ]

    const EXAM_FEE_MONTHS = [8, 12]   // August, December
    const ADMISSION_MONTHS = [4]        // April only
    const ANNUAL_MONTHS = [4]        // April only

    const compositeFee = Number(feeStructure.fee_Amount) || 0
    const admissionFees = Number(feeStructure.admissionFees) || 0
    const annualCharges = Number(feeStructure.annualCharges) || 0
    const examFees = Number(feeStructure.examFees) || 0
    const registrationFees = Number(feeStructure.resgistrationFees) || 0   // typo preserved from DB

    // ── 4. Build feeModule array (12 months) ─────────────────────────────────
    const feeModule = MONTHS.map(({ monthName, monthCode }) => ({
        monthName,
        monthCode,
        compositeFee,
        transportFees: 0,
        admissionFees: ADMISSION_MONTHS.includes(monthCode) ? admissionFees : 0,
        annualCharges: ANNUAL_MONTHS.includes(monthCode) ? annualCharges : 0,
        examFees: EXAM_FEE_MONTHS.includes(monthCode) ? examFees : 0,
        penalty: 0,
        paidStatus: false,
    }))

    const findClosingBalances = await ClosingBalance.findOne({ student_id, session })

    // ── 5. Create & save ─────────────────────────────────────────────────────
    const newFeeModule = await FeeModule.create({
        student_id,
        session,
        closingBalance: {
            amount: findClosingBalances?.closing_balance_amount || 0,
            paid: findClosingBalances
                ? (findClosingBalances.paid ? 'Yes' : 'No')
                : 'Yes',
        },
        feeModule,
        description: ' ',
    })

    return res.status(200).json(
        new ApiResponse(200, newFeeModule, 'Fee module set up successfully')
    )
})

const createFeeModule = asyncHandler(async (req, res) => {
    const { student_id, closingBalance, feeModule, description } = req.body

    var session = await getCurrentSchoolSession()

    if (
        [student_id, description].some((item) => !item || item?.trim() === "")
    ) {
        throw new ApiError(400, 'Required Input')
    }

    if (!feeModule || feeModule.length !== 12) {
        throw new ApiError(400, 'Fee Module must have exactly 12 months')
    }

    const findModule = await FeeModule.findOne({ student_id, session })

    if (findModule) {
        throw new ApiError(429, 'Module Already Created')
    }

    const createModule = await FeeModule.create({
        student_id,
        session,
        closingBalance,
        feeModule,
        description
    })

    if (!createModule) {
        throw new ApiError(500, 'Module creation error')
    }

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Creation', `Fee Module created for ${student_id}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Module Created Successfully')
        )
})

const getFeeModule = asyncHandler(async (req, res) => {
    const { student_id } = req.query

    var session = await getCurrentSchoolSession()

    const findModule = await FeeModule.findOne({ student_id, session })

    if (!findModule) {
        throw new ApiError(404, 'Fee Module Missiong')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, findModule, 'Fee Module')
        )
})

const updateFeeModule = asyncHandler(async (req, res) => {
    const session = await getCurrentSchoolSession()

    const { student_id, feeModule, description, closingBalance } = req.body

    if (!student_id || student_id.trim() === "") {
        throw new ApiError(400, 'Student ID is required')
    }

    if (!feeModule || feeModule.length !== 12) {
        throw new ApiError(400, 'Fee Module must have exactly 12 months')
    }

    // Fetch existing document to get current description
    const existingModule = await FeeModule.findOne({ student_id, session })

    if (!existingModule) {
        throw new ApiError(404, "Fee Module not found")
    }

    // Build timestamp
    // Build timestamp
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const pad = n => String(n).padStart(2, '0')
    const hours24 = now.getHours()
    const hours12 = hours24 % 12 || 12
    const ampm = hours24 < 12 ? 'AM' : 'PM'
    const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(hours12)}:${pad(now.getMinutes())} ${ampm}`

    // Append new description to existing
    const updatedDescription = existingModule.description
        ? `${existingModule.description} \\${timestamp}\\: ${description}`
        : description

    const updateModule = await FeeModule.updateOne(
        { student_id, session },
        {
            $set: {
                feeModule,
                description: updatedDescription,
                closingBalance,
            },
        }
    )

    if (updateModule.matchedCount === 0) {
        throw new ApiError(404, "Fee Module not found")
    }

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Updation', `Fee Update for student ${student_id}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Fee Module Updated Successfully")
        )
})

const addPenalty = asyncHandler(async (req, res) => {
    const { student_id, penalty_amount, description } = req.body

    var session = await getCurrentSchoolSession()

    if (
        [student_id, penalty_amount, description].some((items) =>
            items.trim() === "")
    ) {
        throw new ApiError(400, 'Required Inputs')
    }

    const now = new Date();

    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const previousPenalty = await Penalty.findOne({
        student_id: student_id,
        penalty_date: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    })

    if (previousPenalty) {
        throw new ApiError(409, 'Same Day Two Penalty Cannot be added')
    }

    const penalty_date = new Date()

    const createPenalty = await Penalty.create({
        student_id: student_id,
        penalty_amount: penalty_amount,
        penalty_date: penalty_date,
        description: description,
        session: session

    })

    if (!createPenalty) {
        throw new ApiError(500, 'Penalty Not saved ')
    }

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(_id, type, 'Create', `Penalty Created for Student ${student_id}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Penalty Saved')
        )
})

const getPenalty = asyncHandler(async (req, res) => {

    var session = await getCurrentSchoolSession()

    const { student_id } = req.body

    if (student_id === "") {
        throw new ApiError(400, 'Required Fields')
    }

    const previousPenalty = await Penalty.findOne({
        student_id: student_id,
        session: session,
    }).lean()

    return res
        .status(200)
        .json(
            new ApiResponse(200, previousPenalty, 'Penalty Value')
        )
})

const studentFeeData = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { student_id } = req.query

    if (!student_id) {
        throw new ApiError(400, 'Required Inputs')
    }

    const studentData = await Student.findOne(
        { student_id: student_id }).lean()

    if (studentData.status === 'Not-Promoted') {
        throw new ApiError(404, 'Student In Non-Promoted List')
    }

    // { name: 1, grade: 1, gender: 1, category: 1, section: 1, father_name: 1, mother_name: 1, student_id: 1, parent_id: 1} 

    if (!studentData) {
        throw new ApiError(401, 'Wrong Student ID')
    }

    const grade = studentData.grade

    const studentFeeDetails = await Student.aggregate([
        {
            $match: {
                parent_id: `${studentData.parent_id}`
            }
        },
        {
            $lookup: {
                from: "parents",
                localField: "parent_id",
                foreignField: "parent_id",
                as: "parent_info"
            }
        },
        {
            $unwind: {
                path: "$parent_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "transportationhistories",
                let: { sid: `${student_id}` },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$student_id", `${student_id}`] },
                                    { $eq: ["$session", session] }  // ✅ current session filter
                                ]
                            }
                        }
                    }
                ],
                as: "transportation_info"
            }
        },
        {
            $addFields: {
                transportation_info: {
                    $arrayElemAt: ["$transportation_info", 0]
                }
            }
        },
        // {
        //     $lookup: {
        //         from: "discounts",
        //         let: { sid: `${student_id}` },
        //         pipeline: [
        //             {
        //                 $match: {
        //                     $expr: {
        //                         $and: [
        //                             { $eq: ["$student_id", `${student_id}`] },
        //                             { $eq: ["$session", session] }  // ✅ current session filter
        //                         ]
        //                     }
        //                 }
        //             }
        //         ],
        //         as: "discount_info"
        //     }
        // },
        {
            $project: {
                name: 1,
                grade: 1,
                gender: 1,
                category: 1,
                addmissionDate: 1,
                section: 1,
                father_name: "$parent_info.father_name",
                mother_name: "$parent_info.mother_name",
                student_id: 1,
                parent_id: 1,
                months: "$transportation_info.months",
                transport_opted: "$transportation_info.transport_opted",
                amount: "$transportation_info.amount",
                // discounts: "$discount_info"
            }
        }
    ]);

    const studentDetails = studentFeeDetails[0]

    const previousPayments = await Payment.find({ student_id: student_id, session: session }).lean()

    const feeStructure = await FeeStructure.findOne({ grade: grade, session: session }).lean()

    const feeModule = await FeeModule.findOne({ student_id: student_id, session: session }).lean()

    const Data = { previousPayments, feeStructure, studentDetails, feeModule }

    return res
        .status(200)
        .json(
            new ApiResponse(200, Data, 'Fee Details')
        )
})

const makePayment = asyncHandler(async (req, res) => {
    const { student_id, amount, grade, section, discount, paid_till_month, fees_breakout, payment_method, status, type } = req.body

    var session = await getCurrentSchoolSession()

    if (
        [student_id, amount, grade, section, payment_method, status, type].some((item) => !item)
    ) {
        throw new ApiResponse(400, 'Required Inputs')
    }

    const dateOBJ = new Date()

    const payment_date = dateOBJ.toString()

    var user = ''

    if (type === 'admin') {
        const admin = await Admin.findById(req?.admin._id)
        user = admin.name
    } else if (type === 'employee') {
        const employee = await Admin.findById(req?.employee._id)
        user = employee.name
    } else {
        throw new ApiError(401, 'Not Autorised')
    }

    var receipt_no = 0

    const previousRecieptNo = await Payment.findOne().sort({ receipt_no: -1 }).limit(1)

    if (previousRecieptNo) {
        receipt_no = previousRecieptNo.receipt_no + 1
    }

    const createPayment = await Payment.create({
        student_id,
        receipt_no,
        amount,
        grade,
        section,
        discount,
        paid_till_month,
        payment_date,
        fees_breakout,
        payment_method,
        session,
        user,
        status,
        dateOBJ,
    })

    if (!createPayment) {
        throw new ApiError(500, 'Server Error')
    }

    // Extract monthCode from paid_till_month (e.g. "0 Due in April_04" → 4)
    const paidTillMonthCode = parseInt(paid_till_month.split('_')[1])

    // Parse fees_breakout and check for OpeningBalance
    const parsedBreakout = JSON.parse(fees_breakout)
    const hasOpeningBalance = parsedBreakout.hasOwnProperty('OpeningBalance')

    // Build $set object conditionally
    const updateFields = {
        "feeModule.$[elem].paidStatus": true,
    }

    if (hasOpeningBalance) {
        updateFields["closingBalance.paid"] = "Yes"
        await ClosingBalance.updateOne({ student_id, session }, { paid: false })
    }

    // Update FeeModule
    await FeeModule.updateOne(
        { student_id, session },
        { $set: updateFields },
        {
            arrayFilters: [{ "elem.monthCode": { $lte: paidTillMonthCode } }]
        }
    )

    const findStudent = await Student.findOne({ student_id, session })

    const findPayments = await Payment.find({ student_id, session, status: 'Active' })
    if (findPayments.length === 0) {
        findStudent.status = 'Active'
        findStudent.save()
    }

    const _id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    await CreateActivity(_id, type, 'Payment', `Payment done for Student ${student_id}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Payment Done Successfully')
        )
})

const getReceipts = asyncHandler(async (req, res) => {
    const { student_id } = req.query

    if (!student_id) {
        throw new ApiError(400, 'Required Inputs')
    }

    const session = await getCurrentSchoolSession()

    const findPayments = await Payment.aggregate([
        {
            $match: {
                student_id: `${student_id}`,
                session: session,
                status: 'Active'
            }
        },
        {
            $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "student_id",
                as: "student_info"
            }
        },
        {
            $unwind: {
                path: "$student_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "parents",
                localField: "student_info.parent_id",
                foreignField: "parent_id",
                as: "parent_info"
            }
        },
        {
            $unwind: {
                path: "$parent_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                student_id: 1,
                receipt_no: 1,
                amount: 1,
                discount: 1,
                paid_till_month: 1,
                payment_date: 1,
                fees_breakout: 1,
                payment_method: 1,
                session: 1,
                status: 1,
                user: 1,
                dateOBJ: 1,
                grade: 1,
                section: 1,
                name: "$student_info.name",
                gender: "$student_info.gender",
                category: "$student_info.category",
                roll_number: "$student_info.roll_number",
                father_name: "$parent_info.father_name",
                father_contact: "$parent_info.father_contact"
            }
        }
    ])

    if (!findPayments || findPayments.length === 0) {
        throw new ApiError(404, 'No Payments Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, findPayments, 'Student Payment Records')
        )
})

const cancelSlip = asyncHandler(async (req, res) => {
    const { _id, student_id, description } = req.body

    if (!_id || !student_id) {
        throw new ApiError(400, 'Required Inputs')
    }

    const findReceipt = await Payment.findById(_id)

    if (findReceipt.student_id !== student_id) {
        throw new ApiError(404, 'Slip Mismatch')
    }

    findReceipt.status = 'Cancelled'
    findReceipt.save()

    // Extract monthCode from the receipt's paid_till_month
    const paidTillMonthCode = parseInt(findReceipt.paid_till_month.split('_')[1])

    // Get current session
    const session = await getCurrentSchoolSession()

    // Find second last active receipt
    const secondLastReceipt = await Payment.findOne({
        student_id,
        session,
        _id: { $ne: findReceipt._id },
        status: 'Active'
    }).sort({ dateOBJ: -1 }).limit(1)

    // Build $set object
    const updateFields = {}

    if (secondLastReceipt) {
        // Mark months AFTER second last receipt's paid_till_month as false
        const secondLastMonthCode = parseInt(secondLastReceipt.paid_till_month.split('_')[1])

        updateFields["feeModule.$[elem].paidStatus"] = false

        // Handle closingBalance
        const parsedBreakout = JSON.parse(findReceipt.fees_breakout)
        const hasOpeningBalance = parsedBreakout.hasOwnProperty('OpeningBalance')
        if (hasOpeningBalance) {
            updateFields["closingBalance.paid"] = "No"
        }

        await FeeModule.updateOne(
            { student_id, session },
            { $set: updateFields },
            {
                arrayFilters: [{ "elem.monthCode": { $gt: secondLastMonthCode } }]
            }
        )

    } else {
        // No other receipts — mark ALL months as false
        updateFields["feeModule.$[elem].paidStatus"] = false

        const parsedBreakout = JSON.parse(findReceipt.fees_breakout)
        const hasOpeningBalance = parsedBreakout.hasOwnProperty('OpeningBalance')
        if (hasOpeningBalance) {
            updateFields["closingBalance.paid"] = "No"
        }

        await FeeModule.updateOne(
            { student_id, session },
            { $set: updateFields },
            {
                arrayFilters: [{ "elem.monthCode": { $gt: 0 } }]
            }
        )

        const findStudent = await Student.updateOne({ student_id, session }, { status: 'Inactive' })
    }

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Cancellation', description)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Receipt Cancelled')
        )
})

const fetchCancelledSlips = asyncHandler(async (req, res) => {
    const { student_id } = req.query

    if (!student_id) {
        throw new ApiError(400, 'Required Inputs')
    }

    const session = await getCurrentSchoolSession()

    const findSlips = await Payment.aggregate([
        {
            $match: {
                student_id: `${student_id}`,
                session: session,
                status: 'Inactive'
            }
        },
        {
            $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "student_id",
                as: "student_info"
            }
        },
        {
            $unwind: {
                path: "$student_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "parents",
                localField: "student_info.parent_id",
                foreignField: "parent_id",
                as: "parent_info"
            }
        },
        {
            $unwind: {
                path: "$parent_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                student_id: 1,
                receipt_no: 1,
                amount: 1,
                discount: 1,
                paid_till_month: 1,
                payment_date: 1,
                fees_breakout: 1,
                payment_method: 1,
                session: 1,
                status: 1,
                user: 1,
                dateOBJ: 1,
                grade: 1,
                section: 1,
                name: "$student_info.name",
                gender: "$student_info.gender",
                category: "$student_info.category",
                roll_number: "$student_info.roll_number",
                father_name: "$parent_info.father_name",
                father_contact: "$parent_info.father_contact"
            }
        }
    ])

    if (!findSlips || findSlips.length === 0) {
        throw new ApiError(404, 'No Cancelled Slips Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, findSlips, 'Cancelled Slips')
        )
})

const transitReceipts = asyncHandler(async (req, res) => {
    // const receipts = await Payment.find();

    // let counter = 1;

    // for (const receipt of receipts) {
    //     receipt.status = 'Active';
    //     receipt.user = 'System Software';

    //     if (receipt.payment_date) {
    //         receipt.dateOBJ = new Date(receipt.payment_date);
    //     }

    //     await receipt.save();

    //     console.log(`Updated ${counter}`);
    //     counter++;
    // }


})

const monthlyReport = asyncHandler(async (req, res) => {
    const { month, year } = req.query

    if (!month || !year) {
        throw new ApiError(400, 'Required Fields')
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (year > new Date().getFullYear()) {
        throw new ApiError(429, 'Future Year')
    }

    const monthCode = months.indexOf(month)

    const start_date = new Date(parseInt(year), monthCode, 1, 0, 0, 0, 0)

    const end_date = new Date(parseInt(year), monthCode + 1, 0, 23, 59, 59, 999)

    const payments = await Payment.aggregate([
        {
            $match: {
                dateOBJ: {
                    $gte: start_date,
                    $lte: end_date
                },
                status: 'Active'
            }
        },
        {
            $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "student_id",
                as: "student_info"
            }
        },
        {
            $unwind: {
                path: "$student_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "parents",
                localField: "student_info.parent_id",
                foreignField: "parent_id",
                as: "parent_info"
            }
        },
        {
            $unwind: {
                path: "$parent_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                student_id: 1,
                receipt_no: 1,
                amount: 1,
                discount: 1,
                paid_till_month: 1,
                payment_date: 1,
                fees_breakout: 1,
                payment_method: 1,
                session: 1,
                status: 1,
                user: 1,
                dateOBJ: 1,
                grade: 1,
                section: 1,
                name: "$student_info.name",
                gender: "$student_info.gender",
                category: "$student_info.category",
                roll_number: "$student_info.roll_number",
                father_name: "$parent_info.father_name",
                father_contact: "$parent_info.father_contact"
            }
        },
        {
            $sort: { payment_date: 1 }
        }
    ])

    if (!payments.length) {
        throw new ApiError(404, 'No payments found for this month')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, payments, 'Monthly Report')
        )
})

const headCollection = asyncHandler(async (req, res) => {
    const { grade, section } = req.query

    const session = await getCurrentSchoolSession()

    const getStudents = await Student.find({
        grade,
        section,
        session,
        status: { $in: ['Active', 'Inactive'] }
    }).sort({ roll_number: 1 })

    const outputArray = []

    for (const student of getStudents) {
        const getPayment = await Payment.find({
            student_id: student.student_id,
            session
        })

        outputArray.push({
            student_id: student.student_id,
            name: student.name,
            roll_number: student.roll_number,
            grade: student.grade,
            section: student.section,
            session: student.session,
            payments: getPayment
        })
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, outputArray, 'Payment records')
        )
})

const defaultersList = asyncHandler(async (req, res) => {

    const session = await getCurrentSchoolSession()
    const { grade, section, month } = req.query

    if (!grade || !section) {
        throw new ApiError(400, 'Required Inputs')
    }

    const currentMonth = Number(month) || (new Date().getMonth() + 1)

    const findAllStudents = await Student.aggregate([
        {
            $match: { grade, section, session, status: { $in: ['Active', 'Inactive'] } }
        },
        {
            $lookup: {
                from: 'parents',
                localField: 'parent_id',
                foreignField: 'parent_id',
                as: 'parent_info'
            }
        },
        {
            $unwind: { path: '$parent_info', preserveNullAndEmptyArrays: true }
        },
        {
            $addFields: { roll_number_int: { $toInt: '$roll_number' } }
        },
        {
            $sort: { roll_number_int: 1 }
        }
    ])

    if (!findAllStudents.length) {
        throw new ApiError(404, 'No Students Found')
    }

    const ACADEMIC_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]
    const currentMonthAcademicIndex = ACADEMIC_ORDER.indexOf(currentMonth)

    const outputArray = []

    for (const student of findAllStudents) {

        const findFeeModule = await FeeModule.findOne({
            student_id: student.student_id,
            session
        })

        let total_due_amount = 0

        if (!findFeeModule) {
            outputArray.push({
                roll_number: student.roll_number,
                student_id: student.student_id,
                name: student.name,
                grade: student.grade,
                section: student.section,
                father_name: student.parent_info?.father_name || '—',
                mother_name: student.parent_info?.mother_name || '—',
                father_contact: student.parent_info?.father_contact || '—',
                amount: 0,
                status: student.status
            })
            continue
        }

        const feeModuleMonths = findFeeModule.feeModule
        const closingBalance = findFeeModule.closingBalance
        const closingDue = (closingBalance && closingBalance.paid === 'No')
            ? Number(closingBalance.amount || 0)
            : 0

        // Find last paid month from feeModule
        const paidMonths = feeModuleMonths.filter(m => m.paidStatus === true)

        const lastPaidMonth = paidMonths.length > 0
            ? paidMonths.reduce((last, m) => {
                const idx = ACADEMIC_ORDER.indexOf(m.monthCode)
                return idx > ACADEMIC_ORDER.indexOf(last.monthCode) ? m : last
            })
            : null

        const lastPaidAcademicIndex = lastPaidMonth
            ? ACADEMIC_ORDER.indexOf(lastPaidMonth.monthCode)
            : -1

        // ── CASE 1: Last paid month is STRICTLY AHEAD of current month ──────
        if (lastPaidAcademicIndex > currentMonthAcademicIndex) {
            total_due_amount = 0
        }
        // ── CASE 2: Last paid month is EQUAL TO or BEHIND current 
        else if (lastPaidMonth) {
            const lastReceipt = await Payment.findOne({
                student_id: student.student_id,
                session,
                status: 'Active'
            }).sort({ dateOBJ: -1 })

            let leftOverDue = 0
            if (lastReceipt?.paid_till_month) {
                const leftOverRaw = String(lastReceipt.paid_till_month).split(' ')[0]
                leftOverDue = isNaN(Number(leftOverRaw)) ? 0 : Number(leftOverRaw)
            }

            // Months AFTER last paid month up to current month that are still unpaid
            const unpaidAfterLastPaid = feeModuleMonths.filter(m => {
                const idx = ACADEMIC_ORDER.indexOf(m.monthCode)
                return !m.paidStatus &&
                    idx > lastPaidAcademicIndex &&
                    idx <= currentMonthAcademicIndex
            })

            const unpaidAfterFee = unpaidAfterLastPaid.reduce((sum, m) => {
                return sum +
                    Number(m.compositeFee || 0) +
                    Number(m.transportFees || 0) +
                    Number(m.admissionFees || 0) +
                    Number(m.annualCharges || 0) +
                    Number(m.examFees || 0) +
                    Number(m.penalty || 0)
            }, 0)

            total_due_amount = leftOverDue + unpaidAfterFee + closingDue
        }
        // ── CASE 3: No payment done at all ───────────────────────────────────
        else {
            const monthsDueTillNow = feeModuleMonths.filter(m => {
                const idx = ACADEMIC_ORDER.indexOf(m.monthCode)
                return idx <= currentMonthAcademicIndex
            })

            const totalFeeTillNow = monthsDueTillNow.reduce((sum, m) => {
                return sum +
                    Number(m.compositeFee || 0) +
                    Number(m.transportFees || 0) +
                    Number(m.admissionFees || 0) +
                    Number(m.annualCharges || 0) +
                    Number(m.examFees || 0) +
                    Number(m.penalty || 0)
            }, 0)

            total_due_amount = totalFeeTillNow + closingDue
        }

        outputArray.push({
            roll_number: student.roll_number,
            student_id: student.student_id,
            name: student.name,
            grade: student.grade,
            section: student.section,
            father_name: student.parent_info?.father_name || '—',
            mother_name: student.parent_info?.mother_name || '—',
            father_contact: student.parent_info?.father_contact || '—',
            amount: total_due_amount,
            status: student.status
        })
    }

    return res
        .status(200)
        .json(new ApiResponse(200, outputArray, 'Defaulters List'))
})

const feeRecords = asyncHandler(async (req, res) => {
    const { grade } = req.query

    if (!grade) {
        throw new ApiError(400, 'Required Fields')
    }

    const session = await getCurrentSchoolSession()

    const findStudentsFeeModule = await Student.aggregate([
        {
            $match: {
                grade: grade,
                session: session,
                status: { $in: ['Active', 'Inactive'] }
            }
        },
        {
            $lookup: {
                from: 'feemodules',
                localField: 'student_id',
                foreignField: 'student_id',
                as: 'feeModule'
            }
        },
        {
            $unwind: {
                path: '$feeModule',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                roll_number_int: { $toInt: '$roll_number' }
            }
        },
        {
            $sort: { roll_number_int: 1 }
        },
        {
            $project: {
                _id: 1,
                student_id: 1,
                name: 1,
                grade: 1,
                section: 1,
                roll_number: 1,
                session: 1,
                status: 1,
                feeModule: 1
            }
        }
    ])

    if (!findStudentsFeeModule.length) {
        throw new ApiError(404, 'No Records Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, findStudentsFeeModule, 'Fee Records')
        )
})

const feeEstimate = asyncHandler(async (req, res) => {
    const session = await getCurrentSchoolSession();

    const feeStructures = await FeeStructure.find({ session });

    const feesEstimate = await Promise.all(
        feeStructures.map(async (item) => {
            const studentCount = await Student.countDocuments({
                grade: item.grade,
                session,
                status: { $in: ["Active", "Inactive"] }
            });

            const totalAmount =
                (
                    Number(item.fee_Amount || 0) * 14 +
                    Number(item.admissionFees || 0) +
                    Number(item.resgistrationFees || 0) +
                    Number(item.annualCharges || 0)
                ) * studentCount;

            return {
                grade: item.grade,
                fee_Amount: item.fee_Amount,
                admissionFees: item.admissionFees,
                resgistrationFees: item.resgistrationFees,
                examFees: item.examFees,
                annualCharges: item.annualCharges,
                studentCount,
                totalAmount
            };
        })
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, feesEstimate, 'Fees Estimate')
        )
})

const closingBalanceList = asyncHandler(async (req, res) => {
    const session = await getCurrentSchoolSession()

    const findClosingBalances = await ClosingBalance.aggregate([
        {
            $match: { session: session }
        },
        {
            $lookup: {
                from: 'students',
                localField: 'student_id',
                foreignField: 'student_id',
                as: 'student_info'
            }
        },
        {
            $unwind: {
                path: '$student_info',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'parents',
                localField: 'student_info.parent_id',
                foreignField: 'parent_id',
                as: 'parent_info'
            }
        },
        {
            $unwind: {
                path: '$parent_info',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                student_id: 1,
                closing_balance_amount: 1,
                closing_balance_date: 1,
                paid: 1,
                session: 1,
                name: '$student_info.name',
                grade: '$student_info.grade',
                section: '$student_info.section',
                roll_number: '$student_info.roll_number',
                status: '$student_info.status',
                father_name: '$parent_info.father_name',
                father_contact: '$parent_info.father_contact'
            }
        },
        {
            $sort: { grade: 1, section: 1, roll_number: 1 }
        }
    ])

    if (findClosingBalances.length === 0) {
        throw new ApiError(404, 'No Closing Balances Records')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, findClosingBalances, 'Closing Balances List')
        )
})

const dayBook = asyncHandler(async (req, res) => {
    const { day, month, year } = req.query

    if (!day || !month || !year) {
        throw new ApiError(400, 'Required Fields')
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthCode = months.indexOf(month)

    if (monthCode === -1) {
        throw new ApiError(400, 'Invalid Month')
    }

    const start_date = new Date(parseInt(year), monthCode, parseInt(day), 0, 0, 0, 0)
    const end_date = new Date(parseInt(year), monthCode, parseInt(day), 23, 59, 59, 999)

    const payments = await Payment.aggregate([
        {
            $match: {
                dateOBJ: {
                    $gte: start_date,
                    $lte: end_date
                },
                status: 'Active'
            }
        },
        {
            $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "student_id",
                as: "student_info"
            }
        },
        {
            $unwind: {
                path: "$student_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "parents",
                localField: "student_info.parent_id",
                foreignField: "parent_id",
                as: "parent_info"
            }
        },
        {
            $unwind: {
                path: "$parent_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                student_id: 1,
                receipt_no: 1,
                amount: 1,
                discount: 1,
                paid_till_month: 1,
                payment_date: 1,
                fees_breakout: 1,
                payment_method: 1,
                session: 1,
                status: 1,
                user: 1,
                dateOBJ: 1,
                grade: 1,
                section: 1,
                name: "$student_info.name",
                gender: "$student_info.gender",
                category: "$student_info.category",
                roll_number: "$student_info.roll_number",
                father_name: "$parent_info.father_name",
                father_contact: "$parent_info.father_contact"
            }
        },
        {
            $sort: { payment_date: 1 }
        }
    ])

    if (!payments.length) {
        throw new ApiError(404, 'No payments found for this day')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, payments, 'Day Book')
        )
})


export {
    setupFees,
    getFeesStructure,
    getClassFeeStructure,
    editFeesStructure,
    setupFeeModule,
    createFeeModule,
    getFeeModule,
    updateFeeModule,
    addPenalty,
    getPenalty,
    studentFeeData,
    makePayment,
    getReceipts,
    cancelSlip,
    fetchCancelledSlips,
    transitReceipts,
    monthlyReport,
    defaultersList,
    feeRecords,
    feeEstimate,
    headCollection,
    closingBalanceList,
    dayBook
}