// [patch-dsh-meme-pincode] 「点的是 A、发出来是 B」的回归测试。
//
// 病根：一个抖音帖里的多张图共用同一句 caption（`ingest.mjs` 把帖子 desc 当 caption），
// 而解析历史上只按描述配图 → 同组里谁先谁后全看索引顺序，用户点 A 会冒出 B。
// 药方：每行 keywords 尾部挂一个稳定码 `·c1a2b3`（'c' + sha1(path).slice(0,6)，
// 由 _plugin_work\add-meme-codes.mjs 写入），标记带上码后**码在就用码**。
//
// 这里不 import client.js（它是浏览器 bundle，结尾还有 window/React 副作用），
// 改成把 client.js 里的正则与两个纯函数抠出来现场求值 —— 源码改了、行为漂了，
// 这个测试就会红。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', 'client.js'), 'utf8')

const pick = (re, what) => {
  const m = src.match(re)
  assert.ok(m, '没能在 client.js 里找到' + what + '（源码结构变了？测试要跟着改）')
  return m[0]
}
const reSrc = pick(/const MEME_TEXT_RE = \/.*?\/g/, 'MEME_TEXT_RE')
const codeReSrc = pick(/const MEME_CODE_RE = \/.*?\/[a-z]*/, 'MEME_CODE_RE')

// 抠一个「从第 start 个字符起的整段代码」：从 start 处的花括号开始数，数平了就停。
// 之前这里是 `[\s\S]*?\n {6}\}` —— 拿缩进当锚点，函数一挪出内层（缩进 6→4）就抠到
// 隔壁去了、拼出来的源码语法错。改成数花括号之后，重排缩进/换行都不再影响它；
// 字符串、模板串里的 `{` `}` 和正则字面量也跳过，免得数错。
const sliceBalanced = (start) => {
  let i = src.indexOf('{', start)
  assert.ok(i >= 0, '这段代码里没找到函数体花括号')
  let depth = 0
  let quote = null
  let inClass = false
  for (; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = null
      continue
    }
    if (c === '/' && src[i + 1] !== '/' && src[i + 1] !== '*') {
      const prev = src[i - 1]
      const canBeRegex = !/[\w)\]$]/.test(prev || '')
      if (canBeRegex && (depth > 0 || i >= start)) {
        i++
        while (i < src.length && src[i] !== '/') { if (src[i] === '\\') i++; i++ }
        inClass = false
        continue
      }
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue }
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1) }
  }
  assert.fail('花括号没数平 —— client.js 里这段代码的结尾没找到')
}
const codeFnStart = src.indexOf('const memeCodeFromRow = (row) =>')
assert.ok(codeFnStart >= 0, '没能在 client.js 里找到 memeCodeFromRow（源码结构变了？）')
const codeFnSrc = sliceBalanced(codeFnStart)

// 抠出来的源码拼成一个工厂函数求值，把三样东西还出来（ESM 是严格模式，eval 里声明的
// const 不会漏到模块作用域，必须靠返回值拿）。
const factory = new Function(codeReSrc + '\n' + reSrc + '\n' + codeFnSrc + '\nreturn { MEME_CODE_RE, MEME_TEXT_RE, memeCodeFromRow }')
const { MEME_TEXT_RE, memeCodeFromRow } = factory()

// client.js 里 memeSrcFor 的判据（保持同步：标记里的 URL > 码表 > 描述匹配）。
// 注意有码但码表里没有时**直接返回空**，绝不落到 fallback —— 那正是发错图的现场。
const resolve = (hit, codeIndex = new Map(), fallback = () => '') => {
  if (hit[3]) return hit[3]
  if (hit[2]) return codeIndex.get(hit[2]) || ''
  return fallback(hit[1])
}

const parse = (text) => {
  const hits = []
  MEME_TEXT_RE.lastIndex = 0
  let m
  while ((m = MEME_TEXT_RE.exec(text))) hits.push(m)
  return hits
}

const row = (path, caption, keywords) => ({ path, caption, keywords, url: '/dsh-memes/' + path })
const codeOf = (path) => {
  // 与 add-meme-codes.mjs 同算法（sha1 前 6 位十六进制）
  return 'c' + createHash('sha1').update(path).digest('hex').slice(0, 6)
}

