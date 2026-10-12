/**
 * test/scope-order.test.mjs — 「用了但还没声明」的静态体检（防 TDZ / ReferenceError 复发）。
 *
 * 背景（2026-10-12 的真实事故）：`memeCodeFromRow` 被写在 `apply()` 里，而调用它的
 * 点图处理器属于更早定义的 `MemeBoard`。两者根本不在同一条作用域链上，一点图就是
 * `ReferenceError: memeCodeFromRow is not defined`，整个 send() 当场死掉 ——
 * 用户看到的现象是「点图完全没反应」。这类 bug 只在运行时炸、还极容易被 try/catch
 * 吞掉（我自己就吞了一次），所以用静态检查兜住。
 *
 * ⚠️ 这份体检脚本自己出过一次洋相：判据 ④ 写成了 `!(!d || d.line <= r.line)`，
 * 取反把 `<=` 一起反了 —— 结果「前向引用」全被当合法放行、闭包豁免反而倒过来，
 * 一连几轮绿灯全是假的。所以下面留了两道**反向自检**（喂已知该报/不该报的数据），
 * 谁再改这个判据，先过那两道。
 *
 * 判据（每条都要满足才算「危险」）：
 *   ① 这个名字在文件里有声明；
 *   ② 声明行号 **大于** 引用行号（= 先用了）；
 *   ③ 声明不是 `function`（函数声明提升，安全）、不是形参（进函数就绑好）；
 *   ④ 这个名字在文件里只声明过一次（两次以上多半是我宽松抓来的形参，不报）；
 *   ⑤ 引用**没有被任何更早定义的函数包住**（闭包前向引用：那段代码等函数被调用才跑，
 *      届时声明早初始化完了 —— 这条豁免靠「函数定义顺序」成立，见下面那道名单用例）。
 *
 * 运行：node --import ./test/stub/register.mjs test/scope-order.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = readFileSync(join(__dirname, '..', 'client.js'), 'utf8')
const LINES = SRC.split('\n')

/** JS 关键字/字面量 —— 既不是声明也不是「我们自己写的名字」。 */
const KEYWORDS = new Set([
  'new', 'if', 'else', 'for', 'while', 'do', 'return', 'typeof', 'instanceof', 'in', 'of',
  'null', 'true', 'false', 'this', 'try', 'catch', 'finally', 'throw', 'switch', 'case',
  'break', 'continue', 'default', 'delete', 'void', 'yield', 'super', 'extends', 'class',
  'const', 'let', 'var', 'function', 'async', 'await', 'static', 'get', 'set', 'export',
  'import', 'from', 'as', 'with', 'debugger', 'enum',
])

/** 浏览器/宿主全局，别当成本地声明。 */
const GLOBALS = new Set([
  'require', 'module', 'exports', 'window', 'document', 'console', 'localStorage',
  'fetch', 'React', 'Map', 'Set', 'Array', 'Object', 'String', 'Number', 'Boolean',
  'JSON', 'Math', 'Date', 'RegExp', 'Error', 'Promise', 'Symbol', 'Proxy', 'Reflect',
  'WeakMap', 'WeakSet', 'URL', 'URLSearchParams', 'Blob', 'File', 'FileReader',
  'Image', 'Event', 'CustomEvent', 'KeyboardEvent', 'MutationObserver', 'IntersectionObserver',
  'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout',
  'clearTimeout', 'setInterval', 'clearInterval', 'navigator', 'location', 'history',
  'structuredClone', 'queueMicrotask', 'AbortController', 'TextEncoder', 'TextDecoder',
  'FormData', 'Headers', 'Request', 'Response', 'globalThis', 'undefined', 'NaN',
  'Infinity', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
  'decodeURIComponent', 'atob', 'btoa', 'alert', 'confirm', 'prompt',
])

