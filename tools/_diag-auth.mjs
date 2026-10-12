// 把 index.js 里新的 assertLocalRequest 原样抠出来打表 —— 重启前先把「门到底挡谁、放谁」验一遍，
// 免得改出「图库页自己都被 403 打成空白」这种反向事故。
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../index.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const grab = (re, n) => { const m = src.match(re); if (!m) throw new Error('找不到 ' + n); return m[0] }
const block = [
  grab(/const LOOPBACK_HOSTS = [^\n]*/, 'LOOPBACK_HOSTS'),
  grab(/const hostIsLoopback = \(hostHeader\) => \{[\s\S]*?\n {4}\}/, 'hostIsLoopback'),
  grab(/const assertLocalRequest = \(req\) => \{[\s\S]*?\n {4}\}/, 'assertLocalRequest'),
].join('\n')

const AUTH_HEADER = 'x-dsh-meme'
const { assertLocalRequest, hostIsLoopback } = new Function('AUTH_HEADER', block + '\n return { assertLocalRequest, hostIsLoopback }')(AUTH_HEADER)

const cases = [
  ['DSH 页面同源 GET（浏览器带 Origin）', { host: '127.0.0.1:19387', origin: 'http://127.0.0.1:19387' }, true],
  ['DSH 页面同源 POST（带 Origin）', { host: '127.0.0.1:19387', origin: 'http://127.0.0.1:19387' }, true],
  ['本机脚本 curl 带 x-dsh-meme: 1', { host: '127.0.0.1:19387', 'x-dsh-meme': '1' }, true],
  ['本机脚本 node fetch 带 sec-fetch-site', { host: '127.0.0.1:19387', 'sec-fetch-site': 'same-origin' }, true],
  ['localhost 写法', { host: 'localhost:19387', origin: 'http://localhost:19387' }, true],
  ['外部 curl 什么都不带', { host: '127.0.0.1:19387' }, false],
  ['跨站 Origin', { host: '127.0.0.1:19387', origin: 'http://evil.example' }, false],
  ['DNS rebinding（Host 与 Origin 都是攻击者域名）', { host: 'evil.example', origin: 'http://evil.example' }, false],
  ['Host 缺省', { origin: 'http://127.0.0.1:19387' }, false],
  ['Host 是别的机器', { host: '192.168.1.9:19387', origin: 'http://192.168.1.9:19387' }, false],
  ['Host 冒名（127.0.0.1.evil.example）', { host: '127.0.0.1.evil.example:19387', origin: 'http://127.0.0.1.evil.example:19387' }, false],
  ['IPv6 回环', { host: '[::1]:19387', origin: 'http://[::1]:19387' }, true],
]

let bad = 0
for (const [name, headers, want] of cases) {
  let got = true
  let why = ''
  try { assertLocalRequest({ headers }) } catch (e) { got = false; why = e.message }
  const ok = got === want
  if (!ok) bad++
  console.log((ok ? '✅' : '❌') + ' ' + name + ' → ' + (got ? '放行' : '拦下(' + why + ')') + (ok ? '' : '   ⚠️ 期望' + (want ? '放行' : '拦下')))
}
console.log(bad === 0 ? '\n全部符合预期' : '\n有 ' + bad + ' 条不符合预期')
process.exit(bad === 0 ? 0 : 1)
