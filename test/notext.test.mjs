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

// ⚠️ 这两个函数现在都在**工厂顶层**（4 空格缩进），不是 apply() 里面（6 空格）——
// 兜底那层要在 apply 外面调它。抠源码的正则跟着缩进走，挪了地方就得一起改。
const fnSrc = (() => {
  const m = src.match(/const hideMemeRawText = \(\) => \{[\s\S]*?\n {4}\}/)
  assert.ok(m, '没能在 client.js 里找到 hideMemeRawText（源码结构变了？测试要跟着改）')
  const tw = src.match(/const textWithoutGhosts = \(el\) => \{[\s\S]*?\n {4}\}/)
  assert.ok(tw, '没能在 client.js 里找到 textWithoutGhosts（它该在工厂顶层）')
  return tw[0] + '\n' + m[0]
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
    dataset: {},
    style: {},
    textContent: '',
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
  return el
}

// ---- 组装：把抠出来的函数放进一个能看见 document / NodeFilter 的作用域 -----
const build = (doc) => {
  const fn = new Function('document', 'NodeFilter', fnSrc + '\n return hideMemeRawText')
  return fn(doc, { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 })
}

// 把一棵假 DOM 里**还看得见**的文本拼出来（跳过 data-meme-hidden 子树）
const visibleText = (node) => {
  let out = ''
  for (const child of node.childNodes || []) {
    if (child.nodeType === TEXT) { out += child.nodeValue; continue }
    if (child.nodeType !== ELEMENT) continue
    if (child.attrs['data-meme-hidden'] !== undefined || child.dataset.memeHidden) continue
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
