import mongoose,{Schema} from "mongoose";

const ExamTypeSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    exam_type_id:{
        type:String,
        required:true
    }
})

export const ExamType = mongoose.model('ExamType',ExamTypeSchema)