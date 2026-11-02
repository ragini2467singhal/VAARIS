export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, VaultItem, Message, CheckIn, ExecutorRequest, Beneficiary, Executor } from '@/models/index'
import { hashPassword } from '@/lib/auth'
import { ok, serverError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    // Only allow in development/demo mode
    if (process.env.NODE_ENV === 'production' && !process.env.DEMO_MODE) {
      return new Response('Not available in production', { status: 403 })
    }

    await connectDB()

    // Clear existing demo data
    await Promise.all([
      User.deleteMany({ email: { $regex: 'demo@' } }),
      VaultItem.deleteMany({}),
      Message.deleteMany({}),
      CheckIn.deleteMany({}),
      ExecutorRequest.deleteMany({}),
      Beneficiary.deleteMany({}),
      Executor.deleteMany({}),
    ])

    // Create demo users
    const demoUsers = []
    for (let i = 1; i <= 50; i++) {
      const user = await User.create({
        email: `demo${i}@virasat.in`,
        name: `Demo User ${i}`,
        phone: `98765432${String(i).padStart(2, '0')}`,
        religion: ['hindu', 'muslim', 'christian', 'sikh'][Math.floor(Math.random() * 4)],
        dob: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        password: await hashPassword('demo123'),
        encryptionSalt: `salt${i}`,
        keyCheck: `check${i}`,
        serverShare: `share${i}`,
        checkInFrequency: ['weekly', 'fortnightly', 'monthly'][Math.floor(Math.random() * 3)],
        lastCheckIn: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        missedCount: Math.floor(Math.random() * 3),
        status: Math.random() > 0.1 ? 'active' : 'verified_deceased',
        subscriptionStatus: Math.random() > 0.7 ? 'active' : null,
      })
      demoUsers.push(user)
    }

    // Create vault items
    const categories = ['bank_account', 'fd_rd', 'crypto', 'gold', 'insurance', 'property', 'password', 'bank_locker']
    for (const user of demoUsers) {
      const itemCount = Math.floor(Math.random() * 8) + 1 // 1-8 items per user
      for (let j = 0; j < itemCount; j++) {
        await VaultItem.create({
          userId: user._id,
          category: categories[Math.floor(Math.random() * categories.length)],
          title: `Demo Asset ${j + 1}`,
          encryptedData: 'demo_encrypted_data',
          assignedTo: user._id, // Simplified - in real app this would be beneficiary ID
          hasAttachment: Math.random() > 0.8,
          attachmentUrl: Math.random() > 0.8 ? 'demo_url' : null,
        })
      }
    }

    // Create messages
    for (const user of demoUsers) {
      const messageCount = Math.floor(Math.random() * 3) + 1 // 1-3 messages per user
      for (let j = 0; j < messageCount; j++) {
        await Message.create({
          userId: user._id,
          type: ['video', 'letter', 'voice'][Math.floor(Math.random() * 3)],
          title: `Demo Message ${j + 1}`,
          assignedTo: user._id,
          triggerType: Math.random() > 0.5 ? 'on_death' : 'on_date',
          triggerDate: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000) : null,
          encryptedContentUrl: Math.random() > 0.5 ? 'demo_content_url' : null,
          encryptedText: 'demo_encrypted_text',
          deliveryText: 'demo_delivery_text',
          delivered: Math.random() > 0.7,
          deliveredAt: Math.random() > 0.7 ? new Date() : null,
        })
      }
    }

    // Create check-ins
    for (const user of demoUsers) {
      const checkInCount = Math.floor(Math.random() * 20) + 5 // 5-25 check-ins per user
      for (let j = 0; j < checkInCount; j++) {
        await CheckIn.create({
          userId: user._id,
          token: `token${user._id}${j}`,
          scheduledFor: new Date(Date.now() - j * 7 * 24 * 60 * 60 * 1000),
          respondedAt: Math.random() > 0.2 ? new Date(Date.now() - j * 7 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 24 * 60 * 60 * 1000)) : null,
          missed: Math.random() > 0.8,
        })
      }
    }

    // Create executor requests for some users
    const deceasedUsers = demoUsers.filter(u => u.status === 'verified_deceased')
    for (const user of deceasedUsers) {
      await ExecutorRequest.create({
        userId: user._id,
        executorId: user._id, // Simplified
        initiatedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        deathCertificateUrl: 'demo_death_cert.pdf',
        dateOfDeath: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        verifiedAt: new Date(),
        unlockDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'delivered',
        cancellationReason: null,
      })
    }

    return ok({
      message: 'Demo data populated successfully',
      stats: {
        users: demoUsers.length,
        vaultItems: await VaultItem.countDocuments(),
        messages: await Message.countDocuments(),
        checkIns: await CheckIn.countDocuments(),
        executorRequests: await ExecutorRequest.countDocuments(),
      }
    })

  } catch (err) {
    return serverError(err)
  }
}