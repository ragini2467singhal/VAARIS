export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB, isFallbackActive } from '@/lib/db'
import { DeathCertificate, Executor, User } from '@/models/index'
import { FallbackDB } from '@/lib/fallbackDb'
import { ok, badRequest, serverError } from '@/lib/api'
import { verifyGovernmentDeathCertificate } from '@/lib/ocrVerification'
import { z } from 'zod'

const NomineeDeathCertificateSchema = z.object({
  nomineeId: z.string().min(1),
  uniqueToken: z.string().optional(),
  ownerEmail: z.string().optional(),
  dateOfDeath: z.string().min(1),
  registrationNumber: z.string().min(1),
  issuingAuthority: z.string().min(1),
  aadhaarNumber: z.string().optional(),
  fileName: z.string().default('death_certificate.pdf'),
  fileData: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const parsed = NomineeDeathCertificateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const {
      nomineeId,
      uniqueToken,
      ownerEmail,
      dateOfDeath,
      registrationNumber,
      issuingAuthority,
      aadhaarNumber,
      fileName,
      fileData,
      notes,
    } = parsed.data

    let nominee: any = null
    let owner: any = null

    // Locate nominee and owner
    if (uniqueToken) {
      if (!isFallbackActive()) {
        try {
          nominee = await Executor.findOne({ uniqueToken }).lean()
          if (nominee) {
            owner = await User.findById(nominee.userId).lean()
          }
        } catch {}
      }
      if (!nominee) {
        nominee = FallbackDB.findNomineeByToken(uniqueToken)
        if (nominee) owner = FallbackDB.findUserById(nominee.userId)
      }
    }

    if (!nominee && nomineeId) {
      if (!isFallbackActive()) {
        try {
          nominee = await Executor.findById(nomineeId).lean()
          if (nominee) owner = await User.findById(nominee.userId).lean()
        } catch {}
      }
      if (!nominee) {
        nominee = FallbackDB.getNominees().find(n => n.id === nomineeId || n._id === nomineeId)
        if (nominee) owner = FallbackDB.findUserById(nominee.userId)
      }
    }

    const userId = owner ? (owner._id || owner.id).toString() : 'vaaris-demo-user-1'
    const execId = nominee ? (nominee._id || nominee.id).toString() : nomineeId
    const ownerName = owner ? owner.name : 'Vaaris Vault Owner'

    // Run Automated OCR & Govt CRS Verification + Aadhaar Cross-Verification
    const ocrResult = await verifyGovernmentDeathCertificate({
      fileName,
      fileData,
      inputRegistrationNumber: registrationNumber,
      inputDateOfDeath: dateOfDeath,
      inputAuthority: issuingAuthority,
      ownerName,
      aadhaarNumber: aadhaarNumber || undefined,
    })

    const finalStatus = ocrResult.verified ? 'verified' : 'pending'

    // Persist in FallbackDB
    const fallbackCert = FallbackDB.createDeathCertificate({
      userId,
      executorId: execId,
      fileName,
      fileUrl: fileData || '/uploads/death_certificates/sample_certificate.pdf',
      fileSize: 204800,
      mimeType: 'application/pdf',
      dateOfDeath,
      registrationNumber,
      issuingAuthority,
      status: finalStatus,
    })

    // Update Nominee & Owner status in FallbackDB
    FallbackDB.updateNominee(execId, {
      status: finalStatus === 'verified' ? 'verified' : 'awaiting_verification',
      dateOfDeath,
      deathCertificateUrl: fileData || '/uploads/death_certificates/sample_certificate.pdf'
    })
    FallbackDB.updateUser(userId, { status: 'pending_verification' })

    // Also persist in MongoDB if online
    if (!isFallbackActive()) {
      try {
        await DeathCertificate.create({
          userId,
          executorId: execId,
          fileName,
          fileUrl: fileData || '/uploads/death_certificates/sample_certificate.pdf',
          fileSize: 204800,
          mimeType: 'application/pdf',
          ocrText: ocrResult.extractedText,
          ocrConfidence: ocrResult.ocrConfidence,
          dateOfDeath,
          registrationNumber,
          issuingAuthority,
          deceasedName: ownerName,
          status: finalStatus,
          reviewedAt: new Date(),
          reviewedBy: 'Central Civil Registration System (crsorgi.gov.in) OCR Engine',
          verificationNotes: ocrResult.remarks,
        })

        await Executor.updateOne(
          { _id: execId },
          {
            $set: {
              status: finalStatus === 'verified' ? 'verified' : 'awaiting_verification',
              dateOfDeath,
              deathCertificateUrl: fileData || '/uploads/death_certificates/sample_certificate.pdf',
              verifiedAt: new Date()
            }
          }
        )

        await User.updateOne(
          { _id: userId },
          { $set: { status: 'pending_verification' } }
        )
      } catch (err) {
        console.warn('MongoDB save death certificate warning:', err)
      }
    }

    return ok({
      certificateId: fallbackCert.id,
      status: finalStatus,
      ocrResult,
      message: ocrResult.verified
        ? 'Death certificate automatically verified via Civil Registration System (crsorgi.gov.in) OCR.'
        : 'Death certificate submitted for secondary verification.'
    }, 'Death certificate processed and verified')
  } catch (err) {
    console.error('Submit death certificate error:', err)
    return serverError(err)
  }
}
