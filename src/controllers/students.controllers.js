import { Parent } from "../models/parent.models.js";
import { Student } from "../models/students.models.js";
import { CreateActivity } from "../utils/Activity.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCurrentSchoolSession } from "../utils/CurrentSession.js";
import { StudentId } from "../utils/IDs.js";

const newAddmission = asyncHandler(async (req, res) => {
    const { name, aapar_id_no, gender, category, student_email, student_contact, dob, parent_email, grade, section, mother_name, father_name, father_occupation, mother_occupation, father_qualification, mother_qualification, guardian_name, guradian_phone, mother_contact, father_contact, address, pincode, city, document_type, document_number, modeOfTransport, status, scholar_number, vehicle_number, session } = req.body

    if (
        [name, gender, category, dob, grade, section, mother_name, father_name, father_qualification, mother_qualification, father_occupation, mother_occupation, mother_contact, father_contact, address, pincode, city, modeOfTransport, vehicle_number].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    const existStudent = await Student.findOne({ name: name })

    const existParents = await Parent.findOne({ parent_id: existStudent?.parent_id })

    if (existStudent && (existParents.father_name === father_name && existParents.mother_name === mother_name)) {
        throw new ApiError(409, `Students Exisit in Database Id: ${existStudent.student_id}`)
    }

    let student_id;
    let isUnique = false;

    // Loop to ensure unique student_id
    while (!isUnique) {
        student_id = StudentId(); // Generate a student ID
        const existingStudent = await Student.findOne({ where: { student_id } }); // Check for existence
        if (!existingStudent) {
            isUnique = true;
        }
    }

    const parent_id = 'P' + student_id.slice(1);

    const addmissionDate = new Date()

    const CreateStudent = await Student.create({
        student_id: student_id,
        aapar_id_no: aapar_id_no || '',
        student_image: null,
        name: name,
        category: category,
        gender: gender,
        student_email: student_email || null,
        grade: grade,
        roll_number: null,
        section: section,
        student_contact: student_contact || null,
        addmissionDate: addmissionDate,
        dob: dob,
        status: status,
        address: address,
        pincode: pincode || null,
        city: city || null,
        document_type: document_type || null,
        document_number: document_number || null,
        modeOfTransport: modeOfTransport || null,
        scholar_number: scholar_number || null,
        vehicle_number: vehicle_number || null,
        parent_id: parent_id,
        session: '2026-2027'
    })

    const CreateParent = await Parent.create({
        parent_id: parent_id,
        father_name: father_name,
        mother_name: mother_name,
        guardian_name: guardian_name || null,
        guradian_phone: guradian_phone || null,
        parent_email: parent_email || null,
        father_qualification: father_qualification || null,
        mother_qualification: mother_qualification || null,
        mother_contact: mother_contact,
        father_contact: father_contact,
        mother_occupation: mother_occupation,
        father_occupation: father_occupation
    })

    if (!CreateParent._id || !CreateStudent._id) {
        return ({ status: 500, message: 'Server Not Working Properly' })
    }

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Admission', `New Admission done for student with name ${name}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { student_id }, 'Students Addmission Done')
        )
})

const findStudentsQuery = asyncHandler(async (req, res) => {
    const { query } = req.query

    if (!query) {
        throw new ApiError(400, 'Query Can Not Be Empty')
    }

    const findStudent = await Student.find({
        $or: [
            { student_id: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } },
            { scholar_number: { $regex: query, $options: 'i' } },
            { aapar_id_no: { $regex: query, $options: 'i' } }
        ]
    }).lean();

    return res
        .status(200)
        .json(
            new ApiResponse(200, findStudent, 'Query Output')
        )
})

