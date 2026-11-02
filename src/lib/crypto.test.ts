import { describe, it, expect } from 'vitest'
import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  base64ToBuffer,
} from '@/lib/crypto'

// Avoid the module-level audit-log setTimeout keeping the process alive.
;(process.env as Record<string, string>).NODE_ENV = 'development'

const PASSWORD = 'correct-horse-battery-staple'
const WRONG_PASSWORD = 'wrong-password'

async function makeKey(password: string): Promise<CryptoKey> {
  const salt = base64ToBuffer(generateSalt())
  return deriveKey(password, salt)
}

describe('crypto.ts (Web Crypto AES-256-GCM)', () => {
  it('encrypts and decrypts a roundtrip correctly', async () => {
    const key = await makeKey(PASSWORD)
    const plaintext = 'Hello, this is a secret message.'
    const ciphertext = await encrypt(plaintext, key)
    expect(ciphertext).not.toContain(plaintext)
    const decrypted = await decrypt(ciphertext, key)
    expect(decrypted).toBe(plaintext)
  })

  it('rejects decryption with the wrong password', async () => {
    const key = await makeKey(PASSWORD)
    const wrongKey = await makeKey(WRONG_PASSWORD)
    const ciphertext = await encrypt('top secret', key)
    await expect(decrypt(ciphertext, wrongKey)).rejects.toThrow()
  })

  it('rejects tampered ciphertext (GCM auth tag)', async () => {
    const key = await makeKey(PASSWORD)
    const ciphertext = await encrypt('do not tamper', key)
    const [iv, body] = ciphertext.split(':')
    // Flip the last character of the base64 ciphertext to simulate tampering.
    const last = body.slice(-1)
    const flipped = last === 'A' ? 'B' : 'A'
    const tampered = `${iv}:${body.slice(0, -1)}${flipped}`
    await expect(decrypt(tampered, key)).rejects.toThrow()
  })

  it('roundtrips an empty string', async () => {
    const key = await makeKey(PASSWORD)
    const ciphertext = await encrypt('', key)
    const decrypted = await decrypt(ciphertext, key)
    expect(decrypted).toBe('')
  })

  it('roundtrips a large payload', async () => {
    const key = await makeKey(PASSWORD)
    const plaintext = 'x'.repeat(100_000)
    const ciphertext = await encrypt(plaintext, key)
    expect(await decrypt(ciphertext, key)).toBe(plaintext)
  })

  it('roundtrips Unicode / Hindi content', async () => {
    const key = await makeKey(PASSWORD)
    const plaintext = 'नमस्ते भारत! आपकी विरासत सुरक्षित है। 𑴀𑴁 emoji 🕉️'
    const ciphertext = await encrypt(plaintext, key)
    expect(await decrypt(ciphertext, key)).toBe(plaintext)
  })

  it('produces a unique IV for each encryption (no key reuse)', async () => {
    const key = await makeKey(PASSWORD)
    const a = await encrypt('same plaintext', key)
    const b = await encrypt('same plaintext', key)
    const ivA = a.split(':')[0]
    const ivB = b.split(':')[0]
    expect(ivA).not.toBe(ivB)
    expect(await decrypt(a, key)).toBe('same plaintext')
    expect(await decrypt(b, key)).toBe('same plaintext')
  })
})
