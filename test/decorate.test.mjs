// [patch-dsh-meme-notext 第三刀 2026-10-12] decorateMemeText **本体**的回归测试。
//
// 为什么非要有它：2026-10-12 用户报「只显示文字」—— 聊天气泡里的 [表情: 描述] ·码 一张都不
// 转图，面板自检里漏出一句
//   索引拉取失败: Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.
// 真凶：decorateMemeText 里「先把注释原文摘掉」那一步（maskMarksInTextNode 拿文档片段**换掉整个
// 文本节点**）跑在配图判断之前，于是**每一条能配到图的消息**走到后面 parent.replaceChild(frag, node)
// 时，node 早就不是 parent 的孩子了 → 抛异常 → 整趟装饰当场断（后面的节点、去重、隐藏全跳过）。
//
// 而那一刻 test/notext.test.mjs 16 条用例**全绿**：它把 notext 那层函数孤立着跑，从不跑
// decorateMemeText 本体 —— 错就长在两层之间。这个文件补的就是那一块：把 decorateMemeText 从
// 源码里抠出来，配一套**会像真 DOM 一样断言子节点关系**的假 DOM（test/stub/dom.mjs），真跑一遍。
//
// 不 import client.js（浏览器 bundle，尾部有窗口副作用），抠源码的方式与 notext.test.mjs 一致：
// 源码结构变了这个测试会红 —— 那是提醒，不是噪音。作用域按花括号深度核过（tools/_diag-depth.mjs）：
// 这个文件的缩进被历史补丁拧过（decorateMemeText 那行顶格、体内 8 空格），**别信缩进**。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TEXT, makeDoc, makeEl, visibleText } from './stub/dom.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', 'client.js'), 'utf8')

const grab = (re, name) => {
  const m = src.match(re)
  assert.ok(m, '没能在 client.js 里找到 ' + name + '（源码结构变了？测试要跟着改）')
  return m[0]
}

const fnSrc = [
  grab(/const MEME_TEXT_RE = [^\n]*\n/, 'MEME_TEXT_RE'),
  grab(/const MEME_TEXT_TEST = [^\n]*\n/, 'MEME_TEXT_TEST'),
  grab(/const MEME_EXCLUDE_SEL = '[^']*'/, 'MEME_EXCLUDE_SEL'),
  grab(/const MEME_MASK_GRACE = \d+/, 'MEME_MASK_GRACE'),
  // 下面这批在工厂顶层（4 空格收尾）
  grab(/const textWithoutGhosts = \(el\) => \{[\s\S]*?\n {4}\}/, 'textWithoutGhosts'),
  grab(/const maskMarksInTextNode = \(node\) => \{[\s\S]*?\n {4}\}/, 'maskMarksInTextNode'),
  grab(/const hideMemeRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'hideMemeRawText'),
  grab(/const markStaleRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'markStaleRawText'),
  grab(/const hideStaleRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'hideStaleRawText'),
  grab(/const unmaskStalePending = \(\) => \{[\s\S]*?\n {4}\}/, 'unmaskStalePending'),
  // 这两个在 apply() 里面（6 空格收尾）
  grab(/const ghostFor = \(raw\) => \{[\s\S]*?\n {6}\}/, 'ghostFor'),
  grab(/const decorateMemeText = \(\) => \{[\s\S]*?\n {6}\}/, 'decorateMemeText'),
].join('\n')

const makeClock = (start = 1_700_000_000_000) => {
  const clock = { t: start, now() { return clock.t } }
  return clock
}
const codeSrc = (hit) => (hit[2] ? 'https://memes.test/' + hit[2] + '.jpg' : '')

// ---- 组装：把抠出来的函数放进一个能看见 document / 桩掉外部依赖的作用域，真跑 ----
const build = (doc, opts = {}) => {
  const clock = opts.clock || makeClock()
  const fn = new Function(
    'document', 'NodeFilter', 'Date', 'scheduleScan',
    'memeSrcFor', 'memeTokenLabel', 'foldCaption', 'loadMemeIndex', 'dedupeMemeImages',
    'let memeIndexNeedsRecheck = ' + (opts.recheck ? 'true' : 'false') + '\n' +
    'let memeDecorateStatus = ""\n' +
    'let memeImgCount = 0\n' +
    'let memeIndex = null\n' +          // 索引为空 → 末尾的 TTL 重拉那支不会跑（免得要再桩一层）
    'let memeIndexAt = 0\n' +
    'let memeRefreshGate = 0\n' +
    'const MEME_INDEX_TTL = 60000\n' +
    fnSrc + '\n' +
    'return { decorateMemeText, unmaskStalePending, maskMarksInTextNode, status: () => memeDecorateStatus, imgCount: () => memeImgCount, recheck: () => memeIndexNeedsRecheck }'
  )
  const api = fn(
    doc, { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 }, clock,
    opts.scheduleScan || (() => {}),
    opts.memeSrcFor || codeSrc,
    opts.memeTokenLabel || ((hit) => hit[2] || hit[1]),
    opts.foldCaption || ((x) => x),
    opts.loadMemeIndex || (() => {}),
    opts.dedupeMemeImages || (() => {}),
  )
  return { api, clock }
}

