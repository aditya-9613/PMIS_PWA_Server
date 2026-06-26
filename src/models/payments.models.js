import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const paymentSchema = new Schema({
    student_id: {
        type: String,
    },
    receipt_no: {
        type: Number,
    },
    amount: {
        type: String,
    },
    grade: {
        type: String,
    },
    section: {
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
    session: {
        type: String
    },
    user: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'Active'
    },
    dateOBJ: {
        type: Date,
        required: true,
    }
})

paymentSchema.plugin(mongooseAggregatePaginate)
export const Payment = mongoose.model('Payment', paymentSchema)