'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'

function CancelContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      cancelRecovery()
    }
  }, [token])

  const cancelRecovery = async () => {
    try {
      const res = await fetch('/api/auth/recovery/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast.success('Recovery cancelled')
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 text-center"
      >
        <h1 className="text-4xl text-[#C9A84C] font-bold tracking-widest mb-4">VIRASAT</h1>
        <p className="text-gray-300">Cancelling recovery...</p>
      </motion.div>
    </div>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center"><div className="text-[#C9A84C]">Loading...</div></div>}>
      <CancelContent />
    </Suspense>
  )
}