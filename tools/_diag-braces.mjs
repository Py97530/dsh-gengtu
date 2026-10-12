// 临时诊断：数花括号找失衡点（忽略字符串/模板串/正则/注释，跟测试里 sliceBalanced 一个思路）。
// 用法：node tools/_diag-braces.mjs [起始行]
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const lines = readFileSync(join(HERE, '..', '..', 'client.js'), 'utf8').split(/\r?\n/)

let depth = 0
let state = 'code' // code | line | block | sq | dq | tpl | re
const report = []
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const before = depth
  for (let j = 0; j < line.length; j++) {
    const ch = line[j]
    const nx = line[j + 1]
    if (state === 'line') break
    if (state === 'block') { if (ch === '*' && nx === '/') { state = 'code'; j++ } continue }
    if (state === 'sq') { if (ch === '\\') { j++; continue } if (ch === "'") state = 'code'; continue }
    if (state === 'dq') { if (ch === '\\') { j++; continue } if (ch === '"') state = 'code'; continue }
    if (state === 'tpl') { if (ch === '\\') { j++; continue } if (ch === '`') state = 'code'; continue }
    if (state === 're') { if (ch === '\\') { j++; continue } if (ch === '/') state = 'code'; continue }
    if (ch === '/' && nx === '/') { state = 'line'; break }
    if (ch === '/' && nx === '*') { state = 'block'; j++; continue }
    if (ch === "'") { state = 'sq'; continue }
    if (ch === '"') { state = 'dq'; continue }
    if (ch === '`') { state = 'tpl'; continue }
    if (ch === '{') depth++
    else if (ch === '}') depth--
  }
  if (state === 'line') state = 'code'
  report.push({ n: i + 1, before, after: depth, text: line })
}
const from = Number(process.argv[2] || 2650)
for (const r of report) if (r.n >= from) console.log(`${r.n}: ${r.before} -> ${r.after}  ${r.text.slice(0, 72)}`)
console.log('\n文件末尾 depth =', depth, '（应该 = 0）')
// 找第一个「深度掉回 1」的行 —— 工厂体本该停在 2
const drop = report.find((r) => r.n > 120 && r.after === 1 && r.before >= 2)
console.log('第一次从 >=2 掉到 1 的行：', drop ? drop.n + ': ' + drop.text.trim().slice(0, 80) : '（没有）')
