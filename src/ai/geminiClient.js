import { AI_CONFIG } from './aiConfig'

function post(url, payload, signal) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
}

// Gọi API thường (không stream) — dùng làm phương án dự phòng.
export async function askGemini({ message, context, analysis, history, signal }) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AI_CONFIG.requestTimeoutMs)
  const combinedSignal = signal || controller.signal
  try {
    const response = await post('/api/chat', { message, context, analysis, history: history?.slice(-AI_CONFIG.maxHistory) }, combinedSignal)
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(payload?.error || `AI request failed (${response.status})`)
      error.status = response.status
      throw error
    }
    return payload
  } finally {
    clearTimeout(timeout)
  }
}

// Gọi API streaming: nhận từng đoạn văn bản qua onDelta, trả về { text, model }.
// Timeout tổng 90s; nếu 45s không nhận được gì thì tự hủy để không treo màn hình.
export async function askGeminiStream({ message, context, analysis, history, signal, onDelta }) {
  const controller = new AbortController()
  const combinedSignal = signal || controller.signal
  let timeout = setTimeout(() => controller.abort(), AI_CONFIG.streamIdleTimeoutMs)

  const resetIdle = () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => controller.abort(), AI_CONFIG.streamIdleTimeoutMs)
  }
  const clearAll = () => clearTimeout(timeout)

  try {
    const response = await post('/api/chat/stream', { message, context, analysis, history: history?.slice(-AI_CONFIG.maxHistory) }, combinedSignal)
    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => ({}))
      const error = new Error(payload?.error || `AI request failed (${response.status})`)
      error.status = response.status
      throw error
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let full = ''
    let model = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      resetIdle()
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (!payload) continue
        let event
        try { event = JSON.parse(payload) } catch { continue }
        if (event.error) {
          const error = new Error(event.error)
          error.status = event.status || 500
          throw error
        }
        if (event.delta) {
          full += event.delta
          onDelta?.(event.delta)
        }
        if (event.done) model = event.model || model
      }
    }

    if (!full.trim()) throw new Error('Gemini không trả về nội dung.')
    return { text: full, model: model || 'Gemini' }
  } finally {
    clearAll()
  }
}
