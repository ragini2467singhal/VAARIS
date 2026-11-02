export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, badRequest, serverError } from '@/lib/api'

const MAX_FILE_SIZE = 200 * 1024 * 1024
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm']

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const fileName = typeof body.fileName === 'string' ? body.fileName : ''
    const contentType = typeof body.contentType === 'string' ? body.contentType : ''
    const size = typeof body.size === 'number' ? body.size : 0

    if (!fileName || !contentType) return badRequest('Missing file metadata')
    if (!ALLOWED_TYPES.includes(contentType)) return badRequest('Unsupported file type')
    if (size <= 0 || size > MAX_FILE_SIZE) return badRequest('File too large')

    const accountId = process.env.R2_ACCOUNT_ID
    const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
    const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      return badRequest('R2 is not configured')
    }

    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    })

    const safeName = sanitizeFileName(fileName)
    const key = `messages/${user.id}/${Date.now()}-${safeName}`

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 })
    const fileUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/${key}` : null

    return ok({ uploadUrl, fileUrl, key })
  } catch (err) {
    return serverError(err)
  }
}
