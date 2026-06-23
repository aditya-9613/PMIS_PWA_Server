import { ClosingBalance } from "../models/closing_balance.models.js";
import { Discount } from "../models/fee_discount.models.js";
import { FeeModule } from "../models/feeModule.models.js";
import { FeeStructure } from "../models/fees_structure.models.js";
import { Payment } from "../models/payments.models.js";
import { SpecialDiscount } from "../models/special_discount.models.js";
import { Student } from "../models/students.models.js";
import { TransportationHistory } from "../models/transportation_history.models.js";
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

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Fees Structure Updated Successfully')
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

    const { student_id, feeModule } = req.body

    if (!student_id || student_id.trim() === "") {
        throw new ApiError(400, 'Student ID is required')
    }

    if (!feeModule || feeModule.length !== 12) {
        throw new ApiError(400, 'Fee Module must have exactly 12 months')
    }

    const updateModule = await FeeModule.updateOne(
        { student_id, session },
        { $set: { feeModule } }
    )

    if (updateModule.matchedCount === 0) {
        throw new ApiError(404, 'Fee Module not found')
    }

    if (updateModule.modifiedCount === 0) {
        throw new ApiError(500, 'Fee Module update failed')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Fee Module Updated Successfully')
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

export {
    setupFees,
    getFeesStructure,
    getClassFeeStructure,
    editFeesStructure,
    createFeeModule,
    getFeeModule,
    updateFeeModule,
    addPenalty,
    getPenalty,
    studentFeeData
}