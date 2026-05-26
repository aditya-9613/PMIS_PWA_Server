import mongoose,{Schema} from "mongoose";

const TeacherSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
    dob: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    gender: {   // M or F
        type: String,
        required: true
    },
    hire_date: {
        type: Date,
        required: true
    },
    subjects: { // Array of subjects    
        type: Array,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    document_type: {
        type: String,
        required: true
    },
    document: {
        type: String,
        required: true
    },
}, {
    timestamps: true
})

export const Teacher = mongoose.model('Teacher', TeacherSchema)