'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const QUESTIONS = [
  { id: 'fullName', q: 'What is your full legal name?', placeholder: 'Rajesh Kumar Sharma' },
  { id: 'address', q: 'What is your current address?', placeholder: 'Flat 4B, Sector 62, Noida, UP - 201309' },
  { id: 'bankAccounts', q: 'Who should inherit your bank accounts and FDs?', placeholder: 'My wife Priya Sharma gets all bank accounts and FDs' },
  { id: 'property', q: 'Who should inherit your property?', placeholder: 'My wife Priya Sharma gets the Noida flat. My children share any other property equally.' },
  { id: 'crypto', q: 'Who should get your crypto/digital assets?', placeholder: 'My son Arjun Sharma gets all cryptocurrency' },
  { id: 'gold', q: 'Who should get your gold and jewellery?', placeholder: 'My wife Priya Sharma gets all gold and jewellery' },
  { id: 'insurance', q: 'Who are your insurance nominees?', placeholder: 'Priya Sharma is nominee on all insurance policies' },
  { id: 'guardian', q: 'If you have minor children, who should be their guardian?', placeholder: 'My brother Suresh Sharma should be guardian of my children' },
  { id: 'executor', q: 'Who should be the executor of this will?', placeholder: 'My brother Suresh Sharma' },
  { id: 'otherWishes', q: 'Any other wishes or instructions?', placeholder: 'My personal belongings should be distributed by my wife as she sees fit' },
]

