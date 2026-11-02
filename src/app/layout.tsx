import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { Cormorant_Garamond, JetBrains_Mono, Outfit } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'
import { schemas } from '@/app/schema'
import './globals.css'

const CustomCursor = dynamic(() => import('@/components/custom-cursor'), { ssr: false })

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Vaaris - Digital Legacy Vault & Nominee Succession Platform',
    template: '%s | Vaaris',
  },
  description: 'Secure your family\'s future with Vaaris, India\'s trusted digital legacy platform. Encrypted digital vault for insurance documents, property papers, crypto, and wills using AES-256 and Shamir\'s Secret Sharing.',
  keywords: [
    'digital will India',
    'estate planning Delhi',
    'insurance policy management India',
    'digital legacy vault',
    'inheritance planning India',
    'secure document storage India',
    'beneficiary management',
    'life insurance documents',
    'property will online',
    'crypto inheritance India',
    'asset protection Delhi NCR',
    'family legacy planning',
    'succession planning India',
    'online will India',
    'secure vault for insurance',
    'Hindu Succession Act',
    'Indian succession law',
    'digital executor India',
    'vault delivery system India',
  ],
  authors: [{ name: 'Virasat Team' }],
  creator: 'Virasat Technologies',
  publisher: 'Virasat Technologies',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'Financial Services',
  classification: 'Estate Planning, Digital Legacy, Insurance Management',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    alternateLocale: 'hi_IN',
    url: 'https://virasat-theta.vercel.app',
    siteName: 'Virasat - Digital Legacy Vault',
    title: 'Virasat - Secure Your Family\'s Future | Digital Legacy Vault in India',
    description: 'India\'s first zero-knowledge encrypted digital legacy vault. Store insurance documents, plan your estate, create a digital will, and ensure secure delivery to your family. Trusted by families across Delhi NCR.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Virasat - Digital Legacy Vault',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virasat - Digital Legacy Vault & Estate Planning India',
    description: 'Encrypted vault for your insurance documents, wills, and assets. Plan your estate. Protect your family\'s future.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://virasat-theta.vercel.app',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${outfit.variable} ${jetbrains.variable}`}
    >
      <body
        suppressHydrationWarning
        className="font-body bg-paper text-ink antialiased"
      >
        <CustomCursor />
        {children}
        <Toaster position="bottom-right" />
        {schemas.map((schema, index) => (
          <Script
            key={index}
            id={`schema-org-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </body>
    </html>
  )
}
