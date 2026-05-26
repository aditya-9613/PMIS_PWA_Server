import mongoose,{Schema} from "mongoose";

const reminderSchema = new Schema({

    reminder_type:{
        type:String
    },
    reminder_heading:{
        type:String
    },
    reminder_date:{
        type:String
    },
    reminder_description:{
        type:String
    }

})

export const Reminder = mongoose.model('Reminder',reminderSchema)