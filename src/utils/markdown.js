function isBlockStart(line) {
  return /^\s{0,3}#{1,6}\s+/.test(line)
    || /^\s{0,3}(?:[-*+]|\d+[.)])\s+/.test(line)
    || /^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(line)
}

export function parseMarkdownInline(text) {
  const tokens = []
  const pattern = /(\*\*|__)(.+?)\1|`([^`]+)`/g
  let start = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > start) tokens.push({ type: 'text', value: text.slice(start, match.index) })
    if (match[3]) tokens.push({ type: 'code', value: match[3] })
    else tokens.push({ type: 'strong', value: match[2] })
    start = pattern.lastIndex
  }
  if (start < text.length) tokens.push({ type: 'text', value: text.slice(start) })
  return tokens
}

export function parseMarkdownBlocks(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, content: heading[2] })
      index += 1
      continue
    }

    if (/^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(line)) {
      blocks.push({ type: 'separator' })
      index += 1
      continue
    }

    const listItem = line.match(/^\s{0,3}([-*+]|\d+[.)])\s+(.+)$/)
    if (listItem) {
      const ordered = /^\d/.test(listItem[1])
      const items = []
      while (index < lines.length) {
        const item = lines[index].match(/^\s{0,3}([-*+]|\d+[.)])\s+(.+)$/)
        if (!item || /^\d/.test(item[1]) !== ordered) break
        items.push(item[2])
        index += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paragraph = [line.trim()]
    index += 1
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push({ type: 'paragraph', content: paragraph.join(' ') })
  }

  return blocks
}
