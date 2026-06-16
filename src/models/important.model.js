import mongoose,{Schema} from "mongoose";

const ImportantSchema = new Schema({
    attendanceTime:{
        type: String,
        required: true
    },
    session: {
        type: String,
        required: true
    }
})

export const Important = mongoose.model('Important', ImportantSchema)