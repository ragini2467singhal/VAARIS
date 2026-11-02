'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface RecoveryStatus {
  state: 'none' | 'pending' | 'completed' | 'cancelled'
  expiresAt?: string
  isReady?: boolean
  method?: string
}

function RecoveryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [step, setStep] = useState<'initiate' | 'waiting' | 'complete'>('initiate')
  const [email, setEmail] = useState('')
  const [method, setMethod] = useState<'user_executor' | 'user_server'>('user_executor')
  const [executorEmail, setExecutorEmail] = useState('')
  const [userShare, setUserShare] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<RecoveryStatus | null>(null)

  useEffect(() => {
    if (token) {
      checkStatus()
    }
  }, [token])

  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/auth/recovery?token=${token}`)
      const json = await res.json()
      setStatus(json)

      if (json.state === 'pending') {
        setStep(json.isReady ? 'complete' : 'waiting')
      } else if (json.state === 'completed') {
        router.push('/auth/login?message=recovery_complete')
      }
    } catch (error) {
      console.error('Status check failed:', error)
    }
  }

  const initiateRecovery = async () => {
    if (!email) {
      toast.error('Email required')
      return
    }

    if (method === 'user_executor' && !executorEmail) {
      toast.error('Executor email required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method, executorEmail })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast.success('Recovery initiated! Check your email.')
      if (json.recoveryToken) {
        router.push(`/recovery?token=${json.recoveryToken}`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate recovery')
    } finally {
      setLoading(false)
    }
  }

  const cancelRecovery = async () => {
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/recovery/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast.success('Recovery cancelled')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel')
    } finally {
      setLoading(false)
    }
  }

  const completeRecovery = async () => {
    if (!token || !newPassword) {
      toast.error('New password required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/recovery/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPasswordHash: newPassword,
          userShare: userShare || undefined
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast.success('Password reset! Login with your new password.')
      router.push('/auth/login?message=recovery_complete')
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete recovery')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'initiate') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper paper-texture">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl text-[#C9A84C] font-bold tracking-widest">VIRASAT</h1>
            <p className="text-[#8BA5BC] mt-2 tracking-wide">PASSWORD RECOVERY</p>
          </div>

          <div className="bg-[#1B2F45] p-6 border border-[#C9A84C]/30">
            <div className="bg-ember/20 border border-ember/40 p-4 mb-6">
              <p className="text-ember/90 font-bold text-sm mb-2">⚠️ IMPORTANT — NOT LEGAL ADVICE</p>
              <p className="text-gray-300 text-sm">
                Virasat is a secure storage and delivery tool only. It does NOT replace a legal Will,
                Trust, or court-mandated succession process. Recovering access to your vault does NOT
                transfer legal ownership of assets. Your beneficiaries must still follow standard legal
                procedures. Consult a qualified lawyer for estate planning.
              </p>
            </div>

            <p className="text-gray-300 mb-6 text-center">
              Recover your vault using your saved shares. This requires a 7-day waiting period for security.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[#C9A84C] text-sm mb-2">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-paper paper-texture border border-[#C9A84C]/30 px-4 py-3 text-white focus:border-[#C9A84C] outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-[#C9A84C] text-sm mb-2">Recovery Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full bg-paper paper-texture border border-[#C9A84C]/30 px-4 py-3 text-white focus:border-[#C9A84C] outline-none"
                >
                  <option value="user_executor">Use your executor share</option>
                  <option value="user_server">Use server share (slower)</option>
                </select>
              </div>

              {method === 'user_executor' && (
                <div>
                  <label className="block text-[#C9A84C] text-sm mb-2">Executor Email</label>
                  <input
                    type="email"
                    value={executorEmail}
                    onChange={(e) => setExecutorEmail(e.target.value)}
                    className="w-full bg-paper paper-texture border border-[#C9A84C]/30 px-4 py-3 text-white focus:border-[#C9A84C] outline-none"
                    placeholder="executor@example.com"
                  />
                </div>
              )}

              <button
                onClick={initiateRecovery}
                disabled={loading}
                className="w-full bg-[#C9A84C] text-[#0D1B2A] py-3 font-bold hover:bg-[#D4B85C] transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Start Recovery'}
              </button>

              <Link
                href="/auth/login"
                className="block text-center text-gray-400 text-sm hover:text-[#C9A84C]"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (step === 'waiting' && status?.expiresAt) {
    const daysLeft = Math.ceil((new Date(status.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper paper-texture">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl text-[#C9A84C] font-bold tracking-widest">VIRASAT</h1>
            <p className="text-[#8BA5BC] mt-2 tracking-wide">RECOVERY PENDING</p>
          </div>

          <div className="bg-[#1B2F45] p-6 border border-[#C9A84C]/30 text-center">
            <div className="bg-[#8B2635] text-white px-4 py-2 mb-6 inline-block">
              {daysLeft} days remaining
            </div>

            <p className="text-gray-300 mb-6">
              Your recovery is in progress. A confirmation email was sent to your address.
            </p>

            <p className="text-gray-400 text-sm mb-6">
              You can cancel anytime before the waiting period ends.
            </p>

            <button
              onClick={cancelRecovery}
              disabled={loading}
              className="w-full border border-[#8B2635] text-[#8B2635] py-3 font-bold hover:bg-[#8B2635]/20 transition-colors disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Cancel Recovery'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper paper-texture">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl text-[#C9A84C] font-bold tracking-widest">VIRASAT</h1>
            <p className="text-[#8BA5BC] mt-2 tracking-wide">RESET PASSWORD</p>
          </div>

          <div className="bg-[#1B2F45] p-6 border border-[#C9A84C]/30">
            <div className="bg-[#2E7D32] text-white px-4 py-2 mb-6 inline-block">
              Ready to reset
            </div>

            <p className="text-gray-300 mb-6">
              Enter your new master password. You&apos;ll need this + your shares to access your vault.
            </p>

            <div className="space-y-4">
              {method === 'user_executor' && (
                <div>
                  <label className="block text-[#C9A84C] text-sm mb-2">Your Share (Share 3)</label>
                  <input
                    type="password"
                    value={userShare}
                    onChange={(e) => setUserShare(e.target.value)}
                    className="w-full bg-paper paper-texture border border-[#C9A84C]/30 px-4 py-3 text-white focus:border-[#C9A84C] outline-none"
                    placeholder="Enter your written share"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#C9A84C] text-sm mb-2">New Master Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-paper paper-texture border border-[#C9A84C]/30 px-4 py-3 text-white focus:border-[#C9A84C] outline-none"
                  placeholder="New password"
                />
              </div>

              <button
                onClick={completeRecovery}
                disabled={loading}
                className="w-full bg-[#C9A84C] text-[#0D1B2A] py-3 font-bold hover:bg-[#D4B85C] transition-colors disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return null
}

export default function RecoveryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper paper-texture flex items-center justify-center"><div className="text-[#C9A84C]">Loading...</div></div>}>
      <RecoveryContent />
    </Suspense>
  )
}