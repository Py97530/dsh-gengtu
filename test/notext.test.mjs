// [patch-dsh-meme-notext] 「图出来了，可那串 [表情: 描述] ·码 注释还杵在气泡里」的回归测试。
//
// 病根：前几版隐藏判据都押在 DOM 形状上 ——
//   ① `img[data-meme-hide-raw] ~ span`（要求注释元素是图片的**兄弟**）；
//   ② `[data-meme-bare]:has(img)` 那一套（要求气泡里**没有别的可见文本**）。
// 宿主只要换个裹法（注释被塞进 <p>/<span> 里、或者气泡里还有别的字），两条就都失效，注释原文
// 一直晾着 —— 用户能选中、能复制。
//
// 药方：不猜层级，直接按**文本节点**摘。这条消息里已经有 img[data-meme-img]（图真配上了），
// 就把同一消息行里还看得见的 [表情: …] 文本节点用 <span data-meme-hidden> 裹起来。
//
// 不 import client.js（浏览器 bundle，尾部有窗口副作用），而是把它从源码里抠出来配一套假 DOM。
// 源码结构变了这个测试会红 —— 那是提醒，不是噪音。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', 'client.js'), 'utf8')

// ⚠️ 这几个函数现在都在**工厂顶层**（4 空格缩进），不是 apply() 里面（6 空格）——
// 兜底那层要在 apply 外面调它。抠源码的正则跟着缩进走，挪了地方就得一起改。
// [patch-dsh-meme-notext 2026-10-12] 第二层（markStaleRawText / hideStaleRawText）原先零覆盖，
// 而它正好是「正文被整块吞掉」的那个病灶（评审 AC-1/AC-2/AC-3）。现在两层一起抠出来测。
const fnSrc = (() => {
  const grab = (re, name) => {
    const m = src.match(re)
    assert.ok(m, '没能在 client.js 里找到 ' + name + '（源码结构变了？测试要跟着改）')
    return m[0]
  }
  const consts = grab(/const MEME_EXCLUDE_SEL = '[^']*'/, 'MEME_EXCLUDE_SEL')
  const tw = grab(/const textWithoutGhosts = \(el\) => \{[\s\S]*?\n {4}\}/, 'textWithoutGhosts')
  const mask = grab(/const maskMarksInTextNode = \(node\) => \{[\s\S]*?\n {4}\}/, 'maskMarksInTextNode')
  const hide = grab(/const hideMemeRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'hideMemeRawText')
  const mark = grab(/const markStaleRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'markStaleRawText')
  const stale = grab(/const hideStaleRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'hideStaleRawText')
  // [第二刀] 消闪现那三样：宽限期常量 + 先摘后放回的两个函数。
  const grace = grab(/const MEME_MASK_GRACE = \d+/, 'MEME_MASK_GRACE')
  const unmask = grab(/const unmaskStalePending = \(\) => \{[\s\S]*?\n {4}\}/, 'unmaskStalePending')
  return [consts, grace, tw, mask, hide, mark, stale, unmask].join('\n')
})()

// ---- 够用的假 DOM：元素 / 文本节点 / TreeWalker / 选择器 / 文档片段 --------
const TEXT = 3
const ELEMENT = 1

