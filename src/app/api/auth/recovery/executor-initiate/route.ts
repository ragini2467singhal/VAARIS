import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Executor } from '@/models/Executor'
import { sendRecoveryInitiatedEmail } from '@/lib/email'
import { generateSecureToken } from '@/lib/crypto'

const RECOVERY_WAIT_DAYS = 7

async function initiateRecoveryForUser(userId: string, executorEmail: string) {
  const recoveryToken = generateSecureToken(32)
  const initiatedAt = new Date()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + RECOVERY_WAIT_DAYS)

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        recoveryState: 'pending',
        recoveryToken,
        recoveryInitiatedAt: initiatedAt,
        recoveryMethod: 'user_executor',
        recoveryExpiresAt: expiresAt
      }
    }
  )

  return { recoveryToken, initiatedAt, expiresAt }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { token, executorEmail } = body

    if (!token || !executorEmail) {
      return NextResponse.json(
        { error: 'Executor token and email required' },
        { status: 400 }
      )
    }

    const executor = await Executor.findOne({ 
      uniqueToken: token,
      email: executorEmail.toLowerCase()
    })

    if (!executor) {
      return NextResponse.json(
        { error: 'Invalid executor token' },
        { status: 404 }
      )
    }

    if (executor.status !== 'verified') {
      return NextResponse.json(
        { error: 'Executor not verified' },
        { status: 400 }
      )
    }

    const user = await User.findById(executor.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.recoveryState === 'pending' && user.recoveryExpiresAt && new Date() < user.recoveryExpiresAt) {
      return NextResponse.json(
        { error: 'Recovery already in progress',
          expiresAt: user.recoveryExpiresAt },
        { status: 400 }
      )
    }

    const result = await initiateRecoveryForUser(String(user._id), executorEmail)
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cancelUrl = `${APP_URL}/recovery/cancel?token=${result.recoveryToken}`

    await sendRecoveryInitiatedEmail({
      name: user.name,
      email: user.email,
      recoveryUrl: cancelUrl,
      expiryDays: RECOVERY_WAIT_DAYS
    })

    return NextResponse.json({
      message: 'Recovery initiated',
      expiresAt: result.expiresAt,
      waitingPeriod: RECOVERY_WAIT_DAYS
    })
  } catch (error) {
    console.error('Executor recovery initiation failed:', error)
    return NextResponse.json(
      { error: 'Failed to initiate recovery' },
      { status: 500 }
    )
  }
}