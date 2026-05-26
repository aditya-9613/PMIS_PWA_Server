import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const closingBalanceSchema = new Schema({
    student_id: {
        type: String,
        required: true
    },
    closing_balance_date: {
        type: Date,
        required: true
    },
    closing_balance_amount: {
        type: Number,
        required: true
    },
    paid:{
        type:Boolean,
        default:false
    },
    session: {
        type: String,
        required: true
    }
})

closingBalanceSchema.plugin(mongooseAggregatePaginate)
export const ClosingBalance = mongoose.model('ClosingBalance', closingBalanceSchema);