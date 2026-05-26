import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const specialDiscountSchema = new Schema({
    student_id: {
        type: String,
        required: true
    },
    discount_amount: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    discount_status: {
        type: Boolean,
        default: true
    },
    discount_start_date: {
        type: Date,
    },
    discount_end_date: {
        type: Date,
    },
    note: {
        type: String,
    },
    session: {
        type: String,
    }
}, {
    timestamps: true
})

specialDiscountSchema.plugin(mongooseAggregatePaginate)
export const SpecialDiscount = mongoose.model("SpecialDiscount", specialDiscountSchema)
