import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'crypto'
import { encryptField, decryptField } from '@/lib/serverCrypto'

const KEY_A = 'a'.repeat(64) // 32 bytes hex
const KEY_B = 'b'.repeat(64) // 32 bytes hex (different)

function setKey(key: string) {
  process.env.ENCRYPTION_KEY = key
}

describe('serverCrypto.ts (AES-256-GCM field encryption)', () => {
  beforeEach(() => {
    setKey(KEY_A)
  })

  it('encrypts and decrypts a phone number', () => {
    const enc = encryptField('+919876543210')
    expect(enc).not.toBe('+919876543210')
    expect(decryptField(enc)).toBe('+919876543210')
  })

  it('encrypts and decrypts a date of birth', () => {
    const dob = '1990-05-15'
    const enc = encryptField(dob)
    expect(decryptField(enc)).toBe(dob)
  })

  it('encrypts and decrypts a religion value', () => {
    const religion = 'Hindu'
    const enc = encryptField(religion)
    expect(decryptField(enc)).toBe(religion)
  })

  it('returns empty/whitespace input unchanged', () => {
    expect(encryptField('')).toBe('')
    expect(encryptField('   ')).toBe('   ')
  })

  it('is idempotent: re-encrypting an encrypted value does not double-encrypt', () => {
    const enc = encryptField('+919876543210')
    expect(encryptField(enc)).toBe(enc)
    expect(decryptField(encryptField(enc))).toBe('+919876543210')
  })

  it('rejects decryption with the wrong key (GCM auth failure)', () => {
    const enc = encryptField('+919876543210')
    setKey(KEY_B)
    expect(() => decryptField(enc)).toThrow()
  })

  it('throws on a malformed key length', () => {
    setKey('tooshort')
    expect(() => encryptField('+919876543210')).toThrow(/32 bytes/)
    // Valid-format payload (correct IV/tag byte lengths) so getServerKey is reached.
    const validFormat = `${crypto.randomBytes(12).toString('base64')}:${crypto
      .randomBytes(8)
      .toString('base64')}:${crypto.randomBytes(16).toString('base64')}`
    expect(() => decryptField(validFormat)).toThrow(/32 bytes/)
  })
})
