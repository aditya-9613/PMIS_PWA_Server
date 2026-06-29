import mongoose, { Schema } from "mongoose";


const cancelledSlipSchema = new Schema({
    student_id: {
        type: String,
    },
    receipt_no: {
        type: Number,
    },
    amount: {
        type: String,
    },
    discount: {
        type: String,
    },
    paid_till_month: {
        type: String
    },
    payment_date: {
        type: String
    },
    fees_breakout: {
        type: String,
    },
    payment_method: {
        type: String
    },
    status:{
        type: String,
        default: 'cancelled'
    },
    session: {
        type: String
    },
    user:{
        type:String,
    },
    dateOBJ:{
        type:Date,
        required:true,
    }
})


export const CancelledSlip = mongoose.model('CancelledSlip', cancelledSlipSchema)