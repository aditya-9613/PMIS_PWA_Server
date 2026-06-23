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
        amount: {
            type: Number,
            default: 0
        },
        paid: {
            type: String,
            default: 'Yes',
            enum: ['Yes', 'No']
        }
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
            },
            penalty: {
                type: Number,
                default: 0
            },
            paidStatus: {
                type: Boolean,
                default: false
            }
        }
    ],
    description: {
        type: String,
        default: ' '
    },
}, { timestamps: true });

export const FeeModule = mongoose.model("FeeModule", feeModuleSchema);