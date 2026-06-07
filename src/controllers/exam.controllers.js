import { Admin } from "../models/admin.models.js";
import { Exam } from "../models/exam.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getUserDetails = asyncHandler(async (type) => {
    var user = ''
    if (type === 'admin') {
        user = await Admin.findById(req.admin.id)
    } else if (type === 'employee') {
        user = await Admin.findById(req.employee.id)
    } else if (type === 'teacher') {
        user = await Admin.findById(req.teacher.id)
    }

    return user
})

const defineExam = asyncHandler(async (req, res) => {
    const { exam_type, start_date, end_date, type } = req.body

    if (
        [exam_type, start_date, end_date].some((item) =>
            item.trim() === "")
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    var session = await getCurrentSchoolSession()


    const dateCollide = await Exam.find({
        $or: [
            {
                start_date: { $gte: start_date, $lte: end_date }
            },
            {
                end_date: { $gte: start_date, $lte: end_date }
            },
            {
                $and: [
                    { start_date: { $lte: start_date } },
                    { end_date: { $gte: end_date } }
                ]
            }
        ],
        session: session
    })


    if (dateCollide.length) {
        throw new ApiError(422, 'Date Collides from Previous Test')
    }

    const user = await getUserDetails(type)

    const setExamsDate = await Exam.create({
        exam_type: exam_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        user: `${user.name}/${user.username}/${user._id}`,
        session: session
    })

    if (!setExamsDate) {
        throw new ApiError(500, 'Server Error')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Exam Date Set")
        )
})

const getExams = asyncHandler(async (req, res) => {
    const session = await getCurrentSchoolSession()

    const today = new Date();

    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const result = await Exam.find({
        session: session
    }, { _id: 0, __v: 0 }).lean()

    return ({ status: 200, message: 'Data', Data: result })
})

const scheduleExam = asyncHandler(async (req, res) => {
    const tableData = req.body

    tableData.forEach(async (element) => {
        var dates = []
        var subject = []
        var schedule = element.schedule
        schedule.sort((a, b) => new Date(a.date) - new Date(b.date))
        schedule.forEach(item => {
            if ((item.subject === '' && item.timeSlot !== '') || item.subject !== '' && item.timeSlot === '') {
                throw new ApiError(400, `Required Input at ${element.class} on Date:${item.date}`)
            }
            if (item.date === '') {
                throw new ApiError(400, 'Dates can Not be Null')
            }
            dates.push(`${item.date}`)
            subject.push(`${item.subject}/${item.timeSlot}`)
        })

        const saveTimeTable = await TimeTable.create({
            grade: element.class,
            subject: subject,
            dates: dates,
            start_date: dates[0],
            end_date: dates[dates.length - 1]
        })
        if (!saveTimeTable) {
            throw new ApiError(500, 'Server Error')
        }
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Time Table Created Successfully")
        )
})


export {
    defineExam,
    getExams,
    scheduleExam
}