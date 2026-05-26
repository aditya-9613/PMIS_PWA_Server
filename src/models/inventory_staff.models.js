import mongoose,{Schema} from "mongoose"

const inventoryStaffSchema = new Schema({
    staff_id:{
        type: String,
        required: true
    },
    first_name:{
        type: String,
        required: true
    },
    last_name:{
        type: String,
        required: true
    },
    role:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    phone_number:{
        type: String,
        required: true
    },
})

export const InventoryStaff = mongoose.model("InventoryStaff", inventoryStaffSchema)