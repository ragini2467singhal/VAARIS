export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { User, Executor, Beneficiary, Message, VaultItem } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/api'

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

    const exportData = {
      exportedAt: new Date().toISOString(),
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
        createdAt: m.createdAt,
      })),
      vaultItems: vaultItems.map((v: any) => ({
        category: v.category,
        title: v.title,
        createdAt: v.createdAt,
      })),
    }

    return ok(exportData)
  } catch (err) {
    return serverError(err)
  }
}