/**
 * tools/_diag-extract.mjs — 检查 pincode.test.mjs 那三条正则从 client.js 抠出来的源码是否完整。
 * 用法：node tools/_diag-extract.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, '..', 'client.js'), 'utf8')
const pick = (re, what) => {
  const m = src.match(re)
  if (!m) { console.log('✗ 没找到 ' + what); return '' }
  return m[0]
}
const dump = (label, s) => {
  console.log('=== ' + label + '（' + s.length + ' 字）===')
  console.log(s)
  try { new Function(s); console.log('   → 语法 OK') } catch (e) { console.log('   → 语法错：' + e.message) }
}
dump('MEME_TEXT_RE', pick(/const MEME_TEXT_RE = \/.*?\/g/, 'MEME_TEXT_RE'))
dump('MEME_CODE_RE', pick(/const MEME_CODE_RE = \/.*?\/[a-z]*/, 'MEME_CODE_RE'))
dump('memeCodeFromRow', pick(/const memeCodeFromRow = \(row\) => \{[\s\S]*?\n {6}\}/, 'memeCodeFromRow'))
