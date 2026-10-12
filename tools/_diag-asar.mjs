// 读 DSH 的 app.asar(明文归档),找 webServer.tapIndex 的实现。
// 用法: node tools/_diag-asar.mjs [要搜的字符串]
import { readFileSync } from 'node:fs'

const ASAR = 'C:\\Users\\17301\\AppData\\Local\\Programs\\DeepSeek Harness\\resources\\app.asar'
const buf = readFileSync(ASAR)
console.log('asar 大小', buf.length)

// pickle header: [0..4) = 4, [4..8) = header JSON 长度
const headerSize = buf.readUInt32LE(4)
const raw = buf.slice(8, 8 + headerSize).toString('utf8')
let header = null
try {
  header = JSON.parse(raw.replace(/\0+$/, ''))
} catch (e) {
  console.log('header 解析失败:', e.message)
}

if (header && header.files) {
  const names = []
  const walk = (node, prefix) => {
    for (const [k, v] of Object.entries(node.files || {})) {
      const p = prefix ? prefix + '/' + k : k
      if (v.files) walk(v, p)
      else names.push(p + '  (' + v.size + ')')
    }
  }
  walk(header, '')
  console.log('文件总数', names.length)
  const want = names.filter((n) => /web|server|http|listen|index\.html/i.test(n))
  console.log('--- 名含 web/server/http/index.html 的（前 80）')
  for (const n of want.slice(0, 80)) console.log('  ' + n)
}

const needleArg = process.argv[2] || 'tapIndex'
const needle = Buffer.from(needleArg, 'utf8')
let i = 0
const hits = []
while (hits.length < 40) {
  const at = buf.indexOf(needle, i)
  if (at === -1) break
  hits.push(at)
  i = at + 1
}
console.log('--- 命中 "' + needleArg + '": ' + hits.length + ' 处')
for (const at of hits.slice(0, 6)) {
  const seg = buf.slice(Math.max(0, at - 500), at + 600).toString('utf8')
  console.log('=== @' + at)
  console.log(seg.replace(/[^\t\n\x20-\x7e\u4e00-\u9fff]/g, '.'))
}