const findStudentWithId = asyncHandler(async (req, res) => {

    const { student_id } = req.query

    if (!student_id) {
        throw new ApiError(400, 'Student Id Cannot be Empty')
    }

    const studentDetails = await Student.findOne({ student_id: student_id }).lean()

    if (!studentDetails) {
        throw new ApiError(404, 'Student Not Found')
    }

    const parent_id = studentDetails.parent_id

    const fullDetails = await Student.aggregate([
        {
            $match: {
                student_id: student_id
            }
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
            $unwind: {
                path: '$parent_info',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: ['$parent_info', '$$ROOT']
                }
            }
        },
        {
            $project: {
                parent_info: 0
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, fullDetails, 'Student Details')
        )
})

const updateStudentDetails = asyncHandler(async (req, res) => {
    const { student_id, aapar_id_no, parent_id, name, gender, category, student_email, student_contact, dob, addmissionDate, parent_email, grade, section, mother_name, father_name, father_qualification, mother_qualification, father_occupation, mother_occupation, guardian_name, guradian_phone, mother_contact, father_contact, address, pincode, city, document_type, document_number, status, modeOfTransport, scholar_number, vehicle_number } = req.body

    if (
        [name, gender, category, dob, grade, section, mother_name, father_name, father_qualification, mother_qualification, father_occupation, mother_occupation, status, mother_contact, father_contact, address, pincode, city, vehicle_number].some((field) =>
            field?.trim() === "" || field === undefined)
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    const session = await getCurrentSchoolSession()

    const studentData = await Student.findOne({ student_id: student_id, parent_id: parent_id, session: session });

    if (!studentData) {
        throw new ApiError(404, 'Student not found');
    }

    studentData.name = name;
    studentData.aapar_id_no = aapar_id_no || '';
    studentData.gender = gender;
    studentData.category = category;
    studentData.student_email = student_email || null;
    studentData.student_contact = student_contact || null;
    studentData.dob = dob;
    studentData.grade = grade;
    studentData.section = section;
    studentData.status = status;
    studentData.address = address;
    studentData.addmissionDate = addmissionDate;
    studentData.pincode = pincode;
    studentData.city = city;
    studentData.document_type = document_type || null;
    studentData.document_number = document_number || null;
    studentData.modeOfTransport = modeOfTransport;
    studentData.scholar_number = scholar_number || null;
    studentData.vehicle_number = vehicle_number;

    await studentData.save();

    const parentData = await Parent.findOne({ parent_id: parent_id });

    if (!parentData) {
        throw new ApiError(404, 'Parent not found');
    }

    parentData.father_name = father_name;
    parentData.mother_name = mother_name;
    parentData.guardian_name = guardian_name || null;
    parentData.guardian_phone = guradian_phone || null;
    parentData.parent_email = parent_email || null;
    parentData.father_qualification = father_qualification || null;
    parentData.mother_qualification = mother_qualification || null;
    parentData.mother_contact = mother_contact;
    parentData.father_contact = father_contact;
    parentData.mother_occupation = mother_occupation;
    parentData.father_occupation = father_occupation;

    await parentData.save();

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Update', `Student Details updated for ${name} with ID ${student_id}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, 'Student Data Updated')
        )
})

const classImageList = asyncHandler(async (req, res) => {
    const { grade, section } = req.query

    if (grade === '' || section === '') {
        throw new ApiError(400, 'Required Fields')
    }

    const studentList = await Student.find(
        { grade: grade, section: section, status: { $in: ['Active', 'Inactive'] } },
        { _id: 0, student_image: 1, name: 1, student_id: 1, roll_number: 1 }
    ).lean()

    if (!studentList.length) {
        throw new ApiError(404, 'No Students Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { results: studentList }, 'Student List')
        )
})

const updateImageOnCloud = asyncHandler(async (req, res) => {

    const { student_id } = req.body

    const photoLocalPath = req.file?.path

    if (!student_id) throw new ApiError(400, "Student ID is required")

    if (!photoLocalPath) throw new ApiError(400, "Photo is required")

    const student = await Student.findOne({ student_id })
    if (!student) throw new ApiError(404, "Student not found")

    if (student.student_image) {
        await removeFromCloudinary(student.student_image)
    }

    const uploaded = await uploadOnCloudinary(photoLocalPath)

    if (!uploaded.secure_url) throw new ApiError(500, "Failed to upload photo to Cloudinary")

    student.student_image = uploaded.secure_url
    await student.save()

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Update', `Image Uploaded of student ${student_id}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { student_image: uploaded.secure_url }, "Photo updated successfully")
        )
})

const updateClassList = asyncHandler(async (req, res) => {

    const { jsonData } = req.body

    if (!jsonData || jsonData.length === 0) {
        throw new ApiError(400, 'No Updates Are Done')
    }

    for (const student of jsonData) {
        const studentData = await Student.findOne({
            student_id: student.student_id
        });

        const parentData = await Parent.findOne({
            parent_id: "P" + student.student_id.slice(1)
        });

        if (!studentData || !parentData) {
            throw new ApiError(404, "Student or Parent Not Found");
        }

        studentData.name = student.name || studentData.name
        studentData.aapar_id_no = student.aapar_id_no || studentData.aapar_id_no
        studentData.gender = student.gender || studentData.gender
        studentData.category = student.category || studentData.category
        studentData.student_email = student.student_email || studentData.student_email
        studentData.student_contact = student.student_contact || studentData.student_contact
        studentData.dob = student.dob || studentData.dob
        studentData.grade = student.grade || studentData.grade
        studentData.section = student.section || studentData.section
        studentData.status = student.status || studentData.status
        studentData.address = student.address || studentData.address
        studentData.addmissionDate = student.addmissionDate || studentData.addmissionDate
        studentData.pincode = student.pincode || studentData.pincode
        studentData.city = student.city || studentData.city
        studentData.document_type = student.document_type || studentData.document_type
        studentData.document_number = student.document_number || studentData.document_number
        studentData.modeOfTransport = student.modeOfTransport || studentData.modeOfTransport
        studentData.scholar_number = student.scholar_number || studentData.scholar_number
        studentData.vehicle_number = student.vehicle_number || studentData.vehicle_number

        await studentData.save()

        parentData.father_name = student.father_name || parentData.father_name
        parentData.mother_name = student.mother_name || parentData.mother_name
        parentData.guardian_name = student.guardian_name || parentData.guardian_name
        parentData.guardian_phone = student.guradian_phone || parentData.guardian_phone
        parentData.parent_email = student.parent_email || parentData.parent_email
        parentData.father_qualification = student.father_qualification || parentData.father_qualification
        parentData.mother_qualification = student.mother_qualification || parentData.mother_qualification
        parentData.mother_contact = student.mother_contact || parentData.mother_contact
        parentData.father_contact = student.father_contact || parentData.father_contact
        parentData.mother_occupation = student.mother_occupation || parentData.mother_occupation
        parentData.father_occupation = student.father_occupation || parentData.father_occupation

        await parentData.save()
    }

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Update', 'Class list Updated')

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, 'Class List Updated')
        )
})

