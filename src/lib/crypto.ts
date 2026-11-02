/**
 * VIRASAT CRYPTO ENGINE
 * Zero-knowledge AES-256-GCM encryption
 * Server NEVER sees plaintext. Ever.
 * All encryption/decryption happens in the browser.
 */

const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 32
const IV_LENGTH = 12
const KEY_LENGTH = 256

// ─── KEY DERIVATION ───────────────────────────────────────────────────────────

/**
 * Derives an AES-256 key from user's master password + salt
 * Uses PBKDF2 with 100k iterations — slow by design
 */
export async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(masterPassword)
  const normalizedSalt = new Uint8Array(salt)

  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: normalizedSalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generates a random salt for a new user
 * Store this salt in DB (it's not secret — needed for key derivation)
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return bufferToBase64(salt)
}

// ─── ENCRYPTION ───────────────────────────────────────────────────────────────

/**
 * Encrypts any string data using AES-256-GCM
 * Returns: base64(iv) + ":" + base64(ciphertext)
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const data = encoder.encode(plaintext)

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    const result = `${bufferToBase64(iv)}:${bufferToBase64(new Uint8Array(ciphertext))}`
    await logCryptoAction({ action: 'encrypt', success: true, metadata: { plaintextLength: plaintext.length } })
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Encryption failed:', error)
    await logCryptoAction({ action: 'encrypt', success: false, errorMessage })
    throw new Error('Failed to encrypt data. Please check your encryption key.')
  }
}

/**
 * Decrypts AES-256-GCM encrypted data
 */
export async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    const [ivBase64, ciphertextBase64] = encryptedData.split(':')

    if (!ivBase64 || !ciphertextBase64) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = base64ToBuffer(ivBase64)
    const ciphertext = base64ToBuffer(ciphertextBase64)
    const normalizedIv = new Uint8Array(iv)
    const normalizedCiphertext = new Uint8Array(ciphertext)
    const decoder = new TextDecoder()

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: normalizedIv },
      key,
      normalizedCiphertext
    )

    await logCryptoAction({ action: 'decrypt', success: true, metadata: { ciphertextLength: ciphertextBase64.length } })
    return decoder.decode(plaintext)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Decryption failed:', error)
    await logCryptoAction({ action: 'decrypt', success: false, errorMessage })
    if (error instanceof Error && error.message.includes('Invalid encrypted data format')) {
      throw error
    }
    throw new Error('Failed to decrypt data. Please check your encryption key or try logging in again.')
  }
}

/**
 * Encrypts a JS object (auto-serializes to JSON)
 */
export async function encryptObject<T>(obj: T, key: CryptoKey): Promise<string> {
  return encrypt(JSON.stringify(obj), key)
}

/**
 * Decrypts and deserializes a JS object
 */
export async function decryptObject<T>(encryptedData: string, key: CryptoKey): Promise<T> {
  const json = await decrypt(encryptedData, key)
  return JSON.parse(json) as T
}

// ─── SESSION KEY MANAGEMENT ───────────────────────────────────────────────────

/**
 * Stores the derived key in sessionStorage (cleared when tab closes)
 * We store the raw key bytes, not the CryptoKey object
 */
