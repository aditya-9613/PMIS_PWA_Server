import cron from 'node-cron'
import { Student } from '../models/students.models.js'
import { getCurrentSchoolSession } from './CurrentSession.js'
import { FeeModule } from '../models/feeModule.models.js'
import { Payment } from '../models/payments.models.js'

const MONTHS_SESSION_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]
const PENALTY_STEP = 50

const penaltyController = async () => {
    const session = await getCurrentSchoolSession()

    const fetchAllStudents = await Student.find({
        status: { $in: ['Active', 'Inactive'] },
        session,
    })

    const currentMonth = new Date().getMonth() + 1
    const currentIdx = MONTHS_SESSION_ORDER.indexOf(currentMonth)

    for (const student of fetchAllStudents) {
        const student_id = student.student_id

        const feeModule = await FeeModule.findOne({ student_id, session })
        if (!feeModule) continue

        const paymentDetails = await Payment
            .find({ student_id, session })
            .sort({ dateOBJ: -1 })

        // No payment yet -> nothing is paid, window starts at first session month.
        // lastPaidIdx = -1 makes startIdx = 0 (April).
        let lastPaidIdx = -1

        if (paymentDetails.length > 0) {
            const lastPaidMonth = Number(paymentDetails[0].paid_till_month.split('_')[1])
            lastPaidIdx = MONTHS_SESSION_ORDER.indexOf(lastPaidMonth)
        }

        const startIdx = lastPaidIdx + 1   // month after last paid
        const endIdx = currentIdx - 1      // month before current (current is still running)

        // Nothing overdue: paid up to date, or current is the first unpaid month.
        if (startIdx > endIdx) continue

        // Back-count from the month before current down to the first overdue month.
        // Newest overdue month = 50, next older = 100, and so on.
        let counter = 1
        for (let i = endIdx; i >= startIdx; i--) {
            const monthCode = MONTHS_SESSION_ORDER[i]
            const entry = feeModule.feeModule.find(m => m.monthCode === monthCode)
            if (entry && entry.compositeFee > 0) {
                entry.penalty = counter * PENALTY_STEP
            }
            counter++
        }

        // await feeModule.save()
    }
}

const mountPenalty = async () => {
    cron.schedule('30 1 1 * *', async () => {
        await penaltyController()
    }, {
        timezone: 'Asia/Kolkata',
    });
}

export default mountPenalty