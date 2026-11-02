import mongoose, { Schema, Document } from 'mongoose'

export interface UserActivityDocument extends Document {
  userId: mongoose.Types.ObjectId
  action: string
  category: 'vault' | 'beneficiary' | 'executor' | 'message' | 'settings' | 'checkin' | 'recovery' | 'security'
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const UserActivitySchema = new Schema<UserActivityDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  category: { type: String, enum: ['vault', 'beneficiary', 'executor', 'message', 'settings', 'checkin', 'recovery', 'security'], required: true },
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true })

UserActivitySchema.index({ userId: 1, createdAt: -1 })
UserActivitySchema.index({ category: 1, createdAt: -1 })

export const UserActivity = mongoose.models.UserActivity || mongoose.model<UserActivityDocument>('UserActivity', UserActivitySchema)