const assignRollNo = asyncHandler(async (req, res) => {

    const { studentArray } = req.body

    if (!studentArray || studentArray.length === 0) {
        throw new ApiError(400, 'Student Array Cannot Be Empty')
    }

    var flag = 0;

    const rollNo = [];

    for (let i = 0; i < studentArray.length; i++) {
        const element = studentArray[i];
        if (element.roll_number === 0) {
            throw new ApiError(400, `Please Enter Roll Number at ${element.name}`)
        }
        if (rollNo.indexOf(element.roll_number) > -1) {
            throw new ApiError(422, `Two Roll Numbers Can't be Same: ${element.roll_number}`)
        }
        rollNo.push(element.roll_number);
    }

    for (let i = 0; i < studentArray.length; i++) {
        const item = studentArray[i];
        const updateRollNumber = await Student.updateOne({ student_id: item.student_id }, { roll_number: item.roll_number })
        if (!updateRollNumber.acknowledged) {
            throw new ApiError(500, `Server Error ${item.name}`)
        }
    }

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Assign', 'Roll Number Assigned')

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, 'Roll Numbers Assigned')
        )
})

const getClassStrength = asyncHandler(async (req, res) => {
    var currentSession = await getCurrentSchoolSession()

    const { grade, section } = req.query

    if (!grade || !section) {
        throw new ApiError(400, 'Required Fields')
    }

    const studentLists = await Student.aggregate([
        {
            $match: {
                grade: grade,
                section: section,
                session: currentSession
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
                aapar_id_no: 1,
                grade: 1,
                gender: 1,
                category: 1,
                dob: 1,
                section: 1,
                address: 1,
                roll_number: 1,
                status: 1,
                document_number: 1,
                document_type: 1,
                scholar_number: 1,
                addmissionDate: 1,
                session: 1,
                father_name: "$parent_info.father_name",
                mother_name: "$parent_info.mother_name",
                father_contact: "$parent_info.father_contact",
                parent_email: "$parent_info.parent_email",
                mother_contact: "$parent_info.mother_contact"
            }
        }
    ])

    if (!studentLists.length) {
        throw new ApiError(404, 'Class not Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, studentLists, 'Class List')
        )
})

const getNotPromotedList = asyncHandler(async (req, res) => {
    const { grade, section } = req.query

    if (grade === "" || section === "") {
        throw new ApiError(400, 'Required Fields')
    }

    const findNonPromotedStudentList = await Student.aggregate([
        {
            $match: {
                grade: grade,
                section: section,
                status: 'Not-Promoted'
            },
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
                grade: 1,
                gender: 1,
                section: 1,
                status: 1,
                father_name: "$parent_info.father_name",
                mother_name: "$parent_info.mother_name",
                father_contact: "$parent_info.father_contact"
            }
        }
    ])

    if (!findNonPromotedStudentList.length) {
        throw new ApiError(404, 'Class not Found or No Students Left for promotion')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, findNonPromotedStudentList, 'Non Promoted List')
        )
})

