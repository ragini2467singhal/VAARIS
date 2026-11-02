import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Executor } from '@/models/Executor'
import { TriggerEvent } from '@/models/index'
import { sendTriggerGracePeriodEmail, sendExecutorVerificationEmail } from '@/lib/email'
import { generateSecureToken } from '@/lib/crypto'
import { addDays } from 'date-fns'

const GRACE_PERIOD_DAYS = 7
const INACTIVITY_THRESHOLD_DAYS = 90

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  checkin_failure: 'Missed Check-ins',
  manual_trigger: 'Manual Request',
  inactivity: 'Inactivity'
}

async function initiateTrigger(
  userId: string,
  triggerType: 'checkin_failure' | 'manual_trigger' | 'inactivity',
  source: 'system' | 'family' | 'executor' | 'emergency_contact'
) {
  const now = new Date()
  const gracePeriodEnds = addDays(now, GRACE_PERIOD_DAYS)

  const triggerEvent = await TriggerEvent.create({
    userId,
    triggerType,
    source,
    verificationStep: 'requested',
    stepActivatedAt: now,
    gracePeriodEndsAt: gracePeriodEnds,
    notes: [`Trigger initiated by ${source} at ${now.toISOString()}`]
  })

  await User.updateOne(
    { _id: userId },
    { $set: { status: 'pending_verification', missedCount: 0 } }
  )

  return triggerEvent
}

async function notifyUserOfTrigger(userId: string, triggerEvent: any) {
  const user = await User.findById(userId)
  if (!user) return

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const confirmUrl = `${APP_URL}/dashboard?action=cancel-trigger&token=${triggerEvent._id}`

  await sendTriggerGracePeriodEmail({
    name: user.name,
    email: user.email,
    triggerType: TRIGGER_TYPE_LABELS[triggerEvent.triggerType],
    confirmUrl,
    graceDays: GRACE_PERIOD_DAYS
  })
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const authHeader = request.headers.get('authorization')
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'
    const hasSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isInternal = isVercelCron || hasSecret

    const body = await request.json()
    const { userId, triggerType, source, executorToken } = body

    if (!isInternal && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let targetUserId = userId
    let triggerSource: 'system' | 'family' | 'executor' | 'emergency_contact' = source || 'system'

    if (source === 'executor' && executorToken) {
      const executor = await Executor.findOne({ uniqueToken: executorToken })
      if (!executor) {
        return NextResponse.json({ error: 'Invalid executor token' }, { status: 404 })
      }
      targetUserId = String(executor.userId)
      triggerSource = 'executor'
    }

    const existingTrigger = await TriggerEvent.findOne({
      userId: targetUserId,
      verificationStep: { $nin: ['completed', 'cancelled'] }
    })

    if (existingTrigger) {
      return NextResponse.json({
        error: 'Trigger already in progress',
        status: existingTrigger.verificationStep,
        stepActivatedAt: existingTrigger.stepActivatedAt
      }, { status: 400 })
    }

    const triggerEvent = await initiateTrigger(
      targetUserId,
      triggerType,
      triggerSource
    )

    await notifyUserOfTrigger(targetUserId, triggerEvent)

    return NextResponse.json({
      message: 'Trigger initiated',
      triggerId: triggerEvent._id,
      gracePeriodEnds: triggerEvent.gracePeriodEndsAt,
      verificationStep: 'requested'
    })
  } catch (error) {
    console.error('Trigger initiation failed:', error)
    return NextResponse.json({ error: 'Failed to initiate trigger' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const userId = request.nextUrl.searchParams.get('userId')
    const triggerId = request.nextUrl.searchParams.get('triggerId')

    if (!userId && !triggerId) {
      return NextResponse.json({ error: 'userId or triggerId required' }, { status: 400 })
    }

    const query = triggerId ? { _id: triggerId } : { userId }
    const trigger = await TriggerEvent.findOne(query).sort({ stepActivatedAt: -1 })

    if (!trigger) {
      return NextResponse.json({ error: 'No trigger found' }, { status: 404 })
    }

    return NextResponse.json({
      triggerId: trigger._id,
      triggerType: trigger.triggerType,
      source: trigger.source,
      verificationStep: trigger.verificationStep,
      stepActivatedAt: trigger.stepActivatedAt,
      gracePeriodEndsAt: trigger.gracePeriodEndsAt,
      executorVerifiedAt: trigger.executorVerifiedAt,
      deathCertificateUrl: trigger.deathCertificateUrl,
      finalApprovedAt: trigger.finalApprovedAt,
      completedAt: trigger.completedAt,
      cancelledAt: trigger.cancelledAt
    })
  } catch (error) {
    console.error('Trigger status check failed:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}