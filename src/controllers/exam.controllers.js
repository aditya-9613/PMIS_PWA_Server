import { Exam } from "../models/exam.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getCurrentSchoolSession } from "../utils/CurrentSession.js";
import { TimeTable } from '../models/time_table.models.js'
import { Student } from "../models/students.models.js";
import { ExamResult } from "../models/exam_result.models.js"
import { Attendance } from "../models/attendance.models.js";
import { DailyAttendance } from "../models/daily_attendance.model.js";
import { Important } from "../models/important.model.js";


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

    const duplicateExam = await Exam.findOne({ session: session, exam_type: exam_type })

    if (duplicateExam) {
        throw new ApiError(422, 'Exam Duplicate')
    }


    if (dateCollide.length) {
        throw new ApiError(422, 'Date Collides from Previous Test')
    }

    const setExamsDate = await Exam.create({
        exam_type: exam_type,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
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

    return res
        .status(200)
        .json(
            new ApiResponse(200, { exams: result }, 'Exam Schedule Data')
        )
})

const scheduleExam = asyncHandler(async (req, res) => {
    const { tableData, start_date } = req.body;

    const startDateObj = new Date(start_date);

    for (const element of tableData) {
        const dates = [];
        const subject = [];
        const schedule = element.schedule;

        schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

        for (const item of schedule) {
            if (item.date === '') {
                throw new ApiError(400, 'Dates cannot be null')
            }

            if (
                (item.subject === '' && item.timeSlot !== '') ||
                (item.subject !== '' && item.timeSlot === '')
            ) {
                throw new ApiError(400, `Required input missing at ${element.class} on Date: ${item.date}`)
            }

            dates.push(`${item.date}`);
            subject.push(`${item.subject}/${item.timeSlot}`);
        }

        const findSubjectData = await TimeTable.findOne({
            grade: element.class,
            start_date: startDateObj
        });

        if (findSubjectData) {
            const updateTable = await TimeTable.updateOne(
                {
                    grade: element.class,
                    start_date: startDateObj
                },
                {
                    subject: subject,
                    dates: dates,
                    end_date: dates[dates.length - 1]
                }
            );

            if (!updateTable.acknowledged) {
                throw new ApiError(500, 'Server Error')
            }
        } else {
            const createDataNew = await TimeTable.create({
                grade: element.class,
                start_date: startDateObj,
                subject: subject,
                dates: dates,
                end_date: dates[dates.length - 1]
            });

            if (!createDataNew) {
                throw new ApiError(500, 'Server Error')
            }
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Time Table Updated Successfully')
        )
})

const getSchedule = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    var { start_date, end_date } = req.query

    if (start_date === '' || end_date === '') {
        throw new ApiError(400, 'Required Fields')
    }

    start_date = new Date(start_date);
    start_date.setUTCHours(0, 0, 0, 0);

    end_date = new Date(end_date);
    end_date.setUTCHours(0, 0, 0, 0);
    end_date.setUTCDate(end_date.getUTCDate() + 1); // exclusive upper bound

    const findExam = await TimeTable.find({
        start_date: { $gte: start_date },
        end_date: { $lt: end_date }   // note: $lt not $lte
    }).lean();

    if (findExam.length === 0) {
        throw new ApiError(404, 'Exam Not Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, findExam, 'Exam Data')
        )
})

const genrateAdmitCards = asyncHandler(async (req, res) => {
    const { grade, section, examType, start_date, end_date } = req.query;

    if ([grade, section, examType, start_date, end_date].some((item) => !item || item.trim() === "")) {
        throw new ApiError(400, 'Required Fields');
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate) || isNaN(endDate)) {
        throw new ApiError(400, 'Invalid date format');
    }

    const findPapers = await TimeTable.findOne({
        grade: grade,
        start_date: startDate,
        end_date: endDate
    }).lean();

    if (!findPapers) {
        throw new ApiError(404, 'Exam schedule not found');
    }

    const studentDetails = await Student.aggregate([
        {
            $match: {
                grade: grade,
                section: section,
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
            $unwind: "$parent_info"
        },
        {
            $project: {
                name: 1,
                student_id: 1,
                student_image: 1,
                grade: 1,
                gender: 1,
                dob: 1,
                section: 1,
                address: 1,
                roll_number: 1,
                status: 1,
                session: 1,
                father_name: "$parent_info.father_name",
                mother_name: "$parent_info.mother_name",
                father_contact: "$parent_info.father_contact"
            }
        }
    ])

    const Admit_Card = { exam: findPapers, studentDetails: studentDetails }

    return res
        .status(200)
        .json(
            new ApiResponse(200, Admit_Card, 'Admit Card')
        )
})

