export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@/models/User'
import { ok, unauthorized, badRequest, serverError } from '@/lib/api'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const PLANS = {
  free: { name: 'Free', assetLimit: 15, executorLimit: 1, videoMessages: false },
  premium: { name: 'Premium', assetLimit: Infinity, executorLimit: 3, videoMessages: true },
} as const

type PlanId = keyof typeof PLANS

function isPlanId(value: string): value is PlanId {
  return value === 'free' || value === 'premium'
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getCurrentUser()
    if (!authUser) return unauthorized()

    await connectDB()

    const user = await User.findById(authUser.id)
    if (!user) return badRequest('User not found')

    const body = await req.json().catch(() => ({}))
    const planId = typeof body?.planId === 'string' ? body.planId.toLowerCase() : 'premium'

    if (!isPlanId(planId)) {
      return badRequest('Invalid plan')
    }

    const plan = PLANS[planId]

    if (planId === 'premium') {
      const order = await razorpay.orders.create({
        amount: 49900,
        currency: 'INR',
        receipt: `virasat-${user._id}-${Date.now()}`,
        payment_capture: true,
      })

      return ok({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        name: 'Virasat Premium',
        description: '₹499/month',
        prefill: { email: user.email, contact: user.phone },
      })
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { subscriptionStatus: 'free', subscriptionId: null } }
    )

    return ok({ success: true, plan: 'free' })
  } catch (err) {
    console.error('Razorpay order creation failed:', err)
    return serverError(err)
  }
}

