import { NextResponse } from 'next/server'
import { User, UserDocument } from '@/models/User'
import { connectDB } from '@/lib/db'
import { encryptField, decryptField } from '@/lib/serverCrypto'

export async function POST(request: Request) {
  try {
    await connectDB()

    const migrationSecret = process.env.MIGRATION_SECRET
    const providedSecret = request.headers.get('x-migration-secret')

    if (migrationSecret && providedSecret !== migrationSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: 'ENCRYPTION_KEY not configured' },
        { status: 500 }
      )
    }

    const unencryptedUsers = await User.find({ isDataEncrypted: false })

    if (unencryptedUsers.length === 0) {
      return NextResponse.json({
        message: 'No users need migration',
        migrated: 0
      })
    }

    let migrated = 0
    const errors: string[] = []

    for (const user of unencryptedUsers) {
      try {
        const originalPhone = user.phone
        const originalReligion = user.religion
        const originalDob = user.dob

        const encryptedPhone = encryptField(originalPhone)
        const encryptedReligion = encryptField(originalReligion)
        const encryptedDob = encryptField(originalDob)

        const verifyPhone = decryptField(encryptedPhone)
        const verifyReligion = decryptField(encryptedReligion)
        const verifyDob = decryptField(encryptedDob)

        if (verifyPhone !== originalPhone || verifyReligion !== originalReligion || verifyDob !== originalDob) {
          errors.push(`User ${user._id}: Decryption verification failed`)
          continue
        }

        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              phone: encryptedPhone,
              religion: encryptedReligion,
              dob: encryptedDob,
              isDataEncrypted: true
            }
          }
        )

        migrated++
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`User ${user._id}: ${errorMessage}`)
      }
    }

    return NextResponse.json({
      message: `Migration completed`,
      totalUsers: unencryptedUsers.length,
      migrated,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()

    const stats = await User.aggregate([
      {
        $group: {
          _id: '$isDataEncrypted',
          count: { $sum: 1 }
        }
      }
    ])

    const encrypted = stats.find(s => s._id === true)?.count || 0
    const unencrypted = stats.find(s => s._id === false)?.count || 0

    return NextResponse.json({
      encrypted,
      unencrypted,
      needsMigration: unencrypted > 0
    })
  } catch (error) {
    console.error('Stats query failed:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}