const upsertExamMarks = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { exam_type, grade, section, MaximumMarks, marksData } = req.body

    // ── Validation ──────────────────────────────────────────────────────────────
    if ([exam_type, grade, section, MaximumMarks].some((item) => String(item)?.trim() === "")) {
        throw new ApiError(400, 'Required Fields')
    }

    // ── Check marks already exist in DB for this exam/grade/section ─────────────
    const existingResults = await ExamResult.find({
        exam_type,
        session,
        grade,
        section
    })

    const existingMap = {}
    existingResults.forEach((doc) => {
        existingMap[String(doc.student_id)] = doc
    })

    const toInsert = []
    const toUpdate = []

    // ── Validate marks and split into insert / update buckets ───────────────────
    for (const element of marksData) {
        const { student_id, name, subjects: subjectsObj } = element
        const subjects = Object.keys(subjectsObj)
        const marks = Object.values(subjectsObj)
        const maxMarks = Number(MaximumMarks)

        // Validate: no mark should exceed MaximumMarks
        const invalidMark = marks.find((mark) => {
            const numMark = Number(mark)
            return mark !== '' && !isNaN(numMark) && numMark > maxMarks
        })

        if (invalidMark) {
            throw new ApiError(400, `Marks entered for ${name} exceed Maximum Marks`)
        }

        if (existingMap[String(student_id)]) {
            // ── UPDATE: record exists for this student ───────────────────────────
            toUpdate.push({
                _id: existingMap[String(student_id)]._id,
                subjects,
                marks,
                maximumMarks: MaximumMarks,
                name
            })
        } else {
            // ── INSERT: no record yet for this student ───────────────────────────
            toInsert.push({
                exam_type,
                name,
                student_id,
                maximumMarks: MaximumMarks,
                grade,
                section,
                subjects,
                marks,
                session
            })
        }
    }

    // ── Bulk Insert ──────────────────────────────────────────────────────────────
    if (toInsert.length > 0) {
        const inserted = await ExamResult.insertMany(toInsert)
        if (!inserted) {
            throw new ApiError(500, 'Failed to save marks for one or more students')
        }
    }

    // ── Bulk Update ──────────────────────────────────────────────────────────────
    if (toUpdate.length > 0) {
        const bulkOps = toUpdate.map((item) => ({
            updateOne: {
                filter: { _id: item._id },
                update: {
                    $set: {
                        subjects: item.subjects,
                        marks: item.marks,
                        maximumMarks: item.maximumMarks
                    }
                }
            }
        }))

        const bulkResult = await ExamResult.bulkWrite(bulkOps)

        if (!bulkResult.acknowledged) {
            throw new ApiError(500, 'Marks update failed for one or more students')
        }
    }

    const action = toInsert.length > 0 && toUpdate.length > 0
        ? 'Marks Saved & Updated Successfully'
        : toInsert.length > 0
            ? 'Marks Added Successfully'
            : 'Marks Updated Successfully'

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, action)
        )
})

