import mongoose, { Schema } from "mongoose";

const scholasticSchema = new Schema({
    student_id: {
        type: String,
        required: true
    },
    grade:{
        type: String,
        required:true
    },
    section:{
        type:String,
        required:true
    },
    roll_number: {
        type: String,
        required: true
    },
    exam_type: {
        type: String,
        required: true
    },
    subjects: {
        type: [String],
        required: true
    },
    marks: {
        type: [String],
        required: true
    },
    session: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

export const Scholastic = mongoose.model('Scholastic', scholasticSchema);