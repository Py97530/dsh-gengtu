// [diag] AI 识图现场探针 —— 打活宿主，看 op:'recognize' 到底报什么错
// 只读：recognize 只返回识别结果，不写库。
// 用法: node tools/_diag-recognize.mjs [图片路径]
import { readFileSync, existsSync } from 'node:fs'

const BASE = process.env.DSH_BASE || 'http://127.0.0.1:19387'
const TOKEN_FILE = 'C:\\Users\\17301\\.dsh\\dsh-expression.token'
const img = process.argv[2] || 'C:\\Users\\17301\\Desktop\\deepseek最新重装文件夹\\宣发素材\\ref-whale-girl.jpg'

if (!existsSync(TOKEN_FILE)) { console.error('❌ 找不到令牌文件 ' + TOKEN_FILE); process.exit(2) }
if (!existsSync(img)) { console.error('❌ 找不到图片 ' + img); process.exit(2) }

const token = readFileSync(TOKEN_FILE, 'utf8').trim()
const buf = readFileSync(img)
console.log('图片 : ' + img + '  (' + Math.round(buf.length / 1024) + ' KB)')
console.log('令牌 : 长度 ' + token.length)

const payload = JSON.stringify({
  op: 'recognize',
  fileName: img.split(/[\\/]/).pop() || 'probe.jpg',
  dataBase64: buf.toString('base64'),
})

const t0 = Date.now()
let res
try {
  res = await fetch(BASE + '/dsh-memes-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-dsh-meme': '1', 'x-dsh-meme-token': token, Origin: BASE },
    body: payload,
    signal: AbortSignal.timeout(120000),
  })
} catch (e) {
  console.log('请求失败: ' + (e && e.message))
  process.exit(1)
}
const text = await res.text()
console.log('HTTP ' + res.status + '   ' + ((Date.now() - t0) / 1000).toFixed(1) + 's')
console.log(text.slice(0, 2000))
