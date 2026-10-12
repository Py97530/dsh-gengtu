// 临时诊断：从指定行开始做严格词法花括号计数，找出「多出来的那个 }」在哪一段。
// 用法：node tools/_diag-runaway.mjs <起始行>
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', 'client.js'), 'utf8')
// ⚠️ 这个文件是 CRLF：不把 \r 去掉，正则字面量的「行内结束」判据会把换行认成 \r，
// 整个计数就假报（曾经拿它得出「净数 -4」，其实是 -2）。统一先归一化成 LF 再数。
const lines = src.replace(/\r\n/g, '\n').split('\n')
const startLine = Number(process.argv[2] || 1939)

// 严格词法：把从某一行开始的源码按「跳字符串/模板/正则/注释」的方式数花括号
const countFrom = (text) => {
  let d = 0
  let i = 0
  let prevSig = ''
  while (i < text.length) {
    const ch = text[i]
    const nx = text[i + 1]
    if (ch === '/' && nx === '/') { while (i < text.length && text[i] !== '\n') i++; continue }
    if (ch === '/' && nx === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i += 2; continue }
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; i++
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue }
        if (text[i] === q) { i++; break }
        if (q === '`' && text[i] === '$' && text[i + 1] === '{') { i += 2; let k = 1; while (i < text.length && k > 0) { if (text[i] === '\\') { i += 2; continue } if (text[i] === '{') k++; else if (text[i] === '}') k--; i++ } continue }
        i++
      }
      prevSig = 'x'; continue
    }
    if (ch === '/' && /[=(,:[!&|?{};+\-*%~^<>]/.test(prevSig)) {
      i++
      while (i < text.length) { if (text[i] === '\\') { i += 2; continue } if (text[i] === '[') { while (i < text.length && text[i] !== ']') { if (text[i] === '\\') i++; i++ } } if (text[i] === '/') { i++; break } if (text[i] === '\n') break; i++ }
      prevSig = 'x'; continue
    }
    if (ch === '{') d++
    else if (ch === '}') d--
    if (!/\s/.test(ch)) prevSig = ch
    i++
  }
  return d
}

console.log('第', startLine, '行:', lines[startLine - 1].trim().slice(0, 70))
console.log('这一行起往后（含本行）的花括号净数 =', countFrom(lines.slice(startLine - 1).join('\n')))
// 逐段：每 100 行一段，看净数怎么走
for (let ln = startLine; ln < lines.length; ln += 100) {
  const seg = lines.slice(ln - 1, ln + 99).join('\n')
  const net = countFrom(seg)
  if (net !== 0) console.log('  段', ln, '~', Math.min(ln + 99, lines.length), ' 净数', net)
}
console.log('全文件从第 1 行起净数 =', countFrom(src.replace(/\r\n/g, '\n')))
