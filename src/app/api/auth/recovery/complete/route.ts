import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { sendRecoveryCompletedEmail } from '@/lib/email'
import { generateSecureToken, generateSalt } from '@/lib/crypto'
import crypto from 'crypto'

const RECOVERY_WAIT_DAYS = 7

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { token, newPasswordHash, userShare } = body

    if (!token || !newPasswordHash) {
      return NextResponse.json(
        { error: 'Token and new password hash required' },
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

    if (user.recoveryState !== 'pending') {
      return NextResponse.json(
        { error: 'No pending recovery for this token' },
        { status: 400 }
      )
    }

    if (!user.recoveryExpiresAt || new Date() < user.recoveryExpiresAt) {
      return NextResponse.json(
        { error: 'Waiting period not yet complete', 
          expiresAt: user.recoveryExpiresAt },
        { status: 400 }
      )
    }

    let serverShare: string
    let userHasRequiredShares = false

    if (user.recoveryMethod === 'user_server') {
      if (!user.serverShare) {
        return NextResponse.json(
          { error: 'Server share not available' },
          { status: 400 }
        )
      }
      serverShare = user.serverShare
      userHasRequiredShares = true
    } else if (user.recoveryMethod === 'user_executor') {
      if (!userShare) {
        return NextResponse.json(
          { needExecutorShare: true },
          { status: 400 }
        )
      }
      serverShare = userShare
      userHasRequiredShares = true
    }

    if (!userHasRequiredShares) {
      return NextResponse.json(
        { error: 'Cannot complete recovery without required shares' },
        { status: 400 }
      )
    }

    const newSalt = generateSalt()
    const newKeyCheck = generateSecureToken(16)
    
    const newServerShares = crypto.getRandomValues(new Uint8Array(32))
    const newServerShare = Buffer.from(newServerShares).toString('base64')

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: newPasswordHash,
          encryptionSalt: newSalt,
          keyCheck: newKeyCheck,
          serverShare: newServerShare,
          recoveryState: 'completed',
          recoveryToken: null
        },
        $unset: {
          recoveryInitiatedAt: '',
          recoveryMethod: '',
          recoveryExpiresAt: ''
        }
      }
    )

    await sendRecoveryCompletedEmail({
      name: user.name,
      email: user.email
    })

    return NextResponse.json({
      message: 'Password reset successfully',
      salt: newSalt,
      keyCheck: newKeyCheck
    })
  } catch (error) {
    console.error('Recovery completion failed:', error)
    return NextResponse.json(
      { error: 'Failed to complete recovery' },
      { status: 500 }
    )
  }
}