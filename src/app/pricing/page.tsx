'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Check, Zap, Crown, Shield, Video, Users, MessageSquare, FileText } from 'lucide-react'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: 'free' | 'premium') => {
    if (plan === 'free') return
    setLoading('premium')
    try {
      const res = await fetch('/api/billing/razorpay', { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      if (json.data.razorpayKey && json.data.orderId) {
        const options: any = {
          key: json.data.razorpayKey,
          amount: json.data.amount,
          currency: json.data.currency,
          name: json.data.name,
          description: json.data.description,
          order_id: json.data.orderId,
          prefill: json.data.prefill,
          handler: async (response: any) => {
            const verifyRes = await fetch('/api/billing/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verifyJson = await verifyRes.json()
            if (verifyJson.success) {
              toast.success('Premium activated! Enjoy unlimited access.')
              window.location.href = '/dashboard'
            } else {
              toast.error('Payment verification failed. Contact support.')
            }
          },
          theme: { color: '#C9A84C' }
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        toast.error('Unable to start payment. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(null)
    }
  }

  const features = [
    { icon: Shield, free: '15 assets', premium: 'Unlimited assets', highlight: false },
    { icon: Users, free: '1 executor', premium: 'Up to 3 executors', highlight: false },
    { icon: MessageSquare, free: 'Email only', premium: 'Email + WhatsApp + SMS', highlight: false },
    { icon: Video, free: 'Text only', premium: 'Video + Audio messages', highlight: true },
    { icon: FileText, free: 'Basic will', premium: 'AI-powered will (all religions)', highlight: true },
    { icon: Zap, free: 'Standard support', premium: 'Priority support', highlight: false },
  ]

  return (
    <div className="min-h-screen paper-texture pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl md:text-6xl text-ink mb-6"
          >
            Protect Your Legacy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-ash/70 text-lg max-w-2xl mx-auto"
          >
            Start free. Upgrade when you need more. Every plan includes zero-knowledge encryption and secure delivery.
          </motion.p>

          <div className="mt-8">
            <script src="https://checkout.razorpay.com/v1/checkout.js" async />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="vault-card p-8 relative"
          >
            <div className="mb-6">
              <h3 className="font-display text-2xl text-gold mb-2">Free</h3>
              <p className="text-ash/60 text-sm">For individuals getting started</p>
            </div>

            <div className="mb-8">
              <span className="font-display text-5xl text-ink">₹0</span>
              <span className="text-ash/50 text-sm">/forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ash/80 text-sm">Up to 15 assets</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ash/80 text-sm">1 executor</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ash/80 text-sm">Email notifications only</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ash/80 text-sm">Basic messages (text)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ash/80 text-sm">Standard support</span>
              </li>
            </ul>

            <Link
              href="/auth/signup"
              className="block w-full py-3 border border-gold/30 text-gold text-center font-mono text-sm tracking-wider hover:bg-gold/5 transition-colors"
            >
              GET STARTED FREE
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="vault-card p-8 relative border-gold/40 shadow-vault-deep"
          >
            <div className="absolute top-0 right-0 bg-gold text-vault px-3 py-1 text-xs font-mono tracking-wider">
              RECOMMENDED
            </div>

            <div className="mb-6">
              <h3 className="font-display text-2xl text-gold mb-2">Premium</h3>
              <p className="text-ash/60 text-sm">For families with complex legacy needs</p>
            </div>

            <div className="mb-8">
              <span className="font-display text-5xl text-ink">₹499</span>
              <span className="text-ash/50 text-sm">/month</span>
              <p className="text-gold/60 text-xs mt-1">or ₹4,999/year (save 16%)</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.filter(f => f.highlight || !f.highlight).map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-ink text-sm font-medium">{f.premium}</span>
                    {f.highlight && <span className="ml-2 text-xs text-gold/70 font-mono">PREMIUM</span>}
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ink text-sm">Unlimited vault items</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ink text-sm">Up to 3 executors</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ink text-sm">WhatsApp + SMS notifications</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-ink text-sm">AI-powered will generator</span>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loading === 'premium'}
              className="btn-gold w-full text-center"
            >
              {loading === 'premium' ? 'PROCESSING...' : 'UPGRADE TO PREMIUM'}
            </button>

            <p className="text-ash/40 text-xs text-center mt-4">
              Cancel anytime. Secure payment via Razorpay.
            </p>
          </motion.div>
        </div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-8 text-ash/40 text-xs font-mono tracking-wider">
            <span>🔒 ZERO-KNOWLEDGE ENCRYPTION</span>
            <span>🇮🇳 MADE IN INDIA</span>
            <span>✓ 30-DAY WAITING PERIOD</span>
          </div>
          <p className="text-ash/40 text-xs mt-4">
            Your data is encrypted before it leaves your device. We can never see your vault contents.
          </p>
        </motion.div>

        {/* Legal Disclaimer */}
        <div className="mt-12 max-w-3xl mx-auto bg-ember/10 border border-ember/25 p-6">
          <p className="text-ember/80 text-xs leading-relaxed">
            <strong className="uppercase tracking-wider">Legal Notice:</strong> Virasat is a digital legacy vault and notification service only. 
            It does not replace a legal Will, Trust, or court-mandated succession process. 
            Actual asset transfer requires valid legal documentation per applicable Indian laws. 
            Premium features do not constitute legal advice. Consult a qualified lawyer for estate planning.
          </p>
        </div>
      </div>
    </div>
  )
}