const promoteStudents = asyncHandler(async (req, res) => {

    var currentSession = await getCurrentSchoolSession()
    const { promotionList } = req.body

    if (!promotionList || promotionList.length === 0) {
        throw new ApiError(400, 'Promotion List Cannot Be Empty')
    }

    let stuArray = []

    promotionList.forEach(async (item) => {
        stuArray.push(item.student_id)
        const promoteStudent = await Student.updateOne({ student_id: item.student_id, status: 'Not-Promoted' }, { status: 'Inactive', grade: item.promote_to })

        if (!promoteStudent.acknowledged) {
            throw new ApiError(500, `Server Error at ${item.name}`)
        }
    })

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Prmotion', `Promotion done for students with ID ${stuArray.join(',')}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, 'Students Promoted')
        )
})

const swiftSection = asyncHandler(async (req, res) => {
    const { selectedStudent } = req.body

    if (!selectedStudent || selectedStudent.length === 0) {
        throw new ApiError(400, 'No Student Selected')
    }

    let stuArray = []

    selectedStudent.forEach(async (item) => {
        stuArray.push(item.student_id)
        const updateSection = await Student.updateOne({ student_id: item.student_id }, { section: item.section })

        if (!updateSection.acknowledged) {
            throw new ApiError(500, `Server Error at ${item.name}`)
        }
    })

    const user_id = req?.admin?._id || req?.employee?._id || req?.teacher?._id
    const type = req?.admin ? 'admin' : req?.teacher ? 'teacher' : req?.employee ? 'employee' : null
    await CreateActivity(user_id, type, 'Section Swifted', `Promotion done for students with ID ${stuArray.join(',')}`)

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, 'Section Updated Successfully')
        )
})

