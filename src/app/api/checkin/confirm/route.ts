export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { CheckIn } from '@/models/index'
import { User } from '@/models/User'
import { ok, notFound, serverError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return notFound('Invalid check-in link')

    const checkIn = await CheckIn.findOne({ token, missed: false })
    if (!checkIn) return notFound('Check-in link is invalid or already used')

    // Mark check-in as responded
    await CheckIn.updateOne(
      { _id: checkIn._id },
      { $set: { respondedAt: new Date(), missed: false } }
    )

    // Reset missed count and clear snooze on user
    await User.updateOne(
      { _id: checkIn.userId },
      { $set: { lastCheckIn: new Date(), missedCount: 0 }, $unset: { snoozeUntil: 1 } }
    )

    return ok({ confirmed: true }, 'Check-in confirmed. Your family is safe.')
  } catch (err) {
    return serverError(err)
  }
}

