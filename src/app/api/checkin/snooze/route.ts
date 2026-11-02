export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, serverError, badRequest } from '@/lib/api'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()

    await connectDB()
    const { days } = await req.json()

    if (days === 0) {
      await User.updateOne(
        { _id: user.id },
        { $unset: { snoozeUntil: 1 }, $set: { missedCount: 0 } }
      )
      return ok(null, 'Snooze cancelled - check-ins resumed')
    }

    if (!days || days < 1 || days > 90) return badRequest('Snooze days must be 1-90 or 0 to cancel')

    const snoozeUntil = addDays(new Date(), days)
    await User.updateOne(
      { _id: user.id },
      { $set: { snoozeUntil, missedCount: 0 } }
    )

    return ok({ snoozeUntil }, `Check-ins snoozed for ${days} days`)
  } catch (err) {
    return serverError(err)
  }
}

