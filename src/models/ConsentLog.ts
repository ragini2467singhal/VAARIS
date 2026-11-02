import mongoose, { Schema, Document } from 'mongoose'

export interface ConsentLogDocument extends Document {
  userId: string
  consentType: string               // 'privacy_policy', 'terms_of_service', 'dpdp_act', 'data_processing'
  consentVersion: string            // Version of the policy (e.g., "1.0", "2023-06")
  status: 'accepted' | 'withdrawn'
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

const ConsentLogSchema = new Schema<ConsentLogDocument>({
  userId: { type: String, required: true, index: true },
  consentType: { type: String, required: true, enum: [
    'privacy_policy',
    'terms_of_service',
    'dpdp_act',
    'data_processing'
  ]},
  consentVersion: { type: String, required: true, default: '1.0' },
  status: { type: String, required: true, enum: ['accepted', 'withdrawn'], default: 'accepted' },
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true })

// Ensure one consent record per user per type
ConsentLogSchema.index({ userId: 1, consentType: 1, timestamp: -1 })

export const ConsentLog = mongoose.models.ConsentLog || mongoose.model<ConsentLogDocument>('ConsentLog', ConsentLogSchema)
