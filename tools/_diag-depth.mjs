// 临时诊断：用严格词法扫描数花括号，打印指定行区间每行的深度变化。
// 用法：node tools/_diag-depth.mjs [from] [to]
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', '..', 'client.js'), 'utf8')

const from = Number(process.argv[2] || 1)
const to = Number(process.argv[3] || 2714)

const lineStarts = [0]
for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1)
const lineAt = (idx) => { let lo = 0; let hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1 } return lo + 1 }
const lineText = (n) => src.slice(lineStarts[n - 1], lineStarts[n] ?? src.length).replace(/\r?\n$/, '')

let depth = 0
let i = 0
let prevSig = ''
const perLine = new Map()
while (i < src.length) {
  const ch = src[i]
  const nx = src[i + 1]
  if (ch === '/' && nx === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
  if (ch === '/' && nx === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue }
  if (ch === "'" || ch === '"' || ch === '`') {
    const q = ch; i++
    while (i < src.length) {
      if (src[i] === '\\') { i += 2; continue }
      if (src[i] === q) { i++; break }
      if (q === '`' && src[i] === '$' && src[i + 1] === '{') { i += 2; let d = 1; while (i < src.length && d > 0) { if (src[i] === '\\') { i += 2; continue } if (src[i] === '{') d++; else if (src[i] === '}') d--; i++ } continue }
      i++
    }
    prevSig = 'x'; continue
  }
  if (ch === '/' && /[=(,:[!&|?{};+\-*%~^<>]/.test(prevSig)) {
    i++
    while (i < src.length) { if (src[i] === '\\') { i += 2; continue } if (src[i] === '[') { while (i < src.length && src[i] !== ']') { if (src[i] === '\\') i++; i++ } } if (src[i] === '/') { i++; break } if (src[i] === '\n') break; i++ }
    prevSig = 'x'; continue
  }
  if (ch === '{') { depth++; if (!perLine.has(lineAt(i))) perLine.set(lineAt(i), []); perLine.get(lineAt(i)).push(+1) }
  else if (ch === '}') { depth--; if (!perLine.has(lineAt(i))) perLine.set(lineAt(i), []); perLine.get(lineAt(i)).push(-1) }
  if (!/\s/.test(ch)) prevSig = ch
  i++
}
let d = 0
for (let ln = 1; ln <= lineStarts.length; ln++) {
  const before = d
  for (const delta of perLine.get(ln) || []) d += delta
  if (ln >= from && ln <= to && before !== d) console.log(`${ln}: ${before} -> ${d}  ${lineText(ln).trim().slice(0, 70)}`)
}
console.log('末尾 depth =', d)
