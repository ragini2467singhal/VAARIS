export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, Executor, Beneficiary, Message, VaultItem, CheckIn } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'

interface UserData {
  name?: string
  email?: string
  phone?: string
  religion?: string
  dob?: string
  checkInFrequency?: string
  status?: string
  consentGiven?: boolean
  consentAt?: Date
  consentVersion?: string
  createdAt?: Date
  lastCheckIn?: Date
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()

    await connectDB()

    const userData = await User.findById(user.id).select('-passwordHash -serverShare').lean() as UserData | null
    const executors = await Executor.find({ userId: user.id }).lean()
    const beneficiaries = await Beneficiary.find({ userId: user.id }).lean()
    const messages = await Message.find({ userId: user.id }).lean()
    const vaultItems = await VaultItem.find({ userId: user.id }).lean()
    const checkIns = await CheckIn.find({ userId: user.id }).lean()

    const exportData = {
      exportedAt: new Date().toISOString(),
      dataResidency: 'India (MongoDB Atlas recommended)',
      encryptionNote: 'Vault contents are encrypted and cannot be exported in plaintext by the server',
      account: {
        name: userData?.name,
        email: userData?.email,
        phone: userData?.phone,
        religion: userData?.religion,
        dob: userData?.dob,
        checkInFrequency: userData?.checkInFrequency,
        status: userData?.status,
        consentGiven: userData?.consentGiven,
        consentAt: userData?.consentAt,
        createdAt: userData?.createdAt,
        lastCheckIn: userData?.lastCheckIn,
      },
      executors: executors.map((e: any) => ({
        name: e.name,
        email: e.email,
        phone: e.phone,
        relationship: e.relationship,
        status: e.status,
      })),
      beneficiaries: beneficiaries.map((b: any) => ({
        name: b.name,
        email: b.email,
        phone: b.phone,
        relationship: b.relationship,
      })),
      messages: messages.map((m: any) => ({
        title: m.title,
        type: m.type,
        triggerType: m.triggerType,
        triggerDate: m.triggerDate,
        delivered: m.delivered,
        deliveredAt: m.deliveredAt,
        createdAt: m.createdAt,
      })),
      vaultItems: vaultItems.map((v: any) => ({
        category: v.category,
        title: v.title,
        assignedTo: v.assignedTo?.toString(),
        hasAttachment: v.hasAttachment,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      checkIns: checkIns.map((c: any) => ({
        scheduledFor: c.scheduledFor,
        respondedAt: c.respondedAt,
        missed: c.missed,
        createdAt: c.createdAt,
      })),
    }

    await logAuditEvent({
      userId: user.id,
      action: AUDIT_ACTIONS.DATA.EXPORTED,
      metadata: { itemCount: vaultItems.length + messages.length + beneficiaries.length },
      success: true,
    })

    return ok(exportData)
  } catch (err) {
    return serverError(err)
  }
}
