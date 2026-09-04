const KEY = 'tft18-ai-chat-v5'
export function loadChat() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(data) ? data.slice(-30) : []
  } catch { return [] }
}
export function saveChat(messages) {
  try { localStorage.setItem(KEY, JSON.stringify(messages.slice(-30))) } catch { /* storage can be disabled */ }
}
