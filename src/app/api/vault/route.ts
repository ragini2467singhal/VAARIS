export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB, isFallbackActive } from '@/lib/db'
import { VaultItem } from '@/models/index'
import { User } from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { ok, created, unauthorized, badRequest, serverError } from '@/lib/api'
import { FallbackDB } from '@/lib/fallbackDb'
import { FREE_ONLY_MODE } from '@/lib/flags'
import { z } from 'zod'

const VaultItemSchema = z.object({
  category: z.enum(['bank_account', 'fd_rd', 'crypto', 'gold', 'insurance', 'property', 'password', 'bank_locker', 'other']),
  title: z.string().min(1).max(200),
  encryptedData: z.string().min(1),  // already encrypted by browser
  assignedTo: z.string().min(1),      // beneficiary id
  hasAttachment: z.boolean().default(false),
  attachmentUrl: z.string().optional(),
})

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()

    await connectDB()

    if (isFallbackActive()) {
      const items = FallbackDB.getVaultItems(user.id)
      return ok(items)
    }

    try {
      const items = await VaultItem.find({ userId: user.id })
        .sort({ createdAt: -1 })
        .lean()
      return ok(items)
    } catch {
      const items = FallbackDB.getVaultItems(user.id)
      return ok(items)
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
    const parsed = VaultItemSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const dbUser = await User.findById(user.id)
      .select('subscriptionStatus')
      .lean<{ subscriptionStatus?: string } | null>()
    const isPro = FREE_ONLY_MODE || dbUser?.subscriptionStatus === 'active'
    if (!isPro) {
      const count = await VaultItem.countDocuments({ userId: user.id })
      if (count >= 5) {
        return badRequest('Free plan limit reached (5 items). Upgrade to add unlimited items.')
      }
    }

    const item = await VaultItem.create({
      userId: user.id,
      ...parsed.data,
    })

    return created(item, 'Item added to vault')
  } catch (err) {
    return serverError(err)
  }
}

