export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { ok, badRequest } from '@/lib/api'

function verifyRazorpaySignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return signature === expected
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''

  if (!verifyRazorpaySignature(body, signature)) {
    console.error('Razorpay webhook signature verification failed')
    return badRequest('Invalid signature')
  }

  const event = JSON.parse(body)
  await connectDB()

  try {
    switch (event.event) {
      case 'subscription.activated': {
        const sub = event.payload.subscription
        const userId = sub.user_id

        await User.updateOne(
          { _id: userId },
          { $set: { plan: 'premium', subscriptionStatus: 'active' } }
        )
        break
      }

      case 'subscription.charged': {
        const sub = event.payload.subscription
        const userId = sub.user_id

        await User.updateOne(
          { _id: userId },
          { $set: { subscriptionStatus: 'active' } }
        )
        break
      }

      case 'subscription.paused':
      case 'subscription.pending': {
        const sub = event.payload.subscription
        const userId = sub.user_id

        await User.updateOne(
          { _id: userId },
          { $set: { subscriptionStatus: 'past_due' } }
        )
        break
      }

      case 'subscription.cancelled': {
        const sub = event.payload.subscription
        const userId = sub.user_id

        await User.findOneAndUpdate(
          { razorpayCustomerId: userId },
          { $set: { plan: 'free', subscriptionStatus: 'cancelled' } }
        )
        break
      }

      case 'subscription.completed': {
        const sub = event.payload.subscription
        const userId = sub.user_id

        await User.updateOne(
          { _id: userId },
          { $set: { plan: 'free', subscriptionStatus: 'expired' } }
        )
        break
      }

      case 'payment.failed': {
        const payment = event.payload.payment
        const subId = payment.subscription_id
        if (!subId) break

        await User.updateOne(
          { subscriptionId: subId },
          { $set: { subscriptionStatus: 'past_due' } }
        )
        break
      }

      default:
        break
    }

    return ok({ received: true })
  } catch (err) {
    console.error('Webhook processing failed:', err)
    return badRequest('Webhook processing failed')
  }
}
