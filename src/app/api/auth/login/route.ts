export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB, isFallbackActive } from '@/lib/db'
import { User } from '@/models/User'
import { verifyPassword, signToken, setAuthCookie, hashPassword } from '@/lib/auth'
import { logAuditEvent, getClientInfo, AUDIT_ACTIONS } from '@/lib/audit'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api'
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rateLimit'
import { FallbackDB } from '@/lib/fallbackDb'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const identifier = getRateLimitIdentifier(req)
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AUTH_LOGIN)
    if (!rateLimit.allowed) {
      return unauthorized(`Too many login attempts. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 60000)} minutes.`)
    }

    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) return badRequest('Invalid credentials')

    const { email, password } = parsed.data
    const clientInfo = getClientInfo(req)

    let foundUser: any = null
    let isFromMongo = false

    // Try MongoDB first if connected
    if (!isFallbackActive()) {
      try {
        foundUser = await User.findOne({ email: email.toLowerCase().trim() })
        if (foundUser) isFromMongo = true
      } catch (err) {
        console.warn('MongoDB query error, falling back:', err)
      }
    }

    // Fallback to local storage if not found in MongoDB
    if (!foundUser) {
      const fbUser = FallbackDB.findUserByEmail(email)
      if (fbUser) {
        foundUser = fbUser
      }
    }

    if (!foundUser) {
      // Special check: if this is demo login and not yet initialized
      if (email.toLowerCase().trim() === 'demo@vaaris.in' || email.toLowerCase().trim() === 'demo@virasat.in') {
        const demoHash = await hashPassword('demo123')
        foundUser = FallbackDB.createUser({
          email: email.toLowerCase().trim(),
          name: 'Vaaris Demo User',
          phone: '9876543210',
          passwordHash: demoHash,
        })
      } else {
        await logAuditEvent({
          action: AUDIT_ACTIONS.AUTH.LOGIN_FAILED,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          metadata: { email },
          success: false,
          errorMessage: 'User not found'
        })
        return unauthorized('Invalid email or password')
      }
    }

    const valid = await verifyPassword(password, foundUser.passwordHash)
    if (!valid) {
      await logAuditEvent({
        userId: String(foundUser._id || foundUser.id),
        action: AUDIT_ACTIONS.AUTH.LOGIN_FAILED,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        errorMessage: 'Invalid password'
      })
      return unauthorized('Invalid email or password')
    }

    const userId = (foundUser._id || foundUser.id).toString()

    if (isFromMongo) {
      try {
        await User.updateOne({ _id: foundUser._id }, { $set: { lastSeen: new Date() } })
      } catch {}
    } else {
      FallbackDB.updateUser(userId, { lastCheckIn: new Date().toISOString() })
    }

    const token = signToken({
      id: userId,
      email: foundUser.email,
      name: foundUser.name,
      encryptionSalt: foundUser.encryptionSalt,
      status: foundUser.status || 'active',
    })

    setAuthCookie(token)

    await logAuditEvent({
      userId,
      action: AUDIT_ACTIONS.AUTH.LOGIN_SUCCESS,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    })

    return ok({
      user: {
        id: userId,
        email: foundUser.email,
        name: foundUser.name,
        encryptionSalt: foundUser.encryptionSalt,
        keyCheck: foundUser.keyCheck || '',
        status: foundUser.status || 'active',
      }
    }, 'Logged in successfully')
  } catch (err) {
    console.error('Login error:', err)
    return serverError(err)
  }
}
