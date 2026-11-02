export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { connectDB } from '@/lib/db'
import { Beneficiary, Message } from '@/models/index'
import { User } from '@/models/User'
import { ok, notFound, serverError } from '@/lib/api'
import { decryptDeliveryText } from '@/lib/deliveryCrypto'

interface Params { params: { token: string } }
type BeneficiaryLean = {
  _id: { toString: () => string }
  userId: { toString: () => string }
  name: string
  relationship: string
}
type MessageLean = {
  _id: { toString: () => string }
  title: string
  type: 'video' | 'voice' | 'letter'
  deliveredAt?: Date
  deliveryText?: string
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

async function signMediaUrl(key: string): Promise<string | null> {
  const r2 = getR2Client()
  if (!r2) return null

  let objectKey = key
  if (objectKey.startsWith('http')) {
    try {
      objectKey = new URL(objectKey).pathname.replace(/^\/+/, '')
    } catch {
      return null
    }
  }

  const command = new GetObjectCommand({ Bucket: r2.bucket, Key: objectKey })
  return getSignedUrl(r2.client, command, { expiresIn: 600 })
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const token = params.token
    if (!token) return notFound('Invalid link')

    const beneficiary = await Beneficiary.findOne({ deliveryToken: token }).lean<BeneficiaryLean | null>()
    if (!beneficiary) return notFound('Invalid delivery link')

    const owner = await User.findById(beneficiary.userId).select('name').lean<{ name: string } | null>()
    if (!owner) return notFound('Owner not found')

    const messages = await Message.find({
      assignedTo: beneficiary._id,
      delivered: true,
    }).sort({ deliveredAt: -1 }).lean<MessageLean[]>()

    const results = await Promise.all(messages.map(async msg => {
      let text: string | null = null
      let mediaUrl: string | null = null

      if (msg.type === 'letter') {
        if (!msg.deliveryText) {
          text = null
        } else {
          try {
            text = decryptDeliveryText(msg.deliveryText)
          } catch {
            text = null
          }
        }
      }

      if ((msg.type === 'video' || msg.type === 'voice') && msg.encryptedContentUrl) {
        mediaUrl = await signMediaUrl(msg.encryptedContentUrl)
      }

      return {
        id: msg._id.toString(),
        title: msg.title,
        type: msg.type,
        deliveredAt: msg.deliveredAt,
        text,
        mediaUrl,
      }
    }))

    return ok({
      beneficiary: {
        name: beneficiary.name,
        relationship: beneficiary.relationship,
      },
      owner: { name: owner.name },
      messages: results,
    })
  } catch (err) {
    return serverError(err)
  }
}