const admissionReport = asyncHandler(async (req, res) => {
    const { year } = req.query

    if (!year) {
        throw new ApiError(400, 'Year is Required')
    }

    const currentYear = new Date().getFullYear();

    if (year > currentYear) {
        return { status: 404, message: "Future Year" };
    }

    const admittedStudents = await Student.aggregate([
        {
            $match: {
                addmissionDate: {
                    $gte: new Date(Number(year), 0, 1)
                }
            }
        },
        {
            $lookup: {
                from: "parents", // collection name
                localField: "parent_id",
                foreignField: "parent_id",
                as: "parent"
            }
        },
        {
            $unwind: {
                path: "$parent",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,

                // Student fields
                student_id: 1,
                name: 1,
                addmissionDate: 1,
                grade: 1,
                section: 1,
                gender: 1,
                category: 1,
                dob: 1,
                document_number: 1,
                scholar_number: 1,
                status: 1,
                session: 1,

                // Parent fields
                father_name: "$parent.father_name",
                mother_name: "$parent.mother_name",
                father_contact: "$parent.father_contact",
                mother_contact: "$parent.mother_contact"
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, { admittedStudents }, 'Admission Report')
        )
})

const previousStudentList = asyncHandler(async (req, res) => {
    const { grade, section, session } = req.query
    var currentSession = await getCurrentSchoolSession()

    if (
        [grade, section, session].some((item) => item.trim() === "" || !item)
    ) {
        throw new ApiError(400, 'Required Fields')
    }

    if (session === currentSession) {
        throw new ApiError(429, 'This Session is Current Session')
    }

    const getAttendanceRecords = await Attendance.aggregate([
        { $match: { grade, section, session } },
        {
            $group: {
                _id: "$student_id",
                roll_number: { $first: "$roll_number" },
            },
        },
        {
            $project: {
                _id: 0,
                student_id: "$_id",
                roll_number: 1,
            },
        },
    ]);

    const paymentRecords = await Payment.distinct("student_id", {
        grade,
        section,
        session,
    });

    // Build a map from attendanceRecords for quick lookup
    const attendanceMap = new Map(
        getAttendanceRecords.map((record) => [record.student_id, record.roll_number])
    );

    // Union of both student_ids
    const allStudentIds = new Set([
        ...getAttendanceRecords.map((r) => r.student_id),
        ...paymentRecords,
    ]);

    const studentIds = [...allStudentIds];
    const parentIds = studentIds.map((id) => "P" + id.slice(1));

    const [studentRecords, parentRecords] = await Promise.all([
        Student.find(
            { student_id: { $in: studentIds } },
            { student_id: 1, student_contact: 1, address: 1, pincode: 1, city: 1, name: 1, _id: 0 }
        ).lean(),
        Parent.find(
            { parent_id: { $in: parentIds } },
            { parent_id: 1, mother_contact: 1, father_contact: 1, _id: 0 }
        ).lean(),
    ]);

    const studentMap = new Map(studentRecords.map((s) => [s.student_id, s]));
    const parentMap = new Map(parentRecords.map((p) => [p.parent_id, p]));

    const finalRecords = studentIds.map((student_id) => {
        const parent_id = "P" + student_id.slice(1);
        const { student_id: _s, ...studentData } = studentMap.get(student_id) ?? {};
        const { parent_id: _p, ...parentData } = parentMap.get(parent_id) ?? {};

        return {
            grade,
            section,
            session,
            student_id,
            roll_number: attendanceMap.get(student_id) ?? "N/A",
            parent_id,
            ...studentData,
            ...parentData,
        };
    }).sort((a, b) => {
        if (a.roll_number === "N/A") return 1;
        if (b.roll_number === "N/A") return -1;
        return Number(a.roll_number) - Number(b.roll_number);
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, finalRecords, 'Previous Session Data')
        )
})

const studentReport = asyncHandler(async (req, res) => {
    const { student_id } = req.query

    if (!student_id) {
        throw new ApiError(400, 'Student Id is Required')
    }

    const AllDetails = await Student.aggregate([
        {
            $match: {
                student_id: student_id
            }
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
            $lookup: {
                from: 'payments',
                localField: 'student_id',
                foreignField: 'student_id',
                as: 'payment_info'
            }
        },
        {
            $lookup: {
                from: 'examresults',
                localField: 'student_id',
                foreignField: 'student_id',
                as: 'result_info'
            }
        },
        {
            $lookup: {
                from: 'attendances',
                localField: 'student_id',
                foreignField: 'student_id',
                as: 'attendance_info'
            }
        },
        {
            $lookup: {
                from: 'discounts',
                localField: 'student_id',
                foreignField: 'student_id',
                as: 'discount_info'
            }
        },
        {
            $lookup: {
                from: 'specialdiscounts',
                localField: 'student_id',
                foreignField: 'student_id',
                as: 'special_discount_info'
            }
        }
    ])

    if (!AllDetails.length) {
        throw new ApiError(404, 'Student Not Found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, AllDetails[0], 'Student Report')
        )
})

export {
    newAddmission,
    findStudentsQuery,
    findStudentWithId,
    updateStudentDetails,
    classImageList,
    updateImageOnCloud,
    updateClassList,
    assignRollNo,
    getClassStrength,
    getNotPromotedList,
    promoteStudents,
    swiftSection,
    admissionReport,
    previousStudentList,
    studentReport
}