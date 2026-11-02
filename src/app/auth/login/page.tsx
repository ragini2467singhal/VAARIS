'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { deriveKey, storeSessionKey, base64ToBuffer, decrypt, encrypt } from '@/lib/crypto'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const KEYCHECK_VALUES = [
    'vaaris-key-check:v2',
    'virasat-key-check:v2',
    'vaaris-key-check:v1',
    'virasat-key-check:v1',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter your email and password')
      return
    }

    const effectiveMaster = masterPassword.trim() || password.trim()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Login failed')

      // Derive encryption key safely without blocking navigation
      try {
        const salt = json.data?.user?.encryptionSalt || 'vaaris-default-salt-2026'
        let saltBuffer: Uint8Array
        try {
          saltBuffer = base64ToBuffer(salt)
        } catch {
          saltBuffer = new TextEncoder().encode(salt)
        }
        const legacySaltBuffer = new TextEncoder().encode(salt)
        const modernKey = await deriveKey(effectiveMaster, saltBuffer)
        const legacyKey = await deriveKey(effectiveMaster, legacySaltBuffer)

        let chosenKey: CryptoKey = modernKey

        if (json.data?.user?.keyCheck && json.data.user.keyCheck.trim() !== '') {
          try {
            const modernCheck = await decrypt(json.data.user.keyCheck, modernKey)
            if (KEYCHECK_VALUES.includes(modernCheck)) {
              chosenKey = modernKey
            }
          } catch {}

          if (!chosenKey) {
            try {
              const legacyCheck = await decrypt(json.data.user.keyCheck, legacyKey)
              if (KEYCHECK_VALUES.includes(legacyCheck)) {
                chosenKey = legacyKey
              }
            } catch {}
          }
        }

        if (json.data?.user?.id) {
          await storeSessionKey(chosenKey, json.data.user.id)
        }
      } catch (cryptoErr) {
        console.warn('Crypto derivation warning:', cryptoErr)
      }

      toast.success('Welcome back to Vaaris.')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemo = () => {
    setEmail('demo@vaaris.in')
    setPassword('demo123')
    setMasterPassword('demomaster123')
    toast.success('Filled demo credentials')
  }

  return (
    <div className="min-h-screen paper-texture flex items-center justify-center p-6 lg:p-8">
      <div className="w-full max-w-md bg-[#FAF6F0] border border-gold/30 p-8 rounded shadow-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-7 h-7 border border-gold/60 rotate-45 flex items-center justify-center bg-paper">
                <div className="w-1.5 h-1.5 bg-gold" />
              </div>
              <span className="font-display text-lg text-ink tracking-[0.2em] font-bold">VAARIS</span>
            </Link>

            <Link
              href="/nominee/login"
              className="text-xs font-mono text-ink/70 hover:text-gold-dark border border-gold/40 px-3 py-1.5 transition-colors bg-paper"
            >
              Nominee Login →
            </Link>
          </div>

          <h1 className="font-display text-3xl text-ink font-normal mb-2">Welcome back.</h1>
          <p className="text-ink/60 font-mono text-xs tracking-wide mb-8">Your digital legacy vault is secured.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-ink/80 mb-1 uppercase tracking-wider font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="virasat-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-ink/80 mb-1 uppercase tracking-wider font-semibold">Account Password *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Login password"
                className="virasat-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-ink/80 mb-1 uppercase tracking-wider font-semibold">
                Master Password <span className="text-ink/40 font-normal lowercase">(optional — defaults to account password)</span>
              </label>
              <input
                type="password"
                value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
                placeholder="Leave blank to use account password"
                className="virasat-input w-full"
              />
              <p className="font-mono text-ink/50 text-[11px] mt-1.5 tracking-wide">
                Used to decrypt your vault locally with zero-knowledge AES-256.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full py-3">
              {loading ? 'Opening vault...' : 'Open My Vault →'}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-mono text-gold-dark hover:text-ink font-semibold underline"
              >
                ⚡ Fill Demo Account
              </button>
              <Link href="/recovery" className="text-xs font-mono text-ink/50 hover:text-gold-dark">
                Forgot password?
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gold/20 flex flex-col gap-3">
            <p className="text-center text-ink/60 text-xs font-mono">
              Don&apos;t have a vault yet?{' '}
              <Link href="/auth/signup" className="text-gold-dark hover:text-ink font-semibold transition-colors underline">
                Create new vault
              </Link>
            </p>

            <Link
              href="/nominee/login"
              className="text-center bg-paper hover:bg-gold/10 border border-gold/30 py-2.5 px-4 text-xs font-mono text-ink transition-colors block font-medium"
            >
              Are you a Nominee or Executor? Click here to access Nominee Portal →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
