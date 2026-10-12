// 冒烟：在假 DOM + 假 cordis ctx 里真调一次 client.js 的 apply()，确认整块结构闭合、
// 该注册的插槽都注册了。比数括号可靠（数括号的正则启发式会被正则字面量骗）。
const html = { innerHTML: '' }
const el = () => ({
  style: {}, dataset: {}, childNodes: [], nodeType: 1, tagName: 'DIV',
  appendChild(c) { this.childNodes.push(c); return c },
  setAttribute() {}, getAttribute() { return null }, removeAttribute() {},
  querySelector() { return null }, querySelectorAll() { return [] },
  closest() { return null }, addEventListener() {}, insertBefore() {}, replaceChild() {},
  set textContent(v) { this._t = v }, get textContent() { return this._t || '' },
})
const body = el()
body.querySelectorAll = () => []
const doc = {
  body, head: el(), documentElement: el(),
  createElement: () => el(),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: t, parentNode: null }),
  createDocumentFragment: () => ({ nodeType: 11, childNodes: [], appendChild(c) { this.childNodes.push(c); return c } }),
  createTreeWalker: () => ({ nextNode: () => null }),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener() {}, removeEventListener() {},
}
globalThis.document = doc
globalThis.window = { addEventListener() {}, removeEventListener() {}, localStorage: { getItem: () => null, setItem() {} }, matchMedia: () => ({ matches: false, addEventListener() {} }), location: { href: 'http://127.0.0.1:19387/' } }
globalThis.localStorage = window.localStorage
globalThis.NodeFilter = { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2, SHOW_ELEMENT: 1 }
globalThis.MutationObserver = class { observe() {} disconnect() {} }
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)
globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => '' })

const registered = []
const slot = {
  inject(name, fn) { registered.push('inject:' + name); return fn() },
  register(meta, Comp) { registered.push('register:' + (meta && meta.name) + '/' + (meta && meta.id)); return { meta, Comp } },
}
const ctx = {
  effect(fn) { try { fn() } catch (e) { registered.push('effect 抛错: ' + e.message) } },
  // 插件是 ctx.get('slots') 拿插槽服务的，所以这里必须真给 slot
  get(name) { registered.push('get:' + name); return name === 'slots' ? slot : {} },
  on() {}, provide() {}, logger: { warn() {}, error() {}, info() {} },
}
// client.js 只有 require('react') 一个外部依赖，别真装 react：给个够用的假货
const h = (type, props, ...kids) => ({ type, props, kids })
const React = {
  createElement: h, Fragment: 'Fragment', useState: (v) => [v, () => {}], useEffect: () => {},
  useRef: (v) => ({ current: v }), useMemo: (fn) => fn(), useCallback: (fn) => fn,
}
let captured = null
globalThis.window.__ModuleLoader__ = { load: (entry) => { captured = entry } }
const { readFileSync } = await import('node:fs')
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
new Function('window', src)(globalThis.window) // 只为跑到 load() 那一步，把 factory 抓出来
if (!captured || typeof captured.factory !== 'function') { console.error('❌ 没抓到 factory'); process.exit(1) }
const mod = { exports: {} }
let returned
try {
  returned = captured.factory((name) => {
    if (name === 'react') return React
    throw new Error('require 了没有的东西: ' + name)
  }, mod)
} catch (err) {
  console.error('❌ factory 抛错:', err && err.message)
  console.error(err && err.stack && err.stack.split('\n').slice(0, 6).join('\n'))
  process.exit(1)
}
const exported = (returned && typeof returned.apply === 'function') ? returned : mod.exports
if (typeof exported.apply !== 'function') {
  console.error('❌ 没导出 apply')
  console.error('  factory 形参:', captured.factory.length)
  console.error('  mod.exports 键:', Object.keys(exported), '自有属性:', Object.getOwnPropertyNames(exported))
  console.error('  返回值键:', returned && Object.keys(returned), '返回值和 mod.exports 同一个吗:', returned === mod.exports)
  process.exit(1)
}
exported.apply(ctx)
console.log('✅ 整块结构闭合、apply() 真跑通，注册动作：')
for (const r of registered) console.log('   ', r)
