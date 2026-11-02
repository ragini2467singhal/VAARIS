
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      return Response.json(
        {
          success: false,
          error: 'RESEND_API_KEY is not configured',
        },
        { status: 503 }
      )
    }

    const resend = new Resend(apiKey)

    const body = await req.json()
    const { to, subject, html } = body

    const recipient = to || 'ragini2467singhal@gmail.com'

    const result = await resend.emails.send({
      from: 'noreply@virasat.in',
      to: recipient,
      subject: subject || 'Hello World',
      html:
        html ||
        '<p>Congrats on sending your <strong>first email</strong>!</p>',
    })

    if (result.error) {
      console.error('Resend email error:', result.error)

      return Response.json(
        {
          success: false,
          error: result.error.message,
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Email API error:', error)

    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    )
  }
}
