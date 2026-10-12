/**
 * test/_diag-scope.mjs — 一次性诊断：列出符号的「声明行（含类型）/ 引用行@所属函数」。
 * 用法：node --import ./test/stub/register.mjs tools/_diag-scope.mjs name1 name2 …
 * （不进 test 套件；`.mjs` 直接在 node 里跑，省得跟 PowerShell 的引号打架。）
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LINES = readFileSync(join(__dirname, '..', '..', 'client.js'), 'utf8').split('\n')
const names = new Set(process.argv.slice(2) || [])
if (!names.size) names.add('x')

const decls = [] // { name, line, kind, indent }
const refs = [] // { name, line, fnStart }
const fnStack = []
const curFn = () => (fnStack.length ? fnStack[fnStack.length - 1] : null)

LINES.forEach((line, i) => {
  const n = i + 1
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('//')) return
  const indent = line.length - line.trimStart().length
  const opensBody = /\{\s*$/.test(trimmed)
  const isFnHead = /\bfunction\b/.test(trimmed) || /=>/.test(trimmed)
  if (opensBody && isFnHead && !/^\}\s*(else|catch|finally)?\s*\{/.test(trimmed)) fnStack.push(n)
  if (/^\}/.test(trimmed) && fnStack.length && indent <= (LINES[fnStack[fnStack.length - 1] - 1].length - LINES[fnStack[fnStack.length - 1] - 1].trimStart().length)) fnStack.pop()

  const dm = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/.exec(trimmed)
  if (dm) decls.push({ name: dm[1], line: n, kind: dm[0].split(/\s/)[0], indent })
  for (const m of trimmed.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) decls.push({ name: m[1], line: n, kind: 'block', indent })
  const sigs = []
  const fm = /\bfunction\s*[A-Za-z_$][\w$]*\s*\(([^)]*)\)/.exec(trimmed)
  if (fm) sigs.push(fm[1])
  const am = /\(([^()]*)\)\s*=>/.exec(trimmed)
  if (am) sigs.push(am[1])
  const sm = /(?:^|[=(,]\s*)([A-Za-z_$][\w$]*)\s*=>/.exec(trimmed)
  if (sm) sigs.push(sm[1])
  for (const sig of sigs) for (const part of sig.split(',')) {
    const bare = part.replace(/=.*$/, '').trim()
    if (/^[A-Za-z_$][\w$]*$/.test(bare)) decls.push({ name: bare, line: n, kind: 'param', indent })
  }
  const re = /(^|[^\w$.])([A-Za-z_$][\w$]*)/g
  let rm
  while ((rm = re.exec(trimmed))) {
    if (/^\s*:/.test(trimmed.slice(rm.index + rm[0].length))) continue
    refs.push({ name: rm[2], line: n, fnStart: curFn() })
  }
})

for (const name of names) {
  const ds = decls.filter((d) => d.name === name)
  console.log('── ' + name + ' 声明：' + JSON.stringify(ds))
  console.log('   引用：' + JSON.stringify(refs.filter((r) => r.name === name).slice(0, 14).map((r) => r.line + '@' + (r.fnStart || '顶格'))))
}
