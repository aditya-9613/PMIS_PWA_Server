import mongoose, { Schema } from "mongoose";

const currentSessionSchema = new Schema({
    session: {
        type: String,
        required: true
    }
})

export const CurrentSession = mongoose.model('CurrentSession', currentSessionSchema);