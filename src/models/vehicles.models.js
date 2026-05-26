import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const vehicleSchema = new Schema({
    vehicle_number: {
        type: String,
    },
    vehicle_type: {
        type: String,
    },
    capacity: {
        type: String,
    },
    driver_name: {
        type: String,
    },
    driver_mobile: {
        type: String,
    },
    student_id:{//Array of student ids
      type:[String],
    },
    session:{
        type:String
    },
    status: {
        type: String,
    }
},{
    timestamps: true
})


vehicleSchema.plugin(mongooseAggregatePaginate);
export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