const getExamMarks = asyncHandler(async (req, res) => {
    const { grade, section, examType } = req.query

    if (
        [grade, section, examType].some((item) => item?.trim() === '' || !item)
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    var currentSession = await getCurrentSchoolSession()

    const getMarksOfExam = await ExamResult.find({
        session: currentSession,
        exam_type: examType,
        grade: grade,
        section: section,
    });

    if (getMarksOfExam.length === 0) {
        throw new ApiError(404, 'Marks Not Found')
    }

    const studentsList = await Student.find({ grade: grade, section: section, status: { $in: ['Active', 'Inactive'] }, session: currentSession })


    const rollNoMap = new Map();
    studentsList.forEach(student => {
        rollNoMap.set(student.student_id.toString(), student.roll_number);
    });

    getMarksOfExam.sort((a, b) => {
        const rollA = rollNoMap.get(a.student_id.toString()) || 0;
        const rollB = rollNoMap.get(b.student_id.toString()) || 0;
        return rollA - rollB;
    });


    return res
        .status(200)
        .json(
            new ApiResponse(200, getMarksOfExam, 'Data Incomming')
        )
})

const getScholasticMarks = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { exam_type, grade, section } = req.query

    if (
        [exam_type, grade, section].some((item) => item?.trim() === "")
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    const getMarksOfScholastic = await Scholastic.find({
        session: session,
        exam_type: exam_type,
        grade: grade,
        section: section,
    })

    if (getMarksOfScholastic.length === 0) {
        throw new ApiError(404, 'Marks Not Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, getMarksOfScholastic, 'Data Incoming')
        )
})

const saveScholasticMarks = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { marksData } = req.body

    if (!marksData || marksData.length === 0) {
        throw new ApiError(400, 'Required Fields')
    }

    var marksList = JSON.parse(marksData)

    for (const record of marksList) {
        const existingRecord = await Scholastic.findOne({
            student_id: record.student_id,
            exam_type: record.exam_type,
            roll_number: record.roll_number,
            grade: (record.grade)?.split('-')[0].trim(),
            section: (record.grade)?.split('-')[1].trim(),
            session: session
        });

        if (existingRecord) {
            // Update existing record
            existingRecord.subjects = record.subjects;
            existingRecord.marks = record.marks;
            await existingRecord.save();
        } else {
            // Create new record
            await Scholastic.create({
                student_id: record.student_id,
                exam_type: record.exam_type,
                roll_number: record.roll_number,
                grade: (record.grade).split('-')[0].trim(),
                section: (record.grade).split('-')[1].trim(),
                session: session,
                marks: record.marks,
                subjects: record.subjects
            });
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Marks Saved Successfully')
        )
})

