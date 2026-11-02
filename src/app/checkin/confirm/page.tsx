'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

function CheckInConfirmContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid check-in link.')
      return
    }

    fetch(`/api/checkin/confirm?token=${token}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setStatus('success')
          setMessage(json.message)
        } else {
          setStatus('error')
          setMessage(json.error)
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [token])

  return (
    <div className="min-h-screen vault-bg flex items-center justify-center p-8">
      <div className="text-center max-w-md w-full">
        <div className="flex items-center justify-center gap-3 mb-16">
          <div className="w-8 h-8 border border-gold/60 rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-gold" />
          </div>
          <span className="font-display text-xl text-gold tracking-[0.2em]">VIRASAT</span>
        </div>

        {status === 'loading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-16 h-16 border border-gold/30 rotate-45 animate-spin mx-auto mb-8" />
            <p className="font-mono text-gold/50 tracking-wider text-sm">CONFIRMING CHECK-IN</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
            <div className="w-20 h-20 border-2 border-gold flex items-center justify-center mx-auto mb-8 animate-pulse-gold">
              <span className="text-gold text-3xl">✓</span>
            </div>
            <h1 className="font-display text-4xl text-paper mb-4">You&apos;re confirmed.</h1>
            <p className="font-body text-gold/50 mb-3">{message}</p>
            <p className="font-mono text-gold/30 text-xs tracking-wider mb-12">YOUR FAMILY IS SAFE.</p>
            <Link href="/dashboard" className="btn-gold">
              Go to Dashboard
            </Link>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-20 h-20 border-2 border-ember/60 flex items-center justify-center mx-auto mb-8">
              <span className="text-ember text-3xl">✕</span>
            </div>
            <h1 className="font-display text-4xl text-paper mb-4">Link not valid.</h1>
            <p className="font-body text-gold/50 mb-12">{message}</p>
            <Link href="/dashboard" className="btn-outline-gold">
              Go to Dashboard
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function CheckInConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen vault-bg" />}>
      <CheckInConfirmContent />
    </Suspense>
  )
}
