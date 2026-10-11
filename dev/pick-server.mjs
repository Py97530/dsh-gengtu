/**
 * 开发用：图库「挑选」模式的清单收集服务。
 *
 * 为什么不在插件里做路由：那是给**开发机**用的动作（勾一堆图 → 打包成随包底图），
 * 随包公开分发时不该多一个「往你磁盘写清单」的写接口。所以挪到仓库里这个可选脚本，
 * 不进 `package.json` 的 `files`。
 *
 * 用法：
 *   node dev/pick-server.mjs            # 默认 8796，清单写到 ./dev/seed-pick.json
 *   node dev/pick-server.mjs 8797       # 换端口
 *   PICK_OUT=/path/to/out.json node dev/pick-server.mjs
 *
 * 面板侧的「挑选」按钮会 POST { paths: [...] }（也吃 { items: [{path}] }）过来。
 * 这个脚本只收 `memes/` 开头、不含 `..` 的路径 —— 清单是要喂给打包脚本的，别让它
 * 变成任意写文件的洞。
 */
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.argv[2] || 8796)
const OUT = process.env.PICK_OUT || join(HERE, 'seed-pick.json')

const readBody = (req) => new Promise((ok, bad) => {
  const chunks = []
  let size = 0
  req.on('data', (c) => {
    size += c.length
    if (size > 4 * 1024 * 1024) { bad(new Error('清单太大')); req.destroy(); return }
    chunks.push(c)
  })
  req.on('end', () => ok(Buffer.concat(chunks).toString('utf8')))
  req.on('error', bad)
})

const CORS = {
  'access-control-allow-origin': 'http://127.0.0.1:19387',
  'access-control-allow-headers': 'content-type,x-dsh-meme,x-dsh-meme-token',
  'access-control-allow-methods': 'POST,OPTIONS',
}

const server = createServer((req, res) => {
  const path = (req.url || '').split('?')[0]
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return }
  if (path === '/submit' && req.method === 'POST') {
    readBody(req).then((raw) => {
      let body = {}
      try { body = JSON.parse(raw || '{}') } catch { body = {} }
      const list = Array.isArray(body.paths)
        ? body.paths
        : (Array.isArray(body.items) ? body.items.map((x) => (x && x.path) || '') : [])
      const seen = new Set()
      const picks = []
      for (const p of list) {
        const v = String(p || '').trim()
        if (!v.startsWith('memes/') || v.indexOf('..') >= 0) continue
        if (seen.has(v)) continue
        seen.add(v)
        picks.push(v)
      }
      try {
        const out = resolve(OUT)
        mkdirSync(dirname(out), { recursive: true })
        writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), mode: 'seed', picks }, null, 2))
        res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, count: picks.length, file: out }))
        console.log('[pick] ' + picks.length + ' 张 → ' + out)
      } catch (error) {
        res.writeHead(500, { ...CORS, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }))
      }
    }).catch((error) => {
      res.writeHead(400, { ...CORS, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }))
    })
    return
  }
  res.writeHead(404, CORS)
  res.end('POST /submit')
})

server.listen(PORT, '127.0.0.1', () => {
  console.log('清单收集服务 on http://127.0.0.1:' + PORT + '  →  ' + resolve(OUT))
})
