'use client'
import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { encrypt, decrypt, getSessionKey } from '@/lib/crypto'

const TYPE_ICONS = { video: '🎥', letter: '✉️', voice: '🎙️' }

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewMsg, setViewMsg] = useState<any>(null)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  const [form, setForm] = useState({
    type: 'letter',
    title: '',
    assignedTo: '',
    triggerType: 'on_death',
    triggerDate: '',
    text: '',
    contentUrl: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const [userRes, msgRes, benRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/messages'), fetch('/api/beneficiaries')])
      const [user, msgs, bens] = await Promise.all([userRes.json(), msgRes.json(), benRes.json()])
      if (!user.success) { router.push('/auth/login'); return }
      setUserId(user.data._id)
      setMessages(msgs.data || [])
      setBeneficiaries(bens.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!form.title || !form.assignedTo) { toast.error('Title and recipient required'); return }
    if (form.type === 'letter' && !form.text) { toast.error('Message content required'); return }
    if ((form.type === 'video' || form.type === 'voice') && !form.contentUrl) { toast.error('Upload a file first'); return }
    if (form.triggerType === 'on_date' && !form.triggerDate) { toast.error('Trigger date required'); return }
    setSaving(true)
    try {
      const key = await getSessionKey(userId)
      if (!key) { toast.error('Session expired'); router.push('/auth/login'); return }
      const encryptedText = form.text ? await encrypt(form.text, key) : undefined
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          assignedTo: form.assignedTo,
          triggerType: form.triggerType,
          triggerDate: form.triggerDate || undefined,
          encryptedText,
          deliveryText: form.type === 'letter' ? form.text : undefined,
          encryptedContentUrl: form.contentUrl || undefined,
        })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Message saved')
      setShowAdd(false)
      setForm({ type: 'letter', title: '', assignedTo: '', triggerType: 'on_death', triggerDate: '', text: '', contentUrl: '' })
      void fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const handleView = async (msg: any) => {
    try {
      let text: string | null = null
      if (msg.encryptedText) {
        const key = await getSessionKey(userId)
        if (!key) { toast.error('Session expired'); return }
        text = await decrypt(msg.encryptedText, key)
      }
      setViewMsg({ ...msg, decryptedText: text, mediaUrl: null })

      const needsMedia = !!msg.encryptedContentUrl && (msg.type === 'video' || msg.type === 'voice')
      if (!needsMedia) { setMediaLoading(false); return }

      setMediaLoading(true)
      const mediaRes = await fetch(`/api/messages/${msg._id}/media`)
      const mediaJson = await mediaRes.json()
      if (!mediaJson.success) throw new Error(mediaJson.error || 'Media not available')

      setViewMsg((prev: any) => prev && prev._id === msg._id ? { ...prev, mediaUrl: mediaJson.data.url } : prev)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load media')
    } finally {
      setMediaLoading(false)
    }
  }

  const uploadToR2 = async (file: File) => {
    setUploading(true)
    setUploadStatus('Requesting upload URL...')
    try {
      const metaRes = await fetch('/api/uploads/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      })
      const meta = await metaRes.json()
      if (!meta.success) throw new Error(meta.error)

      setUploadStatus('Uploading...')
      const putRes = await fetch(meta.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('Upload failed')

      const contentKey = meta?.data?.key || meta?.data?.fileUrl
      if (!contentKey) throw new Error('Upload did not return a file key')
      setForm(f => ({ ...f, contentUrl: contentKey }))
      setUploadStatus('Uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setUploadStatus('')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Deleted')
      void fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const formatDate = (value?: string) => {
    if (!value) return 'Unknown date'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown date'
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getDeliveryMeta = (msg: any) => {
    if (msg.delivered) {
      const deliveredAt = msg.deliveredAt ? formatDate(msg.deliveredAt) : 'Delivered'
      return {
        status: 'Delivered',
        detail: msg.deliveredAt ? `Delivered on ${deliveredAt}` : 'Delivered',
        className: 'text-sage',
      }
    }
    if (msg.triggerType === 'on_date') {
      const dateLabel = msg.triggerDate ? formatDate(msg.triggerDate) : 'Unknown date'
      const isOverdue = msg.triggerDate ? new Date(msg.triggerDate).getTime() < Date.now() : false
      return {
        status: isOverdue ? 'Overdue' : 'Scheduled',
        detail: isOverdue ? `Overdue since ${dateLabel}` : `Scheduled for ${dateLabel}`,
        className: isOverdue ? 'text-ember' : 'text-gold/60',
      }
    }
    return { status: 'Pending', detail: 'Awaiting verification', className: 'text-gold/50' }
  }

  if (loading) return <div className="min-h-screen vault-bg flex items-center justify-center"><div className="w-12 h-12 border border-gold/40 rotate-45 animate-spin" /></div>

  return (
    <div className="flex min-h-screen paper-texture">
      {/* Sidebar */}
      <div className="w-64 vault-bg flex flex-col py-8 px-0 fixed top-0 bottom-0 left-0 z-40">
        <div className="flex items-center gap-3 px-6 mb-12">
          <div className="w-7 h-7 border border-gold/60 rotate-45 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-gold" /></div>
          <span className="font-display text-lg text-gold tracking-[0.2em]">VIRASAT</span>
        </div>
        <nav className="flex-1">
          {[{ href: '/dashboard', icon: '◆', label: 'Dashboard' }, { href: '/vault', icon: '🔐', label: 'Vault' }, { href: '/messages', icon: '✉', label: 'Messages', active: true }, { href: '/will', icon: '📜', label: 'Will Generator' }, { href: '/settings', icon: '⚙', label: 'Settings' }].map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-6 py-3 text-sm tracking-wide border-l-2 transition-all ${item.active ? 'border-gold bg-gold/5 text-gold' : 'border-transparent text-gold/40 hover:text-gold hover:bg-gold/5'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="ml-64 flex-1 p-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="font-mono text-ash/50 text-xs tracking-[0.3em] uppercase mb-2">Final Messages</p>
            <h1 className="font-display text-4xl">Letters from the Heart</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-gold">+ New Message</button>
        </div>

        {/* Emotional intro */}
        <div className="border border-gold/20 p-6 mb-10 max-w-2xl" style={{ background: 'rgba(201,168,76,0.03)' }}>
          <p className="font-display text-xl text-ink/70 italic leading-relaxed">
            &quot;These messages will be delivered exactly when you intend. A video for your wife when she&apos;s ready. A letter to your son on his 18th birthday. Your voice, after you&apos;re gone.&quot;
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="vault-card p-16 text-center">
            <p className="text-5xl mb-4">✉️</p>
            <p className="font-display text-3xl text-gold/40 mb-3">No messages yet</p>
            <p className="font-mono text-gold/25 text-sm mb-8">Leave something behind for the people you love</p>
            <button onClick={() => setShowAdd(true)} className="btn-gold">Write Your First Message</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg, i) => {
              const ben = beneficiaries.find(b => b._id === msg.assignedTo)
              return (
                <motion.div key={msg._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="vault-card p-5 flex items-center justify-between hover:border-gold/40 transition-all cursor-pointer group"
                  onClick={() => handleView(msg)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{TYPE_ICONS[msg.type as keyof typeof TYPE_ICONS]}</span>
                    <div>
                      <p className="text-paper/90 font-medium mb-1">{msg.title}</p>
                      <p className="font-mono text-gold/35 text-xs tracking-wider">
                        To: {ben?.name || 'Unknown'} · Delivers: {msg.triggerType === 'on_death' ? 'After death verified' : new Date(msg.triggerDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="category-badge border border-gold/15 text-gold/40">{msg.type}</span>
                    {msg.delivered && <span className="font-mono text-sage text-xs">✓ Delivered</span>}
                    <button onClick={e => { e.stopPropagation(); handleDelete(msg._id) }} className="opacity-0 group-hover:opacity-100 text-ember/50 hover:text-ember text-xs transition-all">✕</button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <div className="mt-12">
          <p className="font-mono text-ash/50 text-xs tracking-[0.3em] uppercase mb-2">Delivery Status</p>
          <div className="vault-card p-6">
            {messages.length === 0 ? (
              <p className="text-gold/40 text-sm">No delivery history yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map(msg => {
                  const ben = beneficiaries.find(b => b._id === msg.assignedTo)
                  const meta = getDeliveryMeta(msg)
                  const triggerLabel = msg.triggerType === 'on_death'
                    ? 'After verification'
                    : `On ${formatDate(msg.triggerDate)}`
                  return (
                    <div key={`status-${msg._id}`} className="border border-gold/15 p-4 flex items-start justify-between gap-6">
                      <div>
                        <p className="text-paper/90 font-medium mb-1">{msg.title}</p>
                        <p className="font-mono text-gold/35 text-xs">
                          To: {ben?.name || 'Unknown'} | Type: {msg.type} | Trigger: {triggerLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-xs ${meta.className}`}>{meta.status}</p>
                        <p className="font-mono text-gold/40 text-xs">{meta.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            style={{ background: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="vault-card p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-display text-3xl text-paper">New Message</h2>
                <button onClick={() => setShowAdd(false)} className="text-gold/40 hover:text-gold text-xl">✕</button>
              </div>

              {/* Type */}
              <p className="font-mono text-gold/40 text-xs tracking-[0.2em] uppercase mb-3">Message Type</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[{ t: 'letter', i: '✉️', l: 'Letter' }, { t: 'video', i: '🎥', l: 'Video' }, { t: 'voice', i: '🎙️', l: 'Voice Note' }].map(opt => (
                  <button key={opt.t} onClick={() => setForm(f => ({ ...f, type: opt.t, contentUrl: opt.t === 'letter' ? '' : f.contentUrl }))}
                    className={`border p-4 flex flex-col items-center gap-2 transition-all ${form.type === opt.t ? 'border-gold bg-gold/8 text-gold' : 'border-gold/15 text-gold/40 hover:border-gold/40'}`}
                  >
                    <span className="text-2xl">{opt.i}</span>
                    <span className="font-mono text-xs">{opt.l}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-5 mb-6">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Message title" className="virasat-input-dark" />

                {/* Recipient */}
                <div>
                  <p className="font-mono text-gold/40 text-xs tracking-[0.2em] uppercase mb-3">To</p>
                  {beneficiaries.length === 0 ? (
                    <p className="text-gold/40 text-sm">No beneficiaries. <Link href="/settings" className="text-gold underline">Add in Settings →</Link></p>
                  ) : (
                    <div className="space-y-2">
                      {beneficiaries.map(b => (
                        <label key={b._id} className="flex items-center gap-3 cursor-pointer border border-gold/15 p-3 hover:border-gold/40 transition-all">
                          <input type="radio" name="msg-ben" value={b._id} checked={form.assignedTo === b._id} onChange={() => setForm(f => ({ ...f, assignedTo: b._id }))} className="accent-gold" />
                          <span className="text-gold/70 text-sm">{b.name} — {b.relationship}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trigger */}
                <div>
                  <p className="font-mono text-gold/40 text-xs tracking-[0.2em] uppercase mb-3">Deliver When</p>
                  <div className="space-y-2">
                    {[{ v: 'on_death', l: 'After my death is verified' }, { v: 'on_date', l: 'On a specific date' }].map(opt => (
                      <label key={opt.v} className="flex items-center gap-3 cursor-pointer border border-gold/15 p-3 hover:border-gold/40 transition-all">
                        <input type="radio" name="trigger" value={opt.v} checked={form.triggerType === opt.v} onChange={() => setForm(f => ({ ...f, triggerType: opt.v }))} className="accent-gold" />
                        <span className="text-gold/70 text-sm">{opt.l}</span>
                      </label>
                    ))}
                  </div>
                  {form.triggerType === 'on_date' && (
                    <input type="date" value={form.triggerDate} onChange={e => setForm(f => ({ ...f, triggerDate: e.target.value }))} className="virasat-input-dark mt-3" />
                  )}
                </div>

                {/* Letter content */}
                {form.type === 'letter' && (
                  <div>
                    <p className="font-mono text-gold/40 text-xs tracking-[0.2em] uppercase mb-3">Your Message</p>
                    <textarea
                      value={form.text}
                      onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                      placeholder="Write what's in your heart..."
                      rows={8}
                      className="w-full bg-transparent border border-gold/20 p-4 text-gold-light placeholder-gold/20 focus:outline-none focus:border-gold/50 resize-none font-display text-lg leading-relaxed"
                    />
                  </div>
                )}

                {(form.type === 'video' || form.type === 'voice') && (
                  <div className="border border-gold/15 p-6">
                    <p className="font-mono text-gold/40 text-xs tracking-wider mb-3">
                      {form.type === 'video' ? 'VIDEO UPLOAD' : 'VOICE UPLOAD'}
                    </p>
                    <input
                      type="file"
                      accept={form.type === 'video' ? 'video/mp4,video/webm' : 'audio/mpeg,audio/mp3,audio/wav,audio/webm'}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) void uploadToR2(file)
                      }}
                      className="block w-full text-gold/70 text-sm file:mr-4 file:py-2 file:px-3 file:border-0 file:bg-gold file:text-vault file:font-mono file:text-xs file:tracking-wider"
                    />
                    <div className="mt-3 flex items-center gap-3 text-xs font-mono text-gold/50">
                      {uploading ? <span>Uploading...</span> : null}
                      {uploadStatus ? <span>{uploadStatus}</span> : null}
                      {form.contentUrl ? <span className="text-gold/70">File ready</span> : null}
                    </div>
                    {form.contentUrl && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, contentUrl: '' }))}
                        className="mt-3 text-ember/60 hover:text-ember text-xs font-mono"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="btn-outline-gold flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-gold flex-1">
                  {saving ? 'Saving...' : 'Save Message'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View message modal */}
      <AnimatePresence>
        {viewMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            style={{ background: 'rgba(13,27,42,0.95)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="vault-card p-8 w-full max-w-xl max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="font-mono text-gold/40 text-xs tracking-wider mb-1">{viewMsg.type.toUpperCase()}</p>
                  <h2 className="font-display text-2xl text-paper">{viewMsg.title}</h2>
                </div>
                <button onClick={() => { setViewMsg(null); setMediaLoading(false) }} className="text-gold/40 hover:text-gold text-xl">✕</button>
              </div>
              {viewMsg.decryptedText && (
                <div className="border border-gold/15 p-6" style={{ background: 'rgba(201,168,76,0.03)' }}>
                  <p className="font-display text-xl text-paper/80 leading-relaxed italic whitespace-pre-wrap">{viewMsg.decryptedText}</p>
                </div>
              )}
              {viewMsg.type === 'video' && (
                mediaLoading ? (
                  <p className="font-mono text-gold/40 text-xs mt-4">Loading video...</p>
                ) : viewMsg.mediaUrl ? (
                  <video controls className="w-full mt-4 border border-gold/15">
                    <source src={viewMsg.mediaUrl} />
                  </video>
                ) : viewMsg.encryptedContentUrl ? (
                  <p className="font-mono text-ember/60 text-xs mt-4">Video unavailable</p>
                ) : null
              )}
              {viewMsg.type === 'voice' && (
                mediaLoading ? (
                  <p className="font-mono text-gold/40 text-xs mt-4">Loading audio...</p>
                ) : viewMsg.mediaUrl ? (
                  <audio controls className="w-full mt-4">
                    <source src={viewMsg.mediaUrl} />
                  </audio>
                ) : viewMsg.encryptedContentUrl ? (
                  <p className="font-mono text-ember/60 text-xs mt-4">Audio unavailable</p>
                ) : null
              )}
              <p className="font-mono text-gold/20 text-xs mt-4">Decrypted locally · Never sent to server</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
