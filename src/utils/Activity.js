import { Activity } from "../models/activities.model.js"
import { Admin } from "../models/admin.models.js"
import { Teacher } from "../models/teacher.models.js"

export const CreateActivity = async (user_id, type, activityType, description) => {
    var username = ''
    var name = ''

    if (type === 'admin' || type === 'employee') {
        const userInfo = await Admin.findById(user_id)
        username = userInfo.username
        name = userInfo.name
    } else if (type === 'teacher') {
        const userInfo = await Teacher.findById(user_id)
        username = userInfo.email
        name = userInfo.name
    }
    const fillActivity = Activity.create({
        username,
        name,
        user_id,
        activityType,
        description,
        activityDate: new Date(),
    })

    if (fillActivity._id) {
        return true
    } else {
        return false
    }
}