import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Executor } from '@/models/Executor'
import { Beneficiary } from '@/models/index'
import { TriggerEvent } from '@/models/index'
import { sendExecutorVerificationEmail, sendDocumentUploadEmail, sendTriggerCompletedEmail } from '@/lib/email'
import { addDays } from 'date-fns'

const GRACE_PERIOD_DAYS = 7

async function advanceToStep(triggerId: string, newStep: string, update: any = {}) {
  const now = new Date()
  await TriggerEvent.updateOne(
    { _id: triggerId },
    {
      $set: {
        verificationStep: newStep,
        stepActivatedAt: now,
        ...update
      },
      $push: {
        notes: `Advanced to ${newStep} at ${now.toISOString()}`
      }
    }
  )
}

async function cancelTrigger(triggerId: string, reason: string) {
  const trigger = await TriggerEvent.findById(triggerId)
  if (!trigger) return null

  await TriggerEvent.updateOne(
    { _id: triggerId },
    {
      $set: {
        verificationStep: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      },
      $push: { notes: `Cancelled: ${reason}` }
    }
  )

  await User.updateOne(
    { _id: trigger.userId },
    { $set: { status: 'active' } }
  )

  return trigger
}

async function completeTrigger(triggerId: string) {
  const trigger = await TriggerEvent.findById(triggerId)
  if (!trigger) return null

  const now = new Date()
  await TriggerEvent.updateOne(
    { _id: triggerId },
    {
      $set: {
        verificationStep: 'completed',
        completedAt: now
      },
      $push: { notes: `Trigger completed at ${now.toISOString()}` }
    }
  )

  await User.updateOne(
    { _id: trigger.userId },
    { $set: { status: 'verified_deceased' } }
  )

  const user = await User.findById(trigger.userId)
  const beneficiaries = await Beneficiary.find({ userId: trigger.userId })

  if (beneficiaries.length > 0 && user) {
    await sendTriggerCompletedEmail(
      beneficiaries.map(b => ({ name: b.name, email: b.email })),
      user.name
    )
  }

  return trigger
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { triggerId, action, executorToken, deathCertificateUrl, dateOfDeath } = body

    if (!triggerId || !action) {
      return NextResponse.json({ error: 'triggerId and action required' }, { status: 400 })
    }

    const trigger = await TriggerEvent.findById(triggerId)
    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    const executor = await Executor.findOne({ userId: trigger.userId })
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    switch (action) {
      case 'cancel_user': {
        await cancelTrigger(triggerId, 'User confirmed alive')
        return NextResponse.json({ message: 'Trigger cancelled', verificationStep: 'cancelled' })
      }

      case 'advance_grace_period': {
        if (trigger.verificationStep !== 'requested') {
          return NextResponse.json({ error: 'Not in correct step' }, { status: 400 })
        }

        const gracePeriodEnds = addDays(new Date(), GRACE_PERIOD_DAYS)
        await advanceToStep(triggerId, 'grace_period', {
          gracePeriodEndsAt: gracePeriodEnds
        })

        return NextResponse.json({
          message: 'Grace period started',
          verificationStep: 'grace_period',
          gracePeriodEnds: gracePeriodEnds
        })
      }

      case 'executor_verify': {
        if (trigger.verificationStep !== 'executor_verification' && trigger.verificationStep !== 'grace_period') {
          return NextResponse.json({ error: 'Not in correct step' }, { status: 400 })
        }

        const { isDeceased } = body
        if (isDeceased === true) {
          await advanceToStep(triggerId, 'document_upload', {
            executorVerifiedAt: new Date()
          })

          if (executor) {
            const uploadUrl = `${APP_URL}/executor/${executor.uniqueToken}/upload?triggerId=${triggerId}`
            await sendDocumentUploadEmail({
              name: executor.name,
              email: executor.email,
              uploadUrl
            })
          }

          return NextResponse.json({
            message: 'Please upload death certificate',
            verificationStep: 'document_upload'
          })
        } else {
          await cancelTrigger(triggerId, 'User verified alive by executor')
          return NextResponse.json({ message: 'User confirmed alive', verificationStep: 'cancelled' })
        }
      }

      case 'upload_document': {
        if (trigger.verificationStep !== 'document_upload') {
          return NextResponse.json({ error: 'Not in correct step' }, { status: 400 })
        }

        await advanceToStep(triggerId, 'final_approval', {
          deathCertificateUrl,
          dateOfDeath,
          documentUploadedAt: new Date()
        })

        return NextResponse.json({
          message: 'Document uploaded, awaiting final approval',
          verificationStep: 'final_approval'
        })
      }

      case 'final_approve': {
        if (trigger.verificationStep !== 'final_approval') {
          return NextResponse.json({ error: 'Not in correct step' }, { status: 400 })
        }

        await advanceToStep(triggerId, 'completed', {
          finalApprovedAt: new Date()
        })

        await completeTrigger(triggerId)

        return NextResponse.json({
          message: 'Trigger completed, vault delivered',
          verificationStep: 'completed'
        })
      }

      case 'cancel': {
        const reason = body.reason || 'Cancelled by executor'
        await cancelTrigger(triggerId, reason)
        return NextResponse.json({ message: 'Trigger cancelled', verificationStep: 'cancelled' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Trigger verification failed:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}