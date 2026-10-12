// 临时诊断：严格词法扫描（跳过字符串/模板串/正则/注释），列出花括号栈里最后几个没闭合的位置。
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', '..', 'client.js'), 'utf8')

const lineOf = (idx) => src.slice(0, idx).split('\n').length
const stack = []
let i = 0
let prevSig = '' // 上一个非空白有效字符，用来判断 `/` 是除号还是正则
while (i < src.length) {
  const ch = src[i]
  const nx = src[i + 1]
  if (ch === '/' && nx === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
  if (ch === '/' && nx === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue }
  if (ch === "'" || ch === '"' || ch === '`') {
    const q = ch; i++
    while (i < src.length) { if (src[i] === '\\') { i += 2; continue } if (src[i] === q) { i++; break } if (q === '`' && src[i] === '$' && src[i + 1] === '{') { // 模板里的 ${} 当普通文本处理会很脆弱，干脆整段跳过去
        i += 2; let d = 1
        while (i < src.length && d > 0) { if (src[i] === '\\') { i += 2; continue } if (src[i] === '{') d++; else if (src[i] === '}') d--; i++ }
        continue
      } i++ }
    prevSig = 'x'; continue
  }
  if (ch === '/' && /[=(,:[!&|?{};+\-*%~^<>]/.test(prevSig)) { // 正则字面量
    i++
    while (i < src.length) { if (src[i] === '\\') { i += 2; continue } if (src[i] === '[') { while (i < src.length && src[i] !== ']') { if (src[i] === '\\') i++; i++ } } if (src[i] === '/') { i++; break } if (src[i] === '\n') break; i++ }
    prevSig = 'x'; continue
  }
  if (ch === '{') stack.push({ kind: 'brace', at: i, line: lineOf(i) })
  else if (ch === '}') {
    const top = stack[stack.length - 1]
    if (!top) { console.log('多出来的 } 在第', lineOf(i), '行'); }
    else stack.pop()
  }
  if (!/\s/.test(ch)) prevSig = ch
  i++
}
console.log('没闭合的花括号（从早到晚）：')
for (const s of stack) console.log('  第 ' + s.line + ' 行：' + src.slice(s.at, s.at + 60).replace(/\n/g, ' '))
console.log('一共', stack.length, '个没闭合')
