export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB, isFallbackActive } from '@/lib/db'
import { User } from '@/models/User'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'
import { generateSalt } from '@/lib/crypto'
import { ok, badRequest, serverError } from '@/lib/api'
import { FallbackDB } from '@/lib/fallbackDb'
import { z } from 'zod'

const SignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  religion: z.enum(['hindu', 'muslim', 'christian', 'sikh', 'jain', 'other']),
  dob: z.string(),
  checkInFrequency: z.enum(['weekly', 'fortnightly', 'monthly']).default('weekly'),
  encryptionSalt: z.string().optional(),
  keyCheck: z.string().optional(),
  consentGiven: z.boolean().default(false),
  consentAt: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = SignupSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message)
    }

    const { email, name, phone, password, religion, dob, checkInFrequency, encryptionSalt, keyCheck, consentGiven, consentAt } = parsed.data

    const cleanEmail = email.toLowerCase().trim()

    // Check duplicate in Fallback and Mongo
    if (FallbackDB.findUserByEmail(cleanEmail)) {
      return badRequest('Email already registered')
    }

    if (!isFallbackActive()) {
      try {
        const existing = await User.findOne({ email: cleanEmail })
        if (existing) return badRequest('Email already registered')
      } catch (err) {
        console.warn('MongoDB duplicate check error:', err)
      }
    }

    if (!consentGiven) return badRequest('Consent is required to create an account')

    const passwordHash = await hashPassword(password)
    const saltToStore = encryptionSalt || generateSalt()

    let newUserId = `user-${Date.now()}`

    // Always record in FallbackDB
    const fallbackUser = FallbackDB.createUser({
      email: cleanEmail,
      name,
      phone,
      passwordHash,
      encryptionSalt: saltToStore,
      keyCheck: keyCheck || '',
      religion,
      dob,
      checkInFrequency,
      status: 'active',
    })
    newUserId = fallbackUser.id

    // Also persist to MongoDB if online
    if (!isFallbackActive()) {
      try {
        const mongoUser = await User.create({
          email: cleanEmail,
          name,
          phone,
          passwordHash,
          encryptionSalt: saltToStore,
          keyCheck: keyCheck || '',
          religion,
          dob,
          checkInFrequency,
          lastCheckIn: new Date(),
          missedCount: 0,
          status: 'active',
          consentGiven: true,
          consentAt: consentAt ? new Date(consentAt) : new Date(),
        })
        newUserId = mongoUser._id.toString()
      } catch (err) {
        console.warn('Could not save to MongoDB, stored in local store:', err)
      }
    }

    const token = signToken({
      id: newUserId,
      email: cleanEmail,
      name,
      encryptionSalt: saltToStore,
      keyCheck: keyCheck || '',
      status: 'active',
    })

    setAuthCookie(token)

    return ok({
      user: {
        id: newUserId,
        email: cleanEmail,
        name,
        encryptionSalt: saltToStore,
        status: 'active',
      }
    }, 'Account created successfully')
  } catch (err) {
    console.error('Signup error:', err)
    return serverError(err)
  }
}
