'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { clearSessionKey } from '@/lib/crypto'
import { DashStats } from '@/types'
import { Crown, Zap } from 'lucide-react'

const FIRST_LOGIN_BANNER_KEY = 'vaaris_legal_banner_dismissed'

const VAULT_CATEGORIES = [
  { key: 'bank_account', label: 'Bank Accounts', icon: '🏦' },
  { key: 'fd_rd', label: 'FDs & RDs', icon: '📈' },
  { key: 'crypto', label: 'Crypto', icon: '₿' },
  { key: 'gold', label: 'Gold', icon: '🪙' },
  { key: 'insurance', label: 'Insurance', icon: '📋' },
  { key: 'property', label: 'Property', icon: '🏠' },
  { key: 'password', label: 'Passwords', icon: '🔐' },
  { key: 'bank_locker', label: 'Bank Lockers', icon: '🗝️' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [snoozeDays, setSnoozeDays] = useState(14)
  const [showSnooze, setShowSnooze] = useState(false)
  const [showLegalBanner, setShowLegalBanner] = useState(false)
  const [plan, setPlan] = useState<'free' | 'premium'>('free')
  const [assetCount, setAssetCount] = useState(0)

  useEffect(() => {
    const dismissed = sessionStorage.getItem(FIRST_LOGIN_BANNER_KEY)
    if (!dismissed) {
      setShowLegalBanner(true)
    }
    fetchStats()
  }, [])

  useEffect(() => {
    if (stats?.userId) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setPlan(json.data.plan || 'free')
            setAssetCount(stats?.vaultItems ?? 0)
          }
        })
        .catch(() => {})
    }
  }, [stats?.userId])

  const assetLimit = plan === 'premium' ? Infinity : 15
  const assetUsagePercent = assetLimit === Infinity ? 0 : Math.round((assetCount / assetLimit) * 100)
  const showUpgradePrompt = plan === 'free' && assetCount >= 12

  const dismissLegalBanner = () => {
    sessionStorage.setItem(FIRST_LOGIN_BANNER_KEY, 'true')
    setShowLegalBanner(false)
  }

  const fetchStats = async () => {
    try {
      const [vaultRes, messagesRes, benefRes, execRes, userRes] = await Promise.all([
        fetch('/api/vault'),
        fetch('/api/messages'),
        fetch('/api/beneficiaries'),
        fetch('/api/executor'),
        fetch('/api/auth/me'),
      ])
      const [vault, messages, benef, exec, user] = await Promise.all([
        vaultRes.json(),
        messagesRes.json(),
        benefRes.json(),
        execRes.json(),
        userRes.json(),
      ])
      setStats({
        userId: user.data?._id || '',
        vaultItems: vault.data?.length ?? 0,
        messages: messages.data?.length ?? 0,
        beneficiaries: benef.data?.length ?? 0,
        hasExecutor: !!exec.data,
        lastCheckIn: user.data?.lastCheckIn,
        status: user.data?.status,
        missedCount: user.data?.missedCount ?? 0,
        checkInFrequency: user.data?.checkInFrequency,
        snoozeUntil: user.data?.snoozeUntil,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSnooze = async () => {
    try {
      const res = await fetch('/api/checkin/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: snoozeDays })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(`Check-ins snoozed for ${snoozeDays} days`)
      setShowSnooze(false)
      fetchStats()
    } catch (err) {
      toast.error('Failed to snooze')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    if (stats?.userId) clearSessionKey(stats.userId)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen vault-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border border-gold/40 rotate-45 animate-spin" />
          <p className="font-mono text-gold/50 text-sm tracking-wider">OPENING VAULT</p>
        </div>
      </div>
    )
  }

  const completionItems = [
    { label: 'Added vault items', done: (stats?.vaultItems ?? 0) > 0 },
    { label: 'Added beneficiaries', done: (stats?.beneficiaries ?? 0) > 0 },
    { label: 'Named an executor', done: stats?.hasExecutor ?? false },
    { label: 'Left final messages', done: (stats?.messages ?? 0) > 0 },
  ]
  const completion = completionItems.filter(i => i.done).length

  return (
    <div className="min-h-screen paper-texture">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 vault-bg flex flex-col py-8 px-6 z-40">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-7 h-7 border border-gold/60 rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gold" />
          </div>
          <span className="font-display text-lg text-gold tracking-[0.2em]">VAARIS</span>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { href: '/dashboard', icon: '◆', label: 'Dashboard' },
            { href: '/vault', icon: '🔐', label: 'Vault' },
            { href: '/settings', icon: '👥', label: 'Nominees & Keys' },
            { href: '/messages', icon: '✉', label: 'Messages' },
            { href: '/will', icon: '📜', label: 'Will Generator' },
            { href: '/settings', icon: '⚙', label: 'Settings' },
            { href: '/impact', icon: '📊', label: 'Impact Dashboard' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gold/50 hover:text-gold hover:bg-gold/5 transition-all font-body text-sm tracking-wide group"
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button onClick={handleLogout} className="text-gold/30 hover:text-gold/60 text-xs font-mono tracking-wider transition-colors text-left px-4 py-2">
          SIGN OUT
        </button>
      </div>

      {/* Main content */}
      <div className="ml-64 p-10">
        {/* Beta Mode Banner */}
        <div className="bg-gold/10 border border-gold/30 p-4 mb-6 flex items-center justify-between rounded">
          <div className="flex items-center gap-3">
            <span className="text-gold text-lg">🧪</span>
            <div>
              <p className="text-gold font-bold text-sm tracking-wider uppercase">Beta Mode</p>
              <p className="text-ash/70 text-xs">Closed beta — invite friends/family only.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gold/70">support@vaaris.in</span>
          </div>
        </div>

        {/* Legal Disclaimer Banner */}
        {showLegalBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-ember/10 border border-ember/40 p-5 mb-8 flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <p className="text-ember/90 font-bold text-sm tracking-wider uppercase mb-2">
                ⚠️ Important — Not a Legal Service
              </p>
              <p className="text-ash/70 text-sm leading-relaxed">
                Vaaris is a secure storage and delivery tool only. It does NOT replace a legal Will,
                Trust, or court-mandated succession process. Actual asset transfer requires valid legal
                documentation per applicable Indian laws. <Link href="/disclaimer" className="text-gold underline hover:text-gold-dark">Read full disclaimer →</Link>
              </p>
            </div>
            <button onClick={dismissLegalBanner} className="text-ember/50 hover:text-ember transition-colors text-xl leading-none mt-1">
              ✕
            </button>
          </motion.div>
        )}

        {/* Beta Mode Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gold/10 border border-gold/30 p-4 mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-gold text-lg">🧪</span>
            <div>
              <p className="text-gold font-bold text-sm tracking-wider uppercase">Beta Mode</p>
              <p className="text-ash/70 text-xs">You're using the closed beta. Features may change and bugs may occur.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/feedback" className="text-xs font-mono text-gold hover:text-gold-dark border border-gold/30 px-3 py-1.5 rounded">
              Send Feedback
            </Link>
            <Link href="https://github.com/viratcore01/virasat/issues" target="_blank" className="text-xs font-mono text-gold/70 hover:text-gold border border-gold/20 px-3 py-1.5 rounded">
              Report Issue
            </Link>
          </div>
        </motion.div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-mono text-ash/60 text-xs tracking-[0.3em] uppercase mb-2">Dashboard</p>
              <h1 className="font-display text-4xl">Your Legacy Vault</h1>
            </div>
            <div className="flex items-center gap-2">
              {plan === 'premium' ? (
                <span className="flex items-center gap-1 bg-gold/10 border border-gold/30 px-3 py-1 text-gold text-xs font-mono">
                  <Crown className="w-3 h-3" /> PREMIUM
                </span>
              ) : (
                <Link href="/pricing" className="flex items-center gap-1 bg-ember/10 border border-ember/30 px-3 py-1 text-ember text-xs font-mono hover:bg-ember/20 transition-colors">
                  <Zap className="w-3 h-3" /> UPGRADE
                </Link>
              )}
            </div>
          </div>
          {plan === 'free' && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-ash/50 text-xs">Plan Usage</span>
                <span className="font-mono text-ash/60 text-xs">{assetCount} / {assetLimit} assets</span>
              </div>
              <div className="w-full bg-vault-light/50 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${assetUsagePercent >= 90 ? 'bg-ember' : 'bg-gold'}`}
                  style={{ width: `${Math.min(100, assetUsagePercent)}%` }}
                />
              </div>
              {showUpgradePrompt && (
                <div className="mt-3 bg-ember/10 border border-ember/30 p-3 flex items-center justify-between">
                  <p className="text-ember/80 text-xs font-mono">
                    You're approaching your Free plan limit. Upgrade to Premium for unlimited assets.
                  </p>
                  <Link href="/pricing" className="text-xs font-mono text-gold hover:text-gold-dark whitespace-nowrap ml-3">
                    Upgrade →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status alert */}
        {stats?.missedCount === 2 && (
          <div className="bg-ember/10 border border-ember/40 p-4 mb-8 flex items-center justify-between">
            <p className="font-body text-ember text-sm">
              ⚠️ You&apos;ve missed check-ins. Your emergency contact has been notified. Please confirm you&apos;re okay.
            </p>
            <button onClick={() => setShowSnooze(true)} className="text-xs font-mono text-ember/70 hover:text-ember border border-ember/30 px-3 py-1 ml-4 whitespace-nowrap">
              Snooze
            </button>
          </div>
        )}

        {/* Completion progress */}
        {completion < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vault-card p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-gold/80 text-xs tracking-[0.3em] uppercase">Setup Progress</p>
              <p className="font-mono text-gold text-sm">{completion}/4</p>
            </div>
            <div className="w-full bg-vault-light/50 h-1 mb-6">
              <div className="bg-gold h-1 transition-all duration-500" style={{ width: `${(completion / 4) * 100}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {completionItems.map(item => (
                <div key={item.label} className={`flex items-center gap-2 text-xs font-mono ${item.done ? 'text-gold/60' : 'text-gold/30'}`}>
                  <span>{item.done ? '✓' : '○'}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Vault Items', value: stats?.vaultItems ?? 0, href: '/vault', color: 'gold' },
            { label: 'Messages', value: stats?.messages ?? 0, href: '/messages', color: 'gold' },
            { label: 'Beneficiaries', value: stats?.beneficiaries ?? 0, href: '/settings', color: 'gold' },
            { label: 'Setup Complete', value: `${Math.round((completion / 4) * 100)}%`, href: '/settings', color: completion === 4 ? 'sage' : 'gold' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={stat.href} className="block vault-card p-6 hover:border-gold/40 transition-all group">
                <p className="font-mono text-gold/40 text-xs tracking-wider uppercase mb-3">{stat.label}</p>
                <p className="font-display text-4xl text-gold">{stat.value}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick add vault items */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <p className="font-mono text-ash/60 text-xs tracking-[0.3em] uppercase">Quick Add to Vault</p>
            <Link href="/vault" className="font-mono text-gold/60 text-xs hover:text-gold transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {VAULT_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Link href={`/vault?add=${cat.key}`}
                  className="vault-card p-4 flex flex-col items-center gap-2 hover:border-gold/50 transition-all group text-center"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="font-mono text-gold/50 text-xs tracking-wider group-hover:text-gold transition-colors">{cat.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Check-in status */}
        <div className="vault-card p-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-gold/40 text-xs tracking-wider uppercase mb-1">Check-in Status</p>
            <p className="font-body text-gold/80 text-sm">
              {stats?.snoozeUntil
                ? `Snoozed until ${new Date(stats.snoozeUntil).toLocaleDateString('en-IN')}`
                : stats?.lastCheckIn
                ? `Last confirmed ${new Date(stats.lastCheckIn).toLocaleDateString('en-IN')}`
                : 'Not yet confirmed'
              }
            </p>
            <p className="font-mono text-gold/30 text-xs mt-1">{stats?.checkInFrequency} check-ins</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowSnooze(true)} className="btn-outline-gold text-xs py-2 px-4">
              Snooze
            </button>
            <div className="w-3 h-3 rounded-full bg-sage animate-pulse-gold mt-1" />
          </div>
        </div>
      </div>

      {/* Snooze modal */}
      {showSnooze && (
        <div className="fixed inset-0 bg-vault/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="vault-card p-8 max-w-sm w-full"
          >
            <h3 className="font-display text-2xl text-gold mb-2">Snooze Check-ins</h3>
            <p className="text-gold/60 text-sm font-mono mb-6">Travelling or in hospital? Pause check-ins temporarily.</p>
            <div className="space-y-3 mb-6">
              {[7, 14, 30, 60].map(d => (
                <label key={d} className="cursor-pointer block">
                  <input type="radio" name="snooze" value={d} checked={snoozeDays === d} onChange={() => setSnoozeDays(d)} className="sr-only peer" />
                  <div className="border border-gold/20 p-3 peer-checked:border-gold peer-checked:bg-gold/5 hover:border-gold/40 transition-all flex justify-between">
                    <span className="font-body text-gold/70 text-sm">{d} days</span>
                    {snoozeDays === d && <span className="text-gold text-xs font-mono">Selected</span>}
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSnooze(false)} className="btn-outline-gold flex-1 text-sm py-2">Cancel</button>
              <button onClick={handleSnooze} className="btn-gold flex-1 text-sm">Snooze</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