export async function storeSessionKey(key: CryptoKey, userId: string): Promise<void> {
  try {
    const exported = await crypto.subtle.exportKey('raw', key)
    const keyBase64 = bufferToBase64(new Uint8Array(exported))
    sessionStorage.setItem(`virasat_key_${userId}`, keyBase64)
    await logCryptoAction({ action: 'session_store', userId, success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to store session key:', error)
    await logCryptoAction({ action: 'session_store', userId, success: false, errorMessage })
    throw new Error('Failed to store encryption key. Please try logging in again.')
  }
}

export async function getSessionKey(userId: string): Promise<CryptoKey | null> {
  const keyBase64 = sessionStorage.getItem(`virasat_key_${userId}`)
  if (!keyBase64) {
    await logCryptoAction({ action: 'session_restore', userId, success: false, errorMessage: 'No key in session' })
    return null
  }

  try {
    const keyBuffer = base64ToBuffer(keyBase64)
    const normalizedKeyBuffer = new Uint8Array(keyBuffer)
    const key = await crypto.subtle.importKey(
      'raw',
      normalizedKeyBuffer,
      { name: 'AES-GCM', length: KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    )
    await logCryptoAction({ action: 'session_restore', userId, success: true })
    return key
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to import session key:', error)
    sessionStorage.removeItem(`virasat_key_${userId}`)
    await logCryptoAction({ action: 'session_restore', userId, success: false, errorMessage })
    return null
  }
}

/**
 * Clears the session key (on logout)
 */
export function clearSessionKey(userId: string): void {
  sessionStorage.removeItem(`virasat_key_${userId}`)
}

// ─── SHARE INTEGRITY HELPERS ──────────────────────────────────────────────────

export async function verifyShareIntegrity(share: string, expectedHash: string): Promise<boolean> {
  const allShares = [share]
  // We verify by checking if share produces valid reconstruction with placeholder shares
  // In practice, hash verification happens during reconstruction
  const hash = await sha256(share)
  return hash === expectedHash
}

export async function verifyMasterPasswordChecksum(masterPassword: string, checksum: string): Promise<boolean> {
  const data = new TextEncoder().encode(masterPassword)
  const computed = await computeChecksum(data)
  return computed === checksum
}

async function computeChecksum(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource)
  const array = new Uint8Array(hash)
  return bufferToBase64(array).slice(0, 16)
}

async function computeShareHash(share1: string, share2: string, share3: string): Promise<string> {
  const combined = `${share1}:${share2}:${share3}`
  const encoded = new TextEncoder().encode(combined)
  const hash = await crypto.subtle.digest('SHA-256', encoded as unknown as BufferSource)
  const array = new Uint8Array(hash)
  return bufferToBase64(array)
}

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded as unknown as BufferSource)
  return bufferToBase64(new Uint8Array(hash))
}

// ─── AUDIT LOGGING HELPERS ─────────────────────────────────────────────────────

export interface CryptoAuditEntry {
  action: 'encrypt' | 'decrypt' | 'key_derivation' | 'share_split' | 'share_reconstruct' | 'session_store' | 'session_restore'
  userId?: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}

const CRYPTO_AUDIT_BATCH: CryptoAuditEntry[] = []
let CRYPTO_AUDIT_TIMER: NodeJS.Timeout | null = null

export async function logCryptoAction(entry: CryptoAuditEntry): Promise<void> {
  const logEntry = {
    ...entry,
    timestamp: new Date(),
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[CRYPTO AUDIT]', logEntry.action, `user:${entry.userId || 'anonymous'}`, logEntry.success ? 'OK' : 'FAILED')
    return
  }

  CRYPTO_AUDIT_BATCH.push(logEntry)

  if (CRYPTO_AUDIT_BATCH.length >= 5) {
    await flushCryptoAudit()
  } else if (!CRYPTO_AUDIT_TIMER) {
    CRYPTO_AUDIT_TIMER = setTimeout(flushCryptoAudit, 3000)
  }
}

async function flushCryptoAudit(): Promise<void> {
  if (CRYPTO_AUDIT_TIMER) {
    clearTimeout(CRYPTO_AUDIT_TIMER)
    CRYPTO_AUDIT_TIMER = null
  }

  if (CRYPTO_AUDIT_BATCH.length === 0) return

  const batch = [...CRYPTO_AUDIT_BATCH]
  CRYPTO_AUDIT_BATCH.length = 0

  try {
    // Import dynamically to avoid circular deps in client-side code
    if (typeof window === 'undefined') {
      const { AuditLog } = await import('@/models/index')
      await AuditLog.insertMany(
        batch.map(e => ({
          action: `crypto_${e.action}`,
          userId: e.userId,
          success: e.success,
          errorMessage: e.errorMessage,
          metadata: e.metadata ? { ...e.metadata, cryptoAction: true } : { cryptoAction: true },
          timestamp: new Date(),
        })),
        { ordered: false }
      )
    }
  } catch (error) {
    console.error('Failed to write crypto audit log:', error)
  }
}

// ─── TOKEN GENERATION ─────────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure random token
 * Used for check-in links, executor links, etc.
 */
export function generateSecureToken(length = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return bufferToBase64(bytes).replace(/[+/=]/g, '').slice(0, length)
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function bufferToBase64(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(buffer)))
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}
