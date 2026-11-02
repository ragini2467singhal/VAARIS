import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_vercel_builds')
const FROM = process.env.FROM_EMAIL || 'noreply@virasat.in'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// --- EXECUTOR WELCOME ----------------------------------------------------------

export async function sendExecutorWelcomeEmail(executor: {
  name: string
  email: string
  ownerName: string
}) {
  return resend.emails.send({
    from: FROM,
    to: executor.email,
    subject: `${executor.ownerName} has named you as their Virasat Executor`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
          <p style="color: #8BA5BC; margin: 8px 0 0; font-size: 13px; letter-spacing: 2px;">DIGITAL LEGACY VAULT</p>
        </div>
        <p style="color: #2C2C2C; font-size: 17px; line-height: 1.8;">Dear ${executor.name},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          <strong>${executor.ownerName}</strong> has named you as the trusted Executor of their Virasat digital legacy vault.
        </p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          This means that if something were to happen to ${executor.ownerName}, you will be the person who helps their family access everything they've left behind.
        </p>
        <div style="background: #1B2F45; padding: 20px; border-left: 4px solid #C9A84C; margin: 30px 0;">
          <p style="color: #E8D5A3; margin: 0; font-size: 15px; line-height: 1.7;">
            <strong>You don't need to do anything right now.</strong><br>
            We will only contact you if ${executor.ownerName} misses multiple check-ins and we are unable to reach them.
          </p>
        </div>
        <p style="color: #6B7280; font-size: 14px; line-height: 1.8;">
          This is one of the greatest acts of trust. ${executor.ownerName} trusts you with the responsibility of protecting their family's future.
        </p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #D5CDB8; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px;">Virasat - A love letter to your family's future</p>
          <p style="color: #9CA3AF; font-size: 12px;">virasat.in</p>
        </div>
      </div>
    `
  })
}

// --- CHECKIN REMINDER --------------------------------------------------------

export async function sendCheckinEmail(user: {
  name: string
  email: string
  token: string
}) {
  const confirmUrl = `${APP_URL}/checkin/confirm?token=${user.token}`
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Virasat Check-in - Are you okay, ${user.name.split(' ')[0]}?`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Hi ${user.name.split(' ')[0]}</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">Your weekly Virasat check-in. One tap is all it takes.</p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${confirmUrl}" style="background: #C9A84C; color: #0D1B2A; padding: 16px 48px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
            I'm Okay
          </a>
        </div>
        <p style="color: #6B7280; font-size: 14px; text-align: center;">
          Travelling or in hospital?
          <a href="${APP_URL}/settings/snooze" style="color: #C9A84C;">Snooze check-ins here</a>
        </p>
      </div>
    `
  })
}

// --- MISSED CHECK-IN EMAIL ---------------------------------------------------

export async function sendMissedCheckinEmail(user: {
  name: string
  email: string
  token: string
  missCount: number
}) {
  const confirmUrl = `${APP_URL}/checkin/confirm?token=${user.token}`
  const snoozeUrl = `${APP_URL}/settings/snooze`
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Reminder: Please confirm your Virasat check-in`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Hi ${user.name.split(' ')[0]},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          You missed your Virasat check-in. Please confirm you are okay so we do not alert your emergency contact.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="background: #C9A84C; color: #0D1B2A; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
            Confirm I'm Okay
          </a>
        </div>
        <p style="color: #6B7280; font-size: 14px; text-align: center;">
          Travelling or in hospital? <a href="${snoozeUrl}" style="color: #C9A84C;">Snooze check-ins</a>
        </p>
      </div>
    `
  })
}

// --- MISS 2 - EMERGENCY CONTACT --------------------------------------------

export async function sendEmergencyContactEmail(contact: {
  name: string
  email: string
  ownerName: string
  ownerPhone: string
  appUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: contact.email,
    subject: `Please check on ${contact.ownerName} - Virasat`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Dear ${contact.name},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          <strong>${contact.ownerName}</strong> has not responded to their Virasat check-ins for 2 weeks. They listed you as an emergency contact.
        </p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          Could you please check on them? Their phone number is: <strong>${contact.ownerPhone}</strong>
        </p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          If everything is fine, please ask them to log in to <a href="${contact.appUrl}" style="color: #C9A84C;">virasat.in</a> and confirm their check-in.
        </p>
        <div style="background: #FFF8EC; padding: 16px; border-left: 4px solid #C9A84C; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #8B6914;">This is an automated safety check. If ${contact.ownerName} is fine, no further action is needed.</p>
        </div>
      </div>
    `
  })
}

