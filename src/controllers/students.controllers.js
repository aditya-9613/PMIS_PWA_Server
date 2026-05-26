import { Parent } from "../models/parent.models.js";
import { Student } from "../models/students.models.js";
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
    const { student_id, aapar_id_no, parent_id, name, gender, category, student_email, student_contact, dob, admissionDate, parent_email, grade, section, mother_name, father_name, father_qualification, mother_qualification, father_occupation, mother_occupation, guardian_name, guradian_phone, mother_contact, father_contact, address, pincode, city, document_type, document_number, status, modeOfTransport, scholar_number, vehicle_number } = req.body

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
    studentData.addmissionDate = admissionDate;
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

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, 'Student Data Updated')
        )
})

export {
    newAddmission,
    findStudentsQuery,
    findStudentWithId,
    updateStudentDetails,
}