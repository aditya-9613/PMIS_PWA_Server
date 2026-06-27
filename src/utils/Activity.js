import { Activity } from "../models/activities.model.js"
import { Admin } from "../models/admin.models.js"
import { Teacher } from "../models/teacher.models.js"
import { ApiError } from "./ApiError.js"

export const CreateActivity = async (user_id, type, activityType, description) => {
    try {
        let username = ''
        let name = ''

        if (type === 'admin' || type === 'employee') {
            const userInfo = await Admin.findById(user_id)
            if (!userInfo) throw new ApiError(404, `Admin/Employee not found: ${user_id}`)
            username = userInfo.username
            name = userInfo.name

        } else if (type === 'teacher') {
            const userInfo = await Teacher.findById(user_id)
            if (!userInfo) throw new ApiError(404, `Teacher not found: ${user_id}`)
            username = userInfo.email
            name = userInfo.name
        }

        const activity = await Activity.create({
            username,
            name,
            user_id,
            activityType,
            description,
            activityDate: new Date(),
        })

        return activity

    } catch (error) {
        // Re-throw ApiErrors as-is; wrap unexpected errors as 500
        if (error instanceof ApiError) throw error
        throw new ApiError(500, `Failed to create activity: ${error.message}`)
    }
}