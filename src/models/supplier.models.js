import mongoose,{Schema} from "mongoose"


const supplierSchema = new Schema({
    supplier_id:{
        type: String,
        required: true
    },
    supplier_name:{
        type: String,
        required: true
    },
    contact_name:{
        type: String,
        required: true
    },
    phone_number:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    address:{
        type: String,
        required: true
    }
})

export const Supplier = mongoose.model("Supplier", supplierSchema)