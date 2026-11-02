import type { UserDocument } from '@/models/User'

export type PlanId = 'free' | 'premium'

export interface PlanLimits {
  assetLimit: number
  executorLimit: number
  canAddVideo: boolean
  canAddAudio: boolean
  channels: ('email' | 'whatsapp' | 'sms')[]
  hasAiWill: boolean
  hasFamilyCollaboration: boolean
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    assetLimit: 15,
    executorLimit: 1,
    canAddVideo: false,
    canAddAudio: false,
    channels: ['email'],
    hasAiWill: false,
    hasFamilyCollaboration: false,
  },
  premium: {
    assetLimit: Infinity,
    executorLimit: 3,
    canAddVideo: true,
    canAddAudio: true,
    channels: ['email', 'whatsapp', 'sms'],
    hasAiWill: true,
    hasFamilyCollaboration: true,
  },
}

export function getUserPlan(user: UserDocument): PlanId {
  return user.plan === 'premium' ? 'premium' : 'free'
}

export function isPremium(user: UserDocument): boolean {
  return user.plan === 'premium' && user.subscriptionStatus === 'active'
}

export function checkAssetLimit(user: UserDocument, currentCount: number): { allowed: boolean; remaining: number } {
  const plan = getUserPlan(user)
  const limit = PLAN_LIMITS[plan].assetLimit

  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity }
  }

  const remaining = Math.max(0, limit - currentCount)
  return {
    allowed: currentCount < limit,
    remaining,
  }
}

export function canAddExecutor(user: UserDocument, currentCount: number): boolean {
  const plan = getUserPlan(user)
  return currentCount < PLAN_LIMITS[plan].executorLimit
}

export function canAddVideoMessage(user: UserDocument): boolean {
  const plan = getUserPlan(user)
  return PLAN_LIMITS[plan].canAddVideo
}

export function getUpgradeMessage(feature: string): string {
  return `Upgrade to Premium to access ${feature}. Free plan includes 15 assets, 1 executor, and email-only notifications.`
}

export function getSubscriptionStatus(user: UserDocument): 'free' | 'premium' | 'expired' | 'pending' {
  if (user.plan !== 'premium' || user.subscriptionStatus === 'cancelled' || user.subscriptionStatus === 'expired') {
    return 'free'
  }
  if (user.subscriptionStatus === 'past_due') {
    return 'expired'
  }
  if (user.subscriptionStatus === 'pending') {
    return 'pending'
  }
  return 'premium'
}