test('标记解析：带码、带 URL、老格式（无码）都能认出来', () => {
  const a = parse('[表情: 生气的傻孩子] ·c1a2b3')[0]
  assert.equal(a[1], '生气的傻孩子')
  assert.equal(a[2], 'c1a2b3')
  assert.equal(a[3], undefined)

  const b = parse('[表情: 生气的傻孩子](http://127.0.0.1:19387/dsh-memes/x.jpg)')[0]
  assert.equal(b[2], undefined)
  assert.equal(b[3], 'http://127.0.0.1:19387/dsh-memes/x.jpg')

  const c = parse('[表情: 老消息，没有码]')[0]
  assert.equal(c[1], '老消息，没有码')
  assert.equal(c[2], undefined)

  // 码必须贴着 ' ·' 才算码：描述里正好出现 c1a2b3 这种词不该被误吃
  const d = parse('[表情: 这图叫 c1a2b3 来着]')[0]
  assert.equal(d[1], '这图叫 c1a2b3 来着')
  assert.equal(d[2], undefined)
})

test('码表：keywords 尾部取最后一个码（多次更新不会串）', () => {
  assert.equal(memeCodeFromRow(row('memes/a.jpg', 'x', '卖萌 可爱 2026-10-07 ·c03546d')), 'c03546d')
  assert.equal(memeCodeFromRow(row('memes/a.jpg', 'x', '卖萌 ·c03546d 后来补的 ·c999999')), 'c999999')
  assert.equal(memeCodeFromRow(row('memes/a.jpg', 'x', '卖萌 可爱')), '')
  // 码长 5~6 位（6 位是现役；5 位留给早期的短码/兼容）。`·c12345x` 不算码：
  // 量词是 {5,6}、后面 (?!\w) 挡着，退一步吃 5 位也不行。
  assert.equal(memeCodeFromRow(row('memes/a.jpg', 'x', '卖萌 ·c12345')), 'c12345')
  assert.equal(memeCodeFromRow(row('memes/a.jpg', 'x', '卖萌 ·c12345x')), '')
})

test('同 caption 的多张图：带码各自配回自己（这就是用户看到的那类冲突）', () => {
  const cap = '生气了就这样看着你！。（2026-06-27）'
  const rows = [
    row('memes/angry/1791716510442_66.jpg', cap, '生气 2026-06-27 ·' + codeOf('memes/angry/1791716510442_66.jpg')),
    row('memes/angry/1791716510455_12.jpg', cap, '生气 2026-06-27 ·' + codeOf('memes/angry/1791716510455_12.jpg')),
    row('memes/angry/1791716510471_88.jpg', cap, '生气 2026-06-27 ·' + codeOf('memes/angry/1791716510471_88.jpg')),
    row('memes/angry/1791716510490_31.jpg', cap, '生气 2026-06-27 ·' + codeOf('memes/angry/1791716510490_31.jpg')),
  ]
  const codeIndex = new Map(rows.map((r) => [memeCodeFromRow(r), r.url]))
  // 老路径（按描述配图）在撞车时只会给出同一张 —— 交代病根，别把它当意外
  const descFallback = () => rows[0].url
  for (const r of rows) {
    const hit = parse('[表情: ' + cap + '] ·' + memeCodeFromRow(r))[0]
    assert.equal(resolve(hit, codeIndex, descFallback), r.url, '带码必须配回自己：' + r.path)
  }
  // 四张图四个不同的 URL（不是四张都指同一张）
  assert.equal(new Set(rows.map((r) => resolve(parse('[表情: ' + cap + '] ·' + memeCodeFromRow(r))[0], codeIndex, descFallback))).size, 4)
})

test('码查不到时不许退回描述匹配（宁可晚一轮，也不能发错图）', () => {
  const hit = parse('[表情: 某某表情包] ·c0ffee')[0]
  let fellBack = false
  const got = resolve(hit, new Map(), () => { fellBack = true; return '/dsh-memes/wrong.jpg' })
  assert.equal(got, '')
  assert.equal(fellBack, false, '有码就不该走描述兜底')
})

test('标记自带 URL 时最硬：连码表都不用查', () => {
  const hit = parse('[表情: 某某](http://127.0.0.1:19387/dsh-memes/happy/1_2.jpg) ·c0ffee')[0]
  let used = false
  const got = resolve(hit, new Map(), () => { used = true; return '' })
  assert.equal(got, 'http://127.0.0.1:19387/dsh-memes/happy/1_2.jpg')
  assert.equal(used, false)
})