const matches = (el, sel) => {
  if (el.nodeType !== ELEMENT) return false
  return String(sel).split(',').some((one) => {
    const s = one.trim()
    const m = s.match(/^([a-z]*)(\[[^\]]+\])*$/i)
    if (!m) return false
    const tag = (m[1] || '').toUpperCase()
    if (tag && el.tagName !== tag) return false
    for (const attr of (s.match(/\[[^\]]+\]/g) || [])) {
      const [k, v] = attr.slice(1, -1).split('=')
      if (v === undefined) { if (!(k in el.attrs)) return false }
      else if (el.attrs[k] !== v.replace(/^["']|["']$/g, '')) return false
    }
    return true
  })
}

const makeDoc = () => {
  const doc = {
    nodeType: 9,
    body: null,
    createElement(tag) { return makeEl(tag) },
    createTextNode(v) {
      const node = { nodeType: TEXT, nodeValue: String(v), parentNode: null }
      // 真 DOM 里文本节点也有 parentElement；第一版假 DOM 忘了给，函数里那句
      // `node.parentElement` 直接抛错 → 一个标记都摘不掉（测试假红，不是代码红）。
      Object.defineProperty(node, 'parentElement', { get() { return this.parentNode && this.parentNode.nodeType === ELEMENT ? this.parentNode : null } })
      return node
    },
    createDocumentFragment() {
      const frag = { nodeType: 11, childNodes: [], appendChild(c) { c.parentNode = frag; this.childNodes.push(c); return c } }
      return frag
    },
    createTreeWalker(_root, _what, opts) {
      const out = []
      const walk = (node) => {
        for (const child of node.childNodes || []) {
          if (child.nodeType === TEXT) { if (opts.acceptNode(child) === 1) out.push(child) } else if (child.nodeType === ELEMENT) walk(child)
        }
      }
      walk(doc.body)
      let i = 0
      return { nextNode: () => (i < out.length ? out[i++] : null) }
    },
    querySelector(sel) {
      const hit = (node) => {
        for (const child of node.childNodes || []) {
          if (child.nodeType !== ELEMENT) continue
          if (matches(child, sel)) return child
          const deep = hit(child)
          if (deep) return deep
        }
        return null
      }
      return hit(doc.body)
    },
    // [patch-dsh-meme-notext 2026-10-12] 第二层要在 document 上找 [data-meme-rawleft] 的行，
    // 假 DOM 里少这个方法 → 5 条兜底用例全抛 TypeError（假红，不是代码红）。
    querySelectorAll(sel) { return doc.body.querySelectorAll(sel) },
  }
  doc.body = makeEl('body')
  doc.body.ownerDocument = doc
  return doc
}

function makeEl(tag) {
  const el = {
    nodeType: ELEMENT,
    tagName: String(tag).toUpperCase(),
    childNodes: [],
    parentNode: null,
    attrs: {},
    style: {},
    // [第二刀 2026-10-12] 这里原来是 `textContent: ''` 一个死字段 —— maskMarksInTextNode 那行
    // `ghost.textContent = hit[0]` 赋值**悄悄丢掉**，ghost 是空的；unmaskStalePending 靠
    // `ghost.textContent` 判「这是不是我们摘的注释」于是永远不认（3 条新用例假红）。
    // 真 DOM 的 textContent 是可写属性 → 假 DOM 也得给 setter：清空子节点、放一个文本节点。
    get textContent() {
      return this.childNodes.map((c) => (c.nodeType === TEXT ? c.nodeValue : c.textContent)).join('')
    },
    set textContent(v) {
      this.childNodes = []
      this.appendChild({ nodeType: TEXT, nodeValue: String(v), parentNode: null })
    },
    className: '',
    appendChild(c) { c.parentNode = el; el.childNodes.push(c); return c },
    replaceChild(frag, old) {
      const kids = frag.nodeType === 11 ? frag.childNodes : [frag] // 假 DOM 也得认文档片段
      const at = el.childNodes.indexOf(old)
      assert.ok(at >= 0, 'replaceChild 的目标不是这个元素的子节点')
      for (const k of kids) k.parentNode = el
      old.parentNode = null // 真 DOM 换掉一个节点就断开它；假 DOM 也得断，否则断言 parentNode 会假红
      el.childNodes.splice(at, 1, ...kids)
      return old
    },
    setAttribute(k, v) { el.attrs[k] = v },
    getAttribute(k) { return k in el.attrs ? el.attrs[k] : null },
    removeAttribute(k) { delete el.attrs[k] },
    querySelector(sel) {
      const hit = (node) => {
        for (const child of node.childNodes) {
          if (child.nodeType !== ELEMENT) continue
          if (matches(child, sel)) return child
          const deep = hit(child)
          if (deep) return deep
        }
        return null
      }
      return hit(el)
    },
    querySelectorAll(sel) {
      const out = []
      const walk = (node) => {
        for (const child of node.childNodes) {
          if (child.nodeType !== ELEMENT) continue
          if (matches(child, sel)) out.push(child)
          walk(child)
        }
      }
      walk(el)
      return out
    },
    closest(sel) {
      let node = el
      while (node && node.nodeType === ELEMENT) {
        if (matches(node, sel)) return node
        node = node.parentNode
      }
      return null
    },
  }
  // [patch-dsh-meme-notext 2026-10-12] 真 DOM 里 `el.dataset.memeRawleft='1'` 会**同时**写
  // data-meme-rawleft 属性 —— markStaleRawText 靠 dataset 盖章、hideStaleRawText 用属性选择器
  // 找行，假 DOM 里这两个要是各存各的，第二层就永远在空跑（测试假红，而且掩盖真 bug）。
  // 这里做成双向：写 dataset 落成属性，读 dataset 从属性来，kebab ↔ camel 互转。
  el.dataset = new Proxy({}, {
    get(_t, k) {
      if (typeof k !== 'string') return undefined
      const key = 'data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
      return key in el.attrs ? el.attrs[key] : undefined
    },
    set(_t, k, v) {
      if (typeof k !== 'string') return false
      el.attrs['data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())] = String(v)
      return true
    },
    deleteProperty(_t, k) {
      if (typeof k === 'string') delete el.attrs['data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())]
      return true
    },
    has(_t, k) {
      if (typeof k !== 'string') return false
      return ('data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())) in el.attrs
    },
  })
  return el
}

// ---- 组装：把抠出来的函数放进一个能看见 document / NodeFilter 的作用域 -----
const buildAll = (doc, opts = {}) => {
  const loadMemeIndex = opts.loadMemeIndex || (() => {})
  const scheduleScan = opts.scheduleScan || (() => {})
  const DateMock = opts.Date || Date
  const fn = new Function(
    'document', 'NodeFilter', 'loadMemeIndex', 'scheduleScan', 'Date',
    fnSrc + '\n return { hideMemeRawText, markStaleRawText, hideStaleRawText, maskMarksInTextNode, unmaskStalePending }'
  )
  return fn(doc, { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 }, loadMemeIndex, scheduleScan, DateMock)
}
const build = (doc) => buildAll(doc).hideMemeRawText

// 把一棵假 DOM 里**还看得见**的文本拼出来。
// [第二刀 2026-10-12] 按真 DOM 的口径：maskMarksInTextNode 的 ghost 盖的是**两样**
// （data-meme-hidden 属性 + 内联 display:none），放回时只撤后者。所以「属性在、但内联样式是
// 空的」= 已经放回来了，算看得见；只认属性、或者还按着 display:none，才算看不见。
const isHiddenChild = (child) => {
  if (child.style && child.style.display === 'none') return true
  const flagged = child.attrs['data-meme-hidden'] !== undefined || child.dataset.memeHidden
  return !!flagged && !child.style
}
const visibleText = (node) => {
  let out = ''
  for (const child of node.childNodes || []) {
    if (child.nodeType === TEXT) { out += child.nodeValue; continue }
    if (child.nodeType !== ELEMENT) continue
    if (isHiddenChild(child)) continue
    out += visibleText(child)
  }
  return out
}

const row = (doc, opts) => {
  // 形状：body > [data-chat-flow-key] > bubble > ...（故意把注释裹进 <p>，跟 img 不同层——
  // 这正是旧判据失效的形状）
  const flow = makeEl('div'); flow.attrs['data-chat-flow-key'] = 'k1'; flow.className = 'flow'
  const bubble = makeEl('div'); bubble.className = 'bubble'
  const inner = makeEl('p')
  const textNode = doc.createTextNode(opts.text)
  inner.appendChild(textNode)
  bubble.appendChild(inner)
  flow.appendChild(bubble)
  if (opts.withImg) {
    const img = makeEl('img'); img.attrs['data-meme-img'] = 'desc'; img.attrs['data-meme-hide-raw'] = '1'
    bubble.appendChild(img)
  }
  doc.body.appendChild(flow)
  return { flow, bubble, inner, textNode, img: flow.querySelector('img[data-meme-img]') }
}

const MARK = '[表情: 橘猫垂着眼睛低头不说话，下面三个省略号，整张脸写满无语。] ·c44807b'

test('图配上了：注释原文从可见树里消失，剩下的正文照旧可见', () => {
  const doc = makeDoc()
  const { textNode } = row(doc, { withImg: true, text: '哈哈，我今天就这样 ' + MARK + ' 你说是不是' })
  build(doc)()
  const seen = visibleText(doc.body)
  assert.ok(!seen.includes('[表情:'), '注释还看得见：' + seen)
  assert.ok(!seen.includes('·c44807b'), '稳定码还看得见：' + seen)
  assert.ok(seen.includes('哈哈，我今天就这样'), '正文被误伤了：' + seen)
  assert.ok(seen.includes('你说是不是'), '注释后面的正文被误伤了：' + seen)
  assert.equal(textNode.parentNode, null, '原文本节点应该已经被换掉')
})

test('注释在 <p> 里、跟 img 不同层也能摘掉（旧判据失效的形状）', () => {
  const doc = makeDoc()
  const { inner, img } = row(doc, { withImg: true, text: MARK })
  assert.notEqual(inner, img.parentNode, '测试前提：注释和图片不同层')
  build(doc)()
  assert.ok(!visibleText(doc.body).includes('[表情:'), '不同层的注释没摘掉')
})

test('没配上图就不许摘：宁可露出原文，也不能留空气泡', () => {
  const doc = makeDoc()
  row(doc, { withImg: false, text: MARK })
  build(doc)()
  assert.ok(visibleText(doc.body).includes('[表情:'), '无图时不该摘（降级态要看得见描述）')
})

test('自己那份 ghost（data-meme-hidden）不重复裹，也不当成可见原文报出去', () => {
  const doc = makeDoc()
  const { flow } = row(doc, { withImg: true, text: '看图 ' + MARK })
  const ghost = makeEl('span'); ghost.attrs['data-meme-hidden'] = '1'; ghost.style.display = 'none'
  ghost.appendChild(doc.createTextNode(MARK))
  flow.childNodes[0].appendChild(ghost) // 挂进 bubble，跟网格里的注释平级
  const before = flow.querySelectorAll('[data-meme-hidden]').length
  build(doc)()
  const after = flow.querySelectorAll('[data-meme-hidden]').length
  assert.equal(after, before + 1, '应该只多出一个 ghost（原来 ' + before + ' 个，现在 ' + after + ' 个）')
  assert.ok(!visibleText(doc.body).includes('[表情:'), 'ghost 不该被算成可见文本')
})

test('老格式（没有 ·码）同样摘掉', () => {
  const doc = makeDoc()
  row(doc, { withImg: true, text: '[表情: 简笔画白猫捧着小东西眼睛冒星星]' })
  build(doc)()
  assert.ok(!visibleText(doc.body).includes('[表情:'), '无码的老标记没摘掉')
})

test('重复调用是幂等的（每轮扫描都会跑一次）', () => {
  const doc = makeDoc()
  row(doc, { withImg: true, text: '一 ' + MARK + ' 二 ' + MARK })
  const run = build(doc)
  run(); const after1 = visibleText(doc.body)
  run(); const after2 = visibleText(doc.body)
  assert.equal(after1, after2, '跑第二遍又改了可见文本')
  assert.ok(!after2.includes('[表情:'), '第一遍就没摘干净：' + after2)
})

// ---- 第二层（兜底层）：宿主把文本节点重写之后，靠这一层 -------------------------------------------------
// 这一组是评审 AC-1/AC-2/AC-3 的回归：原来它按**元素**判（这一层含标记字样就 display:none），
// 同一条 <p> 里的正文会跟着消失，而且没盖任何标记 → 装饰侧的恢复逻辑找不到它，只能刷新才回来。
const staleRow = (doc, opts) => {
  const flow = makeEl('div'); flow.attrs['data-chat-flow-key'] = 'k2'
  const bubble = makeEl('div')
  flow.appendChild(bubble)
  if (opts.beforeImg) { const p = makeEl('p'); p.appendChild(doc.createTextNode(opts.beforeImg)); bubble.appendChild(p) }
  const img = makeEl('img')
  img.attrs['data-meme-img'] = 'desc'; img.attrs['data-meme-hide-raw'] = '1'; img.attrs['src'] = 'http://x/dsh-memes/a.jpg'
  bubble.appendChild(img)
  const textP = makeEl(opts.textTag || 'p')
  textP.appendChild(doc.createTextNode(opts.text))
  bubble.appendChild(textP)
  if (opts.mixed) {
    // 正文 + 标记**同处一个元素的同一个文本节点**（AC-2 的形状：元素级隐藏会连正文一起吞）
    textP.replaceChild(doc.createTextNode(opts.mixed), textP.childNodes[0])
  }
  doc.body.appendChild(flow)
  return { flow, bubble, textP, img }
}

test('兜底层：正文和标记在同一个元素里，只摘标记、正文必须留着（AC-2）', () => {
  const doc = makeDoc()
  const { flow, textP } = staleRow(doc, { mixed: '今晚加班，先这样吧。[表情: 橘猫垂眼] ·c44807b 我先睡了', beforeImg: '' })
  const api = buildAll(doc)
  api.markStaleRawText()
  api.hideStaleRawText()
  const seen = visibleText(doc.body)
  assert.ok(!seen.includes('[表情:'), '标记没摘掉：' + seen)
  assert.ok(seen.includes('今晚加班，先这样吧。'), '正文被吞了：' + seen)
  assert.ok(seen.includes('我先睡了'), '标记后面的正文被吞了：' + seen)
  assert.equal(textP.style.display, undefined, '不该再对元素下手（display 不该被设）')
  assert.equal(flow.getAttribute('data-meme-rawleft'), '1', '这一行该被认成「还露着标记」（dataset 与属性要同步）')
})

test('兜底层：代码块里的格式示例不许碰（AC-3）', () => {
  const doc = makeDoc()
  const { flow } = staleRow(doc, { text: '例：' + MARK, textTag: 'code' })
  const api = buildAll(doc)
  api.markStaleRawText()
  api.hideStaleRawText()
  assert.ok(visibleText(flow).includes('[表情:'), '代码块里的示例被摘了')
})

test('兜底层：没配到图的行不碰（降级态要看得见描述）', () => {
  const doc = makeDoc()
  const flow = makeEl('div'); flow.attrs['data-chat-flow-key'] = 'k3'
  const p = makeEl('p'); p.appendChild(doc.createTextNode(MARK))
  flow.appendChild(p); doc.body.appendChild(flow)
  const api = buildAll(doc)
  api.markStaleRawText()
  api.hideStaleRawText()
  assert.ok(visibleText(doc.body).includes('[表情:'), '没图也摘了，会留空气泡')
  assert.equal(flow.getAttribute('data-meme-rawleft'), null, '没图的行不该被盖章')
})

test('兜底层：宿主写回正文时不能把元素锁死（AC-1：刷新才回来的那种）', () => {
  const doc = makeDoc()
  const { flow, textP } = staleRow(doc, { text: MARK })
  const api = buildAll(doc)
  api.markStaleRawText()
  api.hideStaleRawText()
  assert.equal(flow.getAttribute('data-meme-rawleft'), '1', '前提：第一遍该盖章')
  // 宿主把纯文本子节点重写成新的文本节点（流式追加就是这么干的）
  textP.replaceChild(doc.createTextNode('写回来了：这是新正文'), textP.childNodes[0])
  api.markStaleRawText()
  api.hideStaleRawText()
  assert.ok(visibleText(flow).includes('写回来了：这是新正文'), '新正文被旧状态挡住了')
})

test('兜底层：摘过的 ghost 不重复摘（幂等）', () => {
  const doc = makeDoc()
  staleRow(doc, { text: '看 ' + MARK })
  const api = buildAll(doc)
  api.markStaleRawText(); api.hideStaleRawText()
  const once = visibleText(doc.body)
  const ghosts1 = doc.body.querySelectorAll('[data-meme-hidden]').length
  api.markStaleRawText(); api.hideStaleRawText()
  const twice = visibleText(doc.body)
  const ghosts2 = doc.body.querySelectorAll('[data-meme-hidden]').length
  assert.equal(once, twice, '第二遍又改了可见文本')
  assert.equal(ghosts1, ghosts2, 'ghost 越裹越多')
})

// ---- [第二刀 2026-10-12] 消闪现：索引没到手的那段空窗 ----------------------------------
// 病：码/描述还没查表、图一张都没插，而所有隐藏逻辑的前提都是「这一行已经有 img」——
// 那串 [表情: …] ·码 就明晃晃挂在气泡里，用户 m02392 报的「先出现一串给 AI 的注释」就是它。
// 药：宽限期内先摘掉，超过 MEME_MASK_GRACE 图还没来就放回去（宁可看见注释，别留空白）。
// 假 DOM 没有真时钟，这里注入一个能手动拨的 Date.now。

const makeClock = (start = 1_700_000_000_000) => {
  let now = start
  const FakeDate = { now: () => now }
  return { FakeDate, tick: (ms) => { now += ms }, at: () => now }
}

// 造一行「还没配图、但已经在等索引」的消息（decorateMemeText 里那支分支的产物）
const pendingRow = (doc, text) => {
  const built = row(doc, { withImg: false, text })
  built.bubble.dataset.memePendingAt = String(1)
  return built
}

test('消闪现：宽限期内先把注释摘掉（这一刻图还没来）', () => {
  const doc = makeDoc()
  const { bubble } = pendingRow(doc, '哈哈 ' + MARK)
  const api = buildAll(doc)
  api.maskMarksInTextNode(doc.body.querySelector('p').childNodes[0])
  bubble.dataset.memePendingAt = String(1) // 盖时间戳（真代码在这里写 Date.now()）
  const seen = visibleText(doc.body)
  assert.ok(!seen.includes('[表情:'), '空窗期注释还看得见：' + seen)
  assert.ok(!seen.includes('·c44807b'), '空窗期稳定码还看得见：' + seen)
  assert.ok(seen.includes('哈哈'), '正文被误伤了：' + seen)
})

test('消闪现：超了宽限期还没配上图，原文放回来（宁可看见注释，别留空白）', () => {
  const doc = makeDoc()
  const clock = makeClock()
  const { bubble, textNode } = row(doc, { withImg: false, text: MARK })
  const api = buildAll(doc, { Date: clock.FakeDate })
  api.maskMarksInTextNode(textNode)
  bubble.dataset.memePendingAt = String(clock.at())
  assert.ok(!visibleText(doc.body).includes('[表情:'), '前提：先摘掉了')
  clock.tick(1600)
  api.unmaskStalePending()
  const seen = visibleText(doc.body)
  assert.ok(seen.includes('[表情:'), '超期后原文没放回来：' + seen)
  assert.equal(bubble.getAttribute('data-meme-pending-at'), null, '超期的戳没清掉（下一遍还得再算一次）')
  assert.equal(bubble.dataset.memeDecorated, undefined, '这一行还露着标记却没解锁，下一遍扫描会跳过它')
})

test('消闪现：宽限期内不许放回（就是靠这段窗口消掉闪现的）', () => {
  const doc = makeDoc()
  const clock = makeClock()
  const { bubble, textNode } = row(doc, { withImg: false, text: MARK })
  const api = buildAll(doc, { Date: clock.FakeDate })
  api.maskMarksInTextNode(textNode)
  bubble.dataset.memePendingAt = String(clock.at())
  clock.tick(1599)
  api.unmaskStalePending()
  assert.ok(!visibleText(doc.body).includes('[表情:'), '还没到点就把注释放回来了，闪现照样有')
})

test('消闪现：图真配上了的话，超期也不放回（藏得有依据）', () => {
  const doc = makeDoc()
  const clock = makeClock()
  const { bubble, textNode } = row(doc, { withImg: true, text: '看这个 ' + MARK })
  const api = buildAll(doc, { Date: clock.FakeDate })
  api.maskMarksInTextNode(textNode)
  bubble.dataset.memePendingAt = String(clock.at())
  clock.tick(99999)
  api.unmaskStalePending()
  assert.ok(!visibleText(doc.body).includes('[表情:'), '图都出来了还把注释放回来')
  assert.ok(visibleText(doc.body).includes('看这个'), '正文被误伤了')
})

test('消闪现：放回之后是真的重扫，不是每遍都放一次（幂等）', () => {
  const doc = makeDoc()
  const clock = makeClock()
  const { bubble } = row(doc, { withImg: false, text: MARK })
  let scans = 0
  const api = buildAll(doc, { Date: clock.FakeDate, scheduleScan: () => { scans += 1 } })
  const inner = bubble.querySelector('p')
  api.maskMarksInTextNode(inner.childNodes[0])
  bubble.dataset.memePendingAt = String(clock.at())
  clock.tick(2000)
  api.unmaskStalePending()
  assert.equal(scans, 1, '放回之后该重扫一次')
  api.unmaskStalePending()
  assert.equal(scans, 1, '没戳了还在扫（每遍都白跑一趟）')
  assert.ok(visibleText(doc.body).includes('[表情:'), '正文态被改坏了')
})
