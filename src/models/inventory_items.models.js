import mongoose,{Schema} from "mongoose"

const inventoryItemsSchema = new Schema({
    item_id:{
        type: String,
        required: true
    },
    item_name:{
        type: String,
        required: true
    },
    item_description:{
        type: String,
        required: true
    },
    item_unit_price:{
        type: Number,
        required: true
    },
    item_quantity:{
        type: Number,
        required: true
    },
    item_category:{
        type: String,
        required: true
    },
    supplier_id:{
        type:Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    purchase_date:{
        type: Date,
        required: true
    },
})

export const InventoryItems = mongoose.model("InventoryItems", inventoryItemsSchema)