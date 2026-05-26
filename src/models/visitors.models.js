import mongoose,{Schema} from "mongoose";

const VisitorSchema = new Schema({
    visitors_name:{
        type:String,
    },
    visitors_phone:{
        type:String,
    },
    reason:{
        type:String,
    },
    date:{
        type:Date,
    },
    address:{
        type:String,
    },
    document_no:{
        type:String,
    }
})

export const Visitor = mongoose.model('Visitor',VisitorSchema)