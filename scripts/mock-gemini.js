// Mock Gemini API để test luồng chat local mà không cần API key thật.
// Chạy: node scripts/mock-gemini.js  (port 8789)
// Sau đó chạy web server với:
//   GEMINI_API_KEY=mock GEMINI_API_ROOT=http://127.0.0.1:8789/v1beta node server.js
import http from 'node:http'

function extractContextSummary(body) {
  const raw = String(body?.contents?.at(-1)?.parts?.[0]?.text || '')
  const compNames = [...raw.matchAll(/"type":"comp"[^}]*?"name":"([^"]+)"/g)].map((m) => m[1])
  const unitNames = [...raw.matchAll(/"type":"unit","name":"([^"]+)"/g)].map((m) => m[1])
  const hasContext = !raw.includes('RETRIEVED DATA: none')
  return { userText: raw.split('\n')[0], compNames, unitNames, hasContext }
}

function buildAnswer({ userText, compNames, unitNames, hasContext }) {
  const lines = []
  lines.push('**(mock)** Câu hỏi của bạn: ' + userText)
  if (hasContext) {
    if (compNames.length) lines.push('\nDữ liệu local trả về các đội hình: **' + compNames.slice(0, 3).join('**, **') + '**.')
    if (unitNames.length) lines.push('\nTướng nhận diện được: **' + unitNames.slice(0, 3).join('**, **') + '**.')
    lines.push('\nKết luận: dữ liệu RAG đã được gửi kèm câu hỏi, pipeline hoạt động đúng.')
  } else {
    lines.push('\nKhông có dữ liệu RAG kèm theo (câu hỏi ngoài phạm vi hoặc không nhận diện được thực thể).')
  }
  return lines.join('\n')
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') { res.writeHead(404); return res.end() }
  let raw = ''
  for await (const chunk of req) raw += chunk
  let body = {}
  try { body = JSON.parse(raw || '{}') } catch { /* ignore */ }
  const answer = buildAnswer(extractContextSummary(body))
  const streaming = req.url.includes(':streamGenerateContent')
  console.log(`[mock-gemini] ${req.url} streaming=${streaming}`)

  if (!streaming) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: answer }] } }] }))
  }

  res.writeHead(200, { 'Content-Type': 'text/event-stream' })
  // Chia nhỏ câu trả lời thành nhiều chunk để kiểm chứng streaming.
  const pieces = answer.match(/[\s\S]{1,24}/g) || []
  for (const piece of pieces) {
    res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: piece }] } }] })}\n\n`)
    await new Promise((r) => setTimeout(r, 40))
  }
  res.end()
})

server.listen(8789, () => console.log('Mock Gemini at http://127.0.0.1:8789'))
