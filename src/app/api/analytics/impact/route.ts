export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, VaultItem, Message, CheckIn, ExecutorRequest } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()

    await connectDB()

    // Get all users (admin only - in hackathon, make this accessible)
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ status: 'active' })
    const verifiedDeceased = await User.countDocuments({ status: 'verified_deceased' })

    // Vault statistics
    const totalVaultItems = await VaultItem.countDocuments()
    const vaultItemsByCategory = await VaultItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    // Message statistics
    const totalMessages = await Message.countDocuments()
    const deliveredMessages = await Message.countDocuments({ delivered: true })

    // Check-in statistics
    const totalCheckIns = await CheckIn.countDocuments()
    const missedCheckIns = await CheckIn.countDocuments({ missed: true })

    // Executor requests
    const totalExecutorRequests = await ExecutorRequest.countDocuments()
    const completedDeliveries = await ExecutorRequest.countDocuments({ status: 'delivered' })

    // Calculate potential value protected (rough estimate)
    const cryptoItems = await VaultItem.find({ category: 'crypto' }).lean()
    const goldItems = await VaultItem.find({ category: 'gold' }).lean()
    const propertyItems = await VaultItem.find({ category: 'property' }).lean()

    // Rough value calculations (in crores)
    const estimatedCryptoValue = cryptoItems.length * 5 // Average ₹5L per crypto holding
    const estimatedGoldValue = goldItems.length * 2 // Average ₹2L per gold holding
    const estimatedPropertyValue = propertyItems.length * 50 // Average ₹5Cr per property

    const totalValueProtected = estimatedCryptoValue + estimatedGoldValue + estimatedPropertyValue

    // Impact metrics
    const familiesProtected = activeUsers
    const inheritanceCasesPrevented = Math.floor(totalUsers * 0.3) // Conservative estimate
    const courtCasesAvoided = Math.floor(inheritanceCasesPrevented * 0.1)

    return ok({
      overview: {
        totalUsers,
        activeUsers,
        verifiedDeceased,
        totalVaultItems,
        totalMessages,
        deliveredMessages,
        totalCheckIns,
        missedCheckIns,
        totalExecutorRequests,
        completedDeliveries,
      },
      categories: vaultItemsByCategory,
      impact: {
        familiesProtected,
        inheritanceCasesPrevented,
        courtCasesAvoided,
        totalValueProtected, // in lakhs
        messagesDelivered: deliveredMessages,
        successfulDeliveries: completedDeliveries,
      },
      engagement: {
        checkInSuccessRate: totalCheckIns > 0 ? ((totalCheckIns - missedCheckIns) / totalCheckIns * 100).toFixed(1) : 0,
        messageDeliveryRate: totalMessages > 0 ? (deliveredMessages / totalMessages * 100).toFixed(1) : 0,
        vaultCompletionRate: totalUsers > 0 ? (totalVaultItems / (totalUsers * 5) * 100).toFixed(1) : 0, // Assuming 5 items per user
      }
    })

  } catch (err) {
    return serverError(err)
  }
}