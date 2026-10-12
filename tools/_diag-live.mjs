// [diag] 活宿主只读体检 —— 直接打 127.0.0.1:19387 上**正在跑的那个插件**，
// 看它此刻是什么状态（PATCHES.md 里的验收都是「重启 + 刷新之后才算数」，
// 所以验现场只能这样打）。
//
// 只读：唯一一个写路径（高风险 op）用的是**不存在的 path**，就算鉴权漏了，
// 落到业务逻辑里也只是「未知路径」，不会动到任何一张图。
//
// 用法：node tools/_diag-live.mjs      （可选 DSH_BASE 覆盖地址）
const BASE = process.env.DSH_BASE || 'http://127.0.0.1:19387'
const AUTH = { 'x-dsh-meme': '1' }
const line = (name, value) => console.log(name + ' :: ' + JSON.stringify(value))
const getApi = (qs, headers) => fetch(BASE + '/dsh-memes-api' + qs, { headers: headers || {} })

// 1) 无头 GET：加固之后本机裸 curl 必须拿不到
try {
  const r = await getApi('?packId=all')
  line('无头 GET 索引(期望 403)', r.status)
} catch (e) { line('无头 GET 索引', 'ERR ' + e.message) }

// 2) 带头 GET：拿全库，顺手统计「装饰能不能靠码」这件最要紧的事
let rows = []
try {
  const r = await getApi('?packId=all', AUTH)
  line('带头 GET 索引(期望 200)', r.status)
  if (r.ok) {
    const j = await r.json()
    rows = (j && j.memes) || []
    const codeRe = /·(c[0-9a-f]{5,6})(?!\w)/
    const withCode = rows.filter((m) => codeRe.test(String(m.keywords || '')))
    const byCap = new Map()
    for (const m of rows) {
      const k = String(m.caption || '')
      if (k) byCap.set(k, (byCap.get(k) || 0) + 1)
    }
    const dups = [...byCap.entries()].filter(([, n]) => n > 1)
    line('全库行数', rows.length)
    line('图库列表(id:条数)', (j.packs || []).map((p) => p.id + ':' + p.count))
    line('total 字段', j.total)
    line('带稳定码的行', withCode.length)
    line('无码行(只能靠描述匹配)', rows.length - withCode.length)
    line('caption 撞车: 组数/张数', dups.length + ' / ' + dups.reduce((a, [, n]) => a + n, 0))
    line('索引字段', Object.keys(rows[0] || {}))
    // 无码行 = 装饰时只能退回描述匹配，配不配得上全看运气；
    // 要是撞车组里混进无码行，那一组就只能配错。
    const noCode = rows.filter((m) => !codeRe.test(String(m.keywords || '')))
    line('无码行明细', noCode.map((m) => ({
      path: m.path, caption: String(m.caption || '').slice(0, 40), kw: String(m.keywords || '').slice(0, 60),
    })))
    line('撞车组里含无码行的组数', dups.filter(([cap]) => rows
      .filter((m) => String(m.caption || '') === cap)
      .some((m) => !codeRe.test(String(m.keywords || '')))).length)
    // caption 是从抖音 desc 抄来的，里面可能自带方括号/换行 —— 那些字符会当场撕裂
    // 「[表情: …] ·码」这个标记格式，让正则咬不住尾码甚至整条咬不住。
    const risky = rows.map((m) => {
      const cap = String(m.caption || '')
      const bad = []
      if (/[[\]]/.test(cap)) bad.push('自带方括号')
      if (/[\n\r]/.test(cap)) bad.push('自带换行')
      if (cap.length > 80) bad.push('超80字(' + cap.length + ')')
      if (cap.includes('·c')) bad.push('自带·c')
      return bad.length ? { path: m.path, cap: cap.slice(0, 46), bad: bad.join('+') } : null
    }).filter(Boolean)
    line('caption 会撕裂标记的行', risky.length)
    line('  明细(最多 12 条)', risky.slice(0, 12))
    // 自洽性：服务端拼的候选行，能不能被前端那条 MEME_TEXT_RE 咬住、且码落在第 2 组
    const MEME_TEXT_RE = /\[(?:表情|m):\s*([^\]]+)\](?:\s*·(c[0-9a-f]{5,6}))?(?:\((https?:\/\/[^\s)]+)\))?/g
    const broken = []
    for (const m of rows) {
      const found = String(m.keywords || '').match(/·(c[0-9a-f]{5,6})(?!\w)/g)
      const code = found && found.length ? found[found.length - 1].slice(1) : ''
      const marked = '[表情: ' + String(m.caption || m.file_name).slice(0, 80) + ']' + (code ? ' ·' + code : '')
      MEME_TEXT_RE.lastIndex = 0
      const hit = MEME_TEXT_RE.exec(marked)
      if (!hit || (code && hit[2] !== code)) {
        broken.push({ path: m.path, code: code, got: hit ? (hit[2] || '(空)') : '咬不住', marked: marked.slice(0, 72) })
      }
    }
    line('自己的候选行配不上自己的正则', broken.length)
    line('  明细(最多 8 条)', broken.slice(0, 8))
  }
} catch (e) { line('带头 GET 索引', 'ERR ' + e.message) }

// 3) 跨站 Origin：DNS rebinding 那一类
try {
  const r = await getApi('?packId=all', { ...AUTH, Origin: 'http://evil.example' })
  line('跨站 Origin(期望 403)', r.status)
} catch (e) { line('跨站 Origin', 'ERR ' + e.message) }

// 4) 高风险 op 不带令牌：改库路径有没有真被令牌挡住
try {
  const r = await fetch(BASE + '/dsh-memes-api', {
    method: 'POST',
    headers: { ...AUTH, 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ op: 'delete', path: '__live_probe_does_not_exist__.jpg' }),
  })
  line('delete 无令牌(期望 403)', r.status + ' ' + (await r.text()).slice(0, 90))
} catch (e) { line('delete 无令牌', 'ERR ' + e.message) }

// 5) 面板页：零鉴权那个洞补上了没
try {
  const r = await fetch(BASE + '/memes-panel', { headers: {} })
  line('面板页 无头(期望 403)', r.status)
} catch (e) { line('面板页 无头', 'ERR ' + e.message) }

// 6) 图片路由：图能不能真取到
try {
  const first = rows.find((m) => m.url || m.path)
  if (!first) line('图片路由', '库里没有行，跳过')
  else {
    const u = String(first.url || '')
    const target = /^https?:/i.test(u) ? u : BASE + (u.startsWith('/') ? u : '/dsh-memes/' + first.path)
    const r = await fetch(target, { headers: AUTH })
    line('图片路由(期望 200)', r.status + ' ' + (r.headers.get('content-type') || '') + ' | ' + target.slice(0, 100))
  }
} catch (e) { line('图片路由', 'ERR ' + e.message) }
