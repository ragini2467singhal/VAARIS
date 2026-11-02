export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { Beneficiary, Message, VaultItem } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError, badRequest } from '@/lib/api'

interface Params { params: { id: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    const [hasMessages, hasVaultItems] = await Promise.all([
      Message.exists({ assignedTo: params.id, userId: user.id }),
      VaultItem.exists({ assignedTo: params.id, userId: user.id }),
    ])

    if (hasMessages || hasVaultItems) {
      return badRequest('Beneficiary is assigned to messages or vault items. Reassign before deleting.')
    }

    const b = await Beneficiary.findOneAndDelete({ _id: params.id, userId: user.id })
    if (!b) return notFound()
    return ok(null, 'Beneficiary removed')
  } catch (err) {
    return serverError(err)
  }
}
