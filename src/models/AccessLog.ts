import mongoose, { Schema, Document } from 'mongoose'

export interface AccessLogDocument extends Document {
  userId: string
  action: string                    // 'vault_access', 'beneficiary_assignment', 'executor_verification', 'key_share_creation', 'data_export', 'data_deletion'
  resourceType: string              // 'vault_item', 'beneficiary', 'executor', 'key_share', 'account'
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  success: boolean
  details?: Record<string, any>     // Additional context
  errorMessage?: string
}

const AccessLogSchema = new Schema<AccessLogDocument>({
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true, enum: [
    'vault_access',
    'beneficiary_assignment',
    'executor_verification',
    'key_share_creation',
    'data_export',
    'data_deletion',
    'death_verification',
    'delivery_initiated'
  ]},
  resourceType: { type: String, required: true, enum: [
    'vault_item',
    'beneficiary',
    'executor',
    'key_share',
    'account'
  ]},
  resourceId: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  success: { type: Boolean, default: true },
  details: { type: Schema.Types.Mixed },
  errorMessage: { type: String },
}, { timestamps: true })

// Index for queries by userId and timestamp
AccessLogSchema.index({ userId: 1, timestamp: -1 })
// Index for audit trails
AccessLogSchema.index({ action: 1, timestamp: -1 })

export const AccessLog = mongoose.models.AccessLog || mongoose.model<AccessLogDocument>('AccessLog', AccessLogSchema)
