import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const transportFeesSchema = new Schema({
    route_name: {
        type: String,
    },
    amount: {
        type: String,
    },
    vehicle_number: {
        type: String,
    },
    session:{
        type:String,
    }
},{
    timestamps: true
})

transportFeesSchema.plugin(mongooseAggregatePaginate);
export const TransportFees = mongoose.model("TransportFees", transportFeesSchema);