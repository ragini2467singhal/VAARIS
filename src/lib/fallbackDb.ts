import fs from 'fs'
import path from 'path'
import { hashPasswordSync, verifyPassword } from '@/lib/auth'

export interface FallbackUser {
  _id: string
  id: string
  email: string
  name: string
  phone: string
  religion: string
  dob: string
  passwordHash: string
  encryptionSalt: string
  keyCheck: string
  serverShare: string
  checkInFrequency: string
  lastCheckIn: string
  missedCount: number
  status: string
  plan: string
  maxExecutors: number
  createdAt: string
}

export interface FallbackNominee {
  _id: string
  id: string
  userId: string
  name: string
  email: string
  phone: string
  relationship: string
  uniqueToken: string
  nomineeShare?: string
  executorShare?: string
  status: string
  role: string
  deathCertificateUrl?: string
  dateOfDeath?: string
  createdAt: string
}

export interface FallbackDeathCert {
  _id: string
  id: string
  userId: string
  executorId: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  dateOfDeath?: string
  registrationNumber?: string
  issuingAuthority?: string
  status: string
  createdAt: string
}

const DATA_FILE = path.join(process.cwd(), '.vaaris-data.json')

interface StorageSchema {
  users: FallbackUser[]
  nominees: FallbackNominee[]
  deathCertificates: FallbackDeathCert[]
  vaultItems: any[]
  beneficiaries: any[]
  messages: any[]
}

// Pre-seeded demo user with masterpassword123
// Keycheck encrypted with masterpassword123: modern AES-GCM format
const DEFAULT_SALT = 'e6c2714c6fb7e21a8bd3b999cf3f8373'
// Salt base64: 5sJxTG+34hqL07mZzz+Dcw==

const DEFAULT_STORAGE: StorageSchema = {
  users: [
    {
      _id: 'vaaris-demo-user-1',
      id: 'vaaris-demo-user-1',
      email: 'demo@vaaris.in',
      name: 'Vaaris Demo User',
      phone: '9876543210',
      religion: 'hindu',
      dob: '1990-01-01',
      passwordHash: '$2a$10$wK1m1n7T0kG/F.xsmJbL..2pY/mOaZ8vK9VwO98O01Q1qJ3/rV8iW', // 'demo123'
      encryptionSalt: Buffer.from(DEFAULT_SALT).toString('base64'),
      keyCheck: '', // Allow legacy/modern derive on login
      serverShare: 'share-vaaris-demo-server-2026',
      checkInFrequency: 'weekly',
      lastCheckIn: new Date().toISOString(),
      missedCount: 0,
      status: 'active',
      plan: 'free',
      maxExecutors: 3,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'vaaris-demo-user-2',
      id: 'vaaris-demo-user-2',
      email: 'user@vaaris.com',
      name: 'Rajesh Kumar',
      phone: '9812345678',
      religion: 'hindu',
      dob: '1985-05-15',
      passwordHash: '$2a$10$wK1m1n7T0kG/F.xsmJbL..2pY/mOaZ8vK9VwO98O01Q1qJ3/rV8iW', // 'demo123'
      encryptionSalt: Buffer.from(DEFAULT_SALT).toString('base64'),
      keyCheck: '',
      serverShare: 'share-vaaris-user2-server-2026',
      checkInFrequency: 'weekly',
      lastCheckIn: new Date().toISOString(),
      missedCount: 0,
      status: 'active',
      plan: 'premium',
      maxExecutors: 3,
      createdAt: new Date().toISOString(),
    }
  ],
  nominees: [
    {
      _id: 'nominee-demo-1',
      id: 'nominee-demo-1',
      userId: 'vaaris-demo-user-1',
      name: 'Priya Sharma (Nominee)',
      email: 'nominee@vaaris.in',
      phone: '9876543211',
      relationship: 'Spouse',
      uniqueToken: 'vaaris-nominee-token-demo-2026',
      nomineeShare: '3e8b4a2f1c9d8e7b6a5c4d3e2f1a0b9c8d7e6f5a',
      executorShare: '3e8b4a2f1c9d8e7b6a5c4d3e2f1a0b9c8d7e6f5a',
      status: 'pending',
      role: 'primary',
      createdAt: new Date().toISOString()
    }
  ],
  deathCertificates: [],
  vaultItems: [],
  beneficiaries: [],
  messages: []
}

function loadStorage(): StorageSchema {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_STORAGE, ...parsed }
    }
  } catch (err) {
    console.warn('Could not read .vaaris-data.json, using in-memory store:', err)
  }
  return { ...DEFAULT_STORAGE }
}

function saveStorage(data: StorageSchema) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (err) {
    console.warn('Could not persist to .vaaris-data.json:', err)
  }
}

let memoryStorage: StorageSchema = loadStorage()

