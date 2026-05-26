import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const discountSchema = new Schema({
    student_id: {
        type: String,
    },
    discount_date: {
        type: [String],
    },
    fees_discount: {
        type: [String],
    },
    transport_discount_date: {
        type: [String],
    },
    transport_discount_amount: {
        type: [String],
    },
    availDiscount: {
        type: [Boolean]
    },
    note: {
        type: [String],
    },
    session: {
        type: String
    }
})

discountSchema.plugin(mongooseAggregatePaginate)
export const Discount = mongoose.model('Discount', discountSchema)