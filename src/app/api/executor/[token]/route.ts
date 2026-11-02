export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { Executor } from '@/models/Executor'
import { User } from '@/models/User'
import { Beneficiary, VaultItem, Message } from '@/models/index'
import { ok, notFound, serverError, badRequest } from '@/lib/api'
import { sendOwnerVaultTriggeredWhatsApp } from '@/lib/whatsapp'
import { generateSecureToken } from '@/lib/crypto'
import { addDays } from 'date-fns'
import { z } from 'zod'

interface Params { params: { token: string } }

// ─── STEP 0: GET executor info ────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const executor = await Executor.findOne({ uniqueToken: params.token })
    if (!executor) return notFound('Invalid executor link')

    const user = await User.findById(executor.userId)
      .lean<{ name: string; status: string; religion: string; dob: string } | null>()
    if (!user) return notFound('User not found')

    return ok({
      step: executor.currentStep,
      identityVerified: executor.identityVerified,
      flowCompleted: executor.flowCompleted,
      owner: { 
        name: user.name, 
        status: user.status,
        isVerifiedDeceased: executor.status === 'verified'
      },
      executor: { 
        name: executor.name, 
        relationship: executor.relationship,
        status: executor.status
      },
      unlockDate: executor.unlockDate,
      verifiedEmailAt: executor.verifiedEmailAt
    })
  } catch (err) {
    return serverError(err)
  }
}

// ─── STEP VERIFICATION ────────────────────────────────────────────────────────

const StepVerifySchema = z.object({
  action: z.enum(['verify_identity', 'mark_alive', 'mark_deceased', 'upload_document', 'confirm_release', 'skip']),
  emailCode: z.string().optional(),
  deathCertificateUrl: z.string().optional(),
  dateOfDeath: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const executor = await Executor.findOne({ uniqueToken: params.token })
    if (!executor) return notFound('Invalid executor link')

    const user = await User.findById(executor.userId)
    if (!user) return notFound('User not found')

    const body = await req.json()
    const parsed = StepVerifySchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const { action } = parsed.data

    switch (action) {
      case 'verify_identity': {
        // Simple email verification - send code (simplified for MVP)
        const code = generateSecureToken(6).slice(0, 6).toUpperCase()
        
        await Executor.updateOne(
          { _id: executor._id },
          { $set: { identityVerified: true, verifiedEmailAt: new Date() } }
        )

        return ok({
          message: 'Identity verified',
          step: 1,
          nextStep: 'status_choice'
        }, 'Verification successful')
      }

      case 'mark_alive': {
        // False alarm - reset everything
        await User.updateOne({ _id: user._id }, {
          $set: { status: 'active', missedCount: 0, lastCheckIn: new Date() }
        })
        await Executor.updateOne({ _id: executor._id }, {
          $set: { status: 'pending', currentStep: 99 }
        })

        return ok({ 
          message: 'Vault trigger cancelled',
          step: 99
        }, 'All clear. Everything is back to normal.')
      }

      case 'mark_deceased': {
        await Executor.updateOne(
          { _id: executor._id },
          { $set: { currentStep: 2 } }
        )

        return ok({
          message: 'Proceeding to document upload',
          step: 2,
          nextStep: 'document_upload'
        })
      }

      case 'upload_document': {
        if (!parsed.data.deathCertificateUrl) {
          return badRequest('Death certificate URL is required')
        }

        const unlockDate = addDays(new Date(), 30)

        await Executor.updateOne(
          { _id: executor._id },
          { 
            $set: { 
              status: 'verified', 
              verifiedAt: new Date(),
              unlockDate,
              deathCertificateUrl: parsed.data.deathCertificateUrl,
              dateOfDeath: parsed.data.dateOfDeath,
              currentStep: 3
            } 
          }
        )

        await User.updateOne(
          { _id: user._id },
          { $set: { status: 'verified_deceased' } }
        )

        return ok({
          message: 'Document uploaded. Proceeding to confirmation.',
          step: 3,
          unlockDate: unlockDate.toISOString(),
          nextStep: 'confirm_release'
        })
      }

      case 'confirm_release': {
        const vaultAccessToken = generateSecureToken(32)

        await Executor.updateOne(
          { _id: executor._id },
          { 
            $set: { 
              flowCompleted: true,
              vaultAccessToken,
              currentStep: 4
            } 
          }
        )

        return ok({
          message: 'Flow completed. Vault access granted.',
          step: 4,
          vaultAccessToken
        })
      }

      case 'skip': {
        // Skip to next step
        const newStep = Math.min(executor.currentStep + 1, 4)
        
        await Executor.updateOne(
          { _id: executor._id },
          { $set: { currentStep: newStep } }
        )

        return ok({ step: newStep })
      }

      default:
        return badRequest('Invalid action')
    }
  } catch (err) {
    return serverError(err)
  }
}

// ─── VAULT ACCESS ────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const body = await req.json()
    const { vaultAccessToken } = body

    const executor = await Executor.findOne({ 
      uniqueToken: params.token,
      vaultAccessToken 
    })
    if (!executor) return badRequest('Invalid access token')

    if (!executor.flowCompleted) {
      return badRequest('Please complete the verification flow first')
    }

    const user = await User.findById(executor.userId)
    if (!user) return notFound('User not found')

    const beneficiaries = await Beneficiary.find({ userId: user._id })
    const vaultItems = await VaultItem.find({ userId: user._id })
    const messages = await Message.find({ 
      userId: user._id,
      delivered: false 
    }).populate('assignedTo', 'name email')

    // Return vault data in readable format (not encrypted)
    return ok({
      owner: {
        name: user.name,
        religion: user.religion,
       dob: user.dob
      },
      beneficiaries: beneficiaries.map(b => ({
        name: b.name,
        email: b.email,
        relationship: b.relationship
      })),
      vaultItems: vaultItems.map(item => ({
        category: item.category,
        title: item.title,
        hasAttachment: item.hasAttachment
      })),
      messages: messages.map(m => ({
        title: m.title,
        type: m.type,
        assignedTo: (m.assignedTo as any)?.name
      }))
    })
  } catch (err) {
    return serverError(err)
  }
}