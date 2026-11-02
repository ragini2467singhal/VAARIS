'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { deriveKey, storeSessionKey, generateSalt, base64ToBuffer, encrypt } from '@/lib/crypto'

const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  dob: z.string().min(1, 'Date of birth required'),
  religion: z.enum(['hindu', 'muslim', 'christian', 'sikh', 'jain', 'other']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  masterPassword: z.string().min(10, 'Master password must be at least 10 characters'),
  confirmMaster: z.string(),
  checkInFrequency: z.enum(['weekly', 'fortnightly', 'monthly']),
}).refine(d => d.masterPassword === d.confirmMaster, {
  message: 'Master passwords do not match',
  path: ['confirmMaster'],
})

type SignupForm = z.infer<typeof SignupSchema>

const STEPS = ['Personal', 'Password & Security']
const KEYCHECK_VALUE_V2 = 'vaaris-key-check:v2'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [consentChecked, setConsentChecked] = useState(true)

  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm<SignupForm>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { religion: 'hindu', checkInFrequency: 'weekly' }
  })

  const nextStep = async () => {
    const fields: (keyof SignupForm)[] = ['name', 'email', 'phone', 'dob', 'religion']
    const valid = await trigger(fields)
    if (valid) setStep(1)
  }

  const onSubmit = async (data: SignupForm) => {
    if (!consentChecked) {
      toast.error('Please accept the terms and consent to continue')
      return
    }
    setLoading(true)
    try {
      const encryptionSalt = generateSalt()
      const key = await deriveKey(data.masterPassword, base64ToBuffer(encryptionSalt))
      const keyCheck = await encrypt(KEYCHECK_VALUE_V2, key)

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          dob: data.dob,
          religion: data.religion,
          password: data.password,
          checkInFrequency: data.checkInFrequency,
          encryptionSalt,
          keyCheck,
          consentGiven: true,
          consentAt: new Date().toISOString(),
        })
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      try {
        await storeSessionKey(key, json.data.user.id)
      } catch {}

      toast.success('Vault created. Welcome to Vaaris.')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen paper-texture flex">
      {/* Left — Visual */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-16 relative overflow-hidden bg-[#FAF6F0] border-r border-gold/20">
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 border border-gold/60 rotate-45 flex items-center justify-center bg-paper">
            <div className="w-2 h-2 bg-gold" />
          </div>
          <span className="font-display text-xl text-ink tracking-[0.2em] font-bold">VAARIS</span>
        </Link>

        <div className="relative z-10">
          <p className="font-display text-4xl text-ink font-light leading-tight mb-8">
            &quot;The greatest gift you can give your family is <em className="text-gold-dark font-normal">clarity</em>.&quot;
          </p>
          <div className="space-y-4">
            {['Zero-knowledge encryption — we never see your data', 'Automatic delivery when you\'re gone', 'Built for Indian assets and families'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                <p className="font-mono text-ink/70 text-sm tracking-wide font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="font-mono text-ink/40 text-xs tracking-wider relative z-10 font-medium">VAARIS · 2026 · INDIA</p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-paper">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-12">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 text-xs font-mono flex items-center justify-center border transition-all ${i === step ? 'border-gold bg-gold text-vault' : i < step ? 'border-gold/60 text-gold/60' : 'border-ash/30 text-ash/30'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-mono tracking-wider hidden sm:block ${i === step ? 'text-ink' : 'text-ash/40'}`}>{s.toUpperCase()}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-gold/60' : 'bg-ash/20'}`} />}
              </div>
            ))}
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 0 && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-4xl mb-2 text-ink">Personal Details</h1>
                    <p className="text-ash text-sm">Enter your personal details to begin setting up your Vaaris vault.</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Full Name *</label>
                      <input {...register('name')} type="text" placeholder="Your full name" className="virasat-input" required />
                      {errors.name && <p className="text-ember text-xs mt-1 font-mono">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Email Address *</label>
                      <input {...register('email')} type="email" placeholder="you@example.com" className="virasat-input" required />
                      {errors.email && <p className="text-ember text-xs mt-1 font-mono">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Phone Number *</label>
                      <input {...register('phone')} type="tel" placeholder="10-digit mobile number" className="virasat-input" required />
                      {errors.phone && <p className="text-ember text-xs mt-1 font-mono">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Date of Birth *</label>
                      <input {...register('dob')} type="date" className="virasat-input" required />
                      {errors.dob && <p className="text-ember text-xs mt-1 font-mono">{errors.dob.message}</p>}
                    </div>
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Religion (for legal succession context)</label>
                      <select {...register('religion')} className="virasat-input" required>
                        <option value="hindu">Hindu</option>
                        <option value="muslim">Muslim</option>
                        <option value="christian">Christian</option>
                        <option value="sikh">Sikh</option>
                        <option value="jain">Jain</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={nextStep} className="btn-gold w-full py-3.5 text-center font-semibold">
                      Continue to Password &amp; Security →
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-4xl mb-2 text-ink">Password &amp; Security</h1>
                    <p className="text-ash text-sm">Set up your passwords and security preferences.</p>
                  </div>
                  <div className="bg-gold/10 border border-gold/30 p-4 rounded">
                    <p className="font-mono text-xs text-ink/80 leading-relaxed">
                      <strong className="text-gold-dark font-bold">ZERO-KNOWLEDGE ENCRYPTION:</strong> Your Master Password encrypts your vault with AES-256. We never store it.
                      Write it down and keep it safe.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Login Password * (Min 8 chars)</label>
                      <input {...register('password')} type="password" placeholder="At least 8 characters" className="virasat-input" required />
                      {errors.password && <p className="text-ember text-xs mt-1 font-mono">{errors.password.message}</p>}
                    </div>
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Master Password (AES Vault Key) * (Min 10 chars)</label>
                      <input {...register('masterPassword')} type="password" placeholder="At least 10 characters" className="virasat-input" required />
                      {errors.masterPassword && <p className="text-ember text-xs mt-1 font-mono">{errors.masterPassword.message}</p>}
                    </div>
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Confirm Master Password *</label>
                      <input {...register('confirmMaster')} type="password" placeholder="Confirm master password" className="virasat-input" required />
                      {errors.confirmMaster && <p className="text-ember text-xs mt-1 font-mono">{errors.confirmMaster.message}</p>}
                    </div>
                    <div>
                      <label className="text-ash/80 text-xs font-mono tracking-wider uppercase block mb-2 font-semibold">Check-in Frequency</label>
                      <select {...register('checkInFrequency')} className="virasat-input" required>
                        <option value="weekly">Every week</option>
                        <option value="fortnightly">Every 2 weeks</option>
                        <option value="monthly">Every month</option>
                      </select>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-gold"
                      />
                      <span className="text-ash text-xs leading-relaxed">
                        I agree to the <Link href="/terms" target="_blank" className="text-gold-dark underline font-medium">Terms of Service</Link>,{' '}
                        <Link href="/privacy" target="_blank" className="text-gold-dark underline font-medium">Privacy Policy</Link>, and{' '}
                        <Link href="/disclaimer" target="_blank" className="text-gold-dark underline font-medium">Legal Disclaimer</Link>.
                        I consent to the processing of personal data under the DPDP Act.
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(0)} className="btn-outline-gold flex-1 text-sm">
                      ← Back to Personal
                    </button>
                    <button type="submit" disabled={loading} className="btn-gold flex-1">
                      {loading ? 'Creating vault...' : 'Create My Vault →'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </motion.div>

          <p className="text-center text-ash text-sm mt-8">
            Already have a vault?{' '}
            <Link href="/auth/login" className="text-gold hover:text-gold-dark transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
