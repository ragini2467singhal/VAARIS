'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const TYPE_ICONS: Record<string, string> = { video: 'VIDEO', letter: 'LETTER', voice: 'VOICE' }

interface DeliveryMessage {
  id: string
  title: string
  type: 'video' | 'letter' | 'voice'
  deliveredAt?: string
  text?: string | null
  mediaUrl?: string | null
}

export default function DeliveryPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [owner, setOwner] = useState<{ name: string } | null>(null)
  const [beneficiary, setBeneficiary] = useState<{ name: string; relationship: string } | null>(null)
  const [messages, setMessages] = useState<DeliveryMessage[]>([])

  useEffect(() => {
    if (!token) return
    fetch(`/api/delivery/${token}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || 'Invalid delivery link')
        setOwner(json.data.owner)
        setBeneficiary(json.data.beneficiary)
        setMessages(json.data.messages || [])
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen vault-bg flex items-center justify-center">
        <div className="w-12 h-12 border border-gold/40 rotate-45 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen vault-bg flex items-center justify-center p-8">
        <div className="vault-card p-8 max-w-lg text-center">
          <p className="font-display text-3xl text-gold mb-3">Link unavailable</p>
          <p className="text-gold/50 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="font-mono text-ash/50 text-xs tracking-[0.3em] uppercase mb-2">Final Messages</p>
          <h1 className="font-display text-4xl mb-2">A gift from {owner?.name}</h1>
          {beneficiary && (
            <p className="text-ash text-sm">
              For {beneficiary.name} ({beneficiary.relationship})
            </p>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="vault-card p-10 text-center">
            <p className="font-display text-3xl text-gold/60 mb-2">No messages yet</p>
            <p className="text-ash text-sm">Please check back later.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map(msg => (
              <div key={msg.id} className="vault-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{TYPE_ICONS[msg.type]}</span>
                  <div>
                    <p className="font-display text-2xl text-paper">{msg.title}</p>
                    {msg.deliveredAt && (
                      <p className="font-mono text-gold/40 text-xs">
                        Delivered {new Date(msg.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {msg.type === 'letter' && (
                  <div className="border border-gold/15 p-5" style={{ background: 'rgba(201,168,76,0.03)' }}>
                    <p className="font-display text-lg text-paper/80 leading-relaxed whitespace-pre-wrap">
                      {msg.text || 'Message content unavailable.'}
                    </p>
                  </div>
                )}

                {msg.type === 'video' && (
                  msg.mediaUrl ? (
                    <video controls className="w-full border border-gold/15">
                      <source src={msg.mediaUrl} />
                    </video>
                  ) : (
                    <p className="font-mono text-ember/60 text-xs">Video unavailable.</p>
                  )
                )}

                {msg.type === 'voice' && (
                  msg.mediaUrl ? (
                    <audio controls className="w-full">
                      <source src={msg.mediaUrl} />
                    </audio>
                  ) : (
                    <p className="font-mono text-ember/60 text-xs">Audio unavailable.</p>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
