import { WHATSAPP_CONFIGURED } from '@/lib/flags'

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || ''
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
let warnedMissing = false

function ensureWhatsAppEnabled() {
  if (WHATSAPP_CONFIGURED) return true
  if (!warnedMissing) {
    console.warn('WhatsApp disabled: missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID')
    warnedMissing = true
  }
  return false
}

async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  if (!ensureWhatsAppEnabled()) return false
  // Format Indian numbers: 91XXXXXXXXXX
  const formatted = to.startsWith('+') ? to.slice(1) : to.startsWith('91') ? to : `91${to}`

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formatted,
        type: 'text',
        text: { body: message }
      })
    })
    return res.ok
  } catch (err) {
    console.error('WhatsApp send failed:', err)
    return false
  }
}

// ─── CHECKIN PING ─────────────────────────────────────────────────────────────

export async function sendCheckInWhatsApp(user: {
  name: string
  phone: string
  token: string
}): Promise<boolean> {
  const confirmUrl = `${APP_URL}/checkin/confirm?token=${user.token}`
  const firstName = user.name.split(' ')[0]

  const message = `👋 *Vaaris Check-in*\n\nHi ${firstName}, your weekly check-in is here.\n\nTap to confirm you're okay:\n${confirmUrl}\n\n_Takes 1 second. Keeps your family safe._`

  return sendWhatsAppMessage(user.phone, message)
}

// ─── MISSED CHECK-IN ALERT ────────────────────────────────────────────────────

export async function sendMissedCheckInWhatsApp(user: {
  name: string
  phone: string
  token: string
  missCount: number
}): Promise<boolean> {
  const confirmUrl = `${APP_URL}/checkin/confirm?token=${user.token}`
  const snoozeUrl = `${APP_URL}/settings/snooze`
  const firstName = user.name.split(' ')[0]

  const message = `⚠️ *Vaaris — Missed Check-in #${user.missCount}*\n\nHi ${firstName}, you've missed your Vaaris check-in.\n\nIf you're okay, please confirm now:\n${confirmUrl}\n\nTravelling or in hospital? Snooze here:\n${snoozeUrl}\n\n_If we don't hear from you, we'll contact your emergency person._`

  return sendWhatsAppMessage(user.phone, message)
}

// ─── EMERGENCY CONTACT ────────────────────────────────────────────────────────

export async function sendEmergencyContactWhatsApp(contact: {
  name: string
  phone: string
  ownerName: string
  ownerPhone: string
}): Promise<boolean> {
  const firstName = contact.name.split(' ')[0]

  const message = `🔔 *Vaaris Safety Alert*\n\nHi ${firstName},\n\n*${contact.ownerName}* hasn't responded to their Vaaris check-ins for 2 weeks. They listed you as their emergency contact.\n\nCould you please check on them? Their number: *${contact.ownerPhone}*\n\nIf they're fine, ask them to log in to vaaris.in to confirm their check-in.\n\n_This is an automated safety message from Vaaris._`

  return sendWhatsAppMessage(contact.phone, message)
}

// ─── EXECUTOR TRIGGER ─────────────────────────────────────────────────────────

export async function sendExecutorTriggerWhatsApp(executor: {
  name: string
  phone: string
  ownerName: string
  token: string
}): Promise<boolean> {
  const executorUrl = `${APP_URL}/executor/${executor.token}`
  const firstName = executor.name.split(' ')[0]

  const message = `🔐 *Vaaris — Vault Trigger Alert*\n\nDear ${firstName},\n\n*${executor.ownerName}* has missed 3 consecutive Vaaris check-ins.\n\nAs their trusted Nominee / Executor, please open the Nominee Portal:\n${executorUrl}\n\nYou can mark this as a false alarm OR begin the verification process if ${executor.ownerName} has passed away.\n\n_The owner has 48 hours to cancel this if it's a mistake._`

  return sendWhatsAppMessage(executor.phone, message)
}

// ─── OWNER VAULT TRIGGERED ALERT ────────────────────────────────────────────

export async function sendOwnerVaultTriggeredWhatsApp(user: {
  name: string
  phone: string
}): Promise<boolean> {
  const cancelUrl = `${APP_URL}/dashboard?action=cancel-trigger`
  const firstName = user.name.split(' ')[0]

  const message = `🚨 *Vaaris — Vault Unlock Initiated*\n\nHi ${firstName},\n\nYour executor has initiated vault verification. If this is a mistake, please log in immediately to cancel:\n${cancelUrl}\n\n*You have 48 hours to cancel.*\n\nIf you cannot access Vaaris, please contact us at support@vaaris.in`

  return sendWhatsAppMessage(user.phone, message)
}

// ─── FINAL MESSAGE DELIVERY ─────────────────────────────────────────────────

export async function sendFinalMessageDeliveryWhatsApp(beneficiary: {
  name: string
  phone: string
  ownerName: string
  deliveryUrl: string
}): Promise<boolean> {
  const firstName = beneficiary.name.split(' ')[0]
  const message = `Vaaris — Final Message\n\nHi ${firstName}, ${beneficiary.ownerName} left a final message for you.\n\nOpen here:\n${beneficiary.deliveryUrl}\n\nPlease keep this link private.`
  return sendWhatsAppMessage(beneficiary.phone, message)
}