// --- MISS 3 - EXECUTOR NOTIFICATION -----------------------------------------

export async function sendExecutorTriggerEmail(executor: {
  name: string
  email: string
  ownerName: string
  token: string
}) {
  const executorUrl = `${APP_URL}/executor/${executor.token}`
  return resend.emails.send({
    from: FROM,
    to: executor.email,
    subject: `URGENT: ${executor.ownerName}'s Virasat vault has been triggered`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <div style="background: #8B2635; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: white; margin: 0; font-size: 15px; font-weight: bold;">VAULT TRIGGER NOTIFICATION</p>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Dear ${executor.name},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          <strong>${executor.ownerName}</strong> has not responded to 3 consecutive Virasat check-ins. As their trusted Executor, you are being notified.
        </p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          Please click below to proceed with verification if <strong>${executor.ownerName} has passed away</strong>, or to mark this as a false alarm.
        </p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${executorUrl}" style="background: #0D1B2A; color: #C9A84C; padding: 16px 48px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block; border: 2px solid #C9A84C;">
            Open Executor Portal
          </a>
        </div>
      </div>
    `
  })
}

// --- DELIVERY CONFIRMATION ----------------------------------------------------

export async function sendDeliveryConfirmationEmail(executor: {
  name: string
  email: string
  ownerName: string
}) {
  return sendExecutorVerificationEmail({
    name: executor.name,
    email: executor.email,
    ownerName: executor.ownerName,
    triggerToken: '',
    verifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/executor`,
  })
}

// --- DELIVERY NOTIFICATION ----------------------------------------------------

export async function sendDeliveryNotificationEmail(beneficiary: {
  name: string
  email: string
  ownerName: string
  items?: Array<{ title: string; category: string }>
}) {
  return sendVaultDeliveryEmail({
    name: beneficiary.name,
    email: beneficiary.email,
    ownerName: beneficiary.ownerName,
    items: beneficiary.items || [],
  })
}

// --- WHATSAPP ALIASES ----------------------------------------------------------

export async function sendDeliveryNotificationWhatsApp(beneficiary: {
  name: string
  phone: string
  ownerName: string
}): Promise<boolean> {
  return { sendCheckInWhatsApp: () => Promise.resolve(true) } as any
}

export async function sendVaultDeliveryEmail(beneficiary: {
  name: string
  email: string
  ownerName: string
  items: Array<{ title: string; category: string }>
}) {
  return resend.emails.send({
    from: FROM,
    to: beneficiary.email,
    subject: `${beneficiary.ownerName} left something for you - Virasat`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Dear ${beneficiary.name},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          <strong>${beneficiary.ownerName}</strong> loved you deeply and left the following for you:
        </p>
        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 4px;">
          ${beneficiary.items.map(item => `
            <div style="padding: 12px 0; border-bottom: 1px solid #E5E0D5;">
              <p style="margin: 0; font-size: 15px; color: #2C2C2C;"><strong>${item.title}</strong></p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">${item.category.replace('_', ' ')}</p>
            </div>
          `).join('')}
        </div>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          Please contact the Executor to access the full vault details.
        </p>
      </div>
    `
  })
}

// --- FINAL MESSAGE DELIVERY --------------------------------------------------

export async function sendFinalMessageDeliveryEmail(beneficiary: {
  name: string
  email: string
  ownerName: string
  deliveryUrl: string
  count: number
}) {
  return resend.emails.send({
    from: FROM,
    to: beneficiary.email,
    subject: `${beneficiary.ownerName} left you a final message - Virasat`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Dear ${beneficiary.name},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          ${beneficiary.ownerName} left ${beneficiary.count} final message${beneficiary.count === 1 ? '' : 's'} for you.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${beneficiary.deliveryUrl}" style="background: #C9A84C; color: #0D1B2A; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
            Open Your Messages
          </a>
        </div>
        <p style="color: #6B7280; font-size: 12px; text-align: center;">
          This link is private. Please do not share it.
        </p>
      </div>
    `
  })
}

