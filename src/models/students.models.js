import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const StudentSchema = new Schema({
    student_id: {
        type: String,
        required: true,
        unique: true
    },
    aapar_id_no: {
        type: String,
    },
    student_image: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    addmissionDate: {
        type: Date
    },
    category: {
        type: String,
        required: true
    },
    course_id: {
        type: String
    },
    gender: {
        type: String
    },
    student_email: {
        type: String,
    },
    grade: {
        type: String,
        required: true
    },
    roll_number: {
        type: String,
    },
    section: {
        type: String,
    },
    student_contact: {
        type: String,
    },
    dob: {
        type: Date,
    },
    status: {
        type: String,
        default: 'Inactive'
    },
    address: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
    },
    city: {
        type: String,
    },
    document_type: {
        type: String
    },
    document_number: {
        type: String
    },
    modeOfTransport: {
        type: String
    },
    vehicle_number: {
        type: String
    },
    scholar_number: {
        type: String,
        unique: true
    },
    parent_id: {
        type: String,
        required: true
    },
    session: {
        type: String
    },
    removalDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})


StudentSchema.plugin(mongooseAggregatePaginate)
export const Student = mongoose.model('Student', StudentSchema)