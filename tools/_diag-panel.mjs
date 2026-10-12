// [diag] 面板页注入体检 —— 带令牌 GET /memes-panel，看 window.__DSH_MEME_TOKEN__ 到底注没注入
// 只读。用法: node tools/_diag-panel.mjs
import { readFileSync, existsSync } from 'node:fs'

const BASE = process.env.DSH_BASE || 'http://127.0.0.1:19387'
const TOKEN_FILE = 'C:\\Users\\17301\\.dsh\\dsh-expression.token'
if (!existsSync(TOKEN_FILE)) { console.error('❌ 找不到令牌文件'); process.exit(2) }
const token = readFileSync(TOKEN_FILE, 'utf8').trim()

const res = await fetch(BASE + '/memes-panel', {
  headers: { 'x-dsh-meme': '1', 'x-dsh-meme-token': token },
  signal: AbortSignal.timeout(30000),
})
const html = await res.text()
console.log('HTTP ' + res.status + '   HTML ' + html.length + ' 字节')
console.log('含 __DSH_MEME_TOKEN__ : ' + html.includes('__DSH_MEME_TOKEN__'))
const m = /__DSH_MEME_TOKEN__[^;]{0,90}/.exec(html)
console.log('注入片段 : ' + (m ? m[0].replace(/\s+/g, ' ') : '(没找到)'))
console.log('含 client.js 引用 : ' + /client\.js/.test(html))