// --- RECOVERY INITIATED ----------------------------------------------------

export async function sendRecoveryInitiatedEmail(user: {
  name: string
  email: string
  recoveryUrl: string
  expiryDays: number
}) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Virasat Password Recovery Initiated',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <div style="background: #8B2635; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: white; margin: 0; font-size: 15px; font-weight: bold;">PASSWORD RECOVERY INITIATED</p>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Hi ${user.name.split(' ')[0]},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          A password recovery was requested for your Virasat vault.
        </p>
        <div style="background: #FFF8EC; padding: 16px; border-left: 4px solid #C9A84C; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #8B6914;">
            <strong>Waiting period:</strong> ${user.expiryDays} days. You can cancel anytime before the waiting period ends.
          </p>
        </div>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          If this wasn't you, click below to cancel immediately:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${user.recoveryUrl}" style="background: #8B2635; color: white; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
            Cancel Recovery
          </a>
        </div>
        <p style="color: #6B7280; font-size: 12px; text-align: center;">
          Recovery will be available after ${user.expiryDays} days. You will receive another email when ready.
        </p>
      </div>
    `
  })
}

// --- TRIGGER GRACE PERIOD NOTIFICATION ------------------------------------

export async function sendTriggerGracePeriodEmail(user: {
  name: string
  email: string
  triggerType: string
  confirmUrl: string
  graceDays: number
}) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Action Required: Verify your Virasat vault (${user.triggerType})`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <div style="background: #8B6914; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: white; margin: 0; font-size: 15px; font-weight: bold;">ACTION REQUIRED</p>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Hi ${user.name.split(' ')[0]},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          A <strong>${user.triggerType}</strong> was triggered for your vault. This is a security check.
        </p>
        <div style="background: #FFF8EC; padding: 16px; border-left: 4px solid #C9A84C; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #8B6914;">
            <strong>Grace period:</strong> ${user.graceDays} days. If you don't respond, your executor will be notified.
          </p>
        </div>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          If you're okay, click below to cancel this trigger:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${user.confirmUrl}" style="background: #2E7D32; color: white; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
            I'm Okay
          </a>
        </div>
      </div>
    `
  })
}

// --- TRIGGER EXECUTOR VERIFICATION -------------------------------------------

export async function sendExecutorVerificationEmail(executor: {
  name: string
  email: string
  ownerName: string
  triggerToken: string
  verifyUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: executor.email,
    subject: `URGENT: Verify ${executor.ownerName}'s status - Virasat`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <div style="background: #8B2635; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: white; margin: 0; font-size: 15px; font-weight: bold;">VERIFICATION REQUIRED</p>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Dear ${executor.name},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          The grace period has ended for <strong>${executor.ownerName}</strong>'s vault trigger. We need your help to verify their status.
        </p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          Please verify if they are deceased or alive:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${executor.verifyUrl}" style="background: #0D1B2A; color: #C9A84C; padding: 16px 48px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block; border: 2px solid #C9A84C;">
            Verify Status
          </a>
        </div>
      </div>
    `
  })
}

// --- TRIGGER DOCUMENT UPLOAD ----------------------------------------------

export async function sendDocumentUploadEmail(executor: {
  name: string
  email: string
  uploadUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: executor.email,
    subject: 'Death Certificate Required - Virasat Vault',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Dear ${executor.name},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          You've verified that the account holder has passed away. Please upload the death certificate to proceed.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${executor.uploadUrl}" style="background: #C9A84C; color: #0D1B2A; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
            Upload Document
          </a>
        </div>
      </div>
    `
  })
}

// --- TRIGGER COMPLETED -----------------------------------------------

