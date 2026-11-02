'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function NomineeLoginPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'token' | 'email'>('email')
  const [token, setToken] = useState('')
  const [nomineeEmail, setNomineeEmail] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (authMode === 'token' && !token.trim()) {
      toast.error('Please enter your unique Nominee Access Token')
      return
    }
    if (authMode === 'email' && (!nomineeEmail.trim() || !ownerEmail.trim())) {
      toast.error('Both Nominee Email and Vault Owner Email are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/nominee/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: authMode === 'token' ? token.trim() : undefined,
          nomineeEmail: authMode === 'email' ? nomineeEmail.trim() : undefined,
          ownerEmail: authMode === 'email' ? ownerEmail.trim() : undefined,
        })
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Authentication failed')

      // Store in session storage for portal state
      sessionStorage.setItem('vaaris_nominee_session', JSON.stringify(json.data))
      toast.success(`Welcome, ${json.data.nominee.name}`)
      router.push('/nominee/portal')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid nominee credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoFill = () => {
    setAuthMode('email')
    setNomineeEmail('nominee@vaaris.in')
    setOwnerEmail('demo@vaaris.in')
    toast.success('Demo Nominee credentials filled')
  }

  return (
    <div className="min-h-screen paper-texture flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 border border-gold/60 rotate-45 flex items-center justify-center bg-paper">
                <div className="w-2 h-2 bg-gold" />
              </div>
              <span className="font-display text-xl text-ink tracking-[0.2em] font-bold">VAARIS</span>
            </Link>
            <Link
              href="/auth/login"
              className="text-xs font-mono text-ink/70 hover:text-gold-dark border border-gold/30 px-3 py-1.5 transition-colors bg-paper"
            >
              Vault Owner Login →
            </Link>
          </div>

          <div className="bg-[#FAF6F0] border border-gold/40 p-8 relative overflow-hidden rounded shadow-md">
            <div className="absolute top-0 right-0 bg-gold/15 text-gold-dark text-[10px] font-mono tracking-widest px-3 py-1 border-b border-l border-gold/30 font-semibold">
              NOMINEE PORTAL
            </div>

            <h1 className="font-display text-2xl text-ink mb-2">Nominee & Executor Portal</h1>
            <p className="text-ink/60 text-xs font-mono mb-6 leading-relaxed">
              Designated nominees can log in here to verify their identity, submit death certificates,
              and initiate Shamir key reconstruction for vault asset distribution.
            </p>

            {/* Auth mode selector */}
            <div className="flex border border-gold/30 mb-6 p-1 bg-paper">
              <button
                type="button"
                onClick={() => setAuthMode('email')}
                className={`flex-1 py-2 text-xs font-mono tracking-wider transition-all ${
                  authMode === 'email'
                    ? 'bg-gold/25 text-ink font-bold border border-gold/40'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                By Emails
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('token')}
                className={`flex-1 py-2 text-xs font-mono tracking-wider transition-all ${
                  authMode === 'token'
                    ? 'bg-gold/25 text-ink font-bold border border-gold/40'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                By Access Token
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {authMode === 'email' ? (
                <>
                  <div>
                    <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-1.5 font-semibold">
                      Your Email (Nominee)
                    </label>
                    <input
                      type="email"
                      value={nomineeEmail}
                      onChange={(e) => setNomineeEmail(e.target.value)}
                      placeholder="nominee@example.com"
                      className="w-full px-4 py-3 bg-paper border border-gold/40 text-ink placeholder-ink/30 text-sm focus:border-gold outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-1.5 font-semibold">
                      Vault Owner Email
                    </label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@example.com"
                      className="w-full px-4 py-3 bg-paper border border-gold/40 text-ink placeholder-ink/30 text-sm focus:border-gold outline-none"
                      required
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-1.5 font-semibold">
                    Nominee Access Token
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="e.g. vaaris-nominee-token-demo-2026"
                    className="w-full px-4 py-3 bg-paper border border-gold/40 text-ink placeholder-ink/30 text-sm focus:border-gold outline-none font-mono"
                    required
                  />
                  <p className="text-[11px] font-mono text-ink/50 mt-1">
                    Provided in your official Vaaris Nominee invitation email/SMS.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold py-3 text-sm font-mono tracking-wider flex items-center justify-center gap-2 mt-6"
              >
                {loading ? 'AUTHENTICATING...' : 'ENTER NOMINEE PORTAL →'}
              </button>

              <div className="pt-4 border-t border-gold/20 flex items-center justify-between text-xs font-mono">
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-gold-dark hover:text-ink font-semibold underline"
                >
                  ⚡ Auto-fill Demo Nominee
                </button>
                <Link href="/auth/login" className="text-ink/60 hover:text-ink">
                  Not a nominee? Log in as owner
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
