export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { DeathCertificate } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, created, unauthorized, serverError, badRequest } from '@/lib/api'
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit'
import { z } from 'zod'

const DeathCertificateSchema = z.object({
  executorId: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  dateOfDeath: z.string().optional(),
  placeOfDeath: z.string().optional(),
  issuingAuthority: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const query: Record<string, any> = { userId: user.id }
    if (status) query.status = status

    const certificates = await DeathCertificate.find(query)
      .sort({ createdAt: -1 })
      .lean()

    return ok(certificates)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    const body = await req.json()
    const parsed = DeathCertificateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.errors[0].message)

    const certificate = await DeathCertificate.create({
      userId: user.id,
      executorId: parsed.data.executorId,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      fileSize: parsed.data.fileSize,
      mimeType: parsed.data.mimeType,
      dateOfDeath: parsed.data.dateOfDeath,
      placeOfDeath: parsed.data.placeOfDeath,
      issuingAuthority: parsed.data.issuingAuthority,
      status: 'pending',
    })

    await logAuditEvent({
      userId: user.id,
      action: AUDIT_ACTIONS.SETTINGS.CHANGED,
      metadata: { action: 'death_certificate_uploaded', certificateId: certificate._id },
      success: true,
    })

    return created(certificate, 'Death certificate uploaded successfully')
  } catch (err) {
    return serverError(err)
  }
}
