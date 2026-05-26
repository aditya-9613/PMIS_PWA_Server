import mongoose,{Schema} from "mongoose"


const inventoryTransactionSchema = new Schema({
    transaction_id:{
        type: String,
        required: true
    },
    item_id:{
        type: Schema.Types.ObjectId,
        ref: 'InventoryItems',
        required: true
    },
    transaction_type:{
        type: String,
        required: true
    },
    quantity:{
        type: Number,
        required: true
    },
    date:{
        type: Date,
        required: true
    },
    staff_id:{
        type: Schema.Types.ObjectId,
        ref: 'InventoryStaff',
        required: true
    },
    notes:{
        type: String,
        required: true
    }
})

export const InventoryTransaction = mongoose.model("InventoryTransaction", inventoryTransactionSchema)