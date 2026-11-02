import mongoose, { Schema, Document } from 'mongoose'
import { VaultCategory, MessageType, MessageTriggerType, ExecutorRequestStatus, VerificationStep, TriggerSource, AccessTriggerType, AuditAction } from '@/types'

// ─── BENEFICIARY ─────────────────────────────────────────────────────────────

export interface BeneficiaryDocument extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  email: string
  phone: string
  relationship: string
  deliveryToken?: string
  createdAt: Date
}

const BeneficiarySchema = new Schema<BeneficiaryDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
  deliveryToken: { type: String, default: '' },
}, { timestamps: true })

BeneficiarySchema.index({ userId: 1 })
BeneficiarySchema.index({ deliveryToken: 1 })

export const Beneficiary = mongoose.models.Beneficiary ||
  mongoose.model<BeneficiaryDocument>('Beneficiary', BeneficiarySchema)

// ─── VAULT ITEM ───────────────────────────────────────────────────────────────

export interface VaultItemDocument extends Document {
  userId: mongoose.Types.ObjectId
  category: VaultCategory
  title: string
  encryptedData: string
  assignedTo: mongoose.Types.ObjectId
  hasAttachment: boolean
  attachmentUrl?: string
  lastReviewedAt: Date
  isStale: boolean
  createdAt: Date
  updatedAt: Date
}

const VaultItemSchema = new Schema<VaultItemDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['bank_account', 'fd_rd', 'crypto', 'gold', 'insurance', 'property', 'password', 'bank_locker', 'other'],
    required: true
  },
  title: { type: String, required: true },
  encryptedData: { type: String, required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Beneficiary', required: true },
  hasAttachment: { type: Boolean, default: false },
  attachmentUrl: { type: String },
  lastReviewedAt: { type: Date, default: Date.now },
  isStale: { type: Boolean, default: false },
}, { timestamps: true })

VaultItemSchema.index({ userId: 1 })
VaultItemSchema.index({ userId: 1, category: 1 })

export const VaultItem = mongoose.models.VaultItem ||
  mongoose.model<VaultItemDocument>('VaultItem', VaultItemSchema)

// ─── MESSAGE ─────────────────────────────────────────────────────────────────

export interface MessageDocument extends Document {
  userId: mongoose.Types.ObjectId
  type: MessageType
  title: string
  assignedTo: mongoose.Types.ObjectId
  triggerType: MessageTriggerType
  triggerDate?: Date
  encryptedContentUrl?: string
  encryptedText?: string
  deliveryText?: string
  delivered: boolean
  deliveredAt?: Date
  createdAt: Date
}

const MessageSchema = new Schema<MessageDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['video', 'letter', 'voice'], required: true },
  title: { type: String, required: true },
  triggerType: { type: String, enum: ['on_death', 'on_date'], required: true },
  triggerDate: { type: Date },
  encryptedContentUrl: { type: String },
  encryptedText: { type: String },
  deliveryText: { type: String },
  delivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
}, { timestamps: true })

MessageSchema.index({ userId: 1 })
MessageSchema.index({ delivered: 1, triggerType: 1, triggerDate: 1 })

export const Message = mongoose.models.Message ||
  mongoose.model<MessageDocument>('Message', MessageSchema)

// ─── CHECKIN ─────────────────────────────────────────────────────────────────

export interface CheckInDocument extends Document {
  userId: mongoose.Types.ObjectId
  token: string
  scheduledFor: Date
  respondedAt?: Date
  missed: boolean
  createdAt: Date
}

const CheckInSchema = new Schema<CheckInDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  scheduledFor: { type: Date, required: true },
  respondedAt: { type: Date },
  missed: { type: Boolean, default: false },
}, { timestamps: true })

CheckInSchema.index({ userId: 1, scheduledFor: -1 })

export const CheckIn = mongoose.models.CheckIn ||
  mongoose.model<CheckInDocument>('CheckIn', CheckInSchema)

// ─── EXECUTOR REQUEST ────────────────────────────────────────────────────────

export interface ExecutorRequestDocument extends Document {
  userId: mongoose.Types.ObjectId
  executorId: mongoose.Types.ObjectId
  initiatedAt: Date
  deathCertificateUrl?: string
  dateOfDeath?: string
  verifiedAt?: Date
  unlockDate?: Date
  status: ExecutorRequestStatus
  cancellationReason?: string
  createdAt: Date
}

