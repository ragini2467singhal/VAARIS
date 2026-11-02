export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB, isFallbackActive } from '@/lib/db'
import { Message } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, created, unauthorized, serverError, badRequest } from '@/lib/api'
import { FallbackDB } from '@/lib/fallbackDb'
import { z } from 'zod'
import { encryptDeliveryText } from '@/lib/deliveryCrypto'

const MessageSchema = z.object({
  type: z.enum(['video', 'letter', 'voice']),
  title: z.string().min(1).max(200),
  assignedTo: z.string().min(1),
  triggerType: z.enum(['on_death', 'on_date']),
  triggerDate: z.string().optional(),
  encryptedContentUrl: z.string().optional(),
  encryptedText: z.string().optional(),
  deliveryText: z.string().optional(),
})

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    if (isFallbackActive()) {
      return ok(FallbackDB.getMessages(user.id))
    }

    try {
      const messages = await Message.find({ userId: user.id }).sort({ createdAt: -1 }).lean()
      return ok(messages)
    } catch {
      return ok(FallbackDB.getMessages(user.id))
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
    const parsed = MessageSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    if (parsed.data.type === 'letter') {
      if (!parsed.data.encryptedText) return badRequest('Letter content is required')
      if (!parsed.data.deliveryText) return badRequest('Delivery text is required')
    }
    if ((parsed.data.type === 'video' || parsed.data.type === 'voice') && !parsed.data.encryptedContentUrl) {
      return badRequest('Media upload is required')
    }

    if (parsed.data.triggerType === 'on_date' && !parsed.data.triggerDate) {
      return badRequest('Trigger date is required for date-locked messages')
    }

    const deliveryText = parsed.data.deliveryText ? encryptDeliveryText(parsed.data.deliveryText) : undefined

    const message = await Message.create({
      userId: user.id,
      ...parsed.data,
      deliveryText,
      delivered: false,
    })

    return created(message, 'Message saved')
  } catch (err) {
    return serverError(err)
  }
}