const classTopper = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    let { grade, section, examType } = req.query

    if ([grade, section, examType].some((item) => item?.trim() === "")) {
        throw new ApiError(400, 'Required Fields')
    }

    // ✅ Now reassignment works
    if (examType === 'Half Yearly Examination') {
        examType = ['Periodic Test-I', 'Half Yearly Examination'];
    } else if (examType === 'Annual Examination') {
        examType = ['Periodic Test-I', 'Periodic Test-II', 'Half Yearly Examination', 'Annual Examination'];
    } else {
        examType = [examType]; // wrap single value in array for consistent $in usage
    }

    const studentList = await Student.find({
        session, grade, section,
        status: { $in: ['Active', 'Inactive'] }
    }).select('student_id')

    const studentIds = studentList.map(s => s.student_id);

    const result = await Student.aggregate([
        {
            $match: {
                student_id: { $in: studentIds },
                session, grade, section,
                status: { $in: ['Active', 'Inactive'] }
            }
        },
        {
            $lookup: {
                from: 'examresults',
                localField: 'student_id',
                foreignField: 'student_id',
                as: 'exam_results'
            }
        },
        // ✅ Filter exam_results by examType AFTER lookup
        {
            $addFields: {
                exam_results: {
                    $filter: {
                        input: '$exam_results',
                        as: 'exam',
                        cond: { $in: ['$$exam.exam_type', examType] }  // ✅ Apply examType filter here
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'parents',
                localField: 'parent_id',
                foreignField: 'parent_id',
                as: 'parent_details'
            }
        },
        { $unwind: { path: "$parent_details", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                student_id: 1,
                name: 1,
                session: 1,
                grade: 1,
                dob: 1,
                section: 1,
                roll_number: 1,
                student_image: 1,
                exam_results: 1,
                father_name: "$parent_details.father_name",
                mother_name: "$parent_details.mother_name",
            }
        }
    ]);

    const studentScores = [];

    result.forEach(student => {
        const examResults = student.exam_results;
        const subjectTotals = {}; // Store sum of marks per subject

        // Sum marks per subject across all exams
        examResults.forEach(exam => {
            exam.subjects.forEach((subject, index) => {
                const markStr = exam.marks[index];
                let totalMark = 0;

                // Convert '76+5+5' => 86, ignore 'A','AB' or empty
                if (markStr && markStr !== 'A' && markStr !== 'AB' && markStr.trim() !== '') {
                    totalMark = markStr.split('+').reduce((sum, val) => sum + (parseInt(val) || 0), 0);
                }

                // Add to subject total
                if (!subjectTotals[subject]) subjectTotals[subject] = 0;
                subjectTotals[subject] += totalMark;
            });
        });

        // Filter out subjects with 0 marks
        const filteredSubjects = Object.fromEntries(
            Object.entries(subjectTotals).filter(([_, value]) => value !== 0)
        );

        // Calculate total obtained marks
        const totalObtainedMarks = Object.values(filteredSubjects).reduce((a, b) => a + b, 0);

        // Total max marks (100 per subject)
        var totalMaxMarks = Object.keys(filteredSubjects).length * 100;
        if (examType[examType.length - 1] === 'Annual Examination') {
            totalMaxMarks = totalMaxMarks * 2;
        }

        // Calculate percentage
        const percentage = totalMaxMarks > 0 ? parseFloat(((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2)) : 0;

        // Push final student summary
        studentScores.push({
            student_image: student.student_image,
            student_id: student.student_id,
            name: student.name,
            roll_number: student.roll_number,
            father_name: student.father_name,
            mother_name: student.mother_name,
            class: `${student.grade}-${student.section}`,
            total_maximum_marks: totalMaxMarks,
            obtained_marks: totalObtainedMarks,
            percentage,
        });
    });
    // Sort by obtained_marks descending
    studentScores.sort((a, b) => b.obtained_marks - a.obtained_marks);

    let rank = 1;
    for (let i = 0; i < studentScores.length; i++) {
        if (i > 0 && studentScores[i].obtained_marks < studentScores[i - 1].obtained_marks) {
            rank++; // increment rank only when marks decrease
        }
        studentScores[i].rank = rank;
    }
    //Take top 5 students and assign Ranks 1 to 5
    const top5Ranks = studentScores.filter(s => s.rank >= 1 && s.rank <= 5);

    return res
        .status(200)
        .json(
            new ApiResponse(200, top5Ranks, 'Class Topper Data')
        )
})

const getResultData = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const { exam_type, grade, section } = req.query

    if (
        [exam_type, grade, section].some((item) => item?.trim() === "")
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    // first find student list in students collection with status Active or Inactive take only student_ids

    const studentList = await Student.find({
        session: session,
        grade: grade,
        section: section,
        status: { $in: ['Active', 'Inactive'] }
    }).select('student_id')

    //Now with this student_ids write aggregation in exam_results collection to get marks and in parents collection to get parent details and in attendance collection to get attendance details and in scholastic collection to get scholastic marks

    const studentIds = studentList.map(s => s.student_id);

    const result = await Student.aggregate([
        {
            $match: {
                student_id: { $in: studentIds },
                session,
                grade,
                section,
                status: { $in: ['Active', 'Inactive'] }
            }
        },

        // Filtered lookup: only current session exam results
        {
            $lookup: {
                from: 'examresults',
                let: { sid: '$student_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$student_id', '$$sid'] },
                                    { $eq: ['$session', session] }   // ← filter by session
                                ]
                            }
                        }
                    }
                ],
                as: 'exam_results'
            }
        },

        // Parent lookup (one-to-one, safe to unwind)
        {
            $lookup: {
                from: 'parents',
                localField: 'parent_id',
                foreignField: 'parent_id',
                as: 'parent_details'
            }
        },

        // Filtered lookup: attendance for this session
        {
            $lookup: {
                from: 'attendances',
                let: { sid: '$student_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$student_id', '$$sid'] },
                                    { $eq: ['$session', session] }
                                ]
                            }
                        }
                    }
                ],
                as: 'attendance'
            }
        },

        // Filtered lookup: scholastic for this session/grade
        {
            $lookup: {
                from: 'scholastics',
                let: { sid: '$student_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$student_id', '$$sid'] },
                                    { $eq: ['$session', session] }
                                ]
                            }
                        }
                    }
                ],
                as: 'scholastic'
            }
        },

        // Only unwind parent (1-to-1). Use $first for others to avoid row explosion.
        { $unwind: { path: '$parent_details', preserveNullAndEmptyArrays: true } },

        {
            $project: {
                student_id: 1,
                name: 1,
                session: 1,
                grade: 1,
                dob: 1,
                section: 1,
                roll_number: 1,
                student_image: 1,

                exam_results: 1,  // array — multiple exams per student

                father_name: '$parent_details.father_name',
                mother_name: '$parent_details.mother_name',

                // Use $first since attendance/scholastic are now arrays
                // but expected to have one record per session
                attendance_present_days: '$attendance.present_days',
                attendance_total_days: '$attendance.total_days',
                attendance_percentage: '$attendance.percentage',

                scholastic_subjects: '$scholastic.subjects',
                scholastic_marks: '$scholastic.marks'
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, result, 'Result Data')
        )
})

