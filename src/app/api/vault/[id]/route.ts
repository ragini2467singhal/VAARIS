export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { VaultItem } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError, badRequest } from '@/lib/api'

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()
    const item = await VaultItem.findOne({ _id: params.id, userId: user.id })
    if (!item) return notFound('Vault item not found')
    return ok(item)
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    const body = await req.json()
    const { title, encryptedData, assignedTo, hasAttachment, attachmentUrl } = body

    const item = await VaultItem.findOneAndUpdate(
      { _id: params.id, userId: user.id },
      { $set: { title, encryptedData, assignedTo, hasAttachment, attachmentUrl } },
      { new: true }
    )

    if (!item) return notFound('Vault item not found')
    return ok(item, 'Item updated')
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    const item = await VaultItem.findOneAndDelete({ _id: params.id, userId: user.id })
    if (!item) return notFound('Vault item not found')

    return ok(null, 'Item deleted from vault')
  } catch (err) {
    return serverError(err)
  }
}
