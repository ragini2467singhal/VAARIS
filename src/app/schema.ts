import { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://virasat-theta.vercel.app'

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'LocalBusiness', 'FinancialService'],
  '@id': `${BASE_URL}/#organization`,
  name: 'Virasat - Digital Legacy Vault',
  alternateName: 'Virasat Digital Legacy',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: 'India\'s first zero-knowledge encrypted digital legacy vault. Plan your estate, store insurance documents, create a digital will, and ensure secure asset delivery to your family in Delhi and across India.',
  foundingDate: '2024',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Block 14, Connaught Place',
    addressLocality: 'New Delhi',
    addressRegion: 'DL',
    postalCode: '110001',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 28.6315,
    longitude: 77.2167,
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'support@virasat.in',
    availableLanguage: ['English', 'Hindi'],
    areaServed: 'IN',
  },
  sameAs: [
    'https://twitter.com/virasat',
    'https://linkedin.com/company/virasat',
    'https://github.com/virasat',
  ],
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  serviceType: [
    'Digital Legacy Planning',
    'Estate Planning Services',
    'Insurance Document Management',
    'Digital Will Creation',
    'Beneficiary Management',
    'Asset Protection',
  ],
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  url: BASE_URL,
  name: 'Virasat - Digital Legacy Vault',
  alternateName: 'Virasat',
  description: 'Zero-knowledge encrypted digital legacy vault for Indian families. Plan your estate, manage insurance documents, and create a secure digital will.',
  publisher: {
    '@id': `${BASE_URL}/#organization`,
  },
  inLanguage: 'en-IN',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Digital Legacy Vault & Estate Planning',
  provider: {
    '@id': `${BASE_URL}/#organization`,
  },
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Digital Legacy Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Digital Legacy Vault',
          description: 'Encrypted secure vault to store bank accounts, crypto, property papers, insurance policies, and passwords. Zero-knowledge encryption ensures only you can access your data.',
          serviceType: 'Digital Storage & Security',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
            description: 'Free forever plan with 15 assets',
          },
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Digital Will & Estate Planning',
          description: 'Create a legally structured digital will tailored to Indian succession laws (Hindu Succession Act, Muslim Personal Law, Indian Succession Act). Guide your family through inheritance with zero ambiguity.',
          serviceType: 'Estate Planning & Legal',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Insurance Policy Management',
          description: 'Securely store life insurance, health insurance, and term plan documents. Ensure your executor can file claims without delays after verified demise.',
          serviceType: 'Insurance & Risk Management',
          areaServed: 'New Delhi, India',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Executor & Beneficiary Management',
          description: 'Appoint trusted executors and assign beneficiaries for each vault item. Automatic notification system triggers when check-ins are missed.',
          serviceType: 'Financial Planning',
        },
      },
    ],
  },
}

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${BASE_URL}/#faq`,
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a digital legacy vault?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A digital legacy vault is an encrypted online storage system where you securely store all your important digital and physical assets — bank accounts, insurance policies, property papers, crypto wallets, passwords, and final messages. Virasat uses zero-knowledge encryption, meaning only you can decrypt your data. We never see or access your vault contents.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a digital will in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'India has one of the highest inheritance case pendency rates in the world. Over 1.5 million inheritance cases are currently pending in Indian courts. A digital legacy vault combined with a legal will ensures your assets are distributed according to your wishes without lengthy court battles. Virasat helps you document your wishes and securely delivers your information to your family when needed.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the insurance claims process work with Virasat?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can securely store all insurance policy documents (life insurance, health insurance, term plans) in your Virasat vault. If you miss consecutive check-ins, your appointed executor receives access to the vault after a verification process. This ensures your family can immediately locate policy documents and file claims without delays.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data really secure with zero-knowledge encryption?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Virasat uses client-side AES-256-GCM encryption via PBKDF2 (100,000 iterations). Your master password never leaves your device and is never stored on our servers. We cannot recover your data if you forget your master password. Even our own team cannot access your vault contents.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the check-in system and how does it protect my family?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The check-in system ensures you are alive and safe. If you miss 3 consecutive weekly check-ins, your executor is automatically notified. After they upload a death certificate and a 30-day waiting period, your encrypted vault is delivered to your designated beneficiaries. This prevents fraudulent access while ensuring your family isn\'t left waiting.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Virasat cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Virasat is free to start with our Forever Free plan, which supports up to 15 vault items including insurance documents, bank accounts, property papers, and more. Premium plans offer unlimited assets, additional executors, and priority support starting at affordable monthly rates tailored for Indian families.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Virasat legally valid in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Virasat is a secure storage and delivery tool, not a legal service. While it helps you organize and securely deliver your documents and instructions, it does not replace a legal will or court-mandated succession process. We recommend consulting a qualified lawyer for estate planning under applicable Indian laws. Actual asset ownership transfer follows standard legal procedures.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I manage my life insurance and health insurance documents here?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Virasat supports secure document storage for all types of insurance policies — life insurance, term insurance, health insurance, and property insurance. You can store policy PDFs, nomination details, and claim documents in your encrypted vault. This ensures your family can quickly access these documents when needed.',
      },
    },
  ],
}

export const breadcrumbListSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${BASE_URL}/#breadcrumb`,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: BASE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Sign Up',
      item: `${BASE_URL}/auth/signup`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Login',
      item: `${BASE_URL}/auth/login`,
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'Dashboard',
      item: `${BASE_URL}/dashboard`,
    },
  ],
}

export const schemas = [
  organizationSchema,
  websiteSchema,
  servicesSchema,
  faqSchema,
  breadcrumbListSchema,
]
