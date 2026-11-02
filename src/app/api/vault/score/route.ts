import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { VaultItem, Beneficiary, Message } from '@/models/index'
import { sendVaultUpdatedConfirmationEmail } from '@/lib/email'
import { addMonths } from 'date-fns'

const ALL_CATEGORIES = [
  'bank_account', 'fd_rd', 'crypto', 'gold', 'insurance', 
  'property', 'password', 'bank_locker', 'other'
]

const STALE_THRESHOLD_MONTHS = 6

interface VaultScore {
  score: number
  totalItems: number
  staleItems: number
  lastUpdated: Date | null
  missingCategories: string[]
}

async function calculateVaultScore(userId: string): Promise<VaultScore> {
  const vaultItems = await VaultItem.find({ userId })
  const messages = await Message.find({ userId, delivered: false })
  const beneficiaries = await Beneficiary.find({ userId })

  const totalItems = vaultItems.length + beneficiaries.length + messages.length
  
  const staleItems = vaultItems.filter(item => {
    if (!item.lastReviewedAt) return true
    const monthsSinceReview = (Date.now() - new Date(item.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    return monthsSinceReview > STALE_THRESHOLD_MONTHS
  }).length

  const vaultCategories = vaultItems.map(item => item.category)
  const missingCategories = ALL_CATEGORIES.filter(cat => !vaultCategories.includes(cat))

  const categoryScore = Math.max(0, 100 - (missingCategories.length * 8))
  const updateScore = staleItems === 0 ? 100 : Math.max(0, 100 - (staleItems * 20))
  const beneficiaryScore = beneficiaries.length > 0 ? 100 : 0
  const messageScore = messages.length > 0 ? 100 : 50

  const score = Math.min(100, Math.round(
    (categoryScore * 0.4) + 
    (updateScore * 0.3) + 
    (beneficiaryScore * 0.15) + 
    (messageScore * 0.15)
  ))

  const lastUpdated = vaultItems.length > 0 
    ? vaultItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].updatedAt
    : null

  return {
    score,
    totalItems,
    staleItems,
    lastUpdated,
    missingCategories
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const score = await calculateVaultScore(userId)

    return NextResponse.json({
      score: score.score,
      totalItems: score.totalItems,
      staleItems: score.staleItems,
      lastUpdated: score.lastUpdated,
      missingCategories: score.missingCategories,
      categories: ALL_CATEGORIES
    })
  } catch (error) {
    console.error('Vault score fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch score' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { userId, itemIds, action, reminderFrequency } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    if (itemIds && Array.isArray(itemIds)) {
      await VaultItem.updateMany(
        { _id: { $in: itemIds } },
        { $set: { lastReviewedAt: new Date(), isStale: false } }
      )
    }

    if (reminderFrequency) {
      await User.updateOne(
        { _id: userId },
        { $set: { reminderFrequency } }
      )
    }

    if (action === 'markReviewed' || itemIds) {
      const now = new Date()
      const nextReviewMonths = reminderFrequency === 'monthly' ? 1 : reminderFrequency === 'quarterly' ? 3 : 6
      
      await User.updateOne(
        { _id: userId },
        { 
          $set: { 
            lastVaultReview: now,
            nextReviewDate: addMonths(now, nextReviewMonths)
          }
        }
      )
    }

    const score = await calculateVaultScore(userId)
    const user = await User.findById(userId)

    await User.updateOne(
      { _id: userId },
      { $set: { vaultScore: score.score } }
    )

    if (user && (action === 'markReviewed')) {
      await sendVaultUpdatedConfirmationEmail({
        name: user.name,
        email: user.email,
        vaultScore: score.score,
        itemsUpdated: itemIds?.length || 0
      }).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      score: score.score,
      totalItems: score.totalItems,
      staleItems: score.staleItems,
      lastUpdated: score.lastUpdated
    })
  } catch (error) {
    console.error('Vault update failed:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}