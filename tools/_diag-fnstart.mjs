/**
 * tools/_diag-fnstart.mjs — 诊断 fnStart 归属：列出「闭包前向引用」候选，
 * 并检查每个候选的「最近的、缩进更浅的 function 头」是不是就是 fnStart。
 * 用法：node tools/_diag-fnstart.mjs
 * （不进 test 套件，靠 PowerShell 复制正则容易出错，所以独立成文件。）
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LINES = readFileSync(join(__dirname, '..', 'client.js'), 'utf8').split('\n')

const isFnHead = (l) => {
  const t = l.trim()
  return (/\{\s*$/.test(t) || /\{\s*\/\//.test(t)) && (/\bfunction\b/.test(t) || /=>/.test(t) || /^\([^)]*\)\s*\{/.test(t))
}
const indentOf = (l) => l.length - l.trimStart().length

// 声明与引用（沿用 scope-order.test.mjs 的口径）
const decls = []
const refs = []
const fnStack = []
const curFn = () => (fnStack.length ? fnStack[fnStack.length - 1] : null)
LINES.forEach((line, i) => {
  const n = i + 1
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('//')) return
  const indent = indentOf(line)
  if (isFnHead(line) && !/^\}\s*(else|catch|finally)?\s*\{/.test(trimmed)) fnStack.push(n)
  if (/^\}/.test(trimmed) && fnStack.length && indent <= indentOf(LINES[fnStack[fnStack.length - 1] - 1])) fnStack.pop()
  const dm = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/.exec(trimmed)
  if (dm) decls.push({ name: dm[1], line: n, kind: dm[0].split(/\s/)[0], indent })
  const re = /(^|[^\w$.])([A-Za-z_$][\w$]*)/g
  let rm
  while ((rm = re.exec(trimmed))) refs.push({ name: rm[2], line: n, indent, fnStart: curFn() })
})

const first = new Map()
for (const d of decls) if (!first.has(d.name)) first.set(d.name, d)

console.log('=== 闭包前向引用候选（fnStart < 声明行）===')
const seen = new Set()
for (const r of refs) {
  const d = first.get(r.name)
  if (!d || d.kind === 'function' || d.kind === 'param') continue
  if (!(r.fnStart != null && r.fnStart < d.line)) continue
  if (r.line === d.line) continue
  const key = r.name
  if (seen.has(key)) continue
  seen.add(key)
  // 最近的、缩进更浅的函数头（应该就是 fnStart）
  let nearest = null
  for (let i = r.line - 2; i >= 0; i--) {
    const l = LINES[i]
    if (!l.trim()) continue
    if (isFnHead(l) && indentOf(l) < r.indent) { nearest = i + 1; break }
  }
  console.log(
    (nearest === r.fnStart ? '  ok  ' : '  ❓  ') + r.name +
    ' 引用@' + r.line + '(缩进' + r.indent + ') 声明@' + d.line + ':' + d.kind + ' fnStart=' + r.fnStart + ' 最近更浅函数头=' + nearest
  )
}

console.log('=== fnStack 深度抽查 ===')
for (const n of [12, 100, 113, 162, 620, 1447, 1464, 1858, 2590, 2612]) {
  const r = refs.find((x) => x.line === n)
  console.log('  第' + n + '行 fnStart=' + (r ? r.fnStart : '(该行无引用)'))
}
