// 表情描述 → 图库行的匹配回归测试（node --test test/match.test.mjs）。
// client.js 是宿主注入用的浏览器产物（__ModuleLoader__.load 形态，不能直接 import），
// 所以这里只把纯函数区（foldCaption … matchDesc）抠出来在闭包里求值 —— 和线上跑的是同一段源码。
import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const loadMatcher = () => {
  const src = fs.readFileSync(path.join(ROOT, 'client.js'), 'utf8')
  const start = src.indexOf('const foldCaption =')
  const end = src.indexOf('function apply(ctx)')
  assert.ok(start > 0 && end > start, 'client.js 里找不到纯函数区（结构被改过？）')
  const body = src.slice(start, end)
  return new Function('return (function(){' + body +
    '\nreturn {foldCaption,looseCaption,splitDescTokens,buildMemeSearch,matchDesc}})()')()
}

const T = loadMatcher()
const rows = [
  { caption: '灰白小猫坐下来周身冒星星，眼睛圆得发光，可爱到冒泡。', keywords: '可爱 小猫 星星 2026-01-02', file_name: '1791606963015_674.jpg' },
  { caption: '一只猫趴在键盘上睡死过去，怎么推都不醒。', keywords: '猫 睡觉 摸鱼', file_name: '1791547885946_927.jpg' },
  { caption: '游戏角色蹲在黄昏街头，举着手机认真给坐在路边的一只橘白猫拍照，猫一脸淡定配合。', keywords: '猫 拍照 日常', file_name: '1791547879702_588.jpg' },
]
const toUrl = (r) => '/memes/' + r.file_name
const search = T.buildMemeSearch(rows, toUrl)
const index = new Map()
for (const r of rows) {
  for (const key of [r.caption, r.file_name, r.keywords, String(r.caption).slice(0, 80), String(r.caption).slice(0, 100)]) {
    const raw = String(key || '').trim()
    if (!raw) continue
    index.set(raw, toUrl(r))
    index.set(T.foldCaption(raw), toUrl(r))
    const loose = T.looseCaption(raw)
    if (loose) index.set(loose, toUrl(r))
  }
}
const hit = (d) => T.matchDesc(d, index, search)

test('抄候选原文（含句号/不含句号/用空格代逗号）都落到同一张图', () => {
  const a = hit('灰白小猫坐下来周身冒星星，眼睛圆得发光，可爱到冒泡。')
  const b = hit('灰白小猫坐下来周身冒星星，眼睛圆得发光，可爱到冒泡')
  const c = hit('灰白小猫坐下来周身冒星星 眼睛圆得发光 可爱到冒泡')
  const d = hit('灰白小猫坐下来周身冒星星 眼睛圆得发光 可爱到冒泡。')
  assert.ok(a, '原文没命中')
  assert.equal(b, a, '少一个句号就配到别的图了')
  assert.equal(c, a, '把逗号写成空格就配到别的图了')
  assert.equal(d, a, '空格 + 句号混写就配到别的图了')
})

test('模型改写/截断描述：整串唯一包含优先于分词直觉', () => {
  assert.equal(hit('游戏角色蹲在黄昏街头，举着手机认真给坐在路边的一只橘白猫拍照，猫一脸淡定配合'), '/memes/1791547879702_588.jpg')
  assert.equal(hit('灰白小猫坐下来周身冒星星，眼睛圆得发光'), '/memes/1791606963015_674.jpg')
})

test('分词兜底不再被最泛的长词抢走（短词优先）', () => {
  const tokens = T.splitDescTokens('灰白小猫坐下来周身冒星星，眼睛圆得发光，可爱到冒泡。')
  assert.ok(tokens.every((t) => t.length >= 2))
  // "周身冒星星" 这类区分性词必须还在；匹配顺序由 matchDesc 内部按长度升序重排
  assert.ok(tokens.some((t) => t.includes('周身冒星星')))
  assert.equal(hit('周身冒星星可爱到冒泡'), '/memes/1791606963015_674.jpg')
})

test('完全对不上时返回 null（前端才会保留描述原文，不留空气泡）', () => {
  assert.equal(hit('完全不存在的一段描述文字'), null)
  assert.equal(hit(''), null)
})
