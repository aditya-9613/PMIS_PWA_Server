import cron from 'node-cron'
import { asyncHandler } from './asyncHandler.js'

const mountPenalty = asyncHandler(async (req, res) => {
    cron.schedule("* * * * * *", () => {
        console.log(new Date().toString());
    });
})

export default mountPenalty