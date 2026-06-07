import mongoose, { Schema } from "mongoose";

const ExamSchema = new Schema({
    exam_type: {
        type: String
    },
    start_date: {
        type: Date
    },
    end_date: {
        type: Date
    },
    user: {
        type: String,
        required: true
    },
    session: {
        type: String
    }
})
export const Exam = mongoose.model('Exam', ExamSchema)