const getPreviousExamMarks = asyncHandler(async (req, res) => {
    const { student_id, session } = req.query

    if (
        [student_id, session].some((item) => item?.trim() === "")
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    const result = await Student.aggregate([
        {
            $match: {
                student_id: student_id
            }
        },

        // Filtered lookup: only current session exam results
        {
            $lookup: {
                from: 'examresults',
                let: { sid: '$student_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$student_id', '$$sid'] },
                                    { $eq: ['$session', session] }   // ← filter by session
                                ]
                            }
                        }
                    }
                ],
                as: 'exam_results'
            }
        },

        // Parent lookup (one-to-one, safe to unwind)
        {
            $lookup: {
                from: 'parents',
                localField: 'parent_id',
                foreignField: 'parent_id',
                as: 'parent_details'
            }
        },

        // Filtered lookup: attendance for this session
        {
            $lookup: {
                from: 'attendances',
                let: { sid: '$student_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$student_id', '$$sid'] },
                                    { $eq: ['$session', session] }
                                ]
                            }
                        }
                    }
                ],
                as: 'attendance'
            }
        },

        // Filtered lookup: scholastic for this session/grade
        {
            $lookup: {
                from: 'scholastics',
                let: { sid: '$student_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$student_id', '$$sid'] },
                                    { $eq: ['$session', session] }
                                ]
                            }
                        }
                    }
                ],
                as: 'scholastic'
            }
        },

        // Only unwind parent (1-to-1). Use $first for others to avoid row explosion.
        { $unwind: { path: '$parent_details', preserveNullAndEmptyArrays: true } },

        {
            $project: {
                student_id: 1,
                name: 1,
                session: session,
                grade: { $arrayElemAt: ["$exam_results.grade", 0] },
                section: { $arrayElemAt: ["$exam_results.section", 0] },
                dob: 1,
                roll_number: 1,
                student_image: 1,

                exam_results: 1,  // array — multiple exams per student

                father_name: '$parent_details.father_name',
                mother_name: '$parent_details.mother_name',

                // Use $first since attendance/scholastic are now arrays
                // but expected to have one record per session
                attendance_present_days: '$attendance.present_days',
                attendance_total_days: '$attendance.total_days',
                attendance_percentage: '$attendance.percentage',

                scholastic_subjects: '$scholastic.subjects',
                scholastic_marks: '$scholastic.marks'
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, result, 'Previous Exam Marks')
        )
})

const dailyAttendanceUpdates = asyncHandler(async (req, res) => {
    const { attendanceArray } = req.body

    var session = await getCurrentSchoolSession()

    if (attendanceArray.length === 0) {
        throw new ApiError(400, 'Attendance Data Required')
    }

    await Promise.all(
        attendanceArray.map(async (record) => {
            //find if record exist for student for current session
            const existingRecord = await DailyAttendance.findOne({
                student_id: record.student_id,
                grade: record.grade,
                section: record.section,
                session: session
            })

            if (existingRecord) {
                const todayStr = new Date().toISOString().slice(0, 10)  // "2026-06-16"

                const todayIndex = existingRecord.attendance.findIndex(a =>
                    new Date(a.date).toISOString().slice(0, 10) === todayStr
                )

                if (todayIndex !== -1) {
                    existingRecord.attendance[todayIndex].status = record.status
                } else {
                    existingRecord.attendance.push({ date: new Date(), status: record.status })
                }

                await existingRecord.save()
            } else {
                const newAttendance = await DailyAttendance.create({
                    student_id: record.student_id,
                    grade: record.grade,
                    section: record.section,
                    session: session,
                    attendance: [{
                        date: new Date(),
                        status: record.status
                    }]
                })

                if (!newAttendance) {
                    throw new ApiError(500, 'Failed to save attendance for student_id: ' + record.student_id)
                }
            }
        })
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Attendance Updated Successfully')
        )
})

