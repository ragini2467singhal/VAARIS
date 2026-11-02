export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@/models/User'
import { ok, unauthorized, badRequest, serverError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const authUser = getCurrentUser()
    if (!authUser) return unauthorized()

    await connectDB()

    const user = await User.findById(authUser.id).select('subscriptionStatus subscriptionCurrentEnd').lean() as { subscriptionStatus: string; subscriptionCurrentEnd?: Date } | null
    if (!user) return badRequest('User not found')

    const isPremium = user.subscriptionStatus === 'active'

    return ok({
      subscriptionStatus: user.subscriptionStatus,
      isPremium,
      currentEnd: user.subscriptionCurrentEnd,
    })
  } catch (err) {
    return serverError(err)
  }
}