const ExecutorRequestSchema = new Schema<ExecutorRequestDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  executorId: { type: Schema.Types.ObjectId, ref: 'Executor', required: true },
  initiatedAt: { type: Date, required: true },
  deathCertificateUrl: { type: String },
  dateOfDeath: { type: String },
  verifiedAt: { type: Date },
  unlockDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'verified', 'waiting', 'delivered', 'cancelled'],
    default: 'pending'
  },
  cancellationReason: { type: String },
}, { timestamps: true })

ExecutorRequestSchema.index({ userId: 1 })
ExecutorRequestSchema.index({ status: 1, unlockDate: 1 })

export const ExecutorRequest = mongoose.models.ExecutorRequest ||
  mongoose.model<ExecutorRequestDocument>('ExecutorRequest', ExecutorRequestSchema)

// ─── TRIGGER EVENT ─────────────────────────────────────────────────────────

export interface TriggerEventDocument extends Document {
  userId: mongoose.Types.ObjectId
  executorId?: mongoose.Types.ObjectId
  triggerType: AccessTriggerType
  source: TriggerSource
  verificationStep: VerificationStep
  stepActivatedAt: Date
  gracePeriodEndsAt?: Date
  executorVerifiedAt?: Date
  deathCertificateUrl?: string
  dateOfDeath?: string
  finalApprovedAt?: Date
  documentUploadedAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  cancellationReason?: string
  notes: string[]
  createdAt: Date
}

const TriggerEventSchema = new Schema<TriggerEventDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  executorId: { type: Schema.Types.ObjectId, ref: 'Executor' },
  triggerType: {
    type: String,
    enum: ['checkin_failure', 'manual_trigger', 'inactivity'],
    required: true
  },
  source: {
    type: String,
    enum: ['system', 'family', 'executor', 'emergency_contact'],
    required: true
  },
  verificationStep: {
    type: String,
    enum: ['requested', 'grace_period', 'executor_verification', 'document_upload', 'final_approval', 'completed'],
    default: 'requested'
  },
  stepActivatedAt: { type: Date, required: true },
  gracePeriodEndsAt: { type: Date },
  executorVerifiedAt: { type: Date },
  deathCertificateUrl: { type: String },
  dateOfDeath: { type: String },
  finalApprovedAt: { type: Date },
  documentUploadedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  notes: { type: [String], default: [] },
}, { timestamps: true })

TriggerEventSchema.index({ userId: 1 })
TriggerEventSchema.index({ verificationStep: 1 })
TriggerEventSchema.index({ stepActivatedAt: 1 })

export const TriggerEvent = mongoose.models.TriggerEvent ||
  mongoose.model<TriggerEventDocument>('TriggerEvent', TriggerEventSchema)

// ─── AUDIT LOG ─────────────────────────────────────────────────────────

export interface AuditLogDocument extends Document {
  userId?: mongoose.Types.ObjectId
  executorId?: mongoose.Types.ObjectId
  action: AuditAction
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  success: boolean
  errorMessage?: string
  createdAt: Date
}

const AuditLogSchema = new Schema<AuditLogDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  executorId: { type: Schema.Types.ObjectId, ref: 'Executor' },
  action: {
    type: String,
    enum: [
      'login_success', 'login_failed', 'logout',
      'vault_access', 'vault_update', 'vault_item_create', 'vault_item_delete',
      'beneficiary_add', 'beneficiary_remove',
      'message_create',
      'trigger_initiated', 'trigger_cancelled', 'trigger_completed',
      'recovery_initiated', 'recovery_completed', 'recovery_cancelled',
      'password_changed', 'settings_changed',
      'executor_verified', 'executor_added',
      'data_exported'
    ],
    required: true,
    index: true
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: Schema.Types.Mixed },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } })

AuditLogSchema.index({ userId: 1, timestamp: -1 })
AuditLogSchema.index({ action: 1, timestamp: -1 })
AuditLogSchema.index({ timestamp: -1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }) // Auto-delete after 90 days

export const AuditLog = mongoose.models.AuditLog ||
  mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema)

// Re-export User and Executor models
export { User } from './User'
export { Executor } from './Executor'
export { DeathCertificate } from './DeathCertificate'
export { UserActivity } from './UserActivity'
export { Subscription } from './Subscription'
// AuditLog is exported above at line 270