export const FallbackDB = {
  getUsers() {
    return memoryStorage.users
  },
  findUserByEmail(email: string) {
    const clean = email.toLowerCase().trim()
    return memoryStorage.users.find(u => u.email.toLowerCase().trim() === clean) || null
  },
  findUserById(id: string) {
    return memoryStorage.users.find(u => u.id === id || u._id === id) || null
  },
  createUser(userData: Partial<FallbackUser>): FallbackUser {
    const id = `user-${Date.now()}`
    const newUser: FallbackUser = {
      _id: id,
      id,
      email: (userData.email || '').toLowerCase().trim(),
      name: userData.name || '',
      phone: userData.phone || '',
      religion: userData.religion || 'hindu',
      dob: userData.dob || '1990-01-01',
      passwordHash: userData.passwordHash || '',
      encryptionSalt: userData.encryptionSalt || Buffer.from(DEFAULT_SALT).toString('base64'),
      keyCheck: userData.keyCheck || '',
      serverShare: userData.serverShare || '',
      checkInFrequency: userData.checkInFrequency || 'weekly',
      lastCheckIn: new Date().toISOString(),
      missedCount: 0,
      status: 'active',
      plan: 'free',
      maxExecutors: 3,
      createdAt: new Date().toISOString(),
      ...userData
    }
    memoryStorage.users.push(newUser)
    saveStorage(memoryStorage)
    return newUser
  },
  updateUser(id: string, updates: Partial<FallbackUser>) {
    const idx = memoryStorage.users.findIndex(u => u.id === id || u._id === id)
    if (idx !== -1) {
      memoryStorage.users[idx] = { ...memoryStorage.users[idx], ...updates }
      saveStorage(memoryStorage)
      return memoryStorage.users[idx]
    }
    return null
  },
  // Nominees
  getNominees(userId?: string) {
    if (userId) {
      return memoryStorage.nominees.filter(n => n.userId === userId)
    }
    return memoryStorage.nominees
  },
  findNomineeByToken(token: string) {
    return memoryStorage.nominees.find(n => n.uniqueToken === token) || null
  },
  findNomineeByEmail(email: string) {
    const clean = email.toLowerCase().trim()
    return memoryStorage.nominees.find(n => n.email.toLowerCase().trim() === clean) || null
  },
  createNominee(data: Partial<FallbackNominee>): FallbackNominee {
    const id = `nominee-${Date.now()}`
    const newNominee: FallbackNominee = {
      _id: id,
      id,
      userId: data.userId || '',
      name: data.name || '',
      email: (data.email || '').toLowerCase().trim(),
      phone: data.phone || '',
      relationship: data.relationship || 'Nominee',
      uniqueToken: data.uniqueToken || `vaaris-token-${Date.now()}`,
      nomineeShare: data.nomineeShare || '',
      executorShare: data.executorShare || data.nomineeShare || '',
      status: data.status || 'pending',
      role: data.role || 'primary',
      createdAt: new Date().toISOString(),
      ...data
    }
    memoryStorage.nominees.push(newNominee)
    saveStorage(memoryStorage)
    return newNominee
  },
  updateNominee(id: string, updates: Partial<FallbackNominee>) {
    const idx = memoryStorage.nominees.findIndex(n => n.id === id || n._id === id)
    if (idx !== -1) {
      memoryStorage.nominees[idx] = { ...memoryStorage.nominees[idx], ...updates }
      saveStorage(memoryStorage)
      return memoryStorage.nominees[idx]
    }
    return null
  },
  // Death Certificates
  createDeathCertificate(cert: Partial<FallbackDeathCert>): FallbackDeathCert {
    const id = `dc-${Date.now()}`
    const newCert: FallbackDeathCert = {
      _id: id,
      id,
      userId: cert.userId || '',
      executorId: cert.executorId || '',
      fileName: cert.fileName || 'death_certificate.pdf',
      fileUrl: cert.fileUrl || '/uploads/death_certificates/default.pdf',
      fileSize: cert.fileSize || 1024,
      mimeType: cert.mimeType || 'application/pdf',
      dateOfDeath: cert.dateOfDeath,
      registrationNumber: cert.registrationNumber,
      issuingAuthority: cert.issuingAuthority,
      status: cert.status || 'pending',
      createdAt: new Date().toISOString(),
      ...cert
    }
    memoryStorage.deathCertificates.push(newCert)
    saveStorage(memoryStorage)
    return newCert
  },
  getDeathCertificates(userId?: string) {
    if (userId) {
      return memoryStorage.deathCertificates.filter(dc => dc.userId === userId)
    }
    return memoryStorage.deathCertificates
  },
  // Vault items
  getVaultItems(userId?: string) {
    if (!memoryStorage.vaultItems) memoryStorage.vaultItems = []
    if (userId) {
      return memoryStorage.vaultItems.filter((v: any) => v.userId === userId)
    }
    return memoryStorage.vaultItems
  },
  createVaultItem(item: any) {
    if (!memoryStorage.vaultItems) memoryStorage.vaultItems = []
    const newItem = { _id: `vault-${Date.now()}`, id: `vault-${Date.now()}`, createdAt: new Date().toISOString(), ...item }
    memoryStorage.vaultItems.push(newItem)
    saveStorage(memoryStorage)
    return newItem
  },
  // Messages
  getMessages(userId?: string) {
    if (!memoryStorage.messages) memoryStorage.messages = []
    if (userId) {
      return memoryStorage.messages.filter((m: any) => m.userId === userId)
    }
    return memoryStorage.messages
  },
  createMessage(msg: any) {
    if (!memoryStorage.messages) memoryStorage.messages = []
    const newMsg = { _id: `msg-${Date.now()}`, id: `msg-${Date.now()}`, createdAt: new Date().toISOString(), ...msg }
    memoryStorage.messages.push(newMsg)
    saveStorage(memoryStorage)
    return newMsg
  },
  // Beneficiaries
  getBeneficiaries(userId?: string) {
    if (!memoryStorage.beneficiaries) memoryStorage.beneficiaries = []
    if (userId) {
      return memoryStorage.beneficiaries.filter((b: any) => b.userId === userId)
    }
    return memoryStorage.beneficiaries
  },
  createBeneficiary(benef: any) {
    if (!memoryStorage.beneficiaries) memoryStorage.beneficiaries = []
    const newB = { _id: `benef-${Date.now()}`, id: `benef-${Date.now()}`, createdAt: new Date().toISOString(), ...benef }
    memoryStorage.beneficiaries.push(newB)
    saveStorage(memoryStorage)
    return newB
  }
}
