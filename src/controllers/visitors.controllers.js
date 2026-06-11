import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Visitor } from "../models/visitors.models.js"

const createVisitor = asyncHandler(async (req, res) => {
    const { visitors_name, visitors_phone, reason, date, address, document_no } = req.body

    if (
        [visitors_name, visitors_phone, reason, address, document_no].some((fields) => fields.trim() === '')
    ) {
        throw new ApiError(400, "All fields are required and must not be empty.")
    }

    const saveVisitors = await Visitor.create({
        visitors_name: visitors_name,
        visitors_phone: visitors_phone,
        reason: reason,
        date: date,
        address: address,
        document_no: document_no
    })

    if (!saveVisitors) {
        throw new ApiError(500, "Server Error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Visitors Data Saved")
        )
})

const getVisitorDetails = asyncHandler(async (req, res) => {
    const { date } = req.query

    if (!date) {
        throw new ApiError(400, "Date is required")
    }

    const visitorData = [];
    const visitorList = await Visitor.find().select("-__v").lean();

    for (const element of visitorList) {
        const incommingDate = element.date.toString();
        const dateString = incommingDate.split(' ');
        const checkDate = `${dateString[3]}-${dateString[1]}-${dateString[2]}`;

        if (checkDate === date) {
            visitorData.push(element);
        }
    }

    if (!visitorData.length) {
        throw new ApiError(404, "No Visitors on this Date")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, visitorData, "Visitors List")
        )
})

export {
    createVisitor,
    getVisitorDetails
}