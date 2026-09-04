const WINDOW_MS = 60_000
const MAX_REQUESTS = 20
const buckets = new Map()

export function checkRateLimit(key = 'local') {
  const now = Date.now()
  const current = buckets.get(key) || { count: 0, resetAt: now + WINDOW_MS }
  if (now > current.resetAt) {
    current.count = 0
    current.resetAt = now + WINDOW_MS
  }
  current.count += 1
  buckets.set(key, current)
  return { allowed: current.count <= MAX_REQUESTS, retryAfterMs: Math.max(0, current.resetAt - now) }
}
