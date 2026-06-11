import { Activity } from "../models/activities.model.js"

export const CreateActivity = async (username, user_id, activityType, description) => {
    const fillActivity = Activity.create({
        username,
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