export default function WillPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(json => {
      if (!json.success) { router.push('/auth/login'); return }
      setUser(json.data)
      setAnswers({ fullName: json.data.name })
    })
  }, [router])

  const [aiGenerated, setAiGenerated] = useState('')
  const [useAI, setUseAI] = useState(false)

  const generateAIWill = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'will',
          details: {
            ...answers,
            religion: user.religion,
            age: new Date().getFullYear() - new Date(user.dob).getFullYear(),
            location: 'India'
          }
        })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAiGenerated(json.data.content)
      setGenerated(true)
    } catch (err) {
      toast.error('AI generation failed. Using template instead.')
      await generateWill() // Fallback to template
    } finally {
      setGenerating(false)
    }
  }

  const generateWill = async () => {
    setGenerated(true)
  }

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/will/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: willText }),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'virasat-will.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Could not generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  const RELIGION_LAW: Record<string, string> = {
    hindu: 'Hindu Succession Act, 1956',
    muslim: 'Muslim Personal Law (Shariat) Application Act, 1937',
    christian: 'Indian Succession Act, 1925',
    sikh: 'Hindu Succession Act, 1956',
    jain: 'Hindu Succession Act, 1956',
    other: 'Indian Succession Act, 1925',
  }

  const willText = useAI && aiGenerated ? aiGenerated : (user ? `
LAST WILL AND TESTAMENT

I, ${answers.fullName || user.name}, residing at ${answers.address || '[Address]'}, aged ${new Date().getFullYear() - new Date(user.dob).getFullYear()} years, being of sound mind and memory, do hereby revoke all former wills and codicils made by me and declare this to be my Last Will and Testament, made in accordance with the ${RELIGION_LAW[user.religion] || 'Indian Succession Act, 1925'}.

ARTICLE I — BANK ACCOUNTS AND FINANCIAL ASSETS
${answers.bankAccounts || '[To be specified]'}

ARTICLE II — IMMOVABLE PROPERTY
${answers.property || '[To be specified]'}

ARTICLE III — DIGITAL AND CRYPTO ASSETS
${answers.crypto || '[To be specified]'}

ARTICLE IV — GOLD AND JEWELLERY
${answers.gold || '[To be specified]'}

ARTICLE V — INSURANCE POLICIES
${answers.insurance || '[To be specified]'}

ARTICLE VI — GUARDIANSHIP OF MINOR CHILDREN
${answers.guardian || 'Not applicable.'}

ARTICLE VII — EXECUTOR
I appoint ${answers.executor || '[Name]'} as the Executor of this Will.

ARTICLE VIII — OTHER WISHES
${answers.otherWishes || 'None specified.'}

IN WITNESS WHEREOF, I have hereunto set my hand on this _______ day of _______, 20___.

Signature: _______________________
Name: ${answers.fullName || user.name}

WITNESSES:

1. Name: _______________________
   Address: _______________________
   Signature: _______________________

2. Name: _______________________
   Address: _______________________
   Signature: _______________________

---
This will was generated by Virasat (virasat.in). For legal validity, this document must be signed in the presence of two witnesses. Consult a lawyer for complex estates.
  `.trim() : '')

  if (!user) return <div className="min-h-screen vault-bg flex items-center justify-center"><div className="w-12 h-12 border border-gold/40 rotate-45 animate-spin" /></div>

  return (
    <div className="flex min-h-screen paper-texture">
      {/* Sidebar */}
      <div className="w-64 vault-bg flex flex-col py-8 fixed top-0 bottom-0 left-0 z-40">
        <div className="flex items-center gap-3 px-6 mb-12">
          <div className="w-7 h-7 border border-gold/60 rotate-45 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-gold" /></div>
          <span className="font-display text-lg text-gold tracking-[0.2em]">VIRASAT</span>
        </div>
        <nav className="flex-1">
          {[{ href: '/dashboard', icon: '◆', label: 'Dashboard' }, { href: '/vault', icon: '🔐', label: 'Vault' }, { href: '/messages', icon: '✉', label: 'Messages' }, { href: '/will', icon: '📜', label: 'Will Generator', active: true }, { href: '/settings', icon: '⚙', label: 'Settings' }].map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-6 py-3 text-sm tracking-wide border-l-2 transition-all ${item.active ? 'border-gold bg-gold/5 text-gold' : 'border-transparent text-gold/40 hover:text-gold hover:bg-gold/5'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="ml-64 flex-1 p-10 max-w-3xl">
        <p className="font-mono text-ash/50 text-xs tracking-[0.3em] uppercase mb-2">Will Generator</p>
        <h1 className="font-display text-4xl mb-2">Your Legal Will</h1>
        <p className="text-ash text-sm mb-10">Answer 10 questions. Get a legally valid Indian will in 5 minutes. No lawyer needed for basic estates.</p>

        <div className="border border-gold/15 p-4 mb-8 flex gap-3 items-start" style={{ background: 'rgba(201,168,76,0.04)' }}>
          <span className="text-gold text-lg mt-0.5">⚖️</span>
          <div>
            <p className="font-mono text-gold/70 text-xs tracking-wider mb-1">LEGAL FRAMEWORK: {RELIGION_LAW[user.religion]}</p>
            <p className="text-ash text-xs">Auto-applied based on your religion. The generated will includes required clauses for Indian law.</p>
          </div>
        </div>

        {!generated ? (
          <>
            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              <div className="flex-1 bg-gold/10 h-1">
                <div className="bg-gold h-1 transition-all duration-500" style={{ width: `${(step / QUESTIONS.length) * 100}%` }} />
              </div>
              <span className="font-mono text-gold/40 text-xs">{step}/{QUESTIONS.length}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {step < QUESTIONS.length ? (
                  <div>
                    <p className="font-mono text-gold/40 text-xs tracking-wider uppercase mb-3">Question {step + 1} of {QUESTIONS.length}</p>
                    <h2 className="font-display text-2xl mb-6">{QUESTIONS[step].q}</h2>
                    <textarea
                      value={answers[QUESTIONS[step].id] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [QUESTIONS[step].id]: e.target.value }))}
                      placeholder={QUESTIONS[step].placeholder}
                      rows={4}
                      className="w-full bg-transparent border border-gold/20 p-4 text-ink placeholder-ash/30 focus:outline-none focus:border-gold/50 resize-none font-body text-base"
                    />
                    <div className="flex gap-3 mt-6">
                      {step > 0 && <button onClick={() => setStep(s => s - 1)} className="btn-outline-gold">← Back</button>}
                      <button onClick={() => setStep(s => s + 1)} className="btn-gold ml-auto">
                        {step === QUESTIONS.length - 1 ? 'Generate Will →' : 'Next →'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="font-display text-3xl mb-4">Ready to generate your will</p>
                    <p className="text-ash mb-8">We&apos;ll create a legally valid document based on your answers and the {RELIGION_LAW[user.religion]}.</p>

                    {/* AI Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-6 p-4 border border-gold/20 rounded-lg bg-gold/5 max-w-md mx-auto">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useAI}
                          onChange={(e) => setUseAI(e.target.checked)}
                          className="accent-gold"
                        />
                        <div>
                          <div className="font-mono text-gold text-sm tracking-wider">🤖 AI-POWERED</div>
                          <div className="text-gold/60 text-xs">Professional legal drafting</div>
                        </div>
                      </label>
                    </div>

                    <button onClick={useAI ? generateAIWill : generateWill} disabled={generating} className="btn-gold text-base px-12 py-4">
                      {generating ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border border-gold/40 rotate-45 animate-spin" />
                          {useAI ? 'AI Crafting...' : 'Generating...'}
                        </div>
                      ) : (
                        `Generate ${useAI ? 'AI-Powered ' : ''}Will 📜`
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold/10 border border-gold/30 flex items-center justify-center">✓</div>
                <p className="font-mono text-gold text-sm tracking-wider">WILL GENERATED</p>
              </div>
              <button onClick={downloadPdf} className="btn-gold text-sm py-2" disabled={downloading}>
                {downloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>

            <div className="border border-gold/20 p-8" style={{ background: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
              <pre className="text-ink/80 text-sm leading-relaxed whitespace-pre-wrap">{willText}</pre>
            </div>

            <div className="border border-gold/15 p-5 mt-6">
              <p className="font-mono text-gold/50 text-xs tracking-wider mb-2">NEXT STEPS</p>
              <div className="space-y-2 text-ash text-sm">
                <p>1. Print this document</p>
                <p>2. Sign it in the presence of 2 witnesses (not beneficiaries)</p>
                <p>3. Both witnesses must also sign</p>
                <p>4. Store the original safely — copy in your Virasat vault</p>
                <p>5. For property worth more than ₹50 lakh, consult a lawyer for registration</p>
              </div>
            </div>

            <button onClick={() => { setGenerated(false); setStep(0) }} className="btn-outline-gold mt-6">
              ← Start Over
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
