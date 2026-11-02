'use client'
import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { encrypt, decrypt, getSessionKey } from '@/lib/crypto'
import { VaultCategory, VaultItemData } from '@/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FREE_ONLY_MODE } from '@/lib/flags-client'

const CATEGORIES = [
  { key: 'bank_account', label: 'Bank Account', icon: '🏦' },
  { key: 'fd_rd', label: 'FD / RD', icon: '📈' },
  { key: 'crypto', label: 'Crypto', icon: '₿' },
  { key: 'gold', label: 'Gold', icon: '🪙' },
  { key: 'insurance', label: 'Insurance', icon: '📋' },
  { key: 'property', label: 'Property', icon: '🏠' },
  { key: 'password', label: 'Password', icon: '🔐' },
  { key: 'bank_locker', label: 'Bank Locker', icon: '🗝️' },
  { key: 'other', label: 'Other', icon: '📁' },
]

const FIELDS: Record<string, { key: string; label: string; type?: string; required?: boolean }[]> = {
  bank_account: [
    { key: 'bankName', label: 'Bank Name', required: true },
    { key: 'accountNumber', label: 'Account Number', required: true },
    { key: 'accountType', label: 'Account Type (Savings/Current)', required: true },
    { key: 'branch', label: 'Branch' },
    { key: 'ifsc', label: 'IFSC Code' },
    { key: 'nomineeName', label: 'Nominee Name' },
    { key: 'netBankingLogin', label: 'Net Banking Login' },
    { key: 'netBankingPassword', label: 'Net Banking Password', type: 'password' },
  ],
  fd_rd: [
    { key: 'bankName', label: 'Bank Name', required: true },
    { key: 'fdNumber', label: 'FD/RD Number', required: true },
    { key: 'amount', label: 'Amount (₹)', required: true },
    { key: 'interestRate', label: 'Interest Rate (%)' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'maturityDate', label: 'Maturity Date', type: 'date' },
    { key: 'certificateLocation', label: 'Physical Certificate Location' },
  ],
  crypto: [
    { key: 'exchangeName', label: 'Exchange (WazirX / Binance / etc)', required: true },
    { key: 'loginEmail', label: 'Login Email', required: true },
    { key: 'loginPassword', label: 'Login Password', type: 'password', required: true },
    { key: 'twoFABackupCodes', label: '2FA Backup Codes', type: 'password' },
    { key: 'walletAddresses', label: 'Wallet Addresses' },
    { key: 'seedPhrase', label: 'Seed Phrase (CRITICAL)', type: 'password' },
    { key: 'approximateValue', label: 'Approximate Value (₹)' },
  ],
  gold: [
    { key: 'form', label: 'Form (Coins/Jewellery/Bars)', required: true },
    { key: 'weight', label: 'Weight (grams)' },
    { key: 'purity', label: 'Purity (22K/24K/etc)' },
    { key: 'location', label: 'Physical Location', required: true },
    { key: 'description', label: 'Description' },
    { key: 'receiptLocation', label: 'Purchase Receipt Location' },
  ],
  insurance: [
    { key: 'company', label: 'Insurance Company', required: true },
    { key: 'policyNumber', label: 'Policy Number', required: true },
    { key: 'policyType', label: 'Policy Type (Term/Endowment/etc)', required: true },
    { key: 'sumAssured', label: 'Sum Assured (₹)' },
    { key: 'premiumAmount', label: 'Premium Amount (₹/year)' },
    { key: 'nomineeName', label: 'Nominee Name' },
    { key: 'maturityDate', label: 'Maturity Date', type: 'date' },
    { key: 'agentContact', label: 'Agent Contact' },
  ],
  property: [
    { key: 'type', label: 'Type (Flat/Plot/Commercial)', required: true },
    { key: 'address', label: 'Full Address', required: true },
    { key: 'registrationNumber', label: 'Registration Number' },
    { key: 'coOwners', label: 'Co-owners (if any)' },
    { key: 'documentLocation', label: 'Document Location', required: true },
    { key: 'loanOutstanding', label: 'Loan Outstanding? (Yes/No)' },
    { key: 'loanBank', label: 'Loan Bank (if any)' },
    { key: 'loanAmount', label: 'Loan Amount (₹)' },
  ],
  password: [
    { key: 'serviceName', label: 'Service Name', required: true },
    { key: 'url', label: 'URL' },
    { key: 'username', label: 'Username/Email', required: true },
    { key: 'password', label: 'Password', type: 'password', required: true },
    { key: 'twoFABackupCodes', label: '2FA Backup Codes', type: 'password' },
    { key: 'notes', label: 'Notes' },
  ],
  bank_locker: [
    { key: 'bankName', label: 'Bank Name', required: true },
    { key: 'branch', label: 'Branch', required: true },
    { key: 'lockerNumber', label: 'Locker Number', required: true },
    { key: 'keyLocation', label: 'Key Location', required: true },
    { key: 'contentsDescription', label: 'Contents Description' },
  ],
  other: [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: true },
    { key: 'value', label: 'Value (₹)' },
    { key: 'location', label: 'Location' },
  ],
}

