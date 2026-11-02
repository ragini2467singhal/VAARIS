export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ok, unauthorized, badRequest, serverError } from '@/lib/api'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not configured')
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const { type, details } = body

    if (!type || !details) return badRequest('Missing type or details')

    let prompt = ''

    switch (type) {
      case 'will':
        prompt = `Generate a comprehensive legal will in India based on these details: ${JSON.stringify(details)}

Include:
- Proper legal structure for Indian law
- Asset distribution
- Executor appointment
- Guardianship for minors
- Digital asset handling
- Professional formatting

Make it legally sound and culturally appropriate for India.`
        break

      case 'message':
        prompt = `Write a heartfelt final message for: ${JSON.stringify(details)}

Make it personal, emotional, and appropriate for the relationship.
Include memories, advice, love, and final wishes.
Keep it under 500 words.`
        break

      case 'executor_letter':
        prompt = `Write a formal letter to an executor explaining their responsibilities: ${JSON.stringify(details)}

Include:
- Legal responsibilities
- Step-by-step process
- Emotional support guidance
- Contact information`
        break

      default:
        return badRequest('Invalid type')
    }

    const payload = {
      contents: [
        {
          parts: [
            { text: `You are a legal expert specializing in Indian inheritance law and estate planning.\n\n${prompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    }

    let geminiRes = await fetchWithBackoff(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      payload,
      1
    )

    if (!geminiRes.ok) {
      console.error('Gemini primary model error:', geminiRes.status, await geminiRes.text())
      geminiRes = await fetchWithBackoff(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        payload,
        1
      )
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini fallback model error:', geminiRes.status, errText)
      try {
        const errJson = JSON.parse(errText)
        const userMessage = errJson?.error?.message || `AI generation failed (HTTP ${geminiRes.status})`
        return serverError(userMessage)
      } catch {
        return serverError(`AI generation failed: ${geminiRes.status}`)
      }
    }

    const geminiData = await geminiRes.json()
    const generatedContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!generatedContent) {
      console.error('Gemini response missing content:', JSON.stringify(geminiData).slice(0, 500))
      return serverError('AI generation failed: empty response')
    }

    return ok({ content: generatedContent })

  } catch (err) {
    console.error('AI generation error:', err)
    return serverError(err)
  }
}

async function fetchWithBackoff(url: string, body: any, retries = 1): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })

    if (res.ok) return res

    if (res.status === 429 && attempt < retries) {
      const delay = 2000
      console.error(`Gemini rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`)
      await new Promise(r => setTimeout(r, delay))
      continue
    }

    return res
  }

  return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
}
