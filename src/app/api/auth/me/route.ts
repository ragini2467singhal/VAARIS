export const dynamic = 'force-dynamic'
import { connectDB, isFallbackActive } from '@/lib/db'
import { User } from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'
import { FallbackDB } from '@/lib/fallbackDb'

export async function GET() {
  try {
    const authUser = getCurrentUser()
    if (!authUser) return unauthorized()

    await connectDB()

    let user: any = null

    if (!isFallbackActive()) {
      try {
        user = await User.findById(authUser.id).select('-passwordHash -serverShare').lean()
      } catch (err) {
        console.warn('MongoDB User.findById error:', err)
      }
    }

    if (!user) {
      const fbUser = FallbackDB.findUserById(authUser.id) || FallbackDB.findUserByEmail(authUser.email)
      if (fbUser) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, serverShare, ...safeUser } = fbUser as any
        user = safeUser
      }
    }

    if (!user) return unauthorized()

    return ok(user)
  } catch (err) {
    return serverError(err)
  }
}
