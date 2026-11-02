// ─── USER ────────────────────────────────────────────────────────────────────

export type Religion = 'hindu' | 'muslim' | 'christian' | 'sikh' | 'jain' | 'other'
export type CheckInFrequency = 'weekly' | 'fortnightly' | 'monthly'
export type UserStatus = 'active' | 'pending_verification' | 'verified_deceased' | 'delivered'

// ─── TRIGGER SYSTEM ─────────────────────────────────────────────────────────────

export type VaultTriggerType = 'checkin_failure' | 'manual_trigger' | 'inactivity'
export type VerificationStep = 'requested' | 'grace_period' | 'executor_verification' | 'document_upload' | 'final_approval' | 'completed'
export type TriggerSource = 'system' | 'family' | 'executor' | 'emergency_contact'

// ─── AUDIT LOG ─────────────────────────────────────────────────────────────

export type AuditAction = 
  | 'login_success' 
  | 'login_failed' 
  | 'logout'
  | 'vault_access'
  | 'vault_update'
  | 'vault_item_create'
  | 'vault_item_delete'
  | 'beneficiary_add'
  | 'beneficiary_remove'
  | 'message_create'
  | 'trigger_initiated'
  | 'trigger_cancelled'
  | 'trigger_completed'
  | 'recovery_initiated'
  | 'recovery_completed'
  | 'recovery_cancelled'
  | 'password_changed'
  | 'settings_changed'
  | 'executor_verified'
  | 'executor_added'
  | 'data_exported'

export interface IUser {
  _id: string
  email: string
  name: string
  phone: string
  religion: Religion
  dob: string
  encryptionSalt: string
  keyCheck?: string
  serverShare: string       // Shamir share 1 (encrypted with server key)
  checkInFrequency: CheckInFrequency
  lastCheckIn: string
  lastLogin: string
  missedCount: number
  inactivityDays: number
  snoozeUntil?: string
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// ─── EXECUTOR ────────────────────────────────────────────────────────────────

export type ExecutorStatus = 'pending' | 'notified' | 'verified' | 'cancelled' | 'awaiting_verification'
export type ExecutorRole = 'primary' | 'backup'
export type DeathVerificationStatus = 'pending' | 'requires_action' | 'waiting' | 'delivered' | 'cancelled' | 'rejected'
export type NotificationChannel = 'email' | 'whatsapp' | 'sms'

export interface IExecutor {
  _id: string
  userId: string
  name: string
  email: string
  phone: string
  relationship: string
  uniqueToken: string
  executorShare: string     // Shamir share 2 (QR code for executor)
  status: ExecutorStatus
  role: ExecutorRole
  order: number
  notifiedAt?: string
  verifiedAt?: string
  deathCertificateUrl?: string
  dateOfDeath?: string
  unlockDate?: string
  rejectionReason?: string
  createdAt: string
}

// ─── BENEFICIARY ─────────────────────────────────────────────────────────────

export interface IBeneficiary {
  _id: string
  userId: string
  name: string
  email: string
  phone: string
  relationship: string
  deliveryToken?: string
  createdAt: string
}

// ─── VAULT ITEM ───────────────────────────────────────────────────────────────

export type VaultCategory =
  | 'bank_account'
  | 'fd_rd'
  | 'crypto'
  | 'gold'
  | 'insurance'
  | 'property'
  | 'password'
  | 'bank_locker'
  | 'other'

export interface IVaultItem {
  _id: string
  userId: string
  category: VaultCategory
  title: string               // Plain text label e.g. "SBI Savings Account"
  encryptedData: string       // AES-256-GCM encrypted JSON blob
  assignedTo: string          // beneficiary _id
  hasAttachment: boolean
  attachmentUrl?: string      // encrypted R2 URL
  createdAt: string
  updatedAt: string
}

// Decrypted vault item data by category
export interface BankAccountData {
  bankName: string
  accountNumber: string
  accountType: string
  branch: string
  ifsc: string
  nomineeName: string
  linkedPhone: string
  netBankingLogin?: string
  netBankingPassword?: string
}

export interface FDData {
  bankName: string
  fdNumber: string
  amount: string
  interestRate: string
  startDate: string
  maturityDate: string
  autoRenewal: boolean
  certificateLocation: string
}

export interface CryptoData {
  exchangeName: string
  loginEmail: string
  loginPassword: string
  twoFABackupCodes?: string
  walletAddresses?: string
  seedPhrase?: string
  approximateValue: string
}

export interface GoldData {
  form: string
  weight: string
  purity: string
  location: string
  description: string
  receiptLocation?: string
}

export interface InsuranceData {
  company: string
  policyNumber: string
  policyType: string
  sumAssured: string
  premiumAmount: string
  nomineeName: string
  maturityDate: string
  agentContact?: string
}

export interface PropertyData {
  type: string
  address: string
  registrationNumber: string
  coOwners?: string
  documentLocation: string
  loanOutstanding: boolean
  loanBank?: string
  loanAmount?: string
}

export interface PasswordData {
  serviceName: string
  url?: string
  username: string
  password: string
  twoFABackupCodes?: string
  notes?: string
}

export interface BankLockerData {
  bankName: string
  branch: string
  lockerNumber: string
  keyLocation: string
  contentsDescription: string
}

export interface OtherData {
  title: string
  description: string
  value?: string
  location?: string
}

export type VaultItemData =
  | BankAccountData
  | FDData
  | CryptoData
  | GoldData
  | InsuranceData
  | PropertyData
  | PasswordData
  | BankLockerData
  | OtherData

// ─── MESSAGE ─────────────────────────────────────────────────────────────────

export type MessageType = 'video' | 'letter' | 'voice'
export type MessageTriggerType = 'on_death' | 'on_date'

export type AccessTriggerType = 'checkin_failure' | 'manual_trigger' | 'inactivity'

export interface IMessage {
  _id: string
  type: MessageType
  title: string
  assignedTo: string          // beneficiary _id
  triggerType: MessageTriggerType
  triggerDate?: string        // if on_date
  encryptedContentUrl?: string // for video/voice
  encryptedText?: string      // for letter
  deliveryText?: string       // encrypted for delivery (server-side)
  delivered: boolean
  deliveredAt?: string
  createdAt: string
}

// ─── CHECKIN ─────────────────────────────────────────────────────────────────

export interface ICheckIn {
  _id: string
  userId: string
  token: string
  scheduledFor: string
  respondedAt?: string
  missed: boolean
  createdAt: string
}

// ─── EXECUTOR REQUEST ────────────────────────────────────────────────────────

export type ExecutorRequestStatus =
  | 'pending'
  | 'verified'
  | 'waiting'      // 30 day wait
  | 'delivered'
  | 'cancelled'

export interface IExecutorRequest {
  _id: string
  userId: string
  executorId: string
  initiatedAt: string
  deathCertificateUrl?: string
  dateOfDeath?: string
  verifiedAt?: string
  unlockDate?: string
  status: ExecutorRequestStatus
  cancellationReason?: string
}

// ─── API RESPONSES ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  encryptionSalt: string
  keyCheck?: string
  status: UserStatus
}

export interface LoginResponse {
  user: AuthUser
  token: string
}

export interface DashStats {
  userId: string
  vaultItems: number
  messages: number
  beneficiaries: number
  hasExecutor: boolean
  lastCheckIn?: string
  status?: string
  missedCount: number
  checkInFrequency?: string
  snoozeUntil?: string
}
