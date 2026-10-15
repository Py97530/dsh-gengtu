// [dev] 把挑好的图打包成插件自带的种子库：`seed/`（图 + manifest.json）。
// 机制那半边在 memes.js 的 seedLibrary()：首启遇到空库时读 seed/manifest.json，
// 逐张拷进用户图库、按新路径重算稳定码、种完写 .seeded 记号。这里只负责"生"。
//
// 用法：
//   node dev/build-seed.mjs                       # 读 dev/seed-pick.json（优先）或 dev/seed-list.txt
//   node dev/build-seed.mjs --list 我的清单.txt    # 每行一个 memes/<tag>/<文件名>，也认 "1. memes/..." 这种
//   node dev/build-seed.mjs --pack "D:\库"         # 源图库目录，默认 ~/.dsh/meme-packs/gengtu-2026
//   node dev/build-seed.mjs --clear               # 先清空 seed/ 里的旧图再打（manifest 一起重写）
//   node dev/build-seed.mjs --keep                # 不清空，往已有 seed/ 后面续（编号接着往下排）
//
// 说明：caption / keywords 从源图库的 index.db 里抄；keywords 里的 ·cXXXXXX 稳定码会被剥掉
// （码是按图库内路径算的，换到 seed/ 就失效了，插件导入时会自己重算）。
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, copyFileSync, statSync } from 'node:fs'
import { join, dirname, basename, extname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const HERE = dirname(fileURLToPath(import.meta.url))          // …/dsh-gengtu/dev
const PKG = join(HERE, '..')                                  // …/dsh-gengtu
const SEED = join(PKG, 'seed')

const argv = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = argv.indexOf('--' + name)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt
}
const CLEAR = argv.includes('--clear')
const KEEP = argv.includes('--keep')
const PACK = arg('pack', join(homedir(), '.dsh', 'meme-packs', 'gengtu-2026'))
const LIST = arg('list', null)

