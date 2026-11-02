import mongoose, { Schema, Document } from 'mongoose'

export interface SubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId
  plan: 'free' | 'premium'
  razorpaySubscriptionId?: string
  razorpayCustomerId?: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelledAt?: Date
  cancelAtPeriodEnd: boolean
  reminderSent: boolean
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<SubscriptionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  razorpaySubscriptionId: { type: String },
  razorpayCustomerId: { type: String },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  cancelledAt: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true })

SubscriptionSchema.index({ userId: 1 })
SubscriptionSchema.index({ razorpaySubscriptionId: 1 })
SubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 })

export const Subscription = mongoose.models.Subscription || mongoose.model<SubscriptionDocument>('Subscription', SubscriptionSchema)
