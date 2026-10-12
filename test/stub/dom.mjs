// 够用的假 DOM：元素 / 文本节点 / TreeWalker / 选择器 / 文档片段。
//
// 原则：**宁可忠实，别图省事**。2026-10-12 那天 test/notext.test.mjs 里 16 条用例全绿，
// 而 App 里一张表情都不出 —— 就是因为它把 notext 那层函数**孤立**着跑，从没真跑过
// decorateMemeText 本体，而 bug 恰好长在两层之间（一个函数把文本节点换走，另一个函数再拿
// 那个节点去 replaceChild）。假 DOM 越像真的，这种「层与层之间」的错才越容易现形：
//   · replaceChild 会像真 DOM 一样断言「目标必须是我自己的子节点」（真 DOM 抛 NotFoundError）；
//   · textContent 是可写属性（写它会清空子节点、放一个文本节点）；
//   · el.dataset ↔ data-* 属性双向同步（kebab ↔ camel）；
//   · el.style.cssText 写 'display:none' 会真的把 style.display 设成 'none'（真 DOM 就是这样，
//     忘了仿的话 ghost 会被算成可见文本，测试假红）。
export const TEXT = 3
export const ELEMENT = 1

export const matches = (el, sel) => {
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

export const makeDoc = () => {
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
      // 真 DOM 在 whatToShow=SHOW_TEXT 时只会拿文本节点去问 acceptNode，这里照做。
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

export function makeEl(tag) {
  const el = {
    nodeType: ELEMENT,
    tagName: String(tag).toUpperCase(),
    childNodes: [],
    parentNode: null,
    attrs: {},
    // 真 DOM 的 style.cssText = 'display:none' 会落到 style.display 上（ghostFor 就是这么写的）。
    style: {
      _css: '',
      get cssText() { return this._css },
      set cssText(v) {
        this._css = String(v)
        this.display = /display\s*:\s*none/i.test(this._css) ? 'none' : (this.display === 'none' ? '' : this.display)
      },
    },
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
    removeChild(c) {
      const at = el.childNodes.indexOf(c)
      assertOk(at >= 0, 'removeChild 的目标不是这个元素的子节点')
      c.parentNode = null
      el.childNodes.splice(at, 1)
      return c
    },
    insertBefore(node, ref) {
      const kids = node.nodeType === 11 ? node.childNodes.slice() : [node]
      const at = ref ? el.childNodes.indexOf(ref) : -1
      for (const k of kids) k.parentNode = el
      if (at < 0) el.childNodes.push(...kids)
      else el.childNodes.splice(at, 0, ...kids)
      if (node.nodeType === 11) node.childNodes = []
      return node
    },
    replaceChild(frag, old) {
      const kids = frag.nodeType === 11 ? frag.childNodes : [frag] // 假 DOM 也得认文档片段
      const at = el.childNodes.indexOf(old)
      assertOk(at >= 0, 'replaceChild 的目标不是这个元素的子节点')
      for (const k of kids) k.parentNode = el
      old.parentNode = null // 真 DOM 换掉一个节点就断开它；假 DOM 也得断，否则断言 parentNode 会假红
      el.childNodes.splice(at, 1, ...kids)
      return old
    },
    setAttribute(k, v) { el.attrs[k] = v },
    getAttribute(k) { return k in el.attrs ? el.attrs[k] : null },
    removeAttribute(k) { delete el.attrs[k] },
    get nextSibling() {
      const p = el.parentNode
      if (!p || !p.childNodes) return null
      const i = p.childNodes.indexOf(el)
      return i >= 0 && i + 1 < p.childNodes.length ? p.childNodes[i + 1] : null
    },
    get parentElement() { return el.parentNode && el.parentNode.nodeType === ELEMENT ? el.parentNode : null },
    get isConnected() {
      let n = el
      while (n.parentNode) n = n.parentNode
      return n.tagName === 'BODY'
    },
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

// 本模块不想 import node:assert（它会被当成 test 上下文）；自己抛就行，
// 消息格式跟 assert 一样，红起来一眼能看懂。
const assertOk = (cond, message) => { if (!cond) throw new Error('AssertionError: ' + message) }

// 把一棵假 DOM 里**还看得见**的文本拼出来。
const isHiddenChild = (child) => {
  if (child.style && child.style.display === 'none') return true
  const flagged = child.attrs['data-meme-hidden'] !== undefined || child.dataset.memeHidden
  return !!flagged && !child.style
}
export const visibleText = (node) => {
  let out = ''
  for (const child of node.childNodes || []) {
    if (child.nodeType === TEXT) { out += child.nodeValue; continue }
    if (child.nodeType !== ELEMENT) continue
    if (isHiddenChild(child)) continue
    out += visibleText(child)
  }
  return out
}
