import mongoose, { plugin, Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const penaltySchema = new Schema({
    student_id: {
        type: String
    },
    penalty_date: {
        type: Date
    },
    avail_penalty: {
        type: Boolean,
        default: true
    },
    penalty_amount: {
        type: String,
    },
    description: {
        type: String,
    }

})

penaltySchema.plugin(mongooseAggregatePaginate)
export const Penalty = mongoose.model('Penalty', penaltySchema)