/** 把一行源码里的字符串/正则/注释抹掉，只留结构。 */
function scrub(line) {
  return line
    .replace(/\\./g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/(^|[=(,:;[!&|?]\s*|\breturn\s+)\/(?![/*])(?:\\.|\[[^\]]*\]|[^/\\\n])+\/[a-z]*/g, '$1 RE ')
    .replace(/\/\/.*$/, '')
}

/**
 * 逐行解析出「声明」和「引用」。刻意保持简单：够抓我们这种手写插件，
 * 不追求成为完整 JS parser（也不需要）。
 * 输出：decls [{ name, line, kind, indent, pos }] / refs [{ name, line, indent, pos, fnStart }]
 * （fnStart = 包住这一行的、最内层函数体的起始行号；没被任何函数包住则是 null）
 */
function analyze() {
  const decls = []
  const refs = []
  const fnStack = [] // { startLine, baseIndent }：用来判断某行被哪个（更早定义的）函数包住
  const curFn = () => (fnStack.length ? fnStack[fnStack.length - 1].startLine : null)

  LINES.forEach((line, i) => {
    const n = i + 1
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return
    const indent = line.length - line.trimStart().length
    const code = scrub(trimmed)

    // 维护函数体栈：某行以 `{` 收尾、且带函数特征（function / => / ) {），就认为这里开了一个函数体；
    // 遇到缩进更浅的 `}` 就把它弹掉。
    const opensBody = /\{\s*$/.test(trimmed) || /\{\s*\/\//.test(trimmed)
    const isFnHead = /\bfunction\b/.test(trimmed) || /=>/.test(trimmed) || /^\([^)]*\)\s*\{/.test(trimmed)
    if (opensBody && isFnHead) {
      if (!/^\}\s*(else|catch|finally)?\s*\{/.test(trimmed)) fnStack.push({ startLine: n, baseIndent: indent })
    }
    if (/^\}/.test(trimmed) && fnStack.length && indent <= fnStack[fnStack.length - 1].baseIndent) fnStack.pop()

    // 行首声明：const/let/var/function/class NAME
    const dm = /^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/.exec(trimmed)
    if (dm) decls.push({ name: dm[1], line: n, kind: dm[0].split(/\s/)[0], indent, pos: indent })

    // 行内块级声明：for (const el of …) / for (let i = …)
    for (const im of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
      decls.push({ name: im[1], line: n, kind: 'block', indent, pos: indent + im.index })
    }
    // catch (e) 的绑定
    const ce = /\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/.exec(code)
    if (ce) decls.push({ name: ce[1], line: n, kind: 'catch', indent, pos: indent + ce.index })
    // 解构声明：const { a, b } = … / const [a, b] = …
    const dd = /^(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/.exec(trimmed)
    if (dd) {
      for (const part of dd[1].split(',')) {
        const sm = /([A-Za-z_$][\w$]*)\s*(?::\s*([A-Za-z_$][\w$]*))?/.exec(part.trim())
        if (sm) decls.push({ name: sm[2] || sm[1], line: n, kind: 'destructure', indent, pos: indent })
      }
    }
    // 形参：只认「函数签名/箭头参数」那一段（`function name(…)` 或 `(…) =>`），不碰函数体 ——
    // 早先按「这行有 => 就把行内标识符全当形参」的宽松写法，会把箭头体里的引用名也算成参数，
    // 制造假阴性（`pic` 那次）。
    const sigs = []
    const fm = /\bfunction\s*[A-Za-z_$][\w$]*\s*\(([^)]*)\)/.exec(trimmed)
    if (fm) sigs.push(fm[1])
    const am = /\(([^()]*)\)\s*=>/.exec(trimmed)
    if (am) sigs.push(am[1])
    const sm2 = /(?:^|[=(,]\s*)([A-Za-z_$][\w$]*)\s*=>/.exec(trimmed)
    if (sm2) sigs.push(sm2[1])
    for (const sig of sigs) {
      for (const part of sig.split(',')) {
        const bare = part.replace(/=.*$/, '').trim()
        if (/^[A-Za-z_$][\w$]*$/.test(bare)) decls.push({ name: bare, line: n, kind: 'param', indent, pos: indent })
      }
    }

    // 引用：按「不是属性访问、不是对象键」把标识符抠出来，并记下当前包住这行的是哪个函数。
    const re = /(^|[^\w$.])([A-Za-z_$][\w$]*)/g
    let rm
    while ((rm = re.exec(code))) {
      const name = rm[2]
      const after = code.slice(rm.index + rm[0].length)
      if (/^\s*:/.test(after)) continue // 对象键
      if (GLOBALS.has(name) || KEYWORDS.has(name)) continue
      refs.push({ name, line: n, indent, pos: indent + rm.index + rm[1].length, fnStart: curFn() })
    }
  })
  return { decls, refs }
}

/** 同名声明只留一条（行内 block 抓取会和行首 const 撞名，撞了就当一次声明）。 */
function tallyDecls(decls) {
  const first = new Map() // 名字 → 文件里最早的那条声明
  const count = new Map() // 名字 → 去重后的声明条数
  const kinds = new Map() // 名字 → 声明种类集合（用来抓「解析器把 function 读成 const」这类误读）
  const seenAt = new Set()
  for (const d of decls) {
    const key = d.name + '@' + d.line
    if (seenAt.has(key)) continue
    seenAt.add(key)
    count.set(d.name, (count.get(d.name) || 0) + 1)
    if (!kinds.has(d.name)) kinds.set(d.name, new Set())
    kinds.get(d.name).add(d.kind)
    const cur = first.get(d.name)
    if (!cur || d.line < cur.line) first.set(d.name, d)
  }
  return { first, count, kinds }
}

/**
 * 危险引用清单：见文件头判据。
 *   ignoreClosures = true  → 连「闭包前向引用」也一起报（诊断/给名单用例用）
 *   wantNames      = true  → 只回名字列表，回到第一处就够（名单用例用）
 * 返回：字符串数组（默认）或去重后的名字数组。
 *
 * 已知会漏报的形状（写明白，免得把绿灯当保证）：
 *   ① 名字在别处还当过形参 —— `rows.filter((x) => x.path …)` 里的 `x` 会被当成
 *      「外层那个 const x」的自由变量。调用点根本看不见外层 x，纯属误报，
 *      所以「当过形参的名字」一律不报（宁可漏，不刷屏）。
 *   ② 名字被同一个文件里的两处 `const` 声明复用（不同作用域）—— 判据 ④ 直接跳过。
 *   ③ 声明写在表达式里（`const x = obj[k] = …`）这种一行多渠道的，抓不全。
 * 真事故（memeCodeFromRow）不属于以上任何一种：它是**唯一**声明、且缩进深了一层。
 */function filterDangerous(decls, refs, { ignoreClosures = false, wantNames = false } = {}) {
  const { first, count, kinds } = tallyDecls(decls)
  const seen = new Set()
  const out = []
  for (const r of refs) {
    const d = first.get(r.name)
    if (!d) continue // 这个名字不是本地声明的（宿主/全局/手滑拼错，另一类问题）
    if (d.line <= r.line) continue // 先声明后用 → 正常
    if (d.kind === 'function') continue // 函数声明提升
    if ((count.get(r.name) || 0) > 1) continue // 声明不止一处 → 多半是我抓错了，宁可漏报
    if (d.kind === 'param') continue
    // ① 误报防线：这个名字在文件里任意位置当过形参，说明外层的同名声明被局部遮蔽
    // （`rows.filter((x) => x.path …)` 里的 x 绝不是外层那个 const x）。调用点看不见它。
    if ((kinds.get(r.name) || new Set()).has('param')) continue
    // 闭包前向引用：引用被一个**更早定义**的函数包住（`load` 里用后面才声明的
    // setPreviewPack 就是这种）—— 那段代码要等函数被调用才跑，届时声明早就初始化完了。
    // ⚠️ 这条豁免只靠「函数定义顺序」成立：谁把 `load` 挪到 useState 之前**直接调用**，
    // 豁免就失效 —— 所以下面那道名单用例把它钉住，新增一条就得去认领。
    if (!ignoreClosures && r.fnStart != null && r.fnStart < d.line) continue
    if (seen.has(r.name)) continue
    seen.add(r.name)
    out.push(`第 ${r.line} 行用了 \`${r.name}\`，但它在文件里第一次声明是第 ${d.line} 行（${d.kind}，缩进 ${d.indent} ≤ 引用缩进 ${r.indent}）`)
    if (wantNames) break
  }
  return wantNames ? out.map((s) => /`([^`]+)`/.exec(s)[1]) : out
}

// ───────────────────────── 体检本体 ─────────────────────────

test('client.js: 没有「先用了才声明」的 const/let（TDZ 体检）', () => {
  const { decls, refs } = analyze()
  const problems = filterDangerous(decls, refs)
  assert.deepEqual(problems, [], '发现「先用了才声明」——第 ① 条就是那次点图没反应的形状：\n' + problems.join('\n'))
})

// ── 闭包前向引用名单 ──
// 这一堆都是「函数体里用到后面才声明的东西」，靠**函数定义顺序**保证安全：
// 引用点被包在一个更早定义的函数里（事件回调 / 渲染函数），要等那个函数被调用才跑，
// 届时声明早就初始化完了。它们不能算 bug —— 但也不能白白豁免：
// 哪个消失（重构掉了）、或冒出新名字，都要人来这里认领一次，
// 免得「反正是闭包」变成万能挡箭牌，把真 TDZ 一起放行。
// 数据（2026-10-12 实测）：大部分是 `load`/`savePack`/`doDelete*` 这些组件内的
// 事件回调（声明在 render 里，点按钮时才跑）＋ `MemeButle`/`memeLazyBg` 这类只在
// render 期/异步里被调用的组件。若将来有人把其中任何一个搬到更早的**同步**执行点
// （比如在 render 体内直接 `onTogglePack(...)`），名单该报的「顶格引用」就会非空 ——
// 所以下面顺带断言「这些名字一处顶格引用都没有」。
const KNOWN_CLOSURE_FORWARD = [
  'onTogglePack', 'load', 'setPreviewPack', 'setConfirmBox', 'savePack',
  'memeSortNewestFirst', 'doDeleteTag', 'doDelete', 'memeLazyBg', 'MemeButton',
  'isReadonlyEditor', 'sendInner', 'decorateMemeText', 'scale', 'close',
  // [patch-dsh-meme-notext 2026-10-12] 注释隐藏那四个：都声明在工厂顶层（apply 之前），
  // 调用点全在 apply 内部 / 下一轮扫描里 —— 属于「声明在前、调用在后」，登记进来免得误报。
  'textWithoutGhosts', 'hideMemeRawText', 'markStaleRawText', 'hideStaleRawText',
]

test('闭包前向引用有名单：新增一条就得在这里认领（豁免不能静默变多）', () => {
  const { decls, refs } = analyze()
  const first = new Map()
  const paramNames = new Set()
  for (const d of decls) {
    if (!first.has(d.name)) first.set(d.name, d)
    if (d.kind === 'param') paramNames.add(d.name)
  }
  // 只认「引用行 ≠ 自己那行声明」的：同一行里的自引用（`const f = () => f()`）不算前向。
  const pair = (r) => r.name + '←第' + r.line + '行'
  const real = refs.filter((r) => {
    const d = first.get(r.name)
    if (!d || d.line <= r.line) return false
    if (d.kind === 'function' || d.kind === 'param') return false
    if (paramNames.has(r.name)) return false // 与 filterDangerous 同一条误报防线
    return r.fnStart != null && r.fnStart < d.line // 被更早的函数包住 = 闭包前向
  })
  const names = [...new Set(real.map((r) => r.name))].sort()
  const extra = names.filter((n) => !KNOWN_CLOSURE_FORWARD.includes(n))
  assert.deepEqual(
    extra, [],
    '发现新的「闭包前向引用」（确认安全就把名字加进 KNOWN_CLOSURE_FORWARD）：\n' +
    real.filter((r) => extra.includes(r.name)).map(pair).join('\n')
  )
  const gone = KNOWN_CLOSURE_FORWARD.filter((n) => !names.includes(n))
  assert.deepEqual(gone, [], '名单里的这些已经不再是前向引用了，从 KNOWN_CLOSURE_FORWARD 里删掉：' + gone.join(', '))
  // 这些名字一处「顶格（没被任何函数包住）引用」都不能有 —— 有就是真的先用了。
  const topLevel = real.filter((r) => r.fnStart == null)
  assert.deepEqual(topLevel.map(pair), [], '闭包名单里的名字出现在了顶格执行的位置：')
})

test('关键符号的作用域顺序：函数定义必须早于它引用的 factory 级声明', () => {
  // 真事故的形状：`MemeBoard`（定义在第 1464 行）里引用 `memeCodeFromRow`
  // （当时声明在 `apply()` 里）。不是「先声明后用」跑反了，而是**根本不在同一条作用域链上**
  // —— 点一次炸一次。这条用例把顺序钉死：凡是引用这些符号的函数，定义位置必须晚于声明。
  const { decls, refs } = analyze()
  for (const name of ['memePickMap', 'MEME_CODE_RE', 'memeCodeFromRow']) {
    const d = decls.find((x) => x.name === name && x.kind !== 'param')
    assert.ok(d, `找不到 \`${name}\` 的声明`)
    const bad = refs.filter((r) => r.name === name && r.fnStart != null && r.fnStart < d.line && r.line !== d.line)
    assert.deepEqual(
      bad.map((r) => `第 ${r.fnStart} 行定义的函数引用了它（声明在第 ${d.line} 行）`), [],
      `\`${name}\` 被更早定义的函数引用了 —— 那个函数跑起来就是 ReferenceError`
    )
  }
})

// ─────────────────── 反向自检：保证上面不是假绿灯 ───────────────────

test('体检脚本本身有效：塞一段假代码进去必须报出来', () => {
  // 喂真事故的同形数据（错在**顺序**，不在拼写）：
  const decls = [{ name: 'memeCodeFromRow', line: 1996, kind: 'const', indent: 6, pos: 6 }]
  const refs = [{ name: 'memeCodeFromRow', line: 1649, indent: 8, pos: 20, fnStart: null }]
  assert.equal(filterDangerous(decls, refs).length, 1, '❌ 体检脚本抓不出同形的事故 —— 它已经失效了，别信它的绿灯')
})

test('体检脚本不会误报：闭包前向引用 / 函数提升 / 形参都不该报', () => {
  const decls = [
    { name: 'setPreviewPack', line: 475, kind: 'destructure', indent: 6, pos: 6 }, // 组件里后续才声明
    { name: 'hoisted', line: 20, kind: 'function', indent: 4, pos: 4 },
    { name: 'arg', line: 30, kind: 'param', indent: 8, pos: 8 },
  ]
  const refs = [
    { name: 'setPreviewPack', line: 384, indent: 8, pos: 12, fnStart: 300 }, // 被更早定义的函数包住 → 合法
    { name: 'hoisted', line: 3, indent: 4, pos: 8, fnStart: null }, // 函数提升 → 合法
    { name: 'arg', line: 31, indent: 8, pos: 10, fnStart: 30 }, // 形参 → 合法
  ]
  assert.deepEqual(filterDangerous(decls, refs), [], '❌ 误报了合法写法，这份体检会被无视掉')
})

test('体检脚本不会漏报：闭包豁免必须真的在放行（否则一道用例就能骗过它）', () => {
  const decls = [{ name: 'later', line: 500, kind: 'const', indent: 6, pos: 6 }]
  const refs = [
    { name: 'later', line: 100, indent: 8, pos: 8, fnStart: 90 }, // 更早的函数包住 → 豁免
    { name: 'later', line: 200, indent: 6, pos: 8, fnStart: null }, // 顶格直接跑 → 危险
  ]
  assert.equal(filterDangerous(decls, refs).length, 1, '❌ 闭包豁免把顶格直跑的引用也放行了')
  assert.deepEqual(
    filterDangerous(decls, refs, { ignoreClosures: true, wantNames: true }), ['later'],
    '❌ ignoreClosures 模式没把闭包引用也算进来，名单用例会永远绿'
  )
})

test('体检脚本的误报防线：被形参遮蔽的同名符号不许报（x 那次）', () => {
  // 真数据形状：`setMemes((rows) => rows.filter((x) => x.path !== m.path))` 里的 x
  // 在别处还有 `const x = …`；两者根本不是一个东西，报出来只会淹掉真问题。
  const decls = [{ name: 'x', line: 1390, kind: 'const', indent: 8, pos: 8 }]
  const refs = [{ name: 'x', line: 777, indent: 12, pos: 40, fnStart: 771 }]
  assert.deepEqual(filterDangerous(decls, refs), [], '❌ 把形参遮蔽当成了前向引用')
  // 但同一个 x，如果文件里没有形参声明，就该照报不误（防线不能变成挡箭牌）
  assert.equal(filterDangerous(decls, refs, { ignoreClosures: true }).length, 1, '❌ 形参防线把真引用也吞了')
})

test('体检脚本的已知误读有回声：名单变了就得来看一眼', () => {
  // 这两处是**解析器读不准**的已知地方（不是代码问题）：
  //   · apply      —— patch 的函数声明，行首正则会连 `const` 版本一起看见；
  //   · MemeButton —— `makeMemeButton(){ return function MemeButton(props){} }`，行内函数
  //                   表达式（实测**没被**误读成 const，只是「本体检看不见它」，
  //                   所以它出现在下面的闭包名单里 —— 那份名单才是它的回声）。
  // 读不准本身无害（判据 ③ 会跳过 kind==='function'，④ 会跳过声明不止一处的名字），
  // 但它会让「先用了」的结论变得不可信 —— 所以把数量钉住：多一个就说明有新写法溜进来了。
  const KNOWN_MISREADS = ['apply']
  const { decls } = analyze()
  const { kinds } = tallyDecls(decls)
  const weird = [...kinds.entries()]
    .filter(([, s]) => s.has('function') && s.has('const'))
    .map(([n]) => n)
    .sort()
  assert.deepEqual(
    weird, [...KNOWN_MISREADS].sort(),
    '解析误读名单变了：' + JSON.stringify(weird) + '（多了说明有新函数被行内写法藏起来，少了就删掉对应名字）'
  )
})

// ───────────────────────── 具体符号的锚点 ─────────────────────────

test('client.js: 点击路径依赖的符号都在 factory 顶层（能被 MemeBoard 看见）', () => {
  const { decls } = analyze()
  for (const name of ['memePickMap', 'MEME_CODE_RE', 'memeCodeFromRow']) {
    const d = decls.find((x) => x.name === name && x.kind !== 'param')
    assert.ok(d, `❌ client.js 里找不到 \`${name}\` 的声明`)
    assert.equal(
      d.indent, 4,
      `❌ \`${name}\` 声明在第 ${d.line} 行、缩进 ${d.indent}（应为 4 = factory 顶层）。` +
      '缩进 6 说明它掉进了某个函数内部，MemeBoard 的点图处理器将看不见它 → 点图没反应。'
    )
  }
})

test('client.js: 取码失败不许拖垮发送（有防御性 try）', () => {
  assert.match(
    SRC, /try\s*\{\s*code\s*=\s*memeCodeFromRow\(m\)\s*\}\s*catch/,
    '❌ sendInner 里取稳定码那一步没有 try 兜底：一旦抛错，整个点击静默失败'
  )
})