export async function sendTriggerCompletedEmail(beneficiaries: Array<{name: string, email: string}>, ownerName: string) {
  return resend.emails.send({
    from: FROM,
    to: beneficiaries.map(b => b.email),
    subject: `${ownerName}'s Virasat Vault Has Been Delivered`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <div style="background: #2E7D32; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: white; margin: 0; font-size: 15px; font-weight: bold;">VAULT DELIVERED</p>
        </div>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          <strong>${ownerName}</strong>'s digital legacy vault has been delivered to their beneficiaries.
        </p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          The Executor will be in touch with details on how to access the vault contents.
        </p>
      </div>
    `
  })
}

// --- VAULT REVIEW REMINDER ----------------------------------------

export async function sendVaultReviewReminderEmail(user: {
  name: string
  email: string
  reviewUrl: string
  vaultScore: number
  staleItems: number
  nextReviewDate: string
}) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `${user.name.split(' ')[0]}, time to review your Virasat vault`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Hi ${user.name.split(' ')[0]},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          It's time for a quarterly review of your digital legacy vault. Keeping your information up-to-date ensures your family can access everything when they need it.
        </p>
        <div style="background: #1B2F45; padding: 24px; margin: 24px 0; border-radius: 8px; text-align: center;">
          <p style="color: #C9A84C; margin: 0; font-size: 48px; font-weight: bold;">${user.vaultScore}%</p>
          <p style="color: #8BA5BC; margin: 8px 0 0; font-size: 14px;">Vault Completeness</p>
          ${user.staleItems > 0 ? `
          <p style="color: #EF4444; margin: 16px 0 0; font-size: 14px;">${user.staleItems} item${user.staleItems > 1 ? 's' : ''} need attention</p>
          ` : ''}
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${user.reviewUrl}" style="background: #C9A84C; color: #0D1B2A; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
            Review My Vault
          </a>
        </div>
        <p style="color: #6B7280; font-size: 12px; text-align: center;">
          Next review recommended: ${user.nextReviewDate}
        </p>
      </div>
    `
  })
}

// --- VAULT UPDATED CONFIRMATION ------------------------------------

export async function sendVaultUpdatedConfirmationEmail(user: {
  name: string
  email: string
  vaultScore: number
  itemsUpdated: number
}) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Your Virasat vault is ${user.vaultScore}% complete`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <div style="text-align: center;">
          <p style="color: #C9A84C; font-size: 48px; font-weight: bold; margin: 0;">${user.vaultScore}%</p>
          <p style="color: #2C2C2C; margin: 8px 0 24px;">Vault Completeness</p>
        </div>
        <p style="color: #2C2C2C; font-size: 16px;">
          Thanks for updating your vault, ${user.name.split(' ')[0]}! Your digital legacy is more complete now.
        </p>
        ${user.itemsUpdated > 0 ? `
        <p style="color: #2C2C2C; font-size: 14px;">
          ${user.itemsUpdated} item${user.itemsUpdated > 1 ? 's' : ''} updated this session.
        </p>
        ` : ''}
      </div>
    `
  })
}

// --- RECOVERY READY ----------------------------------------------------

export async function sendRecoveryReadyEmail(user: {
  name: string
  email: string
  recoveryUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Your Virasat Password Recovery is Ready',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <div style="background: #2E7D32; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: white; margin: 0; font-size: 15px; font-weight: bold;">RECOVERY READY</p>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Hi ${user.name.split(' ')[0]},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          Your password recovery waiting period has ended. You can now reset your password.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${user.recoveryUrl}" style="background: #C9A84C; color: #0D1B2A; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
            Reset Password
          </a>
        </div>
        <p style="color: #6B7280; font-size: 12px; text-align: center;">
          If you did not initiate this recovery, please contact support immediately.
        </p>
      </div>
    `
  })
}

// --- RECOVERY COMPLETED ----------------------------------------------------

export async function sendRecoveryCompletedEmail(user: {
  name: string
  email: string
}) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Your Virasat Password has Been Reset',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5F0E8; padding: 40px;">
        <div style="background: #0D1B2A; padding: 30px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #C9A84C; font-size: 32px; margin: 0; letter-spacing: 4px;">VIRASAT</h1>
        </div>
        <p style="color: #2C2C2C; font-size: 17px;">Hi ${user.name.split(' ')[0]},</p>
        <p style="color: #2C2C2C; font-size: 16px; line-height: 1.8;">
          Your Virasat password has been successfully reset.
        </p>
        <div style="background: #FFF8EC; padding: 16px; border-left: 4px solid #C9A84C; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #8B6914;">
            <strong>Important:</strong> Your old master password is no longer valid. You'll need your new password (combined with your shares) to access your vault.
          </p>
        </div>
      </div>
    `
  })
}
