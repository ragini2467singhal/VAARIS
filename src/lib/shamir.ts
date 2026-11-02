/**
 * VAARIS SHAMIR'S SECRET SHARING (SSS) ENGINE
 * Implementation of Shamir's Secret Sharing over Galois Field GF(2^8).
 * Splits a sensitive Vault Key into N shares where any K (threshold)
 * shares can reconstruct the original secret.
 *
 * Default configuration:
 * - Total shares (N): 3
 *   1. User Recovery Share (Stored by owner / PDF recovery kit)
 *   2. Nominee / Executor Share (Assigned to nominee for estate claim)
 *   3. Server Share (Stored securely encrypted in DB)
 * - Threshold (K): 2
 *   Any 2 shares can reconstruct the vault key without exposing the plaintext key to single parties.
 */

const FIELD_SIZE = 256
const EXP = new Uint8Array(FIELD_SIZE * 2)
const LOG = new Uint8Array(FIELD_SIZE)

// Generator 3 generates the complete non-zero field GF(256) with irreducible poly 0x11B
;(function initGF256() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    EXP[i + 255] = x
    LOG[x] = i
    let x2 = x << 1
    if (x2 >= 256) x2 ^= 0x11b
    x = x2 ^ x
  }
  LOG[0] = 0
})()

export function gfAdd(a: number, b: number): number {
  return a ^ b
}

export function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a] + LOG[b]]
}

export function gfDivide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(256)')
  if (a === 0) return 0
  return EXP[(LOG[a] - LOG[b] + 255) % 255]
}

function evaluatePolynomial(coefficients: number[], x: number): number {
  let result = 0
  for (let i = coefficients.length - 1; i >= 0; i--) {
    result = gfAdd(gfMultiply(result, x), coefficients[i])
  }
  return result
}

function getRandomFieldElement(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(1)
    crypto.getRandomValues(arr)
    return arr[0] || 1
  }
  return Math.floor(Math.random() * 255) + 1
}

export interface ShamirShare {
  id: number       // x coordinate (1 to 255)
  share: string    // Hex string of y coordinates
  label?: string   // e.g. "User Share", "Nominee Share", "Server Share"
}

/**
 * Split a UTF-8 or hex secret into N shares with threshold K
 */
export function splitSecret(
  secret: string,
  totalShares: number = 3,
  threshold: number = 2
): ShamirShare[] {
  if (threshold < 2 || threshold > totalShares || totalShares > 255) {
    throw new Error('Invalid Shamir parameters: requires 2 <= threshold <= totalShares <= 255')
  }

  const secretBytes = new TextEncoder().encode(secret)
  const sharesBytes: Uint8Array[] = Array.from({ length: totalShares }, () => new Uint8Array(secretBytes.length))

  for (let b = 0; b < secretBytes.length; b++) {
    const coefficients: number[] = [secretBytes[b]]
    for (let c = 1; c < threshold; c++) {
      coefficients.push(getRandomFieldElement())
    }

    for (let i = 0; i < totalShares; i++) {
      const x = i + 1 // x cannot be 0 (0 is secret)
      sharesBytes[i][b] = evaluatePolynomial(coefficients, x)
    }
  }

  const labels = ['User Recovery Share', 'Nominee Share', 'Server Share']

  return sharesBytes.map((bytes, i) => ({
    id: i + 1,
    share: Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join(''),
    label: labels[i] || `Share ${i + 1}`
  }))
}

/**
 * Reconstruct secret from K or more shares using Lagrange interpolation
 */
export function combineShares(shares: { id: number; share: string }[]): string {
  if (!shares || shares.length < 2) {
    throw new Error('At least 2 shares are required to reconstruct the Vaaris vault key')
  }

  // De-duplicate by share ID
  const uniqueMap = new Map<number, Uint8Array>()
  for (const s of shares) {
    if (!uniqueMap.has(s.id)) {
      const match = s.share.match(/.{1,2}/g)
      if (!match) throw new Error('Invalid share format')
      const bytes = new Uint8Array(match.map(byte => parseInt(byte, 16)))
      uniqueMap.set(s.id, bytes)
    }
  }

  const points = Array.from(uniqueMap.entries()).map(([id, bytes]) => ({ x: id, y: bytes }))
  const length = points[0].y.length

  for (const p of points) {
    if (p.y.length !== length) {
      throw new Error('Incompatible share lengths. Shares must belong to the same split.')
    }
  }

  const secretBytes = new Uint8Array(length)

  for (let b = 0; b < length; b++) {
    let secretByte = 0
    for (let i = 0; i < points.length; i++) {
      let basis = 1
      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          const numerator = points[j].x
          const denominator = gfAdd(points[j].x, points[i].x)
          basis = gfMultiply(basis, gfDivide(numerator, denominator))
        }
      }
      secretByte = gfAdd(secretByte, gfMultiply(points[i].y[b], basis))
    }
    secretBytes[b] = secretByte
  }

  return new TextDecoder().decode(secretBytes)
}

/**
 * High-level helper for Vaaris Vault:
 * Generates User, Nominee, and Server shares for a 2-of-3 threshold.
 */
export function generateVaarisVaultShares(vaultKey: string): {
  userShare: ShamirShare
  nomineeShare: ShamirShare
  serverShare: ShamirShare
} {
  const [userShare, nomineeShare, serverShare] = splitSecret(vaultKey, 3, 2)
  return {
    userShare: { ...userShare, label: 'User Recovery Share (Keep Safe)' },
    nomineeShare: { ...nomineeShare, label: 'Nominee Share (For Nominee Claim)' },
    serverShare: { ...serverShare, label: 'Server Encrypted Share' }
  }
}
