export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { VaultItem, Beneficiary, Message } from '@/models/index'
import { sendVaultReviewReminderEmail } from '@/lib/email'
import { addMonths } from 'date-fns'

const STALE_THRESHOLD_MONTHS = 6
const MIN_ITEMS_FOR_COMPLETE = 5

interface VaultScore {
  score: number
  totalItems: number
  staleItems: number
  lastUpdated: Date | null
  missingCategories: string[]
}

const ALL_CATEGORIES = [
  'bank_account', 'fd_rd', 'crypto', 'gold', 'insurance', 
  'property', 'password', 'bank_locker', 'other'
]

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

async function processUserEngagement(userId: string, frequency: string) {
  const user = await User.findById(userId)
  if (!user || user.status !== 'active') return null
  if (user.reminderFrequency === 'never') return null

  const now = new Date()
  const score = await calculateVaultScore(userId)
  
  const lastReminder = user.lastReminderSent ? new Date(user.lastReminderSent) : null
  const monthsSinceReminder = lastReminder 
    ? (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 999

  const reminderInterval = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 6
  
  if (monthsSinceReminder < reminderInterval) return null

  const nextReviewDate = addMonths(now, reminderInterval)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  await sendVaultReviewReminderEmail({
    name: user.name,
    email: user.email,
    reviewUrl: `${APP_URL}/vault`,
    vaultScore: score.score,
    staleItems: score.staleItems,
    nextReviewDate: nextReviewDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  })

  await User.updateOne(
    { _id: userId },
    { 
      $set: { 
        lastReminderSent: now,
        nextReviewDate,
        vaultScore: score.score
      }
    }
  )

  return {
    userId,
    score: score.score,
    sent: true
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const isVercelCron = req.headers.get('x-vercel-cron') === '1'
    const hasSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`
    if (!isVercelCron && !hasSecret) {
      return new Response('Unauthorized', { status: 401 })
    }

    await connectDB()
    const results = { processed: 0, remindersSent: 0, errors: 0 }

    const users = await User.find({
      status: 'active',
      reminderFrequency: { $ne: 'never' }
    }).lean()

    for (const user of users) {
      try {
        results.processed++
        const result = await processUserEngagement(String(user._id), user.reminderFrequency)
        if (result?.sent) results.remindersSent++
      } catch (userErr) {
        console.error(`Error processing user ${user._id}:`, userErr)
        results.errors++
      }
    }

    console.log('Engagement cron results:', results)
    return new Response(JSON.stringify(results), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Engagement cron failed:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 })
    }

    await connectDB()
    const score = await calculateVaultScore(userId)

    await User.updateOne(
      { _id: userId },
      { $set: { vaultScore: score.score } }
    )

    return new Response(JSON.stringify({
      score: score.score,
      totalItems: score.totalItems,
      staleItems: score.staleItems,
      lastUpdated: score.lastUpdated,
      missingCategories: score.missingCategories
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Vault score calculation failed:', err)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 })
  }
}