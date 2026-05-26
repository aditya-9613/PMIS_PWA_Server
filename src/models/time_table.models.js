import mongoose, { Schema } from "mongoose";

const timeTableSchema = new Schema({
    grade: {
        type: String,
        required: true
    },
    subject: {
        type: [String],
        required: true
    },
    dates: {
        type: [String],
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    }
})

export const TimeTable = mongoose.model('TimeTable', timeTableSchema);