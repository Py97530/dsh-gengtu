// 一次性诊断：为什么「超期放回」在假 DOM 里没生效。跑法：
//   node --import ./test/stub/register.mjs tools/_diag-flash.mjs
// 从 client.js 抠出 unmaskStalePending 那一族真源码，用最小假 DOM 走一遍，逐步打印状态。
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', 'client.js'), 'utf8').replace(/\r\n/g, '\n')
const grab = (re, n) => {
  const m = src.match(re)
  if (!m) throw new Error('没找到 ' + n)
  return m[0]
}
const fnSrcRaw = [
  grab(/const MEME_EXCLUDE_SEL = '[^']*'/, 'MEME_EXCLUDE_SEL'),
  grab(/const MEME_MASK_GRACE = \d+/, 'MEME_MASK_GRACE'),
  grab(/const textWithoutGhosts = \(el\) => \{[\s\S]*?\n {4}\}/, 'textWithoutGhosts'),
  grab(/const maskMarksInTextNode = \(node\) => \{[\s\S]*?\n {4}\}/, 'maskMarksInTextNode'),
  grab(/const unmaskStalePending = \(\) => \{[\s\S]*?\n {4}\}/, 'unmaskStalePending'),
].join('\n')
// 把 unmaskStalePending 体内的关键步骤插进打印（临时诊断，别把它带进正式代码）
const fnSrc = fnSrcRaw
  .replace('        if (!at || Date.now() - at < MEME_MASK_GRACE) continue',
    '        console.log("[trace] at=", at, "now=", Date.now(), "grace=", MEME_MASK_GRACE, "diff=", Date.now() - at)\n        if (!at || Date.now() - at < MEME_MASK_GRACE) continue')
  .replace("        if (el.querySelector('img[data-meme-img]')) continue",
    "        console.log('[trace] 这行有图吗 =', !!el.querySelector('img[data-meme-img]'))\n        if (el.querySelector('img[data-meme-img]')) continue")
  .replace("          if (/^\\[(?:表情|m):/.test(ghost.textContent || '')) ghost.style.display = ''",
    "          console.log('[trace] ghost 文本 =', JSON.stringify(ghost.textContent), '命中 =', /^\\[(?:表情|m):/.test(ghost.textContent || ''))\n          if (/^\\[(?:表情|m):/.test(ghost.textContent || '')) { ghost.style.display = ''; console.log('[trace] 已设 display =', JSON.stringify(ghost.style.display)) }")
  .replace('        const at = parseInt(', '        console.log("[trace] el =", el.tagName, el.attrs)\n        const at = parseInt(')
console.log('注入了几处 =', ['[trace] at=', '[trace] 这行有图吗', '[trace] ghost 文本'].map((k) => fnSrc.includes(k)))

