import { checkRateLimit } from '../server/rateLimit.js'
import { chatWithGemini } from '../server/chatCore.js'

function json(res, status, body) {
  res
    .status(status)
    .setHeader('Content-Type', 'application/json; charset=utf-8')
    .end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  try {
    const key = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'local'
    const limit = checkRateLimit(String(key).split(',')[0].trim())
    if (!limit.allowed) return json(res, 429, { error: 'Đang có quá nhiều yêu cầu. Hãy thử lại sau một phút.' })

    const body = req.body || {}
    const message = String(body.message || '').trim()

    if (!message) {
      return json(res, 400, { error: 'Tin nhắn trống.' })
    }

    const result = await chatWithGemini({
      message,
      context: String(body.context || '').slice(0, 7000),
      analysis: body.analysis || null,
      history: Array.isArray(body.history) ? body.history.slice(-4) : [],
    })

    return json(res, 200, result)
  } catch (error) {
    return json(res, Number(error?.status) || 503, {
      error: error?.message || 'AI server error',
    })
  }
}
