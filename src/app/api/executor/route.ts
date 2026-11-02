export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB, isFallbackActive } from '@/lib/db'
import { Executor } from '@/models/Executor'
import { getCurrentUser } from '@/lib/auth'
import { ok, created, unauthorized, serverError, badRequest } from '@/lib/api'
import { sendExecutorWelcomeEmail } from '@/lib/email'
import { generateSecureToken } from '@/lib/crypto'
import { splitSecret } from '@/lib/shamir'
//import { FallbackDB } from '@/lib/fallbackDb'
import { FallbackDB, type FallbackNominee } from '@/lib/fallbackDb'
import { z } from 'zod'
import { User } from '@/models/User'

const ExecutorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  relationship: z.string().min(1),
  role: z.enum(['primary', 'backup']).default('primary'),
  order: z.number().min(0).max(2).optional(),
})

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    let executors: any[] = []

    if (!isFallbackActive()) {
      try {
        executors = await Executor.find({ userId: user.id }).sort({ order: 1, createdAt: 1 }).lean()
      } catch (err) {
        console.warn('MongoDB Executor.find failed:', err)
      }
    }

    if (executors.length === 0) {
      executors = FallbackDB.getNominees(user.id)
    }

    return ok(executors)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser) return unauthorized()
    await connectDB()

    const body = await req.json()
    const parsed = ExecutorSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    // Generate Shamir Nominee Share (2-of-3 scheme)
    const secretSeed = `vaaris-vault-seed-${currentUser.id}-${Date.now()}`
    const shamirShares = splitSecret(secretSeed, 3, 2)
    const nomineeShamirShare = shamirShares[1].share

    const uniqueToken = generateSecureToken(48)
    const order = parsed.data.order ?? 0

    // Save to FallbackDB
    const fallbackNominee = FallbackDB.createNominee({
      userId: currentUser.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      relationship: parsed.data.relationship,
      role: parsed.data.role,
      uniqueToken,
      nomineeShare: nomineeShamirShare,
      executorShare: nomineeShamirShare,
      status: 'pending',
    })

    //let createdRecord = fallbackNominee
    let createdRecord: FallbackNominee = fallbackNominee

    // If MongoDB is available, also create in MongoDB
    if (!isFallbackActive()) {
      try {
        const executor = await Executor.create({
          userId: currentUser.id,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          relationship: parsed.data.relationship,
          role: parsed.data.role,
          order,
          uniqueToken,
          executorShare: nomineeShamirShare,
          status: 'pending',
        })
        createdRecord = {
        ...fallbackNominee,
        _id: executor._id.toString(),
        id: executor._id.toString(),
      }
      } catch (err) {
        console.warn('MongoDB Executor.create error:', err)
      }
    }

    await sendExecutorWelcomeEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      ownerName: currentUser.name,
    }).catch(console.error)

    return created(createdRecord, 'Nominee / Executor added successfully with Shamir Key Share.')
  } catch (err) {
    return serverError(err)
  }
}
