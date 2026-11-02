'use client'

import Link from 'next/link'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

type DisclaimerType = 'critical' | 'warning' | 'info'

interface DisclaimerBannerProps {
  type?: DisclaimerType
  title?: string
  showClose?: boolean
  onClose?: () => void
  compact?: boolean
  showLinks?: boolean
}

export function DisclaimerBanner({
  type = 'critical',
  title,
  showClose = false,
  onClose,
  compact = false,
  showLinks = true,
}: DisclaimerBannerProps) {
  const variants = {
    critical: {
      bg: 'bg-red-900/40 border-red-500',
      icon: 'text-red-500',
      text: 'text-red-100',
      title: 'text-red-400',
    },
    warning: {
      bg: 'bg-yellow-900/30 border-yellow-500',
      icon: 'text-yellow-500',
      text: 'text-yellow-100',
      title: 'text-yellow-400',
    },
    info: {
      bg: 'bg-blue-900/30 border-blue-500',
      icon: 'text-blue-500',
      text: 'text-blue-100',
      title: 'text-blue-400',
    },
  }

  const icons = {
    critical: <AlertCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const variant = variants[type]

  if (compact) {
    return (
      <div className={`border-2 rounded-lg p-4 flex items-start gap-3 ${variant.bg}`}>
        <div className={`flex-shrink-0 ${variant.icon} mt-0.5`}>{icons[type]}</div>
        <div className="flex-1">
          <p className={`font-semibold ${variant.title}`}>
            {title || 'Important Disclaimer'}
          </p>
          <p className={`text-sm mt-1 ${variant.text}`}>
            Virasat is a storage and delivery tool only. It does NOT replace a legal Will, transfer assets automatically, or provide legal advice.
            <br />
            <strong>Consult a qualified lawyer before using Virasat for estate planning.</strong>
            {showLinks && (
              <>
                {' '}
                <Link href="/legal" className="underline hover:no-underline">
                  Read full disclaimer.
                </Link>
              </>
            )}
          </p>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${variant.icon} hover:opacity-70`}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`border-2 rounded-lg p-6 ${variant.bg}`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${variant.icon} mt-1`}>{icons[type]}</div>
        <div className="flex-1">
          <h2 className={`text-lg font-bold ${variant.title} mb-3`}>
            {title || '⚠️ Important Legal Disclaimer'}
          </h2>

          <div className={`space-y-3 ${variant.text} text-sm leading-relaxed`}>
            <p>
              <strong>Virasat is a secure digital storage and delivery tool ONLY.</strong> It does NOT:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Replace a legal Will, Trust, or court-mandated succession process</li>
              <li>Provide legal advice on estate planning or succession laws</li>
              <li>Automatically transfer ownership of assets (bank accounts, property, crypto, etc.)</li>
              <li>Serve as a substitute for consulting a qualified lawyer</li>
              <li>Guarantee data delivery in all circumstances</li>
            </ul>

            <p className="mt-4">
              <strong>You must consult a qualified lawyer</strong> for estate planning and succession under applicable
              Indian laws (Hindu Succession Act, Muslim Personal Law, Indian Succession Act, etc.).
            </p>

            {showLinks && (
              <div className="flex gap-4 mt-4">
                <Link href="/terms" className="text-blue-300 hover:underline text-sm">
                  Terms of Service →
                </Link>
                <Link href="/privacy" className="text-blue-300 hover:underline text-sm">
                  Privacy Policy →
                </Link>
                <Link href="/legal" className="text-blue-300 hover:underline text-sm">
                  Full Legal Disclaimer →
                </Link>
              </div>
            )}
          </div>
        </div>

        {showClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${variant.icon} hover:opacity-70`}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default DisclaimerBanner
