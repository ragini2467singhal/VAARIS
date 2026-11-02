import mongoose, { Schema, Document } from 'mongoose'

export interface DeathCertificateDocument extends Document {
  userId: mongoose.Types.ObjectId
  executorId: mongoose.Types.ObjectId
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  ocrText?: string
  ocrConfidence?: number
  applicantName?: string
  deceasedName?: string
  dateOfDeath?: string
  placeOfDeath?: string
  registrationNumber?: string
  issuingAuthority?: string
  status: 'pending' | 'reviewing' | 'verified' | 'rejected' | 'approved'
  reviewedAt?: Date
  reviewedBy?: string
  rejectionReason?: string
  verificationNotes?: string
  unlockDate?: Date
  deliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}

const DeathCertificateSchema = new Schema<DeathCertificateDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  executorId: { type: Schema.Types.ObjectId, ref: 'Executor', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  ocrText: { type: String },
  ocrConfidence: { type: Number },
  applicantName: { type: String },
  deceasedName: { type: String },
  dateOfDeath: { type: String },
  placeOfDeath: { type: String },
  registrationNumber: { type: String },
  issuingAuthority: { type: String },
  status: { type: String, enum: ['pending', 'reviewing', 'verified', 'rejected', 'approved'], default: 'pending' },
  reviewedAt: { type: Date },
  reviewedBy: { type: String },
  rejectionReason: { type: String },
  verificationNotes: { type: String },
  unlockDate: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true })

DeathCertificateSchema.index({ userId: 1, status: 1 })
DeathCertificateSchema.index({ executorId: 1 })
DeathCertificateSchema.index({ status: 1, createdAt: 1 })

export const DeathCertificate = mongoose.models.DeathCertificate || mongoose.model<DeathCertificateDocument>('DeathCertificate', DeathCertificateSchema)
