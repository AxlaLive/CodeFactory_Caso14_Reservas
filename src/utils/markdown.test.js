import assert from 'node:assert/strict'
import test from 'node:test'
import { parseMarkdownBlocks, parseMarkdownInline } from './markdown.js'

test('parses Markdown headings, paragraphs, and separators', () => {
  assert.deepEqual(parseMarkdownBlocks('### Diagnóstico\n\nHallazgo clínico.\n\n---'), [
    { type: 'heading', level: 3, content: 'Diagnóstico' },
    { type: 'paragraph', content: 'Hallazgo clínico.' },
    { type: 'separator' },
  ])
})

test('parses unordered and ordered lists with formatted text', () => {
  assert.deepEqual(parseMarkdownBlocks('- **Caries** registrada\n- Control sugerido\n\n1. Restauración\n2. Seguimiento'), [
    { type: 'list', ordered: false, items: ['**Caries** registrada', 'Control sugerido'] },
    { type: 'list', ordered: true, items: ['Restauración', 'Seguimiento'] },
  ])
  assert.deepEqual(parseMarkdownInline('Hallazgo **confirmado** y `nota`'), [
    { type: 'text', value: 'Hallazgo ' },
    { type: 'strong', value: 'confirmado' },
    { type: 'text', value: ' y ' },
    { type: 'code', value: 'nota' },
  ])
})

test('keeps HTML as plain text rather than markup', () => {
  assert.deepEqual(parseMarkdownInline('<script>alert(1)</script>'), [
    { type: 'text', value: '<script>alert(1)</script>' },
  ])
})
