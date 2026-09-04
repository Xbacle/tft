function normalizeMarkdown(text) {
  return String(text ?? '')
    .replace(/\\([\\*_#`>-])/g, '$1')
    .replace(/\r\n/g, '\n')
    .trim()
}

function inlineMarkdown(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*)/g)

  return parts.map((part, index) => {
    if (!part) return null
    if ((part.startsWith('**') && part.endsWith('**')) ||
        (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    return <span key={index}>{part}</span>
  })
}

export default function MarkdownText({ text }) {
  const normalized = normalizeMarkdown(text)
  if (!normalized) return null

  const lines = normalized.split('\n')
  const blocks = []
  let list = []
  let ordered = false

  const flushList = () => {
    if (!list.length) return
    const Tag = ordered ? 'ol' : 'ul'
    blocks.push(
      <Tag key={`list-${blocks.length}`}>
        {list.map((item, index) => (
          <li key={index}>{inlineMarkdown(item)}</li>
        ))}
      </Tag>,
    )
    list = []
  }

  lines.forEach((line, index) => {
    const value = line.trim()
    if (!value) {
      flushList()
      return
    }

    const heading = value.match(/^(#{1,3})\s+(.+)$/)
    const bullet = value.match(/^[-*]\s+(.+)$/)
    const number = value.match(/^\d+[.)]\s+(.+)$/)

    if (heading) {
      flushList()
      const Tag = `h${heading[1].length}`
      blocks.push(<Tag key={index}>{inlineMarkdown(heading[2])}</Tag>)
      return
    }

    if (bullet) {
      if (list.length && ordered) flushList()
      ordered = false
      list.push(bullet[1])
      return
    }

    if (number) {
      if (list.length && !ordered) flushList()
      ordered = true
      list.push(number[1])
      return
    }

    flushList()
    blocks.push(
      <p key={index}>{inlineMarkdown(value)}</p>,
    )
  })

  flushList()

  return <div className="ai-markdown">{blocks}</div>
}
