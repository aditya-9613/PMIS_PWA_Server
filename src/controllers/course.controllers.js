import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Course } from "../models/course.models.js"
import { getCurrentSchoolSession } from '../utils/CurrentSession.js'

const createCourse = asyncHandler(async (req, res) => {
    const { course_id, subjects, grade, session } = req.body

    if (
        [course_id, grade].some((items) =>
            items.trim() === "") || (subjects.length === 0)
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    const previousCourse = await Course.findOne({ course_id: course_id })

    if (previousCourse) {
        throw new ApiError(409, 'Course Id Exisits')
    }

    var createCourse

    if (grade === '9' || grade === '11') {
        createCourse = await Course.create({
            course_id: course_id,
            subjects: subjects,
            grade: grade,
            session: session
        })

        const newCourseId = grade === '9' ? 'Secondary Tenth' : course_id.replace("Eleventh", "Twelve")

        const createCourseFront = await Course.create({
            course_id: newCourseId,
            subjects: subjects,
            grade: (Number(grade) + 1),
            session: session
        })

    } else {
        createCourse = await Course.create({
            course_id: course_id,
            subjects: subjects,
            grade: grade,
            session: session
        })
    }

    if (!createCourse) {
        throw new ApiError(500, 'Server Not Working')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Course Added")
        )
})

const viewCourse = asyncHandler(async (req, res) => {
    var session = await getCurrentSchoolSession()

    const allCourses = await Course.find({ session: session })

    var allCourseRecords = []

    for (let i = 0; i < allCourses.length; i++) {
        const element = allCourses[i];
        const subjects = `${element.subjects.join(',')}`;

        allCourseRecords.push({
            course_id: element.course_id,
            subjects: subjects.trim(),
            grade: element.grade,
            session: element.session,
        });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { courses: allCourseRecords }, "All Courses")
        )
})

const getCourse = asyncHandler(async (req, res) => {
    const { grade, section } = req.query

    if (grade === "" || section === "") {
        throw new ApiError(400, 'Required Fields')
    }

    const studentData = await Student.find({ grade: grade, section: section },
        { _id: 0, student_id: 1, name: 1, roll_number: 1, grade: 1, section: 1, status: 1 }
    ).lean()

    if (!studentData.length) {
        throw new ApiError(404, 'No Records Found')
    }

    const courses = await Course.find({ grade: grade },
        { _id: 0, course_id: 1 }).lean()

    if (!courses.length) {
        throw new ApiError(404, 'No Courses Found')
    }

    const Data = { studentData, courses }

    return res
        .status(200)
        .json(
            new ApiResponse(200, Data, "Course Records")
        )
})

const allotCourse = asyncHandler(async (req, res) => {
    const { result } = req.body

    if (!result || result.length === 0) {
        throw new ApiError(400, 'Result is required')
    }

    const invalidElement = result.find(element => element.course_id === "");

    let flag = invalidElement !== undefined;

    if (flag) {
        throw new ApiError(400, `Course ID Blank for Roll Number ${invalidElement.roll_number}`)
    }

    for (const student of result) {
        await Student.updateOne(
            { student_id: student.student_id },
            { $set: { course_id: student.course_id } }
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Course Ids Updated")
        )
})

const getCourseById = asyncHandler(async (req, res) => {
    const { course_id } = req.body

    if (!course_id) {
        throw new ApiError(400, 'Required Input')
    }

    var session = await getCurrentSchoolSession()

    const Courses = await Course.findOne({ course_id: course_id, session: session })

    if (!Courses) {
        throw new ApiError(404, 'Course Missing')
    }

    var Data = []

    Data.push({
        course_id: Courses.course_id,
        subjects: Courses.subjects.join(','),
        grade: Courses.grade,
        session: Courses.session
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, { courses: Data }, "Course List")
        )
})

const updateCourseById = asyncHandler(async (req, res) => {
    const { course_id, subjects } = req.body

    if (course_id === "" || !subjects || subjects?.length === 0) {
        throw new ApiError(400, 'Required Inputs')
    }

    var updateCourse

    if (course_id.includes('Nineth') || course_id.includes('Eleventh')) {
        updateCourse = await Course.updateOne({ course_id: course_id }, { subjects: subjects })

        const newCourseId = course_id.includes('Nineth') ? 'Secondary Tenth' : course_id.replace("Eleventh", "Twelve")

        const updateCourseFront = await Course.updateOne({ course_id: newCourseId }, { subjects: subjects })

    } else {
        updateCourse = await Course.updateOne({ course_id: course_id }, { subjects: subjects })
    }

    if (!updateCourse.acknowledged) {
        throw new ApiError(500, 'Server Error')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Course Updated")
        )
})

const removeCourseById = asyncHandler(async (req, res) => {
    const { course_id } = req.body

    if (course_id === "") {
        throw new ApiError(400, 'Required Inputs')
    }

    var removeCourse

    if (course_id.includes('Nineth') || course_id.includes('Eleventh')) {
        removeCourse = await Course.deleteOne({ course_id: course_id })

        const newCourseId = course_id.includes('Nineth') ? 'Secondary Tenth' : course_id.replace("Eleventh", "Twelve")

        const removeCourseFront = await Course.deleteOne({ course_id: newCourseId })
    } else {
        removeCourse = await Course.deleteOne({ course_id: course_id })
    }

    if (!removeCourse.acknowledged) {
        throw new ApiError(500, 'Server Error')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Course Deleted")
        )
})

const getStudentWithSubjects = asyncHandler(async (req, res) => {
    var currentSession = await getCurrentSchoolSession()

    const { grade, section, MaximumMarks, examType } = req.query

    if (
        [grade, section, MaximumMarks, examType].some((items) =>
            items.trim() === "" || items === 0)
    ) {
        throw new ApiError(400, "Required Inputs")
    }

    const studentsWithCourseDetails = await Student.aggregate([
        {
            $match: {
                grade: grade,
                section: section,
                session: currentSession,
                status: { $in: ['Active', 'Inactive'] }
            }
        },
        {
            $lookup: {
                from: "courses",
                localField: "course_id",
                foreignField: "course_id",
                as: "course_details"
            }
        },
        {
            $unwind: {
                path: "$course_details",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,
                student_id: 1,
                course_id: 1,
                name: 1,
                roll_number: 1,
                grade: 1,
                section: 1,
                status: 1,
                course_id: "$course_details.course_id",
                subjects: "$course_details.subjects",
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, { students: studentsWithCourseDetails }, "Student Course Details")
        )
})

export {
    createCourse,
    viewCourse,
    getCourse,
    allotCourse,
    getCourseById,
    updateCourseById,
    removeCourseById,
    getStudentWithSubjects
}