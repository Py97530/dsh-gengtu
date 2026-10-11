// [patch-dsh-meme-dominsert] 「点了表情包，输入框里什么都不出来」的回归测试。
//
// 病根：写草稿/提交靠的是插槽 prop `inputActions`（DSH 通过 ctx.uiSession 发给会话作用域
// 插槽的标准 prop）。有的 DSH 版本不给 `conversation.input.overlay` 这个插槽发它，
// 于是 `actions.setDraft` / `actions.submit` 都是 undefined，而调用点包在 try/catch 里
// → 静默吞掉，用户看到的就是「点了没反应」。
//
// 药方：兜底直接对输入框做合成输入（contenteditable 走 execCommand('insertText')，
// textarea/input 走原生 value setter + input 事件），提交走输入框自己那个发送按钮。
//
// 和 pincode.test.mjs 一样，这里不 import client.js（浏览器 bundle，尾部有窗口副作用），
// 而是把三个纯函数从源码里抠出来，配一套假 DOM 现场求值。源码结构变了这里会红。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', 'client.js'), 'utf8')

const pick = (re, what) => {
  const m = src.match(re)
  assert.ok(m, '没能在 client.js 里找到' + what + '（源码结构变了？测试要跟着改）')
  return m[0]
}
const editorElSrc = pick(/const editorEl = \(\) => \{[\s\S]*?\n {6}\}/, 'editorEl')
const isReadonlySrc = pick(/const isReadonlyEditor = \(el\) => .*?$/m, 'isReadonlyEditor')
const insertNativeSrc = pick(/const insertNative = \(el, text\) => \{[\s\S]*?\n {6}\}/, 'insertNative')
const insertToEditorSrc = pick(/const insertToEditor = \(text\) => \{[\s\S]*?\n {6}\}/, 'insertToEditor')
const submitViaEditorSrc = pick(/const submitViaEditor = \(el\) => \{[\s\S]*?\n {6}\}/, 'submitViaEditor')

// ---- 一套够用的假 DOM ------------------------------------------------------
const makeEl = (tag, opts = {}) => {
  const el = {
    tagName: tag.toUpperCase(),
    textContent: opts.text || '',
    innerText: opts.text || '',
    value: opts.value !== undefined ? opts.value : '',
    isConnected: opts.connected !== false,
    offsetParent: opts.offsetParent === undefined ? {} : opts.offsetParent,
    dataset: {}, style: {},
    attrs: Object.assign({}, opts.attrs),
    children: [],
    getAttribute(n) { return this.attrs[n] === undefined ? null : this.attrs[n] },
    removeAttribute(n) { delete this.attrs[n] },
    hasAttribute(n) { return this.attrs[n] !== undefined },
    querySelector() { return null },
    querySelectorAll(sel) {
      if (sel !== 'button') return []
      return this.children.filter((c) => c.tagName === 'BUTTON')
    },
    dispatchEvent(ev) { this.lastEvent = ev; return true },
    focus() { this.focused = true },
    contains() { return false },
    closest(sel) { return (this.closestMap && this.closestMap[sel]) || null },
  }
  return el
}
const makeWorld = (editable, extras = {}) => {
  const calls = []
  const editables = Array.isArray(editable) ? editable : (editable ? [editable] : [])
  const fakeDoc = {
    querySelector(sel) { return sel === '.meme-trigger' ? (extras.trigger || null) : (extras[sel] || null) },
    querySelectorAll(sel) { return /contenteditable|textarea/.test(sel) ? editables : [] },
    createRange() {
      if (extras.rangeThrows) throw new Error('boom')
      return {
        selectNodeContents(el) { calls.push(['selectNodeContents', el]); },
        setStart() {}, setEnd() {},
      }
    },
    execCommand(cmd, _ui, text) {
      calls.push(['execCommand', cmd, text])
      if (extras.execCommand) return extras.execCommand(cmd, text, editable)
      return cmd === 'insertText'
    },
    createElement(tag) { return makeEl(tag) },
  }
  const fakeWin = {
    HTMLTextAreaElement: { prototype: { get value() { return '' } } },
    HTMLInputElement: { prototype: { get value() { return '' } } },
    getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
  }
  // 原生 value setter：真浏览器里是原型上的 accessor，这里用 defineProperty 模拟
  Object.defineProperty(fakeWin.HTMLTextAreaElement.prototype, 'value', {
    configurable: true, set(v) { this._value = v }, get() { return this._value },
  })
  Object.defineProperty(fakeWin.HTMLInputElement.prototype, 'value', {
    configurable: true, set(v) { this._value = v }, get() { return this._value },
  })
  return { fakeDoc, fakeWin, calls }
}
const build = (fakeDoc, fakeWin) => {
  const factory = new Function('document', 'window',
    editorElSrc + '\n' + isReadonlySrc + '\n' + insertNativeSrc + '\n' + insertToEditorSrc + '\n' + submitViaEditorSrc +
    '\nreturn { editorEl, insertNative, insertToEditor, submitViaEditor }')
  return factory(fakeDoc, fakeWin)
}

