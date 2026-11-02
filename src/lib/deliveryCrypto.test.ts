import { describe, it, expect, beforeEach } from 'vitest'
import { encryptDeliveryText, decryptDeliveryText } from '@/lib/deliveryCrypto'

const SECRET_A = 'delivery-secret-alpha'
const SECRET_B = 'delivery-secret-bravo'

describe('deliveryCrypto.ts (AES-256-GCM delivery text)', () => {
  beforeEach(() => {
    process.env.DELIVERY_SECRET = SECRET_A
  })

  it('encrypts and decrypts a roundtrip correctly', () => {
    const plaintext = 'Your loved one left you this final message.'
    const enc = encryptDeliveryText(plaintext)
    expect(enc).not.toContain(plaintext)
    expect(decryptDeliveryText(enc)).toBe(plaintext)
  })

  it('supports Unicode / Hindi delivery content', () => {
    const plaintext = 'आपका संदेश सुरक्षित है — 🕉️'
    const enc = encryptDeliveryText(plaintext)
    expect(decryptDeliveryText(enc)).toBe(plaintext)
  })

  it('rejects decryption with the wrong secret (GCM auth failure)', () => {
    const enc = encryptDeliveryText('confidential')
    process.env.DELIVERY_SECRET = SECRET_B
    expect(() => decryptDeliveryText(enc)).toThrow()
  })

  it('throws on an invalid payload format', () => {
    expect(() => decryptDeliveryText('not-a-valid-payload')).toThrow(/Invalid delivery payload/)
  })
})
