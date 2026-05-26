import mongoose,{Schema} from "mongoose";

const AttendanceSchema = new Schema({
    student_id:{
        type:String,
        required:true
    },
    student_name:{
        type:String,
        required:true
    },
    roll_number:{
        type:String,
        required:true
    },
    exam_type:{
        type:String,
        required:true
    },
    grade:{
        type:String,
        required:true
    },
    section:{
        type:String,
        required:true
    },
    total_days:{
        type:String,
        required:true
    },
    present_days:{
        type:String,
        required:true
    },
    percentage:{
        type:String,
        required:true
    },
    session:{
        type:String,
    }
}, {
    timestamps: true
})

export const Attendance = mongoose.model('Attendance',AttendanceSchema)