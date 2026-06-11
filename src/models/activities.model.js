import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const ActivitySchema = new Schema({
    username: {
        type: String,
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
    },
    activityType: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    activityDate: {
        type: Date,
        required: true,
    }
})


export const Activity = mongoose.model('Activity', ActivitySchema)
mongoose.plugin(mongooseAggregatePaginate)