const ELEMENT = 1
const TEXT = 3
const matches = (el, sel) => String(sel).split(',').some((one) => {
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
const makeEl = (tag) => {
  const el = {
    nodeType: ELEMENT, tagName: tag.toUpperCase(), attrs: {}, childNodes: [], parentNode: null,
    style: {}, get textContent() { return this.childNodes.map((c) => (c.nodeType === TEXT ? c.nodeValue : c.textContent)).join('') },
    set textContent(v) { this.childNodes = []; this.appendChild({ nodeType: TEXT, nodeValue: String(v), parentNode: null }) },
    appendChild(c) { c.parentNode = el; el.childNodes.push(c); return c },
    replaceChild(frag, old) {
      const kids = frag.nodeType === 11 ? frag.childNodes : [frag]
      const at = el.childNodes.indexOf(old)
      if (at < 0) throw new Error('replaceChild 目标不在子节点里')
      for (const k of kids) k.parentNode = el
      old.parentNode = null
      el.childNodes.splice(at, 1, ...kids)
      return old
    },
    setAttribute(k, v) { el.attrs[k] = v },
    getAttribute(k) { return k in el.attrs ? el.attrs[k] : null },
    removeAttribute(k) { delete el.attrs[k] },
    querySelector(sel) { const all = el.querySelectorAll(sel); return all.length ? all[0] : null },
    querySelectorAll(sel) {
      const out = []
      const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType !== ELEMENT) continue; if (matches(c, sel)) out.push(c); walk(c) } }
      walk(el)
      return out
    },
    closest(sel) { let n = el; while (n && n.nodeType === ELEMENT) { if (matches(n, sel)) return n; n = n.parentNode } return null },
  }
  el.dataset = new Proxy({}, {
    get(_t, k) { if (typeof k !== 'string') return undefined; const key = 'data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()); return key in el.attrs ? el.attrs[key] : undefined },
    set(_t, k, v) { el.attrs['data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())] = String(v); return true },
    deleteProperty(_t, k) { delete el.attrs['data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())]; return true },
    has(_t, k) { return ('data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())) in el.attrs },
  })
  return el
}
const doc = {
  body: makeEl('body'),
  createElement: makeEl,
  createTextNode(v) { return { nodeType: TEXT, nodeValue: v, parentNode: null } },
  createDocumentFragment() { return { nodeType: 11, childNodes: [], appendChild(c) { this.childNodes.push(c); return c } } },
  querySelector(sel) { return doc.body.querySelector(sel) },
  querySelectorAll(sel) { return doc.body.querySelectorAll(sel) },
}

const MARK = '[表情: 橘猫垂着眼睛低头不说话，下面三个省略号，整张脸写满无语。] ·c44807b'
const flow = makeEl('div'); flow.attrs['data-chat-flow-key'] = 'k1'
const bubble = makeEl('div')
const p = makeEl('p')
const tn = doc.createTextNode(MARK)
p.appendChild(tn); bubble.appendChild(p); flow.appendChild(bubble); doc.body.appendChild(flow)

let NOW = 1_700_000_000_000
const FakeDate = { now: () => NOW }
let scans = 0
const api = new Function('document', 'NodeFilter', 'loadMemeIndex', 'scheduleScan', 'Date',
  fnSrc + '\n return { maskMarksInTextNode, unmaskStalePending, MEME_MASK_GRACE }')(
  doc, { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 }, () => {}, () => { scans += 1 }, FakeDate)

console.log('宽限期 =', api.MEME_MASK_GRACE)
console.log('--- 摘之前 ---')
console.log('p.childNodes:', p.childNodes.map((c) => (c.nodeType === TEXT ? 'TEXT' : c.tagName)))
api.maskMarksInTextNode(tn)
console.log('--- 摘之后 ---')
console.log('p.childNodes:', p.childNodes.map((c) => (c.nodeType === TEXT ? 'TEXT:' + c.nodeValue : c.tagName + ' hidden=' + c.getAttribute('data-meme-hidden') + ' display=' + JSON.stringify(c.style.display))))
bubble.dataset.memePendingAt = String(NOW)
console.log('bubble 戳 =', bubble.getAttribute('data-meme-pending-at'))
NOW += 1600
console.log('boot.query[data-meme-pending-at] 命中 =', doc.body.querySelectorAll('[data-meme-pending-at]').length)
api.unmaskStalePending()
console.log('--- 放回之后 ---')
console.log('scans =', scans)
console.log('p.childNodes:', p.childNodes.map((c) => (c.nodeType === TEXT ? 'TEXT:' + c.nodeValue : c.tagName + ' hidden=' + c.getAttribute('data-meme-hidden') + ' display=' + JSON.stringify(c.style.display))))
console.log('里面那个 ghost 的 display =', JSON.stringify(p.querySelectorAll('[data-meme-hidden]')[0]?.style.display))
console.log('textWithoutGhosts(bubble) =', JSON.stringify(p.childNodes.filter((c) => c.nodeType === TEXT).map((c) => c.nodeValue).join('')))
