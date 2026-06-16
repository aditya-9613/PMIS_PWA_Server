import mongoose, { Schema } from "mongoose";

const feeModuleSchema = new Schema({
    student_id: {
        type: String,
        required: true
    },
    session: {
        type: String,
        required: true
    },
    closingBalance: {
        type: String
    },
    penalty: {
        type: String,
    },
    penaltyDescription: {
        type: String
    },
    feeModule: [
        {
            monthName: {
                type: String,
                required: true
            },
            monthCode: {
                type: Number,
                required: true
            },
            compositeFee: {
                type: Number,
                default: 0
            },
            transportFees: {
                type: Number,
                default: 0
            },
            admissionFees: {
                type: Number,
                default: 0   // Only April
            },
            annualCharges: {
                type: Number,
                default: 0   // Only April
            },
            examFees: {
                type: Number,
                default: 0   // Only August & December
            }
        }
    ],
    description: {
        type: String,
        required: true
    },
}, { timestamps: true });

export const FeeModule = mongoose.model("FeeModule", feeModuleSchema);