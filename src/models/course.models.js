import mongoose, { Schema } from "mongoose";

const CourseSchema = new Schema({
    course_id: {
        type: String,
        required: true,
        unique:true,
    },
    subjects: {
        //array of subjects
        type: [String],
        required: true
    },
    grade: {
        type: String,
        required: true
    },
    session: {
        type: String
    }
})

export const Course = mongoose.model('Course', CourseSchema)