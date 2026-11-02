export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import chromium from '@sparticuz/chromium'
import { badRequest, serverError } from '@/lib/api'

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const text = typeof body.text === 'string' ? body.text : ''
    if (!text) return badRequest('Missing will text')

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Georgia, 'Times New Roman', serif; padding: 48px; color: #111; }
            pre { white-space: pre-wrap; line-height: 1.5; font-size: 12pt; }
            h1 { font-size: 18pt; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <h1>Virasat Will</h1>
          <pre>${escapeHtml(text)}</pre>
        </body>
      </html>
    `

    const useChromium = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_VERSION
    const puppeteer = useChromium ? await import('puppeteer-core') : await import('puppeteer')

    const browser = await puppeteer.launch({
      args: useChromium ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 1600 },
      executablePath: useChromium ? await chromium.executablePath() : undefined,
      headless: true,
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    const pdfBuffer = new Uint8Array(pdf)
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=\"virasat-will.pdf\"',
      },
    })
  } catch (err) {
    return serverError(err)
  }
}
