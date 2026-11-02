'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface ExecutorInfo {
  step: number
  identityVerified: boolean
  flowCompleted: boolean
  owner: { name: string; status: string; isVerifiedDeceased: boolean }
  executor: { name: string; relationship: string }
  unlockDate?: string
}

export default function ExecutorPortalPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState<ExecutorInfo | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  
  const [deathDate, setDeathDate] = useState('')
  const [certUrl, setCertUrl] = useState('')
  const [vaultAccessToken, setVaultAccessToken] = useState('')
  const [vaultData, setVaultData] = useState<any>(null)

  useEffect(() => {
    fetchExecutorInfo()
  }, [token])

  const fetchExecutorInfo = async () => {
    try {
      const res = await fetch(`/api/executor/${token}`)
      const json = await res.json()
      if (json.success) {
        setInfo(json.data)
        setCurrentStep(json.data.step)
      } else {
        toast.error(json.error || 'Invalid link')
      }
    } catch (err) {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, extra?: Record<string, string>) => {
    setSubmitting(true)
    try {
      const body: Record<string, string> = { action }
      if (extra) Object.assign(body, extra)

      const res = await fetch(`/api/executor/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Something went wrong')
        return
      }

      if (json.data?.step !== undefined) {
        setCurrentStep(json.data.step)
      }

      if (json.data?.vaultAccessToken) {
        setVaultAccessToken(json.data.vaultAccessToken)
      }

      toast.success(json.message || 'Success')
    } catch (err) {
      toast.error('Failed')
    } finally {
      setSubmitting(false)
    }
  }

  const fetchVaultData = async (accessToken: string) => {
    try {
      const res = await fetch(`/api/executor/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultAccessToken: accessToken })
      })
      const json = await res.json()
      if (json.success) {
        setVaultData(json.data)
      }
    } catch (err) {
      toast.error('Failed to load vault')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin rounded-full" />
      </div>
    )
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl text-red-500 mb-4">Invalid Link</h1>
          <Link href="/" className="text-[#C9A84C] hover:underline">Go to Home</Link>
        </div>
      </div>
    )
  }

  // Completed flow - show vault
  if (currentStep === 4 || info.flowCompleted) {
    if (!vaultData && vaultAccessToken) {
      fetchVaultData(vaultAccessToken)
      return (
        <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin rounded-full" />
        </div>
      )
    }

    return <VaultView owner={info.owner} data={vaultData} />
  }

  // Step-by-step flow
  return (
    <div className="min-h-screen bg-[#0D1B2A] p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-[#C9A84C] text-[#0D1B2A]' 
                    : 'bg-[#1B2F45] text-gray-500'
                }`}
              >
                {step <= currentStep ? '✓' : step}
              </div>
            ))}
          </div>
          <div className="h-1 bg-[#1B2F45] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#C9A84C]"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#1B2F45] rounded-lg p-6"
          >
            {currentStep === 0 && (
              <StepWelcome 
                ownerName={info.owner.name} 
                executorName={info.executor.name}
                relationship={info.executor.relationship}
                onVerify={() => handleAction('verify_identity')}
                loading={submitting}
              />
            )}

            {currentStep === 1 && (
              <StepStatusChoice
                ownerName={info.owner.name}
                onAlive={() => handleAction('mark_alive')}
                onDeceased={() => handleAction('mark_deceased')}
                loading={submitting}
              />
            )}

            {currentStep === 2 && (
              <StepDocumentUpload
                deathDate={deathDate}
                setDeathDate={setDeathDate}
                certUrl={certUrl}
                setCertUrl={setCertUrl}
                onUpload={() => handleAction('upload_document', { 
                  deathCertificateUrl: certUrl, 
                  dateOfDeath: deathDate 
                })}
                loading={submitting}
              />
            )}

            {currentStep === 3 && (
              <StepConfirm
                ownerName={info.owner.name}
                unlockDate={info.unlockDate}
                onConfirm={() => handleAction('confirm_release')}
                loading={submitting}
              />
            )}

            {currentStep === 99 && (
              <StepCancelled />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex justify-between text-sm text-gray-500">
          <button 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep <= 0}
            className="disabled:opacity-30 hover:text-white"
          >
            ← Back
          </button>
          <span className="text-gray-600">Step {currentStep} of 4</span>
        </div>
      </div>
    </div>
  )
}

// ─── Step Components ────────────────────────────────────────────────────

function StepWelcome({ 
  ownerName, 
  executorName, 
  relationship,
  onVerify, 
  loading 
}: { 
  ownerName: string
  executorName: string
  relationship: string
  onVerify: () => void
  loading: boolean 
}) {
  return (
    <div>
      <h1 className="text-2xl text-white font-bold mb-2">Welcome, {executorName}</h1>
      <p className="text-gray-400 mb-6">
        You&apos;ve been chosen as the Executor for <strong className="text-white">{ownerName}</strong>.
      </p>
      
      <div className="bg-[#0D1B2A] rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400 mb-2">What is this?</p>
        <p className="text-sm text-gray-500">
          {ownerName} has trusted you to help their family access important documents 
          and messages if something happens to them. This is a zero-knowledge system 
          your data is encrypted and secure.
        </p>
      </div>

      <button
        onClick={onVerify}
        disabled={loading}
        className="w-full bg-[#C9A84C] text-[#0D1B2A] py-3 rounded-lg font-medium hover:bg-[#D4B85C] transition-colors disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Start Verification →'}
      </button>
    </div>
  )
}

function StepStatusChoice({ 
  ownerName, 
  onAlive, 
  onDeceased, 
  loading 
}: { 
  ownerName: string
  onAlive: () => void
  onDeceased: () => void
  loading: boolean 
}) {
  return (
    <div>
      <h1 className="text-xl text-white font-bold mb-6">What is {ownerName}'s current status?</h1>
      
      <div className="space-y-3">
        <button
          onClick={onAlive}
          disabled={loading}
          className="w-full bg-[#1B2F45] border border-green-500/30 p-4 rounded-lg text-left hover:border-green-500/60 transition-colors disabled:opacity-50"
        >
          <div className="text-green-400 font-medium mb-1">✓ {ownerName} is okay</div>
          <div className="text-sm text-gray-500">Cancel this verification</div>
        </button>
        
        <button
          onClick={onDeceased}
          disabled={loading}
          className="w-full bg-[#1B2F45] border border-red-500/30 p-4 rounded-lg text-left hover:border-red-500/60 transition-colors disabled:opacity-50"
        >
          <div className="text-red-400 font-medium mb-1">✗ {ownerName} has passed away</div>
          <div className="text-sm text-gray-500">Proceed to release vault</div>
        </button>
      </div>
    </div>
  )
}

function StepDocumentUpload({ 
  deathDate, 
  setDeathDate, 
  certUrl, 
  setCertUrl,
  onUpload, 
  loading 
}: { 
  deathDate: string
  setDeathDate: (v: string) => void
  certUrl: string
  setCertUrl: (v: string) => void
  onUpload: () => void
  loading: boolean 
}) {
  return (
    <div>
      <h1 className="text-xl text-white font-bold mb-2">Upload Death Certificate</h1>
      <p className="text-gray-400 text-sm mb-6">
        Please provide the death certificate to verify the information.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Date of Death</label>
          <input
            type="date"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            className="w-full bg-[#0D1B2A] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#C9A84C] outline-none"
          />
        </div>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2">Death Certificate Link</label>
          <input
            type="url"
            placeholder="Upload to Google Drive/Dropbox and paste link"
            value={certUrl}
            onChange={(e) => setCertUrl(e.target.value)}
            className="w-full bg-[#0D1B2A] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#C9A84C] outline-none"
          />
          <p className="text-gray-600 text-xs mt-1">
            Upload the certificate to cloud storage and paste the shareable link
          </p>
        </div>
      </div>

      <button
        onClick={onUpload}
        disabled={loading || !certUrl}
        className="w-full mt-6 bg-[#C9A84C] text-[#0D1B2A] py-3 rounded-lg font-medium hover:bg-[#D4B85C] transition-colors disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Continue →'}
      </button>
    </div>
  )
}

function StepConfirm({ 
  ownerName, 
  unlockDate, 
  onConfirm, 
  loading 
}: { 
  ownerName: string
  unlockDate?: string
  onConfirm: () => void
  loading: boolean 
}) {
  return (
    <div>
      <h1 className="text-xl text-white font-bold mb-2">Confirm Vault Release</h1>
      <p className="text-gray-400 text-sm mb-6">
        Review the details before releasing the vault to beneficiaries.
      </p>
      
      <div className="bg-[#0D1B2A] rounded-lg p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Owner:</span>
          <span className="text-white">{ownerName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Unlock Date:</span>
          <span className="text-[#C9A84C]">
            {unlockDate ? new Date(unlockDate).toLocaleDateString('en-IN') : '30 days from now'}
          </span>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Release Vault →'}
      </button>
    </div>
  )
}

function StepCancelled() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-green-500 text-3xl">✓</span>
      </div>
      <h1 className="text-xl text-white font-bold mb-2">All Clear!</h1>
      <p className="text-gray-400">
        The vault trigger has been cancelled. { } is back to normal.
      </p>
    </div>
  )
}

function VaultView({ owner, data }: { owner: any; data: any }) {
  return (
    <div className="min-h-screen bg-[#0D1B2A] p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-500 text-3xl">✓</span>
          </div>
          <h1 className="text-2xl text-white font-bold">Vault Access Granted</h1>
          <p className="text-gray-400">View {owner.name}&apos;s legacy</p>
        </div>

        {data && (
          <div className="space-y-6">
            {/* Owner Info */}
            <div className="bg-[#1B2F45] rounded-lg p-4">
              <h2 className="text-[#C9A84C] text-sm uppercase mb-3">About {owner.name}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Religion:</span>
                  <span className="text-white capitalize">{owner.religion}</span>
                </div>
              </div>
            </div>

            {/* Beneficiaries */}
            <div className="bg-[#1B2F45] rounded-lg p-4">
              <h2 className="text-[#C9A84C] text-sm uppercase mb-3">Beneficiaries</h2>
              {data.beneficiaries?.length > 0 ? (
                data.beneficiaries.map((b: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-800 last:border-0">
                    <span className="text-white">{b.name}</span>
                    <span className="text-gray-400">{b.relationship}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No beneficiaries added</p>
              )}
            </div>

            {/* Vault Items */}
            <div className="bg-[#1B2F45] rounded-lg p-4">
              <h2 className="text-[#C9A84C] text-sm uppercase mb-3">Vault Contents</h2>
              {data.vaultItems?.length > 0 ? (
                data.vaultItems.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-800 last:border-0">
                    <span className="text-white">{item.title}</span>
                    <span className="text-gray-400 capitalize">{item.category.replace('_', ' ')}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No items in vault</p>
              )}
            </div>

            {/* Messages */}
            <div className="bg-[#1B2F45] rounded-lg p-4">
              <h2 className="text-[#C9A84C] text-sm uppercase mb-3">Final Messages</h2>
              {data.messages?.length > 0 ? (
                data.messages.map((m: any, i: number) => (
                  <div key={i} className="text-sm py-2 border-b border-gray-800 last:border-0">
                    <span className="text-white">{m.title}</span>
                    <span className="text-gray-400 ml-2">({m.type}) → {m.assignedTo}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No messages</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}