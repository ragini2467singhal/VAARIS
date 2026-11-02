export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { ExecutorRequest, Executor } from '@/models'
import { User } from '@/models/User'
import { ok, serverError, badRequest } from '@/lib/api'
import { sendDeliveryNotificationEmail } from '@/lib/email'

const WAITING_STATUSES = ['verified', 'waiting']

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

    const readyToDeliver = await ExecutorRequest.find({
      status: 'waiting',
      unlockDate: { $lte: now },
    }).lean()

    const results = {
      processed: 0,
      delivered: 0,
      skipped: 0,
      errors: 0,
    }

    for (const request of readyToDeliver) {
      try {
        results.processed++

        const [userDoc, executorDoc] = await Promise.all([
          User.findOne({ _id: request.userId }).lean(),
          ExecutorRequest.findOne({
            userId: request.userId,
            status: { $nin: ['delivered', 'cancelled'] },
          }).lean(),
        ])

        const user = userDoc as any
        const executor = executorDoc as any

        if (!user || !executor) {
          results.skipped++
          continue
        }

        await ExecutorRequest.updateOne(
          { _id: request._id },
          { $set: { status: 'delivered' } }
        )

        await User.updateOne(
          { _id: user._id },
          { $set: { status: 'delivered' } }
        )

        await Promise.allSettled([
          sendDeliveryNotificationEmail({
            name: user.name,
            email: user.email,
            ownerName: user.name,
          }),
        ])

        results.delivered++
      } catch (err) {
        console.error(`Error processing request ${request._id}:`, err)
        results.errors++
      }
    }

    return ok(results, 'Waiting period cron complete')
  } catch (err) {
    return serverError(err)
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    await connectDB()

    const query: any = { status: { $nin: ['delivered', 'cancelled'] } }
    if (userId) query.userId = userId

    const requests = await ExecutorRequest.find(query)
      .sort({ createdAt: -1 })
      .lean()

    const enriched = await Promise.all(
      requests.map(async (req: any) => {
        const [user, executor] = await Promise.all([
          User.findById(req.userId).select('name email').lean(),
          Executor.findById(req.executorId).select('name email').lean(),
        ])

        const userData = (user as any) ? { name: (user as any).name, email: (user as any).email } : null
        const executorData = (executor as any) ? { name: (executor as any).name, email: (executor as any).email } : null

        const daysRemaining = req.unlockDate
          ? Math.max(0, Math.ceil((new Date(req.unlockDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null

        return {
          _id: req._id,
          userId: req.userId,
          executorId: req.executorId,
          status: req.status,
          dateOfDeath: req.dateOfDeath,
          unlockDate: req.unlockDate,
          daysRemaining,
          user: userData,
          executor: executorData,
          createdAt: req.createdAt,
        }
      })
    )

    return ok(enriched)
  } catch (err) {
    return serverError(err)
  }
}
