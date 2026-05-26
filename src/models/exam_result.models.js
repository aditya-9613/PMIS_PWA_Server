import mongoose, { Schema } from "mongoose";

const ExamResultSchema = new Schema({
    exam_type: {
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    student_id: {
        type: String,
        required: true
    },
    maximumMarks: {
        type: String,
        required: true
    },
    grade: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    subjects: {
        //array of subjects
        type: [String],
        required: true
    },
    marks: {
        //array of marks
        type: [String],
        required: true
    },
    session:{
        type: String,
        required: true
    }
})

export const ExamResult = mongoose.model('ExamResult', ExamResultSchema)