export default function VaultPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedCat, setSelectedCat] = useState<VaultCategory>('bank_account')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [decryptedItems, setDecryptedItems] = useState<Record<string, any>>({})
  const [viewItem, setViewItem] = useState<any>(null)
  const [filterCat, setFilterCat] = useState<string>('all')

  const fetchData = useCallback(async () => {
    try {
      const [userRes, itemsRes, benRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/vault'),
        fetch('/api/beneficiaries'),
      ])
      const [user, itemsData, benData] = await Promise.all([userRes.json(), itemsRes.json(), benRes.json()])
      if (!user.success) { router.push('/auth/login'); return }
      setUserId(user.data._id)
      setUser(user.data)
      setItems(itemsData.data || [])
      setBeneficiaries(benData.data || [])
    } catch { toast.error('Failed to load vault') }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!title || !assignedTo) { toast.error('Title and beneficiary required'); return }
    setSaving(true)
    try {
      const key = await getSessionKey(userId)
      if (!key) { toast.error('Session expired. Please login again.'); router.push('/auth/login'); return }
      const encryptedData = await encrypt(JSON.stringify(formData), key)
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCat, title, encryptedData, assignedTo })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Saved to vault')
      setShowAdd(false)
      setFormData({})
      setTitle('')
      setAssignedTo('')
      void fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const startSubscription = async () => {
    if (FREE_ONLY_MODE) {
      toast.error('Payments are disabled in free-only mode')
      return
    }
    try {
      const ok = await loadRazorpay()
      if (!ok) { toast.error('Razorpay failed to load'); return }

      const res = await fetch('/api/billing/razorpay', { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      const options = {
        key: json.data.keyId,
        subscription_id: json.data.subscriptionId,
        name: 'Virasat',
        description: 'Unlimited vault items — ₹149/month',
        theme: { color: '#C9A84C' },
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/billing/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const verify = await verifyRes.json()
          if (!verify.success) {
            toast.error(verify.error || 'Payment verification failed')
            return
          }
          toast.success('Subscription activated')
          void fetchData()
        },
      }

      const rz = new (window as any).Razorpay(options)
      rz.open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Subscription failed')
    }
  }

  const handleView = async (item: any) => {
    try {
      const key = await getSessionKey(userId)
      if (!key) { toast.error('Session expired'); return }
      const decrypted = JSON.parse(await decrypt(item.encryptedData, key))
      setDecryptedItems(prev => ({ ...prev, [item._id]: decrypted }))
      setViewItem({ ...item, decrypted })
    } catch { toast.error('Could not decrypt item') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item from your vault?')) return
    await fetch(`/api/vault/${id}`, { method: 'DELETE' })
    toast.success('Item deleted')
    void fetchData()
  }

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat)
  const isPro = user?.subscriptionStatus === 'active'
  const limitReached = !FREE_ONLY_MODE && !isPro && items.length >= 5

  if (loading) return (
    <div className="min-h-screen vault-bg flex items-center justify-center">
      <div className="w-12 h-12 border border-gold/40 rotate-45 animate-spin" />
    </div>
  )

  return (
    <div className="flex min-h-screen paper-texture" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {/* Sidebar */}
      <div className="w-64 vault-bg flex flex-col py-8 px-0 fixed top-0 bottom-0 left-0 z-40">
        <div className="flex items-center gap-3 px-6 mb-12">
          <div className="w-7 h-7 border border-gold/60 rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gold" />
          </div>
          <span className="font-display text-lg text-gold tracking-[0.2em]">VIRASAT</span>
        </div>
        <nav className="flex-1">
          {[
            { href: '/dashboard', icon: '◆', label: 'Dashboard' },
            { href: '/vault', icon: '🔐', label: 'Vault', active: true },
            { href: '/messages', icon: '✉', label: 'Messages' },
            { href: '/will', icon: '📜', label: 'Will Generator' },
            { href: '/settings', icon: '⚙', label: 'Settings' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-6 py-3 text-sm tracking-wide border-l-2 transition-all ${item.active ? 'border-gold bg-gold/5 text-gold' : 'border-transparent text-gold/40 hover:text-gold hover:bg-gold/5'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="ml-64 flex-1 p-10">
        {!FREE_ONLY_MODE && !isPro && (
          <div className="border border-gold/30 bg-gold/5 p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-mono text-gold/70 text-xs tracking-wider">FREE PLAN</p>
              <p className="text-gold/80 text-sm">5 items included. Upgrade for unlimited vault items.</p>
            </div>
            <button onClick={startSubscription} className="btn-gold text-xs px-4 py-2">Upgrade ₹149/mo</button>
          </div>
        )}
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="font-mono text-ash/50 text-xs tracking-[0.3em] uppercase mb-2">Encrypted Vault</p>
            <h1 className="font-display text-4xl">{items.length} items secured</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-gold" disabled={limitReached}>+ Add Item</button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button onClick={() => setFilterCat('all')} className={`category-badge border transition-all ${filterCat === 'all' ? 'border-gold text-gold bg-gold/5' : 'border-gold/20 text-ash/50 hover:border-gold/40'}`}>All ({items.length})</button>
          {CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.key).length
            if (count === 0) return null
            return (
              <button key={cat.key} onClick={() => setFilterCat(cat.key)} className={`category-badge border transition-all ${filterCat === cat.key ? 'border-gold text-gold bg-gold/5' : 'border-gold/20 text-ash/50 hover:border-gold/40'}`}>
                {cat.icon} {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="vault-card p-16 text-center">
            <p className="font-display text-3xl text-gold/40 mb-4">Your vault is empty</p>
            <p className="font-mono text-gold/25 text-sm tracking-wider mb-8">Start by adding your first item</p>
            <button onClick={() => setShowAdd(true)} className="btn-gold" disabled={limitReached}>Add Your First Item</button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((item, i) => {
              const cat = CATEGORIES.find(c => c.key === item.category)
              const ben = beneficiaries.find(b => b._id === item.assignedTo)
              return (
                <motion.div key={item._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="vault-card p-5 flex items-center justify-between hover:border-gold/40 transition-all cursor-pointer group"
                  onClick={() => handleView(item)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{cat?.icon}</span>
                    <div>
                      <p className="text-paper/90 font-medium mb-1">{item.title}</p>
                      <p className="font-mono text-gold/35 text-xs tracking-wider">→ {ben?.name || 'Unassigned'} · {new Date(item.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="category-badge border border-gold/15 text-gold/40">{cat?.label}</span>
                    <span className="font-mono text-gold/25 text-xs">🔒 ENCRYPTED</span>
                    <button onClick={e => { e.stopPropagation(); handleDelete(item._id) }} className="opacity-0 group-hover:opacity-100 text-ember/50 hover:text-ember text-xs transition-all ml-2">✕</button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            style={{ background: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="vault-card p-8 w-full max-w-xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-display text-3xl text-paper">Add to Vault</h2>
                <button onClick={() => setShowAdd(false)} className="text-gold/40 hover:text-gold text-xl">✕</button>
              </div>

              {/* Legal Disclaimer */}
              <div className="bg-ember/10 border border-ember/25 p-4 mb-6">
                <p className="text-ember/80 text-xs leading-relaxed">
                  <strong className="uppercase tracking-wider">Legal Notice:</strong> Virasat is a storage and delivery tool only.
                  It does NOT replace a legal Will or court-mandated succession process. Actual asset ownership transfer
                  requires valid legal documentation per applicable Indian laws. Consult a qualified lawyer.
                </p>
              </div>

              {/* Category */}
              <p className="font-mono text-gold/40 text-xs tracking-[0.2em] uppercase mb-3">Category</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {CATEGORIES.map(cat => (
                  <button key={cat.key} onClick={() => { setSelectedCat(cat.key as VaultCategory); setFormData({}) }}
                    className={`border p-3 flex flex-col items-center gap-1 transition-all ${selectedCat === cat.key ? 'border-gold bg-gold/8 text-gold' : 'border-gold/15 text-gold/40 hover:border-gold/40'}`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-mono text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Title */}
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Label (e.g. SBI Savings Account)" className="virasat-input-dark mb-6" />

              {/* Dynamic fields */}
              <div className="space-y-5 mb-6">
                {(FIELDS[selectedCat] || []).map(field => (
                  <div key={field.key}>
                    <label className="font-mono text-gold/35 text-xs tracking-[0.15em] uppercase block mb-2">{field.label}{field.required && ' *'}</label>
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="virasat-input-dark"
                      placeholder={field.label}
                    />
                  </div>
                ))}
              </div>

              {/* Assign to */}
              <p className="font-mono text-gold/40 text-xs tracking-[0.2em] uppercase mb-3">Assign to Beneficiary *</p>
              {beneficiaries.length === 0 ? (
                <div className="border border-gold/15 p-4 mb-6">
                  <p className="text-gold/40 text-sm font-mono">No beneficiaries added yet.</p>
                  <Link href="/settings" className="text-gold text-xs underline">Add beneficiaries in Settings →</Link>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {beneficiaries.map(b => (
                    <label key={b._id} className="flex items-center gap-3 cursor-pointer border border-gold/15 p-3 hover:border-gold/40 transition-all">
                      <input type="radio" name="beneficiary" value={b._id} checked={assignedTo === b._id} onChange={() => setAssignedTo(b._id)} className="accent-gold" />
                      <span className="text-gold/70 text-sm">{b.name} — {b.relationship}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="vault-card p-3 mb-6 bg-gold/5">
                <p className="font-mono text-gold/50 text-xs">🔒 All data is encrypted in your browser before saving. We never see this information.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="btn-outline-gold flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-gold flex-1">
                  {saving ? 'Encrypting & Saving...' : 'Save to Vault'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View item modal */}
      <AnimatePresence>
        {viewItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            style={{ background: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="vault-card p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl text-paper">{viewItem.title}</h2>
                <button onClick={() => setViewItem(null)} className="text-gold/40 hover:text-gold text-xl">✕</button>
              </div>
              <div className="space-y-4">
                {Object.entries(viewItem.decrypted || {}).map(([key, val]) => (
                  val ? (
                    <div key={key} className="border-b border-gold/10 pb-3">
                      <p className="font-mono text-gold/35 text-xs tracking-wider uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-gold/80 text-sm font-mono break-all">{String(val)}</p>
                    </div>
                  ) : null
                ))}
              </div>
              <div className="bg-ember/10 border border-ember/20 p-3 mt-6">
                <p className="font-mono text-ember/60 text-xs">This data was decrypted locally using your master password. It is never sent to our servers.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
