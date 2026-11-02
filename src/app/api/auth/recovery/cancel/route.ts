import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { token } = body

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

    if (user.recoveryState !== 'pending') {
      return NextResponse.json(
        { error: 'No pending recovery to cancel' },
        { status: 400 }
      )
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          recoveryState: 'cancelled'
        },
        $unset: {
          recoveryToken: '',
          recoveryInitiatedAt: '',
          recoveryMethod: '',
          recoveryExpiresAt: ''
        }
      }
    )

    return NextResponse.json({
      message: 'Recovery cancelled successfully'
    })
  } catch (error) {
    console.error('Recovery cancel failed:', error)
    return NextResponse.json(
      { error: 'Failed to cancel recovery' },
      { status: 500 }
    )
  }
}