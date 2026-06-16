import { Discount } from "../models/fee_discount.models.js";
import { SpecialDiscount } from "../models/special_discount.models.js";
import { Student } from "../models/students.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { getCurrentSchoolSession } from "../utils/CurrentSession.js";

const convertFeeModule = asyncHandler(async (req, res) => {
    const session = await getCurrentSchoolSession()
    const getDiscounts = await SpecialDiscount.find({ session: session })
    const getSingleDiscounts = await Discount.find({ session: session })
    var uniqueArrays = []
    var uniqueSingleArrays = []

    for (const discount of getSingleDiscounts) {
        if (!uniqueSingleArrays.includes(discount.student_id)) {
            uniqueSingleArrays.push(discount.student_id)
        }
    }

    for (const student of getDiscounts) {
        const id = student.student_id;
        if (!uniqueArrays.includes(id)) {
            uniqueArrays.push(id)
        }
    }

    const allStudents = [...new Set([
        ...uniqueArrays,
        ...uniqueSingleArrays
    ])];

    const unionArray = allStudents.map((id) => {
        const isInSingle = uniqueSingleArrays.includes(id);
        const isInSpecial = uniqueArrays.includes(id);

        let description = '';

        if (isInSingle && isInSpecial) {
            description = 'Both';
        } else if (isInSingle) {
            description = 'Single';
        } else {
            description = 'Special';
        }

        return {
            student_id: id,
            description
        };
    });

    var studentCountByCategory = [
        {
            Type: 'New Admission',
            Both: [],
            Single: [],
            Special: [],
        }, {
            Type: 'Old Admission',
            Both: [],
            Single: [],
            Special: [],
        }]


    for (const student of unionArray) {
        const ID = student.student_id
        const studentDetails = await Student.findOne({ student_id: ID })
        const admissionYear = new Date(studentDetails.addmissionDate).getFullYear()

        if (new Date().getFullYear() === admissionYear) {
            //Count by Category Both , Single and Special like json 
            if (student.description === 'Both') {
                studentCountByCategory[0].Both.push(ID);
            } else if (student.description === 'Single') {
                studentCountByCategory[0].Single.push(ID);
            } else {
                studentCountByCategory[0].Special.push(ID);
            }
        } else {
            if (student.description === 'Both') {
                studentCountByCategory[1].Both.push(ID);
            } else if (student.description === 'Single') {
                studentCountByCategory[1].Single.push(ID);
            } else {
                studentCountByCategory[1].Special.push(ID);
            }
        }
    }


    if (studentCountByCategory[0].Type === 'New Admission') {
        for (const item of studentCountByCategory[0].Special) {
            const findDiscounts = await SpecialDiscount.findOne({ student_id: item });
        }
        for (const item of studentCountByCategory[0].Single) {
            const findDiscounts = await Discount.findOne({ student_id: item });
        }
        for (const item of studentCountByCategory[0].Both) {
            const findDiscounts = await Discount.findOne({ student_id: item });
            const findSingle = await SpecialDiscount.findOne({ student_id: item })
        }

    } else if (studentCountByCategory[0].Type === 'Old Admission') {

    }
})

export {
    convertFeeModule
}