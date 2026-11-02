export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB, isFallbackActive } from '@/lib/db'
import { Beneficiary } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, created, unauthorized, serverError, badRequest } from '@/lib/api'
import { FallbackDB } from '@/lib/fallbackDb'
import { z } from 'zod'
import crypto from 'crypto'

const BeneficiarySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  relationship: z.string().min(1).max(50),
})

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    if (isFallbackActive()) {
      return ok(FallbackDB.getBeneficiaries(user.id))
    }

    try {
      const beneficiaries = await Beneficiary.find({ userId: user.id }).sort({ createdAt: 1 }).lean()
      return ok(beneficiaries)
    } catch {
      return ok(FallbackDB.getBeneficiaries(user.id))
    }
  } catch (err) {
    return ok([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    const body = await req.json()
    const parsed = BeneficiarySchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const existing = await Beneficiary.findOne({ userId: user.id, email: parsed.data.email })
    if (existing) return badRequest('Beneficiary with this email already exists')

    const deliveryToken = crypto.randomBytes(32).toString('base64url')
    const beneficiary = await Beneficiary.create({ userId: user.id, deliveryToken, ...parsed.data })
    return created(beneficiary, 'Beneficiary added')
  } catch (err) {
    return serverError(err)
  }
}

