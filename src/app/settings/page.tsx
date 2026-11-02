'use client'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clearSessionKey } from '@/lib/crypto'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'executor' | 'beneficiaries' | 'checkin' | 'notifications' | 'activity' | 'account'>('executor')
  const [executors, setExecutors] = useState<any[]>([])
  const [primaryExecutor, setPrimaryExecutor] = useState<any>(null)
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    whatsapp: false,
    sms: false,
    checkinReminders: true,
    executorAlerts: true,
    beneficiaryNotifications: true,
  })
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [frequency, setFrequency] = useState('weekly')
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [savingFreq, setSavingFreq] = useState(false)
  const [savingBen, setSavingBen] = useState(false)
  const [benForm, setBenForm] = useState({ name: '', email: '', phone: '', relationship: '' })
  const [execForm, setExecForm] = useState({ name: '', email: '', phone: '', relationship: '', role: 'primary', order: 0 })
  const [savingExec, setSavingExec] = useState(false)

  const saveExecutor = async () => {
    if (!execForm.name || !execForm.email || !execForm.phone) { toast.error('Name, email, phone required'); return }
    setSavingExec(true)
    try {
      const res = await fetch('/api/executor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(execForm),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Executor added')
      setExecForm({ name: '', email: '', phone: '', relationship: '', role: 'primary', order: 0 })
      void fetchAll()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to add executor') }
    finally { setSavingExec(false) }
  }

  const fetchAll = useCallback(async () => {
    try {
      const [userRes, execRes, benRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/executor'), fetch('/api/beneficiaries')])
      const [userData, execData, benData] = await Promise.all([userRes.json(), execRes.json(), benRes.json()])
      if (!userData.success) { router.push('/auth/login'); return }
      setUser(userData.data)
      setFrequency(userData.data.checkInFrequency || 'weekly')
      
      if (execData.data) {
        if (Array.isArray(execData.data)) {
          setExecutors(execData.data)
          const primary = execData.data.find((e: any) => e.role === 'primary' || e.order === 0)
          setPrimaryExecutor(primary || execData.data[0])
        } else {
          setExecutors([execData.data])
          setPrimaryExecutor(execData.data)
        }
      }
      setBeneficiaries(benData.data || [])
      
      if (userData.data.notificationPreferences) {
        setNotificationPrefs(userData.data.notificationPreferences)
      }
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const saveNotificationPrefs = async () => {
    setSavingFreq(true)
    try {
      const res = await fetch('/api/auth/settings', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ notificationPreferences: notificationPrefs }) 
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Notification preferences updated')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSavingFreq(false) }
  }

  const loadActivities = async () => {
    setLoadingActivities(true)
    try {
      const res = await fetch('/api/user/activity?limit=50')
      const json = await res.json()
      if (json.success) setActivities(json.data || [])
    } catch { toast.error('Failed to load activity') }
    finally { setLoadingActivities(false) }
  }

  useEffect(() => {
    if (tab === 'activity') {
      loadActivities()
    }
  }, [tab])

  const addBeneficiary = async () => {
    if (!benForm.name || !benForm.email || !benForm.phone || !benForm.relationship) { toast.error('All fields required'); return }
    setSavingBen(true)
    try {
      const res = await fetch('/api/beneficiaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(benForm) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Beneficiary added')
      setBenForm({ name: '', email: '', phone: '', relationship: '' })
      void fetchAll()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSavingBen(false) }
  }

  const deleteBeneficiary = async (id: string) => {
    if (!confirm('Remove this beneficiary?')) return
    try {
      const res = await fetch(`/api/beneficiaries/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Removed')
      void fetchAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove')
    }
  }

  const saveFrequency = async () => {
    setSavingFreq(true)
    try {
      const res = await fetch('/api/auth/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkInFrequency: frequency }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Check-in frequency updated')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSavingFreq(false) }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    if (user?._id) clearSessionKey(user._id)
    router.push('/')
  }

  if (loading) return <div className="min-h-screen vault-bg flex items-center justify-center"><div className="w-12 h-12 border border-gold/40 rotate-45 animate-spin" /></div>

  return (
    <div className="flex min-h-screen paper-texture">
      {/* Sidebar */}
      <div className="w-64 vault-bg flex flex-col py-8 fixed top-0 bottom-0 left-0 z-40">
        <div className="flex items-center gap-3 px-6 mb-12">
          <div className="w-7 h-7 border border-gold/60 rotate-45 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-gold" /></div>
          <span className="font-display text-lg text-gold tracking-[0.2em]">VAARIS</span>
        </div>
        <nav className="flex-1">
          {[{ href: '/dashboard', icon: '◆', label: 'Dashboard' }, { href: '/vault', icon: '🔐', label: 'Vault' }, { href: '/messages', icon: '✉', label: 'Messages' }, { href: '/will', icon: '📜', label: 'Will Generator' }, { href: '/settings', icon: '⚙', label: 'Settings', active: true }].map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-6 py-3 text-sm tracking-wide border-l-2 transition-all ${item.active ? 'border-gold bg-gold/5 text-gold' : 'border-transparent text-gold/40 hover:text-gold hover:bg-gold/5'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="ml-64 flex-1 p-10">
        <p className="font-mono text-ash/50 text-xs tracking-[0.3em] uppercase mb-2">Settings</p>
        <h1 className="font-display text-4xl mb-8">Configure Your Vault</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 border-b border-gold/15 overflow-x-auto">
          {[{ id: 'executor', label: 'Nominees & Shamir Keys' }, { id: 'beneficiaries', label: 'Beneficiaries' }, { id: 'checkin', label: 'Check-ins' }, { id: 'notifications', label: 'Notifications' }, { id: 'activity', label: 'Activity' }, { id: 'account', label: 'Account' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-6 py-3 font-mono text-xs tracking-wider uppercase border-b-2 transition-all -mb-px whitespace-nowrap ${tab === t.id ? 'border-gold text-gold' : 'border-transparent text-ash/40 hover:text-gold/60'}`}
            >{t.label}</button>
          ))}
        </div>

        {/* Executor / Nominee tab */}
        {tab === 'executor' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-2xl">Your Nominees & Shamir Keys</h2>
              <Link href="/nominee/login" target="_blank" className="text-xs font-mono text-gold border border-gold/30 px-3 py-1 hover:bg-gold/10 transition-colors">
                Open Nominee Portal ↗
              </Link>
            </div>
            <p className="text-ash text-sm leading-relaxed mb-6">
              Add your trusted Nominees / Executors. Each nominee is automatically allocated a <strong>Shamir Secret Sharing Key Share (2-of-3 threshold)</strong> and can log in at <code className="text-gold">/nominee/login</code> to submit verification certificates upon demise.
            </p>

            {executors.length > 0 && (
              <div className="space-y-3 mb-6">
                {executors.map(e => (
                  <div key={e._id || e.id} className="vault-card p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gold/10 border border-gold/30 flex items-center justify-center text-lg">👤</div>
                      <div className="flex-1">
                        <p className="text-gold font-medium">{e.name}</p>
                        <p className="font-mono text-gold/40 text-xs">{e.email} · {e.relationship} · {e.phone}</p>
                        <span className="text-gold/60 text-xs font-mono uppercase">{e.role} Nominee</span>
                      </div>
                      <span className={`font-mono text-xs px-2 py-1 border ${e.status === 'pending' ? 'border-gold/30 text-gold/50' : 'border-sage/50 text-sage'}`}>
                        {e.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gold/10 flex items-center justify-between text-[11px] font-mono text-gold/60">
                      <span>Access Token: <code className="text-gold">{e.uniqueToken || 'Assigned'}</code></span>
                      <span className="text-emerald-400">✓ Shamir Share #2 Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-gold/15 p-6">
              <p className="font-mono text-gold/40 text-xs tracking-[0.2em] uppercase mb-5">Add Nominee / Executor</p>
              <div className="space-y-5">
                {[{ key: 'name', label: 'Full Name', placeholder: 'Priya Sharma' }, { key: 'email', label: 'Email', placeholder: 'priya@gmail.com' }, { key: 'phone', label: 'Phone (WhatsApp alerts)', placeholder: '9876543210' }, { key: 'relationship', label: 'Relationship', placeholder: 'Spouse / Son / Daughter / Brother' }].map(f => (
                  <div key={f.key}>
                    <label className="font-mono text-ash/50 text-xs tracking-[0.15em] uppercase block mb-2">{f.label}</label>
                    <input value={(execForm as any)[f.key]} onChange={e => setExecForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className="virasat-input" />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="font-mono text-ash/50 text-xs tracking-[0.15em] uppercase block mb-2">Role</label>
                <select 
                  value={(execForm as any).role || 'primary'} 
                  onChange={e => setExecForm(prev => ({ ...prev, role: e.target.value }))}
                  className="virasat-input"
                >
                  <option value="primary">Primary Nominee</option>
                  <option value="backup">Backup Nominee</option>
                </select>
              </div>
              <button onClick={saveExecutor} disabled={savingExec} className="btn-gold mt-6 w-full">
                {savingExec ? 'Saving...' : 'Add Nominee & Issue Shamir Share'}
              </button>
              <p className="font-mono text-ash/40 text-xs mt-4 text-center">Nominee can log in anytime at /nominee/login using their email or unique access token.</p>
            </div>
          </motion.div>
        )}

        {/* Notifications tab */}
        {tab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
            <h2 className="font-display text-2xl mb-3">Notification Preferences</h2>
            <p className="text-ash text-sm leading-relaxed mb-8">Choose how you want to receive reminders and alerts.</p>

            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive check-in reminders and alerts via email' },
                { key: 'whatsapp', label: 'WhatsApp Notifications', desc: 'Receive reminders via WhatsApp (requires phone number)' },
                { key: 'sms', label: 'SMS Notifications', desc: 'Receive reminders via SMS' },
                { key: 'checkinReminders', label: 'Check-in Reminders', desc: 'Send me periodic check-in reminders' },
                { key: 'executorAlerts', label: 'Executor Alerts', desc: 'Notify executor when I miss check-ins' },
                { key: 'beneficiaryNotifications', label: 'Beneficiary Notifications', desc: 'Notify beneficiaries when vault is delivered' },
              ].map(pref => (
                <div key={pref.key} className="vault-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gold font-medium text-sm">{pref.label}</p>
                    <p className="font-mono text-gold/40 text-xs">{pref.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(notificationPrefs as any)[pref.key]}
                      onChange={e => setNotificationPrefs(prev => ({ ...prev, [pref.key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gold/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                  </label>
                </div>
              ))}
            </div>

            <button onClick={saveNotificationPrefs} disabled={savingFreq} className="btn-gold mt-8 w-full">
              {savingFreq ? 'Saving...' : 'Save Preferences'}
            </button>
          </motion.div>
        )}

        {/* Activity tab */}
        {tab === 'activity' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
            <h2 className="font-display text-2xl mb-3">Activity Log</h2>
            <p className="text-ash text-sm leading-relaxed mb-8">Recent actions on your vault for transparency.</p>

            {loadingActivities ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border border-gold/40 rotate-45 animate-spin mx-auto mb-4" />
                <p className="font-mono text-gold/50 text-sm">Loading activity...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="vault-card p-8 text-center">
                <p className="font-mono text-gold/40 text-sm">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activities.map((activity: any) => (
                  <div key={activity._id} className="vault-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-gold/60 text-xs uppercase tracking-wider">{activity.category}</span>
                      <span className="font-mono text-gold/30 text-xs">{new Date(activity.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-gold/80 text-sm">{activity.description}</p>
                    {activity.metadata && (
                      <p className="font-mono text-gold/30 text-xs mt-1">{JSON.stringify(activity.metadata)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Beneficiaries tab */}
        {tab === 'beneficiaries' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
            <h2 className="font-display text-2xl mb-3">Beneficiaries</h2>
            <p className="text-ash text-sm leading-relaxed mb-8">These are the people who will receive your vault items and messages. Add everyone you want to assign assets to.</p>

            {/* Existing */}
            {beneficiaries.length > 0 && (
              <div className="space-y-2 mb-8">
                {beneficiaries.map(b => (
                  <div key={b._id} className="vault-card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-gold font-medium text-sm">{b.name}</p>
                      <p className="font-mono text-gold/35 text-xs">{b.email} · {b.relationship}</p>
                    </div>
                    <button onClick={() => deleteBeneficiary(b._id)} className="text-ember/40 hover:text-ember text-xs font-mono transition-colors">REMOVE</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new */}
            <div className="border border-gold/15 p-6">
              <p className="font-mono text-gold/40 text-xs tracking-[0.2em] uppercase mb-5">Add Beneficiary</p>
              <div className="space-y-5">
                {[{ key: 'name', label: 'Full Name', placeholder: 'Priya Sharma' }, { key: 'email', label: 'Email', placeholder: 'priya@gmail.com' }, { key: 'phone', label: 'Phone', placeholder: '9876543210' }, { key: 'relationship', label: 'Relationship', placeholder: 'Wife / Son / Daughter' }].map(f => (
                  <div key={f.key}>
                    <label className="font-mono text-ash/50 text-xs tracking-[0.15em] uppercase block mb-2">{f.label}</label>
                    <input value={(benForm as any)[f.key]} onChange={e => setBenForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className="virasat-input" />
                  </div>
                ))}
              </div>
              <button onClick={addBeneficiary} disabled={savingBen} className="btn-gold mt-6 w-full">
                {savingBen ? 'Adding...' : '+ Add Beneficiary'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Check-in tab */}
        {tab === 'checkin' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
            <h2 className="font-display text-2xl mb-3">Check-in Frequency</h2>
            <p className="text-ash text-sm leading-relaxed mb-8">How often should we ping you to confirm you&apos;re okay? If you miss 3 consecutive check-ins, your executor will be notified.</p>

            <div className="space-y-3 mb-8">
              {[{ v: 'weekly', l: 'Every week', d: 'Recommended — highest safety. Miss 3 = 3 weeks before trigger.' }, { v: 'fortnightly', l: 'Every 2 weeks', d: 'Good balance. Miss 3 = 6 weeks before trigger.' }, { v: 'monthly', l: 'Every month', d: 'Minimal. Miss 3 = 3 months before trigger.' }].map(opt => (
                <label key={opt.v} className="cursor-pointer block">
                  <input type="radio" name="freq" value={opt.v} checked={frequency === opt.v} onChange={() => setFrequency(opt.v)} className="sr-only peer" />
                  <div className="border border-ash/20 p-4 peer-checked:border-gold peer-checked:bg-gold/5 hover:border-gold/30 transition-all">
                    <div className="font-medium text-sm mb-1">{opt.l}</div>
                    <div className="font-mono text-ash/50 text-xs">{opt.d}</div>
                  </div>
                </label>
              ))}
            </div>

            <button onClick={saveFrequency} disabled={savingFreq} className="btn-gold w-full">
              {savingFreq ? 'Saving...' : 'Save Frequency'}
            </button>

            {/* Snooze Section */}
            <div className="mt-10 pt-8 border-t border-gold/15">
              <h2 className="font-display text-2xl mb-3">Temporarily Snooze Check-ins</h2>
              <p className="text-ash text-sm leading-relaxed mb-6">Going on vacation, hospitalized, or unavailable? Pause check-ins for a set period. You&apos;ll still receive reminders but won&apos;t trigger your executor.</p>
              
              {user?.snoozeUntil && new Date(user.snoozeUntil) > new Date() ? (
                <div className="border border-gold/30 bg-gold/5 p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-mono text-gold text-xs tracking-wider uppercase mb-1">Currently Snoozed</p>
                      <p className="text-gold/70 text-sm">Until {new Date(user.snoozeUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <span className="text-2xl">⏸️</span>
                  </div>
                  <button onClick={async () => {
                    try {
                      const res = await fetch('/api/checkin/snooze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: 0 }) })
                      const json = await res.json()
                      if (!json.success) throw new Error(json.error)
                      toast.success('Snooze cancelled - check-ins resumed')
                      void fetchAll()
                    } catch (err) { toast.error('Failed to cancel snooze') }
                  }} className="w-full py-2 border border-gold/30 text-gold/70 hover:text-gold hover:border-gold font-mono text-xs tracking-wider transition-all">
                    RESUME CHECK-INS NOW
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {[{ d: 7, l: '1 Week' }, { d: 14, l: '2 Weeks' }, { d: 30, l: '1 Month' }, { d: 60, l: '2 Months' }, { d: 90, l: '3 Months' }].map(opt => (
                    <button key={opt.d} onClick={async () => {
                      try {
                        const res = await fetch('/api/checkin/snooze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: opt.d }) })
                        const json = await res.json()
                        if (!json.success) throw new Error(json.error)
                        toast.success(`Check-ins snoozed for ${opt.d} days`)
                        void fetchAll()
                      } catch (err) { toast.error('Failed to snooze') }
                    }} className="py-3 border border-gold/20 text-gold/70 hover:text-gold hover:border-gold font-mono text-xs tracking-wider transition-all">
                      {opt.l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Account tab */}
        {tab === 'account' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
            <h2 className="font-display text-2xl mb-3">Account</h2>
            {user && (
              <div className="vault-card p-6 mb-6">
                <div className="space-y-3">
                  {[{ l: 'Name', v: user.name }, { l: 'Email', v: user.email }, { l: 'Phone', v: user.phone }, { l: 'Religion', v: user.religion }, { l: 'Date of Birth', v: user.dob }, { l: 'Status', v: user.status }, { l: 'Member since', v: new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }, { l: 'Consent', v: user.consentGiven ? 'Yes' : 'No' }].map(f => (
                    <div key={f.l} className="flex justify-between border-b border-gold/10 pb-2">
                      <span className="font-mono text-gold/35 text-xs tracking-wider uppercase">{f.l}</span>
                      <span className="text-gold/70 text-sm capitalize">{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Export */}
            <div className="border border-gold/20 p-5 mb-6">
              <p className="font-mono text-gold/60 text-xs tracking-wider uppercase mb-3">Your Data</p>
              <p className="text-ash text-sm mb-4">Download a copy of your data at any time.</p>
              <button onClick={async () => {
                try {
                  const res = await fetch('/api/auth/export')
                  const json = await res.json()
                  if (!json.success) throw new Error(json.error)
                  const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `virasat-data-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                  toast.success('Data exported')
                } catch (err) { toast.error('Failed to export') }
              }} className="text-gold/70 hover:text-gold font-mono text-xs tracking-wider transition-colors border border-gold/20 px-4 py-2">
                EXPORT MY DATA
              </button>
            </div>

            <div className="border border-ember/20 p-5">
              <p className="font-mono text-ember/60 text-xs tracking-wider uppercase mb-3">Danger Zone</p>
              <p className="text-ash text-sm mb-4">Remember: your master password is never stored. If you forget it, your encrypted data cannot be recovered.</p>
              <div className="flex gap-3">
                <button onClick={handleLogout} className="text-ember/60 hover:text-ember font-mono text-xs tracking-wider transition-colors border border-ember/20 px-4 py-2">
                  SIGN OUT
                </button>
                <button onClick={async () => {
                  if (!confirm('Are you sure you want to DELETE your account and all data? This cannot be undone.')) return
                  if (!confirm('This will permanently delete your vault, messages, and all data. Continue?')) return
                  try {
                    const res = await fetch('/api/auth/account', { method: 'DELETE' })
                    const json = await res.json()
                    if (!json.success) throw new Error(json.error)
                    toast.success('Account deleted')
                    router.push('/')
                  } catch (err) { toast.error('Failed to delete account') }
                }} className="text-ember font-mono text-xs tracking-wider transition-colors border border-ember/40 px-4 py-2 hover:bg-ember/10">
                  DELETE ACCOUNT
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
