import { parseMarkdownBlocks, parseMarkdownInline } from '../utils/markdown'

function InlineContent({ text }) {
  return parseMarkdownInline(text).map((token, index) => {
    if (token.type === 'strong') return <strong key={index}>{token.value}</strong>
    if (token.type === 'code') return <code key={index}>{token.value}</code>
    return <span key={index}>{token.value}</span>
  })
}

export default function MarkdownContent({ children, className = '' }) {
  const blocks = parseMarkdownBlocks(children)
  return <div className={`ai-markdown-content ${className}`.trim()}>
    {blocks.map((block, index) => {
      if (block.type === 'heading') {
        const Heading = `h${block.level}`
        return <Heading key={index}><InlineContent text={block.content} /></Heading>
      }
      if (block.type === 'separator') return <hr key={index} />
      if (block.type === 'list') {
        const List = block.ordered ? 'ol' : 'ul'
        return <List key={index}>{block.items.map((item, itemIndex) => (
          <li key={itemIndex}><InlineContent text={item} /></li>
        ))}</List>
      }
      return <p key={index}><InlineContent text={block.content} /></p>
    })}
  </div>
}
