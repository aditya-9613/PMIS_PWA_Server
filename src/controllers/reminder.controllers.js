import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Reminder } from "../models/reminder.models.js";
import { Admin } from "../models/admin.models.js";

const createReminder = asyncHandler(async (req, res) => {
    const { reminder_type, reminder_heading, reminder_date, reminder_description, type } = req.body

    if (
        [reminder_type, reminder_heading, reminder_date, reminder_description, type].some((fields) => fields.trim() === '')
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedReminder = await Reminder.findOne({
        reminder_type: reminder_type,
        reminder_heading: reminder_heading,
        reminder_date: reminder_date,
        reminder_description: reminder_description
    })

    if (existedReminder) {
        throw new ApiError(409, "Duplicate Reminder")
    }
    var user = ''
    if (type === 'admin') {
        user = await Admin.findById(req?.admin._id)
    } else if (type === 'employee') {
        user = await Admin.findById(req?.employee._id)
    } else if (type === 'teacher') {
        user = await Admin.findById(req?.teacher._id)
    }

    const createReminder = await Reminder.create({
        reminder_type: reminder_type,
        reminder_heading: reminder_heading,
        reminder_date: reminder_date,
        reminder_description: reminder_description,
        user: user?.name,
        userType: type
    })

    if (!createReminder) {
        throw new ApiError(500, "Server Error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Reminder Added")
        )
})

const getReminders = asyncHandler(async (req, res) => {
    var todaysDate = new Date()

    const { type } = req.query

    var user = ''
    if (type === 'admin') {
        user = await Admin.findById(req?.admin._id)
    } else if (type === 'employee') {
        user = await Admin.findById(req?.employee._id)
    } else if (type === 'teacher') {
        user = await Admin.findById(req?.teacher._id)
    }

    var months = (todaysDate.getMonth() + 1).toString().padStart(2, 0);
    var day = todaysDate.getDate().toString().padStart(2, 0)
    var year = todaysDate.getFullYear()

    var reminder_date = `${year}-${months}-${day}`

    const reminderList = await Reminder.find({ reminder_date: reminder_date, user: user?.name, userType: type }).lean()

    if (!reminderList.length) {
        throw new ApiError(404, "No Reminders")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { reminderList }, "Reminder List")
        )
})

export {
    createReminder,
    getReminders
}