/** 读清单：优先 --list 指定的文件，其次 dev/seed-pick.json，最后 dev/seed-list.txt */
function loadPicks() {
  const cands = []
  if (LIST) cands.push(LIST)
  cands.push(join(HERE, 'seed-pick.json'), join(HERE, 'seed-list.txt'))
  for (const f of cands) {
    if (!existsSync(f)) continue
    const raw = readFileSync(f, 'utf8')
    const out = []
    if (f.endsWith('.json')) {
      let j = null
      try { j = JSON.parse(raw) } catch { }
      const arr = Array.isArray(j) ? j : (j && Array.isArray(j.picks) ? j.picks : [])
      for (const it of arr) {
        const p = typeof it === 'string' ? it : (it && (it.path || it.rel))
        if (p) out.push(String(p))
      }
    } else {
      for (const line of raw.split(/\r?\n/)) {
        // 认 "1. memes/happy/x.jpg"、"memes/happy/x.jpg"、"- memes/…" 三种写法
        const m = line.match(/memes[/\\][^\s"']+\.(?:jpg|jpeg|png|gif|webp)/i)
        if (m) out.push(m[0].replace(/\\/g, '/'))
      }
    }
    if (out.length) return { file: f, picks: out }
  }
  return { file: null, picks: [] }
}

const { file: listFile, picks } = loadPicks()
if (!listFile) {
  console.log('没找到清单。先把要带的图勾出来（面板里点「挑选」→ 勾图 → 「填进对话」→ 发我），')
  console.log('或者手写一份 dev/seed-list.txt，每行一个 memes/<tag>/<文件名>。')
  process.exit(1)
}
if (picks.length === 0) { console.log('清单是空的：' + listFile); process.exit(1) }

// 源图库的索引（拿 tag / caption / keywords）
const dbPath = join(PACK, 'index.db')
let db = null
try { db = new DatabaseSync(dbPath, { readOnly: true }) } catch (e) {
  console.log('⚠️ 读不到源图库索引 ' + dbPath + '（' + (e && e.message) + '）→ caption/关键词会是空的')
}
const rowOf = (rel) => {
  if (!db) return null
  try { return db.prepare('SELECT path, tag, file_name, caption, keywords FROM memes WHERE path = ?').get(rel) } catch { return null }
}

// 打标器偶尔会把图里印着的日期/帖子标题一起抄进 caption，出厂的描述要干净：这里统一擦一遍。
// ⚠️ CAPTION_FIX 的键是**新的 seed 文件名**，靠的是清单顺序 —— 以后重新挑图，编号一变就得跟着改。
const CAPTION_FIX = {
  'seed-002.jpg': '一只炸毛小团子瞪着眼生气，画在灰扑扑的纸上，火气写满脸。',
  'seed-020.jpg': '圆滚滚的呆猫举着小手卖萌，睁着大眼睛一脸憨样。',
}
const cleanCaption = (name, raw) => {
  if (CAPTION_FIX[name]) return CAPTION_FIX[name]
  return String(raw || '')
    .replace(/[（(]\s*20\d{2}\s*[-/.年]\s*\d{1,2}\s*[-/.月]\s*\d{1,2}\s*日?\s*[)）]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

if (CLEAR && !KEEP && existsSync(SEED)) {
  let n = 0
  for (const f of readdirSync(SEED)) { unlinkSync(join(SEED, f)); n += 1 }
  console.log('清掉 seed/ 里 ' + n + ' 个旧文件')
}
mkdirSync(SEED, { recursive: true })

// --keep：编号接着已有的往下排
let start = 1
if (KEEP && existsSync(SEED)) {
  const nums = readdirSync(SEED).map(f => (f.match(/^seed-(\d+)\./) || [])[1]).filter(Boolean).map(Number)
  if (nums.length) start = Math.max(...nums) + 1
}

const items = []
const missing = []
let idx = start
for (const rel of picks) {
  const src = join(PACK, rel.replace(/\//g, '\\'))
  if (!existsSync(src)) { missing.push(rel); continue }
  const ext = (extname(src) || '.jpg').toLowerCase()
  const name = 'seed-' + String(idx).padStart(3, '0') + ext
  copyFileSync(src, join(SEED, name))
  const row = rowOf(rel)
  items.push({
    file: name,
    tag: (row && row.tag) || (rel.split('/')[1] || 'happy'),
    caption: cleanCaption(name, row && row.caption),
    keywords: String((row && row.keywords) || '').replace(/·c[0-9a-f]{5,6}/g, '').replace(/\s+/g, ' ').trim().slice(0, 220),
  })
  idx += 1
}

// --keep 时把旧 manifest 的条目接在前面，保持"清单 = 实际文件"
let oldItems = []
const mf = join(SEED, 'manifest.json')
if (KEEP && existsSync(mf)) {
  try { const j = JSON.parse(readFileSync(mf, 'utf8')); if (Array.isArray(j.items)) oldItems = j.items } catch { }
}
const all = oldItems.concat(items)
const noCap = all.filter(it => !it.caption).length
const bytes = readdirSync(SEED).filter(f => f !== 'manifest.json')
  .reduce((s, f) => s + (statSync(join(SEED, f)).size || 0), 0)

writeFileSync(mf, JSON.stringify({
  id: 'dsh-gengtu-seed',
  title: 'dsh-gengtu 自带底图',
  note: '由 dev/build-seed.mjs 生成；图进库时路径会变成 memes/<tag>/<file>，稳定码由插件重算。',
  generatedAt: new Date().toISOString(),
  items: all,
}, null, 2), 'utf8')

const byTag = {}
for (const it of all) byTag[it.tag] = (byTag[it.tag] || 0) + 1
console.log('清单来源: ' + listFile)
console.log('源图库:   ' + PACK)
console.log('本次拷入: ' + items.length + ' 张' + (missing.length ? '（' + missing.length + ' 张在源库里找不到，已跳过）' : ''))
for (const m of missing) console.log('   ✗ 找不到 ' + m)
console.log('seed/ 合计: ' + all.length + ' 张, ' + (bytes / 1048576).toFixed(2) + ' MB' + (noCap ? '，其中 ' + noCap + ' 张没 caption' : ''))
console.log('情绪分布: ' + Object.entries(byTag).map(([t, n]) => t + '×' + n).join('  '))
if (bytes > 20 * 1048576) console.log('⚠️ 超过 20MB 了，npm 包会有点肥，考虑减几张')
console.log('写好: ' + mf)
if (db) db.close()
