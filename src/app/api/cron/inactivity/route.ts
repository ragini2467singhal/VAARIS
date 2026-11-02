export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { TriggerEvent } from '@/models/index'
import { ok, serverError } from '@/lib/api'

const INACTIVITY_THRESHOLD_DAYS = 90

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
    const results = { processed: 0, triggered: 0, errors: 0 }

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

        const daysSinceLastLogin = Math.floor(
          (now.getTime() - new Date(user.lastLogin || user.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceLastLogin < INACTIVITY_THRESHOLD_DAYS) continue

        const existingTrigger = await TriggerEvent.findOne({
          userId: user._id,
          triggerType: 'inactivity',
          verificationStep: { $nin: ['completed', 'cancelled'] }
        })

        if (existingTrigger) continue

        await TriggerEvent.create({
          userId: user._id,
          triggerType: 'inactivity',
          source: 'system',
          verificationStep: 'requested',
          stepActivatedAt: now,
          gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          notes: [`Inactivity trigger: ${daysSinceLastLogin} days since last login`]
        })

        await User.updateOne(
          { _id: user._id },
          { $set: { status: 'pending_verification', inactivityDays: daysSinceLastLogin } }
        )

        results.triggered++
      } catch (userErr) {
        console.error(`Error processing user ${user._id}:`, userErr)
        results.errors++
      }
    }

    console.log('Inactivity cron results:', results)
    return ok(results, 'Inactivity check completed')
  } catch (err) {
    return serverError(err)
  }
}