// 一条消息行：body > div[data-chat-flow-key] > div.bubble > p > 文本
// （形状照宿主：数据在 <p> 里、气泡在上一层，所以图的落点要走「提到气泡外面」那段。）
const chatRow = (doc, text, key = 'k1') => {
  const flow = makeEl('div'); flow.attrs['data-chat-flow-key'] = key; flow.className = 'flow'
  const bubble = makeEl('div'); bubble.className = 'bubble'
  const p = makeEl('p')
  const node = doc.createTextNode(text)
  p.appendChild(node)
  bubble.appendChild(p)
  flow.appendChild(bubble)
  doc.body.appendChild(flow)
  return { flow, bubble, p, node }
}

test('能配到图：图落进 DOM、原文标记不再可见、整趟不抛错（2026-10-12「只显示文字」的回归）', () => {
  const doc = makeDoc()
  const r = chatRow(doc, '看这个 [表情: 猫猫] ·c17928d 好可爱')
  const { api } = build(doc)

  // ← 这一步就是回归点：病在的时候这里会抛
  //   Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.
  api.decorateMemeText()

  const img = r.flow.querySelector('img[data-meme-img]')
  assert.ok(img, '图没落进 DOM')
  assert.equal(img.src, 'https://memes.test/c17928d.jpg')
  assert.ok(!visibleText(doc.body).includes('[表情:'), '给模型看的注释还看得见')
  assert.ok(visibleText(doc.body).includes('看这个') && visibleText(doc.body).includes('好可爱'), '正文被误伤了')
  assert.equal(api.status(), '', '自检里报了装饰失败：' + api.status())
  assert.equal(api.imgCount(), 1)
  assert.equal(r.p.dataset.memeDecorated, '1', '没盖装饰完成的章 → 每轮扫描都会重来')
})

test('配不到图、又赶上「码表刚更新」那一遍：先摘原文顶着，但不标装饰完成', () => {
  const doc = makeDoc()
  const r = chatRow(doc, '看这个 [表情: 查无此图] 好可爱')
  const { api } = build(doc, { recheck: true, memeSrcFor: () => '' })

  api.decorateMemeText()

  assert.ok(r.p.dataset.memePendingAt, '没盖 pendingAt → 宽限期到了也放不回来')
  assert.equal(r.p.dataset.memeDecorated, undefined, '这一遍该放弃，不该标装饰完成')
  assert.ok(!visibleText(doc.body).includes('[表情:'), '空窗期注释还裸着（用户报过的那一下闪现）')
  assert.ok(visibleText(doc.body).includes('看这个'), '摘的时候把正文也带走了')
  assert.equal(api.recheck(), false, 'recheck 没被消费掉 → 以后每轮都会白白放弃这一条')
  assert.equal(api.status(), '')
})

test('宽限期过了：原文放回可见树，而且是**裸文本节点**（不然这条消息永远配不上图）', () => {
  const doc = makeDoc()
  const r = chatRow(doc, '[表情: 查无此图]')
  const clock = makeClock()
  let src = '' // 一开始索引里查不到
  let scans = 0
  const { api } = build(doc, { recheck: true, clock, memeSrcFor: () => src, scheduleScan: () => { scans++ } })

  api.decorateMemeText()
  assert.ok(!visibleText(doc.body).includes('[表情:'), '前提：先摘掉了')

  clock.t += 1600 // 拨过 MEME_MASK_GRACE
  api.unmaskStalePending()

  assert.ok(visibleText(doc.body).includes('[表情:'), '超期了还没把原文放回来（气泡会空一块）')
  assert.equal(r.p.querySelectorAll('[data-meme-hidden]').length, 0,
    '原文还裹在 [data-meme-hidden] 里 → 装饰侧 TreeWalker 见它就 REJECT，这条消息永久裸着标记（第三刀修的就是这个）')
  const back = r.p.childNodes.filter((c) => c.nodeType === TEXT).map((c) => c.nodeValue).join('')
  assert.equal(back, '[表情: 查无此图]', '放回的不是裸文本')
  assert.equal(scans, 1, '放回之后没重扫一次')

  // 下一轮索引里有了 → 必须能正常出图（证明「放回 = 重新可装饰」）
  src = 'https://memes.test/now.jpg'
  api.decorateMemeText()
  assert.ok(r.flow.querySelector('img[data-meme-img]'), '放回之后这条消息再也配不上图了')
  assert.ok(!visibleText(doc.body).includes('[表情:'), '出图了标记还留着')
})

test('兜底：轮到自己时文本节点已经被换走了 → 跳过这一条，别把整趟扫描带崩', () => {
  const doc = makeDoc()
  const first = chatRow(doc, '看这个 [表情: 猫猫] ·c17928d', 'k1')
  const second = chatRow(doc, '还有 [表情: 狗狗] ·c1aaaaa', 'k2')
  const calls = { dedupe: 0 }
  let detached = false
  const { api } = build(doc, {
    // 模拟「parent 已经绑好之后，那一步又把节点摘走」：loadMemeIndex() 正好卡在绑定 parent
    // 与 replaceChild 之间（历史上干这事的就是 2448 那次 mask）。真 DOM 里这么一下必抛。
    loadMemeIndex: () => {
      if (detached) return
      detached = true
      first.p.removeChild(first.node)
    },
    dedupeMemeImages: () => { calls.dedupe++ },
  })

  api.decorateMemeText()

  assert.equal(first.flow.querySelector('img[data-meme-img]'), null, '被换走的那条不该硬插')
  assert.ok(second.flow.querySelector('img[data-meme-img]'), '后面那条没出图 → 又被一条坏消息带崩了')
  assert.match(api.status(), /跳过一条消息/)
  assert.equal(calls.dedupe, 1, '整趟扫描被中断了（末尾的去重/隐藏全跳过）')
})
