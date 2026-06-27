import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const TeacherSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    gender: {   // M or F
        type: String,
        required: true
    },
    adharNumber: {
        type: String,
        required: true,
        unique: true
    },
    classTeacher: {
        alloted: {
            type: Boolean,
            required: true,
        },
        class: {
            type: String,
        },
    },
    qualification: {
        type: String,
    },
    subjects: [{
        subjectName: {
            type: String,
        },
        classes: {
            type: String,
        }
    }],
    refreshToken: {
        type: String,
    }
}, {
    timestamps: true
})

TeacherSchema.pre("save", async function () {
    if (!this.isModified("password")) return

    this.password = await bcrypt.hash(this.password, 10)

})

TeacherSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

TeacherSchema.methods.genrateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

TeacherSchema.methods.genrateRefreshToken = function () {
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


export const Teacher = mongoose.model('Teacher', TeacherSchema)