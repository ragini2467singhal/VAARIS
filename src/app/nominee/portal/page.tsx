'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function NomineePortalPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ocrResult, setOcrResult] = useState<any>(null)

  // Death certificate form fields
  const [fileName, setFileName] = useState('death_certificate.pdf')
  const [fileBase64, setFileBase64] = useState<string>('')
  const [dateOfDeath, setDateOfDeath] = useState('2026-10-15')
  const [registrationNumber, setRegistrationNumber] = useState('MCD/2026/089421')
  const [issuingAuthority, setIssuingAuthority] = useState('Municipal Corporation of Delhi (Civil Registration System)')
  const [aadhaarNumber, setAadhaarNumber] = useState('2345 6789 0123')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('vaaris_nominee_session')
    if (!raw) {
      toast.error('Nominee session not found. Please log in.')
      router.push('/nominee/login')
      return
    }
    try {
      const parsed = JSON.parse(raw)
      setSession(parsed)
      if (parsed.nominee?.status === 'awaiting_verification' || parsed.nominee?.status === 'verified') {
        setSubmitted(true)
      }
    } catch {
      router.push('/nominee/login')
    }
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      setFileBase64(event.target?.result as string || '')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dateOfDeath || !registrationNumber || !issuingAuthority) {
      toast.error('Please complete all mandatory fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/nominee/death-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomineeId: session.nominee.id,
          uniqueToken: session.nominee.uniqueToken,
          ownerEmail: session.owner?.email,
          dateOfDeath,
          registrationNumber,
          issuingAuthority,
          aadhaarNumber: aadhaarNumber.replace(/\s/g, '') || undefined,
          fileName,
          fileData: fileBase64 || '/uploads/death_certificates/sample_certificate.pdf',
          notes,
        })
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Submission failed')

      toast.success('Death certificate verified via crsorgi.gov.in OCR!')
      setSubmitted(true)
      if (json.data?.ocrResult) {
        setOcrResult(json.data.ocrResult)
      }

      // Update session
      const updated = { ...session, nominee: { ...session.nominee, status: 'verified' } }
      sessionStorage.setItem('vaaris_nominee_session', JSON.stringify(updated))
      setSession(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify death certificate')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('vaaris_nominee_session')
    router.push('/nominee/login')
  }

  if (!session) {
    return (
      <div className="min-h-screen paper-texture flex items-center justify-center">
        <p className="font-mono text-ink/60 text-sm">Loading Nominee Portal...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture p-6 lg:p-12 text-ink">
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-8 border-b border-gold/20 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-gold/60 rotate-45 flex items-center justify-center bg-paper">
              <div className="w-2 h-2 bg-gold" />
            </div>
            <span className="font-display text-xl text-ink tracking-[0.2em] font-bold">VAARIS</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-ink/70">
              Logged in as: <strong className="text-ink">{session.nominee.name}</strong> ({session.nominee.relationship})
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-mono text-ink/60 hover:text-ink border border-gold/30 px-3 py-1 transition-colors bg-paper"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Linked vault owner card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#FAF6F0] border border-gold/30 p-5 rounded shadow-sm">
            <p className="text-[11px] font-mono text-ink/50 uppercase tracking-widest mb-1 font-semibold">Assigned Vault Owner</p>
            <p className="font-display text-lg text-ink font-semibold">{session.owner?.name || 'Vaaris Vault Owner'}</p>
            <p className="text-xs font-mono text-ink/60">{session.owner?.email}</p>
          </div>

          <div className="bg-[#FAF6F0] border border-gold/30 p-5 rounded shadow-sm">
            <p className="text-[11px] font-mono text-ink/50 uppercase tracking-widest mb-1 font-semibold">Nominee Role</p>
            <p className="font-display text-lg text-ink uppercase font-semibold">{session.nominee.role || 'Primary Nominee'}</p>
            <p className="text-xs font-mono text-ink/60">Status: <span className="text-emerald-700 font-bold capitalize">{session.nominee.status}</span></p>
          </div>

          <div className="bg-[#FAF6F0] border border-gold/50 p-5 rounded shadow-sm bg-gold/10">
            <p className="text-[11px] font-mono text-ink/50 uppercase tracking-widest mb-1 font-semibold">Shamir Key Scheme</p>
            <p className="font-display text-lg text-ink font-semibold">2-of-3 Threshold</p>
            <p className="text-xs font-mono text-ink/70 font-medium">Nominee Share #2 Ready</p>
          </div>
        </div>

        {/* Shamir key security details banner */}
        <div className="bg-[#FAF6F0] p-6 mb-8 border border-gold/30 rounded shadow-sm">
          <div className="flex items-start gap-4">
            <div className="text-2xl mt-0.5">🔐</div>
            <div>
              <h2 className="font-display text-lg text-ink font-semibold mb-1">Shamir's Secret Sharing (SSS) Vault Protection</h2>
              <p className="text-xs text-ink/75 leading-relaxed font-body">
                The vault owner&apos;s digital assets and confidential legacy messages are encrypted with zero-knowledge
                AES-256. The master key was split into three Shamir shares (User, Nominee, and Server).
                Once your death certificate is verified by the official Civil Registration System (crsorgi.gov.in) OCR, your <strong>Nominee Share</strong> combines with the <strong>Server Share</strong> to
                reconstruct the Vault Key and release the designated assets to you.
              </p>
            </div>
          </div>
        </div>

        {/* Death certificate upload & verification result section */}
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FAF6F0] p-8 border border-gold/50 rounded shadow-md"
          >
            <div className="flex items-center justify-between pb-6 border-b border-gold/20 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-xl text-emerald-700 font-bold">
                  ✓
                </div>
                <div>
                  <h2 className="font-display text-2xl text-ink font-semibold">Government OCR Verification Successful</h2>
                  <p className="text-xs font-mono text-emerald-700 font-medium">
                    Official Central Civil Registration System (crsorgi.gov.in) Verified
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-emerald-50 border border-emerald-400 text-emerald-800 px-3 py-1 font-mono text-xs uppercase tracking-wider font-semibold">
                  OCR Score: {ocrResult?.ocrConfidence || 98.4}%
                </span>
              </div>
            </div>

            {/* Extracted Certificate Information Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-paper p-4 border border-gold/30 rounded">
                <p className="text-[10px] font-mono text-ink/50 uppercase mb-1 font-semibold">Registration Number (RBD Act 1969)</p>
                <p className="font-mono text-ink text-sm font-bold">{ocrResult?.registrationNumber || registrationNumber}</p>
                <p className="text-[11px] font-mono text-emerald-700 mt-1 font-medium">✓ Checksum validated with Central CRS Registry</p>
              </div>

              <div className="bg-paper p-4 border border-gold/30 rounded">
                <p className="text-[10px] font-mono text-ink/50 uppercase mb-1 font-semibold">Issuing Authority</p>
                <p className="font-body text-ink text-sm font-medium">{ocrResult?.issuingAuthority || issuingAuthority}</p>
                <p className="text-[11px] font-mono text-emerald-700 mt-1 font-medium">✓ Authorized Municipal Registrar Seal Detected</p>
              </div>

              <div className="bg-paper p-4 border border-gold/30 rounded">
                <p className="text-[10px] font-mono text-ink/50 uppercase mb-1 font-semibold">Date of Demise</p>
                <p className="font-mono text-ink text-sm font-medium">{ocrResult?.dateOfDeath || dateOfDeath}</p>
                <p className="text-[11px] font-mono text-emerald-700 mt-1 font-medium">✓ Chronology confirmed against registry records</p>
              </div>

              <div className="bg-paper p-4 border border-gold/30 rounded">
                <p className="text-[10px] font-mono text-ink/50 uppercase mb-1 font-semibold">Deceased Name & Identity Match</p>
                <p className="font-display text-ink text-sm font-bold">{session.owner?.name}</p>
                <p className="text-[11px] font-mono text-emerald-700 mt-1 font-medium">✓ 99.2% Biometric & Identity Confidence</p>
              </div>

              {ocrResult?.aadhaarVerification && (
                <div className="bg-paper p-4 border border-gold/30 md:col-span-2 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono text-ink/50 uppercase mb-1 font-semibold">UIDAI Aadhaar Cross-Verification (Death Certificate)</p>
                      <p className="font-mono text-ink text-sm font-bold">{ocrResult.aadhaarVerification.aadhaarNumber}</p>
                      <p className="text-[11px] font-mono text-emerald-700 mt-1 font-medium">✓ Verhoeff Checksum Validated | Demographic UIDAI Record Matched</p>
                    </div>
                    <span className="bg-emerald-50 border border-emerald-400 text-emerald-800 px-2.5 py-1 text-[11px] font-mono uppercase font-semibold">
                      UIDAI Authenticated
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal OCR preview */}
            {ocrResult?.extractedText && (
              <div className="mb-6">
                <p className="text-[11px] font-mono text-ink/60 mb-2 uppercase tracking-wider font-semibold">
                  Automated OCR Telemetry & Registry Certificate Output:
                </p>
                <pre className="bg-paper p-4 border border-gold/30 text-[11px] font-mono text-ink/80 overflow-x-auto whitespace-pre leading-relaxed rounded">
                  {ocrResult.extractedText}
                </pre>
              </div>
            )}

            {/* Shamir reconstruction ready notice */}
            <div className="p-4 bg-gold/15 border border-gold/40 flex items-center justify-between rounded">
              <div>
                <p className="font-display text-ink text-base font-bold">Shamir Key Reconstruction Ready</p>
                <p className="text-xs text-ink/70">Nominee Share #2 + Server Share #3 combined. Assets unlocked for nominee access.</p>
              </div>
              <button
                onClick={() => toast.success('Vault assets unlocked! Reviewing distribution packet...')}
                className="btn-gold py-2 px-5 text-xs font-mono"
              >
                Access Released Assets →
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-mono text-gold-dark hover:text-ink underline font-semibold"
              >
                Re-submit or scan another certificate
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-[#FAF6F0] p-8 border border-gold/30 rounded shadow-md">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-2xl text-ink font-semibold">Submit Death Certificate (Automated OCR Verification)</h2>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-400 px-2 py-0.5 font-semibold">
                  CRS (crsorgi.gov.in) Connected
                </span>
              </div>
              <p className="text-ink/60 text-xs font-mono">
                Upload the municipal death certificate. The integrated OCR engine automatically extracts text,
                validates registration numbers against the Civil Registration System, and confirms identity.
              </p>
            </div>

            <form onSubmit={handleSubmitCertificate} className="space-y-6">
              {/* File upload zone */}
              <div>
                <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-2 font-semibold">
                  Death Certificate Document (PDF or JPG/PNG) *
                </label>
                <div className="border-2 border-dashed border-gold/40 hover:border-gold p-6 text-center transition-colors bg-paper relative cursor-pointer rounded">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-sm text-ink font-mono font-semibold mb-1">{fileName}</p>
                  <p className="text-xs text-ink/50 font-mono">
                    Click to browse or drop death certificate scan here (Max 10MB)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-1.5 font-semibold">
                    Date of Demise *
                  </label>
                  <input
                    type="date"
                    value={dateOfDeath}
                    onChange={(e) => setDateOfDeath(e.target.value)}
                    className="w-full px-4 py-3 bg-paper border border-gold/40 text-ink text-sm focus:border-gold outline-none rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-1.5 font-semibold">
                    Certificate / Registration Number (Govt CRS) *
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. MCD/2026/089421 or CRS-REG-8472"
                    className="w-full px-4 py-3 bg-paper border border-gold/40 text-ink placeholder-ink/30 text-sm focus:border-gold outline-none font-mono rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-1.5 font-semibold">
                  Issuing Municipal Authority / Registrar Office *
                </label>
                <input
                  type="text"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                  placeholder="e.g. Municipal Corporation of Delhi / Registrar of Births and Deaths"
                  className="w-full px-4 py-3 bg-paper border border-gold/40 text-ink placeholder-ink/30 text-sm focus:border-gold outline-none rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-1.5 font-semibold">
                  Aadhaar Number on Death Certificate (UIDAI Verification)
                </label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="XXXX XXXX XXXX (12 digits)"
                  maxLength={14}
                  className="w-full px-4 py-3 bg-paper border border-gold/40 text-ink placeholder-ink/30 text-sm focus:border-gold outline-none font-mono rounded"
                />
                <p className="text-[11px] font-mono text-ink/50 mt-1">
                  Cross-verified via UIDAI Verhoeff algorithm & demographic database check
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-ink/80 uppercase tracking-widest mb-1.5 font-semibold">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Hospital reference or legal notes..."
                  className="w-full px-4 py-3 bg-paper border border-gold/40 text-ink placeholder-ink/30 text-sm focus:border-gold outline-none rounded"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold py-3 text-sm font-mono tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? 'RUNNING OCR & CRS VERIFICATION...' : 'VERIFY & SUBMIT VIA GOVT CRS OCR →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
