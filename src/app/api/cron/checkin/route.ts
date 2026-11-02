export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Executor } from '@/models/Executor'
import { CheckIn, TriggerEvent } from '@/models/index'
import { sendCheckinEmail, sendMissedCheckinEmail, sendEmergencyContactEmail, sendExecutorTriggerEmail } from '@/lib/email'
import { sendCheckInWhatsApp, sendMissedCheckInWhatsApp, sendEmergencyContactWhatsApp, sendExecutorTriggerWhatsApp } from '@/lib/whatsapp'
import { generateSecureToken } from '@/lib/crypto'
import { ok, serverError } from '@/lib/api'
import { subDays, addDays } from 'date-fns'

const GRACE_PERIOD_DAYS = 7
const TRIGGER_THRESHOLD = 3

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const isVercelCron = req.headers.get('x-vercel-cron') === '1'
    const hasSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`
    if (!isVercelCron && !hasSecret) {
      return new Response('Unauthorized', { status: 401 })
    }

    await connectDB()
    const now = new Date()
    const results = { processed: 0, pinged: 0, miss1: 0, miss2: 0, miss3: 0, triggered: 0, errors: 0 }

    const users = await User.find({
      status: 'active',
      $or: [
        { snoozeUntil: { $exists: false } },
        { snoozeUntil: { $lt: now } }
      ]
    }).lean()

    for (const user of users) {
      try {
        results.processed++

        const freq = user.checkInFrequency
        const daysSinceLastCheckIn = Math.floor(
          (now.getTime() - new Date(user.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
        )

        const dueDays = freq === 'weekly' ? 7 : freq === 'fortnightly' ? 14 : 30

        if (daysSinceLastCheckIn < dueDays) continue

        const periodsOverdue = Math.floor(daysSinceLastCheckIn / dueDays)
        const newMissedCount = Math.max(user.missedCount, periodsOverdue)

        await User.updateOne({ _id: user._id }, { $set: { missedCount: newMissedCount } })

        if (newMissedCount === 0) {
          const token = generateSecureToken(32)
          await CheckIn.create({
            userId: user._id,
            token,
            scheduledFor: now,
            missed: false,
          })

          const userData = { name: user.name, phone: user.phone, email: user.email, token }
          await Promise.allSettled([
            sendCheckinEmail(userData),
            sendCheckInWhatsApp(userData),
          ])
          results.pinged++

        } else if (newMissedCount === 1) {
          const token = generateSecureToken(32)
          await CheckIn.create({ userId: user._id, token, scheduledFor: now, missed: true })

          const missData = { name: user.name, phone: user.phone, email: user.email, token, missCount: 1 }
          await Promise.allSettled([
            sendMissedCheckinEmail({ name: user.name, email: user.email, token, missCount: 1 }),
            sendMissedCheckInWhatsApp(missData),
          ])
          results.miss1++

        } else if (newMissedCount === 2) {
          const executors = await Executor.find({ userId: user._id }).lean()
          for (const executor of executors) {
            await Promise.allSettled([
              sendEmergencyContactEmail({
                name: executor.name,
                email: executor.email,
                ownerName: user.name,
                ownerPhone: user.phone,
                appUrl: process.env.NEXT_PUBLIC_APP_URL!,
              }),
              sendEmergencyContactWhatsApp({
                name: executor.name,
                phone: executor.phone,
                ownerName: user.name,
                ownerPhone: user.phone,
              }),
            ])
          }
          results.miss2++

        } else if (newMissedCount >= TRIGGER_THRESHOLD) {
          const existingTrigger = await TriggerEvent.findOne({
            userId: user._id,
            triggerType: 'checkin_failure',
            verificationStep: { $nin: ['completed', 'cancelled'] }
          })

          if (existingTrigger) {
            results.triggered++
            continue
          }

          const gracePeriodEnds = addDays(now, GRACE_PERIOD_DAYS)

          const triggerEvent = await TriggerEvent.create({
            userId: user._id,
            triggerType: 'checkin_failure',
            source: 'system',
            verificationStep: 'requested',
            stepActivatedAt: now,
            gracePeriodEndsAt: gracePeriodEnds,
            notes: [`Check-in trigger: ${newMissedCount} missed check-ins`]
          })

          await User.updateOne(
            { _id: user._id },
            { $set: { status: 'pending_verification' } }
          )

          const executors = await Executor.find({ userId: user._id }).lean()
          if (executors.length) {
            await Executor.updateMany(
              { _id: { $in: executors.map(e => e._id) } },
              { $set: { status: 'notified', notifiedAt: now } }
            )

            for (const executor of executors) {
              await Promise.allSettled([
                sendExecutorTriggerEmail({
                  name: executor.name,
                  email: executor.email,
                  ownerName: user.name,
                  token: executor.uniqueToken,
                }),
                sendExecutorTriggerWhatsApp({
                  name: executor.name,
                  phone: executor.phone,
                  ownerName: user.name,
                  token: executor.uniqueToken,
                }),
              ])
            }
          }
          results.triggered++
        }
      } catch (userErr) {
        console.error(`Error processing user ${user._id}:`, userErr)
        results.errors++
      }
    }

    console.log('Cron check-in results:', results)
    return ok(results, 'Cron job completed')
  } catch (err) {
    return serverError(err)
  }
}