import mongoose,{Schema} from "mongoose";


const transportationHistorySchema = new Schema({
    student_id:{
        type:String,
    },
    months:{
        type:[String],
    },
    transport_opted:{
        type:[Boolean],
    },
    amount:{
        type:String
    },
    session:{
        type:String,
    }
});

export const TransportationHistory = mongoose.model('TransportationHistory',transportationHistorySchema)