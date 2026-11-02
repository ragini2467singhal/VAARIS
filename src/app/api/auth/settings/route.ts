export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function PUT(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()
    const body = await req.json()
    const allowed = ['checkInFrequency', 'phone', 'name']
    const update: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key]
    }
    await User.updateOne({ _id: user.id }, { $set: update })
    return ok(null, 'Settings updated')
  } catch (err) {
    return serverError(err)
  }
}

