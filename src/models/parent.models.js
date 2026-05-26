import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const ParentSchema = new Schema({
    parent_id: {
        type: String,
        required: true,
        unique: true
    },
    father_name: {
        type: String,
    },
    mother_name: {
        type: String,
    },
    guardian_name: {
        type: String,
    },
    guradian_phone: {
        type: String,
    },
    parent_email: {
        type: String,
    },
    father_qualification:{
        type:String,
    },
    mother_qualification: {
        type: String,
    },
    mother_contact: {
        type: String,
    },
    father_contact: {
        type: String,
    },
    mother_occupation: {
        type: String,
    },
    father_occupation: {
        type: String,
    }
})

ParentSchema.plugin(mongooseAggregatePaginate)

export const Parent = mongoose.model('Parent', ParentSchema)