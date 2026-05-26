import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const routeSchema = new Schema({
    route_name: {
        type: String,
    },
    start_location: {
        type: String,
    },
    end_location: {
        type: String,
    },
    vehicle_number: {
        type: String,
    },
    description: {
        type: String,
    },
    session:{
        type:String
    }
}, {
    timestamps: true
})

routeSchema.plugin(mongooseAggregatePaginate);
export const Route = mongoose.model("Route", routeSchema);