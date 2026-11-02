import mongoose, { Schema, Document } from 'mongoose'
import { ExecutorStatus, ExecutorRole } from '@/types'

export interface ExecutorDocument extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  email: string
  phone: string
  relationship: string
  uniqueToken: string
  executorShare: string
  status: ExecutorStatus
  role: ExecutorRole
  order: number
  notifiedAt?: Date
  verifiedAt?: Date
  deathCertificateUrl?: string
  dateOfDeath?: string
  unlockDate?: Date
  rejectionReason?: string
  createdAt: Date
  verifiedEmailAt?: Date
  identityVerified: boolean
  currentStep: number
  flowCompleted: boolean
  vaultAccessToken?: string
}

const ExecutorSchema = new Schema<ExecutorDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
  uniqueToken: { type: String, required: true, unique: true },
  executorShare: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'notified', 'verified', 'cancelled', 'awaiting_verification'], default: 'pending' },
  role: { type: String, enum: ['primary', 'backup'], default: 'primary' },
  order: { type: Number, default: 0 },
  notifiedAt: { type: Date },
  verifiedAt: { type: Date },
  deathCertificateUrl: { type: String },
  dateOfDeath: { type: String },
  unlockDate: { type: Date },
  rejectionReason: { type: String },
  verifiedEmailAt: { type: Date },
  identityVerified: { type: Boolean, default: false },
  currentStep: { type: Number, default: 0 },
  flowCompleted: { type: Boolean, default: false },
  vaultAccessToken: { type: String },
}, { timestamps: true })

ExecutorSchema.index({ userId: 1, role: 1 })
ExecutorSchema.index({ uniqueToken: 1 })

export const Executor = mongoose.models.Executor || mongoose.model<ExecutorDocument>('Executor', ExecutorSchema)
