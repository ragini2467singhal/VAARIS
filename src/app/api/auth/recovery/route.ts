import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { sendRecoveryInitiatedEmail, sendRecoveryReadyEmail } from '@/lib/email'
import { generateSecureToken } from '@/lib/crypto'

const RECOVERY_WAIT_DAYS = 7

async function initiateRecovery(userId: string, method: 'user_executor' | 'user_server') {
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
        recoveryMethod: method,
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
    const { email, method, executorEmail } = body

    if (!email || !method) {
      return NextResponse.json(
        { error: 'Email and recovery method required' },
        { status: 400 }
      )
    }

    if (method !== 'user_executor' && method !== 'user_server') {
      return NextResponse.json(
        { error: 'Invalid recovery method' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.serverShare && method === 'user_server') {
      return NextResponse.json(
        { error: 'Server share not stored. Please contact support.' },
        { status: 400 }
      )
    }

    if (user.recoveryState === 'pending' && user.recoveryExpiresAt && new Date() < user.recoveryExpiresAt) {
      return NextResponse.json(
        { error: 'Recovery already in progress', 
        expiresAt: user.recoveryExpiresAt 
      },
      { status: 400 }
    )
    }

    if (method === 'user_executor' && executorEmail) {
      const { Executor } = await import('@/models/Executor')
      const executor = await Executor.findOne({ 
        email: executorEmail.toLowerCase(),
        owner: user._id 
      })
      
      if (!executor) {
        return NextResponse.json(
          { error: 'Executor not found for this user' },
          { status: 400 }
        )
      }
    }

    const result = await initiateRecovery(String(user._id), method)
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
    console.error('Recovery initiation failed:', error)
    return NextResponse.json(
      { error: 'Failed to initiate recovery' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ recoveryToken: token })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      )
    }

    if (user.recoveryState === 'completed') {
      return NextResponse.json({
        state: 'completed'
      })
    }

    if (user.recoveryState === 'cancelled') {
      return NextResponse.json({
        state: 'cancelled'
      })
    }

    if (user.recoveryState === 'pending' && user.recoveryExpiresAt) {
      const now = new Date()
      const isReady = now >= user.recoveryExpiresAt

      return NextResponse.json({
        state: 'pending',
        expiresAt: user.recoveryExpiresAt,
        isReady,
        method: user.recoveryMethod
      })
    }

    return NextResponse.json({
      state: 'none'
    })
  } catch (error) {
    console.error('Recovery status check failed:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}