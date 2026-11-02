export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, badRequest, serverError } from '@/lib/api'
import { z } from 'zod'

const KeyCheckSchema = z.object({
  keyCheck: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    const authUser = getCurrentUser()
    if (!authUser) return unauthorized()
    await connectDB()

    const body = await req.json()
    const parsed = KeyCheckSchema.safeParse(body)
    if (!parsed.success) return badRequest('Invalid key check')

    await User.updateOne(
      { _id: authUser.id },
      { $set: { keyCheck: parsed.data.keyCheck } }
    )

    return ok(null, 'Key check saved')
  } catch (err) {
    return serverError(err)
  }
}
