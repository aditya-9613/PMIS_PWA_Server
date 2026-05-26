import mongoose,{Schema} from "mongoose";

const feeStructureSchema = new Schema({
    fee_Amount:{
        type:String
    },
    grade:{
        type:String,
    },
    admissionFees:{
        type:String
    },
    resgistrationFees:{
        type:String
    },
    examFees:{
        type:String
    },
    annualCharges:{
        type:String,
    },
    session:{
        type:String
    }
})

export const FeeStructure = mongoose.model('FeeStructure',feeStructureSchema)