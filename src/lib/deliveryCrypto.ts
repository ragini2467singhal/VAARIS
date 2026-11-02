import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getDeliveryKey(): Buffer {
  const secret = process.env.DELIVERY_SECRET
  if (!secret) {
    throw new Error('DELIVERY_SECRET is not configured')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptDeliveryText(plaintext: string): string {
  const key = getDeliveryKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':')
}

export function decryptDeliveryText(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':')
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid delivery payload')
  }
  const key = getDeliveryKey()
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()])
  return plaintext.toString('utf8')
}
