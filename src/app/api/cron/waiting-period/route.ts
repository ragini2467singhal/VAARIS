export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Executor, ExecutorRequest, TriggerEvent, Beneficiary } from '@/models/index'
import { User } from '@/models/User'
import { ok, unauthorized, serverError, badRequest } from '@/lib/api'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { sendDeliveryConfirmationEmail, sendDeliveryNotificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const isVercelCron = req.headers.get('x-vercel-cron') === '1'
    const hasSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`
    if (!isVercelCron && !hasSecret) {
      return new Response('Unauthorized', { status: 401 })
    }

    await connectDB()
    const now = new Date()

    const pendingUnlocks = await ExecutorRequest.find({
      status: 'waiting',
      unlockDate: { $lte: now },
    }).limit(50).lean()

    const results = { processed: 0, delivered: 0, skipped: 0, errors: 0 }

    for (const request of pendingUnlocks) {
      try {
        const [user, latestTrigger] = await Promise.all([
          User.findById(request.userId).lean(),
          TriggerEvent.findOne({ userId: request.userId }).sort({ stepActivatedAt: -1 }).lean(),
        ])

        if (!user) { results.skipped++; continue }

        const userDoc = user as any
        await ExecutorRequest.updateOne({ _id: request._id }, { $set: { status: 'delivered' } })
        await User.updateOne({ _id: userDoc._id }, { $set: { status: 'delivered' } })

        await Promise.allSettled([
          sendExecutorDeliveryConfirmationEmail(request.executorId.toString(), userDoc.name).catch(() => {}),
          sendBeneficiaryNotificationEmail(userDoc._id.toString(), userDoc.name).catch(() => {}),
        ])

        results.delivered++
      } catch (err) {
        console.error(`Waiting period deliver error for ${request._id}:`, err)
        results.errors++
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    return serverError(err)
  }
}

async function sendExecutorDeliveryConfirmationEmail(executorId: string, ownerName: string) {
  const executor = await Executor.findById(executorId)
  if (!executor) return
  await sendDeliveryConfirmationEmail({
    name: executor.name,
    email: executor.email,
    ownerName,
  })
}

async function sendBeneficiaryNotificationEmail(userId: string, ownerName: string) {
  const beneficiaries = await Beneficiary.find({ userId }).limit(50).lean()
  for (const beneficiary of beneficiaries) {
    await sendDeliveryNotificationEmail({
      name: beneficiary.name,
      email: beneficiary.email,
      ownerName,
    })
  }
}
