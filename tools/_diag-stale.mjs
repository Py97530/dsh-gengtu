// 一次性调试：为什么 markStaleRawText 没给行盖章
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const grab = (re, n) => { const m = src.match(re); if (!m) throw new Error('找不到 ' + n); return m[0] }
const fnSrc = [
  grab(/const MEME_EXCLUDE_SEL = '[^']*'/, 'sel'),
  grab(/const textWithoutGhosts = \(el\) => \{[\s\S]*?\n {4}\}/, 'tw'),
  grab(/const maskMarksInTextNode = \(node\) => \{[\s\S]*?\n {4}\}/, 'mask'),
  grab(/const hideMemeRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'hide'),
  grab(/const markStaleRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'mark'),
  grab(/const hideStaleRawText = \(\) => \{[\s\S]*?\n {4}\}/, 'stale'),
].join('\n')

const TEXT = 3, ELEMENT = 1
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
const makeEl = (tag) => {
  const el = { nodeType: ELEMENT, tagName: String(tag).toUpperCase(), childNodes: [], parentNode: null, attrs: {}, dataset: {}, style: {}, textContent: '', appendChild(c) { c.parentNode = el; el.childNodes.push(c); return c }, replaceChild(frag, old) { const kids = frag.nodeType === 11 ? frag.childNodes : [frag]; const at = el.childNodes.indexOf(old); for (const k of kids) k.parentNode = el; old.parentNode = null; el.childNodes.splice(at, 1, ...kids); return old }, setAttribute(k, v) { el.attrs[k] = v }, getAttribute(k) { return k in el.attrs ? el.attrs[k] : null }, removeAttribute(k) { delete el.attrs[k] }, querySelector(sel) { const hit = (n) => { for (const c of n.childNodes) { if (c.nodeType !== ELEMENT) continue; if (matches(c, sel)) return c; const d = hit(c); if (d) return d } return null }; return hit(el) }, querySelectorAll(sel) { const out = []; const w = (n) => { for (const c of n.childNodes) { if (c.nodeType !== ELEMENT) continue; if (matches(c, sel)) out.push(c); w(c) } }; w(el); return out }, closest(sel) { let n = el; while (n && n.nodeType === ELEMENT) { if (matches(n, sel)) return n; n = n.parentNode } return null } }
  return el
}
const doc = { nodeType: 9, body: null, createElement: makeEl, createTextNode(v) { const n = { nodeType: TEXT, nodeValue: String(v), parentNode: null }; Object.defineProperty(n, 'parentElement', { get() { return this.parentNode && this.parentNode.nodeType === ELEMENT ? this.parentNode : null } }); return n }, createDocumentFragment() { const f = { nodeType: 11, childNodes: [], appendChild(c) { c.parentNode = f; this.childNodes.push(c); return c } }; return f }, createTreeWalker(root, _w, opts) { const out = []; const walk = (n) => { for (const c of n.childNodes || []) { if (c.nodeType === TEXT) { if (opts.acceptNode(c) === 1) out.push(c) } else if (c.nodeType === ELEMENT) walk(c) } }; walk(root); let i = 0; return { nextNode: () => (i < out.length ? out[i++] : null) } } }
doc.body = makeEl('body'); doc.body.ownerDocument = doc
doc.querySelectorAll = (sel) => doc.body.querySelectorAll(sel)

const flow = makeEl('div'); flow.attrs['data-chat-flow-key'] = 'k2'
const bubble = makeEl('div'); flow.appendChild(bubble)
const img = makeEl('img'); img.attrs['data-meme-img'] = 'desc'; img.attrs['data-meme-hide-raw'] = '1'; bubble.appendChild(img)
const p = makeEl('p'); p.appendChild(doc.createTextNode('今晚加班，先这样吧。[表情: 橘猫垂眼] ·c44807b 我先睡了')); bubble.appendChild(p)
doc.body.appendChild(flow)

console.log('body 子树里的行：', doc.querySelectorAll('[data-meme-rawleft]').length)
console.log('row 里找 img[data-meme-img]：', flow.querySelector('img[data-meme-img]') ? '有' : '没有')
console.log('p.closest(row):', p.closest('[data-chat-flow],[data-chat-flow-key],[data-time-hover-root]') === flow ? '是 flow' : '不是')
console.log('p.closest(MEME_EXCLUDE_SEL):', p.closest('input,textarea,[contenteditable="true"],[data-variant="think"],[data-variant="others"],pre,code'))

const api = new Function('document', 'NodeFilter', fnSrc + '\n return { markStaleRawText, hideStaleRawText }')(doc, { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 })
// 手动把 markStaleRawText 的循环走一遍，看每一步的判定
{
  const walker = doc.createTreeWalker(doc.body, 4, { acceptNode: (n) => (/\[(?:表情|m):/.test(n.nodeValue || '') ? 1 : 2) })
  let cur
  let n = 0
  while ((cur = walker.nextNode())) {
    n++
    const parent = cur.parentElement
    console.log('文本节点#' + n, JSON.stringify(cur.nodeValue.slice(0, 20)), '| parent:', parent ? parent.tagName : 'null')
    if (!parent) { console.log('   → parent 空，跳'); continue }
    console.log('   closest(ghost):', parent.closest('[data-meme-hidden]') ? '命中（会跳）' : 'null')
    console.log('   closest(exclude):', parent.closest('input,textarea,[contenteditable="true"],[data-variant="think"],[data-variant="others"],pre,code') ? '命中（会跳）' : 'null')
    const row = parent.closest('[data-chat-flow],[data-chat-flow-key],[data-time-hover-root]')
    console.log('   closest(row):', row ? row.tagName : 'null')
    console.log('   row 里有图:', row ? (row.querySelector('img[data-meme-img]') ? '有' : '没有（会跳）') : 'n/a')
  }
  console.log('walker 一共扫到', n, '个文本节点')
}
api.markStaleRawText()
console.log('flow.dataset =', JSON.stringify(flow.dataset))
console.log('flow.attrs =', JSON.stringify(flow.attrs))
console.log('matches(flow, [data-meme-rawleft]) =', matches(flow, '[data-meme-rawleft]'))
console.log('flow.querySelectorAll("[data-meme-rawleft]").length =', flow.querySelectorAll('[data-meme-rawleft]').length)
console.log('doc.querySelectorAll("[data-meme-rawleft]").length =', doc.querySelectorAll('[data-meme-rawleft]').length)
console.log('盖章后 rawleft 行数：', doc.querySelectorAll('[data-meme-rawleft]').length)
api.hideStaleRawText()
let seen = ''
const vis = (n) => { for (const c of n.childNodes || []) { if (c.nodeType === TEXT) { seen += c.nodeValue; continue } if (c.nodeType !== ELEMENT) continue; if (c.attrs['data-meme-hidden'] !== undefined || c.dataset.memeHidden) continue; vis(c) } }
vis(doc.body)
console.log('可见文本：', JSON.stringify(seen))
