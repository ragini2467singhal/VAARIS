export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { connectDB } from '@/lib/db'
import { Message } from '@/models/index'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError, badRequest } from '@/lib/api'

interface Params { params: { id: string } }
type MessageLean = {
  _id: { toString: () => string }
  type: 'video' | 'voice' | 'letter'
  encryptedContentUrl?: string
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined)
  const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  return { client, bucket }
}

function extractObjectKey(value: string): string | null {
  if (!value) return null
  if (value.startsWith('http')) {
    try {
      return new URL(value).pathname.replace(/^\/+/, '')
    } catch {
      return null
    }
  }
  return value
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()

    const msg = await Message.findOne({ _id: params.id, userId: user.id }).lean<MessageLean | null>()
    if (!msg) return notFound()
    if (msg.type !== 'video' && msg.type !== 'voice') return badRequest('Not a media message')
    if (!msg.encryptedContentUrl) return badRequest('No media attached')

    const r2 = getR2Client()
    if (!r2) {
      return badRequest('R2 is not configured')
    }

    const key = extractObjectKey(msg.encryptedContentUrl)
    if (!key) return badRequest('Invalid media URL')

    const command = new GetObjectCommand({ Bucket: r2.bucket, Key: key })
    const url = await getSignedUrl(r2.client, command, { expiresIn: 600 })

    return ok({ url })
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()
    await connectDB()
    const msg = await Message.findOneAndDelete({ _id: params.id, userId: user.id })
    if (!msg) return notFound()

    const key = msg.encryptedContentUrl ? extractObjectKey(msg.encryptedContentUrl) : null
    if (key && (msg.type === 'video' || msg.type === 'voice')) {
      const r2 = getR2Client()
      if (r2) {
        const command = new DeleteObjectCommand({ Bucket: r2.bucket, Key: key })
        await r2.client.send(command).catch(() => {})
      }
    }

    return ok(null, 'Message deleted')
  } catch (err) {
    return serverError(err)
  }
}
