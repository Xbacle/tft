export function buildOfflineFallback(analysis, context, errorMessage = '') {
  if (!context) {
    return errorMessage
      ? `Không gọi được Gemini: ${errorMessage}`
      : 'Tôi chưa có đủ dữ liệu để trả lời câu hỏi này.'
  }

  const chunks = Array.isArray(context.chunks) ? context.chunks : []
  const units = chunks.filter((x) => x?.type === 'unit')
  const comps = chunks.filter((x) => x?.type === 'comp')
  const items = chunks.filter((x) => x?.type === 'item')
  const traits = chunks.filter((x) => x?.type === 'trait')
  const augments = chunks.filter((x) => x?.type === 'augment')
  const intent = analysis?.intent

  if (intent === 'comp_search' || intent === 'recommendation' || intent === 'economy' || intent === 'unit_build') {
    if (comps.length) {
      const lines = comps.slice(0, 3).map((c, i) => `${i + 1}. **${c.name || `Comp ${c.id}`}** — ${c.unitNames?.slice(0, 7).join(', ') || 'chưa có danh sách tướng'}`)
      return `### Gợi ý từ dữ liệu TFT\n${lines.join('\n')}\n\n${errorMessage ? `Gemini chưa phản hồi: ${errorMessage}` : 'Đây là lựa chọn trực tiếp từ dữ liệu local.'}`
    }
  }

  if (intent === 'item_build') {
    const directItems = items.length
      ? items.map((x) => x.name).filter(Boolean)
      : units.flatMap((u) => u.recommendedItems || []).map((x) => typeof x === 'string' ? x : x?.name).filter(Boolean)
    return `### Item gợi ý\n${[...new Set(directItems)].slice(0, 5).map((x, i) => `${i + 1}. **${x}**`).join('\n') || 'Chưa tìm thấy item phù hợp trong dữ liệu.'}\n\n${errorMessage ? `Gemini chưa phản hồi: ${errorMessage}` : 'Đây là kết quả từ dữ liệu local.'}`
  }

  const rows = [
    ...units.slice(0, 3).map((u) => `- **${u.name}** — ${u.cost || '?'} vàng`),
    ...traits.slice(0, 2).map((t) => `- **${t.name}** — tộc/hệ liên quan`),
    ...augments.slice(0, 2).map((a) => `- **${a.name}** — augment`),
  ]
  return `### Dữ liệu tìm thấy\n${rows.join('\n') || '- Chưa xác định được thực thể phù hợp'}\n\n${errorMessage ? `Gemini chưa phản hồi: ${errorMessage}` : 'Đây là kết quả từ dữ liệu local.'}`
}
