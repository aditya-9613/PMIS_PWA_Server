import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const AdminSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique:true,
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique:true,
    },
    name: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['Admin', 'Employee', 'Teacher']
    },
    userStatus: {
        type: String,
        required: true,
        enum: ['active', 'suspended', 'terminated'],
        default: 'active'
    },
    refreshToken: {
        type: String,
    }
})

AdminSchema.pre("save", async function () {
    if (!this.isModified("password")) return

    this.password = await bcrypt.hash(this.password, 10)

})

AdminSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

AdminSchema.methods.genrateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            name: this.name
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

AdminSchema.methods.genrateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const Admin = mongoose.model('Admin', AdminSchema)