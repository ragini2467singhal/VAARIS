export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, Executor, Beneficiary, Message, VaultItem, CheckIn, TriggerEvent } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, serverError, badRequest } from '@/lib/api'

export async function DELETE(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()

    await connectDB()

    const { deleteAllData } = await req.json().catch(() => ({ deleteAllData: true }))

    if (!deleteAllData) {
      return badRequest('Confirmation required')
    }

    const userId = user.id

    await Promise.all([
      Executor.deleteMany({ userId }),
      Beneficiary.deleteMany({ ownerId: userId }),
      Message.deleteMany({ userId }),
      VaultItem.deleteMany({ userId }),
      CheckIn.deleteMany({ userId }),
      TriggerEvent.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ])

    return ok(null, 'Account and all data deleted successfully')
  } catch (err) {
    console.error('Delete account error:', err)
    return serverError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()

    await connectDB()

    const userData = await User.findById(user.id).select('consentGiven consentAt createdAt').lean() as { consentGiven?: boolean; consentAt?: Date; createdAt?: Date } | null
    if (!userData) return unauthorized()

    return ok({
      consentGiven: userData.consentGiven ?? false,
      consentAt: userData.consentAt,
      memberSince: userData.createdAt,
    })
  } catch (err) {
    return serverError(err)
  }
}