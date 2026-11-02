'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Crown, FileText, Users, Shield, Zap } from 'lucide-react'

export default function AIWillGeneratorPage() {
  const [form, setForm] = useState({
    religion: 'hindu',
    assets: '',
    familyMembers: '',
    specialWishes: '',
    messageType: 'letter',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const isPremium = true // TODO: wire to real subscription check

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPremium) {
      toast.error('Upgrade to Premium to use AI Will Generator')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type: 'will_clause',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setResult(json.data.text || json.data.content || 'Generated successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen paper-texture pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl text-ink mb-2">AI Will Generator</h1>
            <p className="text-ash/60 text-sm">Generate personalized will clauses based on your religion, assets, and family situation.</p>
          </div>
          {!isPremium && (
            <Link href="/pricing" className="btn-gold text-xs px-4 py-2">
              <Crown className="w-4 h-4 inline mr-1" />
              Upgrade
            </Link>
          )}
        </div>

        {!isPremium ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="vault-card p-8 text-center">
            <Crown className="w-12 h-12 text-gold mx-auto mb-4" />
            <h2 className="font-display text-2xl text-gold mb-3">Premium Feature</h2>
            <p className="text-ash/70 mb-6">AI-powered will generation is available for Premium users only.</p>
            <Link href="/pricing" className="btn-gold">Upgrade to Premium</Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="font-mono text-ash/50 text-xs tracking-wider uppercase block mb-2">Religion</label>
                <select value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })} className="virasat-input">
                  <option value="hindu">Hindu</option>
                  <option value="muslim">Muslim</option>
                  <option value="christian">Christian</option>
                  <option value="sikh">Sikh</option>
                  <option value="jain">Jain</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-ash/50 text-xs tracking-wider uppercase block mb-2">Message Type</label>
                <select value={form.messageType} onChange={e => setForm({ ...form, messageType: e.target.value })} className="virasat-input">
                  <option value="letter">Letter</option>
                  <option value="video">Video Script</option>
                  <option value="voice">Voice Note Script</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-mono text-ash/50 text-xs tracking-wider uppercase block mb-2">Assets Overview</label>
              <textarea
                value={form.assets}
                onChange={e => setForm({ ...form, assets: e.target.value })}
                placeholder="e.g., SBI Savings Account, 2 acres farmland in Punjab, gold jewelry, crypto wallet..."
                className="virasat-input h-32 resize-none"
              />
            </div>

            <div>
              <label className="font-mono text-ash/50 text-xs tracking-wider uppercase block mb-2">Family Members</label>
              <textarea
                value={form.familyMembers}
                onChange={e => setForm({ ...form, familyMembers: e.target.value })}
                placeholder="e.g., Wife Priya, son Arjun (15), daughter Priya (12)..."
                className="virasat-input h-24 resize-none"
              />
            </div>

            <div>
              <label className="font-mono text-ash/50 text-xs tracking-wider uppercase block mb-2">Special Wishes (Optional)</label>
              <textarea
                value={form.specialWishes}
                onChange={e => setForm({ ...form, specialWishes: e.target.value })}
                placeholder="Any specific instructions or wishes..."
                className="virasat-input h-24 resize-none"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? 'Generating...' : 'Generate Will Clause'}
            </button>
          </form>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 vault-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-gold">Generated Output</h3>
              <button onClick={() => navigator.clipboard.writeText(result)} className="text-gold/60 hover:text-gold text-xs font-mono">
                COPY
              </button>
            </div>
            <div className="whitespace-pre-wrap text-ash/80 text-sm leading-relaxed">{result}</div>
          </motion.div>
        )}

        <div className="mt-12">
          <Link href="/will" className="text-gold/60 hover:text-gold text-sm font-mono">
            ← Back to Will Generator
          </Link>
        </div>
      </div>
    </div>
  )
}