test('输入框是空的：直接写标记，不凭空加换行', () => {
  const ed = makeEl('div', { text: '' })
  const { fakeDoc, fakeWin, calls } = makeWorld(ed)
  const api = build(fakeDoc, fakeWin)
  assert.equal(api.insertToEditor('[表情: 可爱的呆猫] ·c03546d'), true)
  const typed = calls.filter((c) => c[0] === 'execCommand')
  assert.equal(typed.length, 1)
  assert.equal(typed[0][1], 'insertText')
  assert.equal(typed[0][2], '[表情: 可爱的呆猫] ·c03546d', '空输入框不该被加前导换行')
})

test('输入框里已经有草稿：接在下一行（不能把用户打的字顶掉）', () => {
  const ed = makeEl('div', { text: '我刚打了一半的话' })
  const { fakeDoc, fakeWin, calls } = makeWorld(ed)
  const api = build(fakeDoc, fakeWin)
  api.insertToEditor('[表情: x] ·c1a2b3')
  const typed = calls.filter((c) => c[0] === 'execCommand')
  assert.equal(typed[0][2], '我刚打了一半的话\n[表情: x] ·c1a2b3')
})

test('textarea 输入框：走原生 setter + input 事件', () => {
  const { fakeDoc, fakeWin } = makeWorld([])
  const ta = Object.create(fakeWin.HTMLTextAreaElement.prototype)
  Object.assign(ta, makeEl('textarea', { value: '' }))
  fakeDoc.querySelectorAll = (sel) => (sel.indexOf('contenteditable') >= 0 ? [ta] : [])
  const api = build(fakeDoc, fakeWin)
  assert.equal(api.insertToEditor('[表情: x] ·c1a2b3'), true)
  assert.equal(ta.value, '[表情: x] ·c1a2b3')
  assert.equal(ta.lastEvent && ta.lastEvent.type, 'input', '要触发 input 事件，React 才认')
})

test('execCommand 不认时不许抛出去（老宿主/被策略禁掉的情况）', () => {
  const ed = makeEl('div', { text: '' })
  const { fakeDoc, fakeWin } = makeWorld(ed, {
    execCommand: (cmd) => false,
    rangeThrows: true,
  })
  const api = build(fakeDoc, fakeWin)
  let threw = null
  try { api.insertToEditor('[表情: x] ·c1a2b3') } catch (e) { threw = e }
  assert.equal(threw, null, '兜底路径失败只能返回 false，不能把异常甩给点击事件')
})

test('提交：在输入框那一带找发送按钮（按 aria-label/title 认）', () => {
  const ed = makeEl('div', { text: '' })
  const form = makeEl('div')
  const send = makeEl('button', { attrs: { 'aria-label': '发送' } })
  const other = makeEl('button', { attrs: { title: '加号' } })
  form.children = [other, send]
  ed.closest = (sel) => (sel === 'form' ? form : null)
  ed.closestMap = null
  let clicked = false
  send.click = () => { clicked = true }
  const { fakeDoc, fakeWin } = makeWorld(ed)
  const api = build(fakeDoc, fakeWin)
  assert.equal(api.submitViaEditor(ed), true)
  assert.equal(clicked, true, '要按到发送那个按钮')
})

test('提交：认不出按钮就回车提，不许抛异常', () => {
  const ed = makeEl('div', { text: '' })
  const { fakeDoc, fakeWin } = makeWorld(ed)
  const api = build(fakeDoc, fakeWin)
  const sent = []
  globalThis.KeyboardEvent = class { constructor(type, opts) { this.type = type; Object.assign(this, opts) } }
  ed.dispatchEvent = (ev) => { sent.push(ev.type); return true }
  assert.equal(api.submitViaEditor(ed), true)
  assert.deepEqual(sent, ['keydown', 'keypress', 'keyup'], '回车三连要发出去')
  delete globalThis.KeyboardEvent
})

test('源码里不许再出现「静默吞掉的 setDraft」老写法', () => {
  assert.ok(!/setText\(text\)/.test(src), 'setText 老写法已废弃')
  assert.ok(src.indexOf('[patch-dsh-meme-dominsert]') > 0, '兜底补丁标记应该在')
})
