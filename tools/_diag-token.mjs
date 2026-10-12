// [diag] 令牌兜底通道体检 —— 打活宿主上的 GET /dsh-memes-token。
// 期望:无来源头 403 / 带 x-dsh-meme 200 + token / 跨站 Origin 403。
// 只读,不改任何东西。用法: node tools/_diag-token.mjs
const BASE = 'http://127.0.0.1:19387'
const PATH = '/dsh-memes-token'

async function probe(label, headers, expect) {
  try {
    const res = await fetch(BASE + PATH, { headers })
    const text = await res.text()
    let body = text
    try { body = JSON.parse(text) } catch {}
    const shown = typeof body === 'object' ? JSON.stringify({ ...body, token: body.token ? '<' + String(body.token).length + ' 字符>' : undefined }) : String(body).slice(0, 120)
    const ok = res.status === expect ? '✓' : '✗'
    console.log(ok + ' ' + label + ' → HTTP ' + res.status + ' (期望 ' + expect + ')  ' + shown)
  } catch (error) {
    console.log('✗ ' + label + ' → 请求失败: ' + (error && error.message ? error.message : String(error)))
  }
}

console.log('目标 ' + BASE + PATH)
await probe('无头(裸 GET)', {}, 403)
await probe('带来源头 x-dsh-meme: 1', { 'x-dsh-meme': '1' }, 200)
await probe('跨站 Origin', { 'x-dsh-meme': '1', Origin: 'https://evil.example' }, 403)
console.log('—— 三条都对,令牌兜底通道就算通了;全 404 说明宿主还没重启(新路由在 index.js 里)。')
