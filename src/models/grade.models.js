import mongoose,{Schema} from "mongoose";

const GradeSchema = new Schema({
    grade_id:{
        type:String,
        required:true
    },
    grade:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    }
}, {
    timestamps: true
})

export const Grade = mongoose.model('Grade',GradeSchema)