const getAttendanceRecords = asyncHandler(async (req, res) => {
    const { grade, section } = req.query

    if ([grade, section].some((item) => item?.trim() === "")) {
        throw new ApiError(400, 'Required Fields')
    }

    const session = await getCurrentSchoolSession()

    const findRecords = await DailyAttendance.aggregate([
        {
            $match: {
                grade: grade,
                section: section,
                session: session
            }
        },
        {
            $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "student_id",
                as: "studentInfo"
            }
        },
        {
            $unwind: {
                path: "$studentInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                name: "$studentInfo.name",
                roll_number: "$studentInfo.roll_number",
                roll_number_int: { $toInt: "$studentInfo.roll_number" }  // convert for sorting
            }
        },
        {
            $sort: { roll_number_int: 1 }  // sort ascending 1,2,3...
        },
        {
            $project: {
                studentInfo: 0,
                roll_number_int: 0   // remove the temp field after sorting
            }
        }
    ])

    if (findRecords.length === 0) {
        throw new ApiError(404, 'Attendance Records Not Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, findRecords, 'Attendance Records')
        )
})

const saveTotalAttendance = asyncHandler(async (req, res) => {
    const session = await getCurrentSchoolSession();
    const { attendanceData } = req.body;

    const attendanceList = JSON.parse(attendanceData).map(record => {
        const totalDays = Number(record.total_working_days);
        const presentDays = Number(record.total_present);
        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
        return { ...record, percentage };
    });

    const bulkOps = attendanceList.map(record => ({
        updateOne: {
            filter: {
                student_id: record.student_id,
                exam_type: record.exam_type,
                student_name: record.name,
                roll_number: record.roll_number,
                grade: record.grade,
                section: record.section,
                session,
            },
            update: {
                $set: {
                    total_days: record.total_working_days,
                    present_days: record.total_present,
                    percentage: record.percentage,
                },
            },
            upsert: true, // Insert if not found, update if found
        },
    }));

    if (bulkOps.length > 0) {
        await Attendance.bulkWrite(bulkOps);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Attendance Saved')
        )
})

const updateAttendanceTime = asyncHandler(async (req, res) => {
    const { preAttendanceTime, newAttendanceTime } = req.body

    const currentSession = await getCurrentSchoolSession();

    const existingRecord = await Important.findOne({
        session: currentSession
    });

    if (!existingRecord) {
        // First time creation
        if (!newAttendanceTime?.trim()) {
            throw new ApiError(400, "Attendance Time Required");
        }

        await Important.create({ attendanceTime: newAttendanceTime, session: currentSession });
    } else {
        // Update
        if (!preAttendanceTime?.trim() || !newAttendanceTime?.trim()) {
            throw new ApiError(400, "Previous and New Attendance Time Required");
        }
        existingRecord.attendanceTime = newAttendanceTime;
        await existingRecord.save();
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Attendance Time Updated')
        )
})

const getAttendanceTime = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()
    const record = await Important.findOne({ session: session }).select('attendanceTime')

    if (!record) {
        throw new ApiError(404, 'Attendance Time Not Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, record.attendanceTime, 'Attendance Time')
        )
})

const createImportant = asyncHandler(async (req, res) => {
    const { attendanceTime } = req.body
    var session = await getCurrentSchoolSession()

    const create = await Important.create({
        attendanceTime,
        session
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Attendance Time Set')
        )
})

export {
    defineExam,
    getExams,
    scheduleExam,
    getSchedule,
    genrateAdmitCards,
    upsertExamMarks,
    getExamMarks,
    saveScholasticMarks,
    getScholasticMarks,
    classTopper,
    getResultData,
    getPreviousExamMarks,
    dailyAttendanceUpdates,
    getAttendanceRecords,
    saveTotalAttendance,
    updateAttendanceTime,
    getAttendanceTime,
    createImportant
}