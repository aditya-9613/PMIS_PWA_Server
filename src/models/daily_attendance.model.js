import mongoose, { Schema } from "mongoose";

const DailyAttendanceSchema = new Schema({
    student_id: {
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
    session: {
        type: String,
        required: true
    },
    attendance: [{
        date: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            required: true
        }
    }]
},
    {
        timestamps: true
    }
)


export const DailyAttendance = mongoose.model('DailyAttendance', DailyAttendanceSchema)