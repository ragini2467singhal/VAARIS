export const FREE_ONLY_MODE = (process.env.NEXT_PUBLIC_FREE_ONLY ?? 'true') === 'true'

export const STRIPE_CONFIGURED = Boolean(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_PRICE_ID
)

export const WHATSAPP_CONFIGURED = Boolean(
  process.env.WHATSAPP_TOKEN &&
  process.env.WHATSAPP_PHONE_ID
)
