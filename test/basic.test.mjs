// 包体自检 + 图库模块冒烟测试。不需要跑起 DSH、不联网。
//   node --test test/
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const pkg = JSON.parse(read('package.json'))

test('包身份：包名 / patch.yaml 的 name / 客户端 loader id 三处一致', () => {
  const yml = read('cordis.patch.yml')
  const ymlName = yml.match(/^\s*name:\s*(\S+)/m)?.[1]
  assert.equal(ymlName, pkg.name, 'cordis.patch.yml 的 name 必须等于 package.json 的 name')

  // 插件 id 保持 dsh-expression：既有脚本、提示词、~/.dsh/dsh-expression.json 都认这个名字。
  const ymlId = yml.match(/^\s*-?\s*id:\s*(\S+)/m)?.[1]
  assert.equal(ymlId, 'dsh-expression')

  // 客户端 loader id 约定：等于 npm 包名（跟插件 id 无关）。
  const loaderId = read('client.js').match(/__ModuleLoader__\.load\(\{\s*[\r\n\s]*id:\s*['"]([^'"]+)['"]/)?.[1]
  assert.equal(loaderId, pkg.name)
})

test('package.json 的清单字段齐全（别人装得上、装完能跑）', () => {
  assert.equal(pkg.type, 'module')
  assert.equal(typeof pkg.dsh?.bundle?.patch, 'string')
  assert.ok(fs.existsSync(path.join(ROOT, pkg.dsh.bundle.patch)), 'bundle.patch 指向的文件必须存在')
  assert.ok(Array.isArray(pkg.dsh?.client?.inject) && pkg.dsh.client.inject.length >= 3)
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.ok(pkg.peerDependencies['@deepseek-ai/dsh-tools'])
  assert.match(pkg.engines.node, />=22/)
  assert.equal(pkg.license, 'MIT')
  for (const need of ['index.js', 'client.js', 'memes.js', 'panel.html', 'cordis.patch.yml', 'memes/', 'docs/', 'LICENSE', 'README.md']) {
    assert.ok(pkg.files.includes(need), 'files 少了 ' + need)
  }
  for (const need of ['index.js', 'client.js', 'memes.js', 'panel.html', 'LICENSE', 'README.md']) {
    assert.ok(fs.existsSync(path.join(ROOT, need)), '缺文件 ' + need)
  }
})

test('发出去的源码里没有我机器上的路径、没有备份文件', () => {
  const js = ['index.js', 'client.js', 'memes.js']
  for (const f of js) {
    const t = read(f)
    assert.ok(!t.includes('someuser'), f + ' 里还有本机用户名')
    assert.ok(!/C:\\\\?Users/i.test(t), f + ' 里还有硬编码 C:\\Users 路径')
  }
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules') continue
      const q = path.join(dir, e.name)
      if (e.isDirectory()) walk(q)
      else assert.ok(!/\.bak$|\.orig$/.test(e.name), '仓库里混进了备份文件 ' + path.relative(ROOT, q))
    }
  }
  walk(ROOT)
})

test('PATCHES.md 里列的每个补丁标记都还在源码里', () => {
  const rows = [...read('PATCHES.md').matchAll(/^\|\s*(index\.js|client\.js)\s*\|\s*`?([^`|\s]+)`?\s*\|/gm)]
  assert.ok(rows.length >= 18, '补丁表被删过？只找到 ' + rows.length + ' 行')
  const cache = {}
  for (const [, file, marker] of rows) {
    cache[file] ??= read(file)
    assert.ok(cache[file].includes(marker), file + ' 里找不到补丁标记 ' + marker + '（被上游原版覆盖了？）')
  }
})

test('index.js 是合法的 cordis 插件，自带的 ZIP 读写能闭环', async () => {
  const mod = await import(pathToFileURL(path.join(ROOT, 'index.js')).href)
  assert.equal(mod.name, 'dsh-expression', '插件 id 必须保持 dsh-expression')
  assert.equal(typeof mod.apply, 'function')
  assert.ok(mod.inject.includes('tools') && mod.inject.includes('webServer'))

  // 默认不挂任何上游图库目录：别人家的图（授权多为 personal / noncommercial）不跟着转发，
  // 要挂哪个目录由用户自己在设置里填。
  assert.deepEqual(mod.DEFAULT_REMOTE_DIR_URLS, [], 'DEFAULT_REMOTE_DIR_URLS 不该再指向上游市场')

  // 自己写的 store-only ZIP：打包 → 解包 → 逐字节相同（中文文件名 + 二进制内容）
  const files = [
    { name: 'manifest.json', data: Buffer.from(JSON.stringify({ name: '测试图库' }), 'utf8') },
    { name: 'memes/一张图.jpg', data: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]) },
  ]
  const back = mod.unzipStore(mod.zipStore(files))
  assert.equal(back.size, 2)
  for (const f of files) assert.deepEqual(back.get(f.name), f.data, f.name + ' 内容对不上')

  // 下载计数按 tag 归并（去掉 -vX.Y.Z 后缀）
  const counts = mod.parseDownloadCounts([
    { tag_name: 'gengtu-2026-01-v1.0.0', assets: [{ download_count: 3 }, { download_count: 4 }] },
    { tag_name: 'gengtu-2026-01-v1.0.1', assets: [{ download_count: 5 }] },
    { tag_name: '认不出来的tag', assets: [{ download_count: 9 }] },
  ])
  assert.deepEqual(counts, { 'gengtu-2026-01': 12 })
})

test('真·发布包能解开，且索引条数与图片数对得上（本地有就验，没有就跳过）', async (t) => {
  const packs = [
    '_plugin_work/packs/gengtu-2026-01.zip',
    '_plugin_work/packs/gengtu-2026-02.zip',
    '_plugin_work/packs/gengtu-2026-03.zip',
  ].filter((p) => fs.existsSync(p))
  if (!packs.length) return t.skip('本机没有发布包，跳过')
  const { DatabaseSync } = await import('node:sqlite')
  const os = await import('node:os')
  const mod = await import(pathToFileURL(path.join(ROOT, 'index.js')).href)
  for (const p of packs) {
    const base = path.basename(p)
    const store = mod.unzipStore(fs.readFileSync(p))
    assert.ok(store.has('manifest.json'), base + ' 没有 manifest.json')
    assert.ok(store.has('index.db'), base + ' 没有 index.db')
    const meta = JSON.parse(store.get('manifest.json').toString('utf8'))
    assert.ok(meta.id && meta.name, base + ' manifest 不对: ' + JSON.stringify(meta))
    const images = [...store.keys()].filter((k) => /\.(jpe?g|png|webp|gif)$/i.test(k))
    assert.ok(images.length > 0, base + ' 里一张图都没有')

    // 索引里的每条 path 都得在图包里，数量也要一致 —— 包不自洽的话用户装上就是坏库
    const tmp = path.join(os.tmpdir(), 'dsh-gengtu-test-' + meta.id + '.db')
    fs.writeFileSync(tmp, store.get('index.db'))
    try {
      const db = new DatabaseSync(tmp, { readOnly: true })
      const rows = db.prepare('SELECT path FROM memes').all()
      db.close()
      assert.equal(rows.length, images.length, base + ' 索引 ' + rows.length + ' 条 vs 图片 ' + images.length + ' 张')
      const set = new Set(images)
      const missing = rows.map((r) => String(r.path)).filter((p2) => !set.has(p2))
      assert.equal(missing.length, 0, base + ' 有 ' + missing.length + ' 条索引指向包里没有的图，例如 ' + missing[0])
    } finally {
      try { fs.unlinkSync(tmp) } catch { /* 临时文件清理失败就算了 */ }
    }
  }
})

test('图库模块：能就地建空库、能打开索引、路径不许越界', async () => {
  const memes = await import(pathToFileURL(path.join(ROOT, 'memes.js')).href)
  const os = await import('node:os')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-gengtu-lib-'))
  try {
    // 包里不再自带图片（原来那 24 张原作者授权是 personal）⇒ 宿主首次启动必须能自己建出空库，
    // 否则 MemesStore 缺索引抛错、apply 直接 return，表现就是「插件没装上」。
    // [patch-dsh-meme-seed] 中间一度带过自己挑的 57 张底图，上架前撤掉了（版权）。
    // 所以这里断言的是**空库**：索引建得出来、0 行、目录里没有残留图。
    const root = memes.ensureLibrary(path.join(tmp, 'empty'))
    assert.ok(fs.existsSync(path.join(root, 'index.db')), 'ensureLibrary 没建出索引: ' + root)

    const store = new memes.MemesStore(root)
    try {
      const listed = store.list()
      assert.equal(listed.memes.length, 0, '包里不该带任何图，结果有 ' + listed.memes.length + ' 张')
      // 注意 `tags` 回的是**插件认的 6 个情绪桶**（memes.js 里的固定列表），不是库里的实际分桶，
      // 所以空库这里不是 0（早先断言 tags.length===0 是错的）。
      assert.deepEqual([...listed.tags].sort(), ['angry', 'confused', 'daily', 'happy', 'sad', 'shy'])
      assert.ok(Array.isArray(store.search('猫', 5).memes))
      assert.ok(memes.moodNames().length > 0)
      assert.throws(() => store.resolveStored('../../../etc/passwd'), /超出/)
    } finally {
      store.close()
    }

    // 没有自带包时默认库落在 <home>/.dsh/meme-packs/default，而且建得出来、打得开
    const prevHome = process.env.DSH_MEME_HOME
    process.env.DSH_MEME_HOME = tmp
    try {
      const fallback = memes.defaultMemeRoot()
      assert.equal(fallback, path.join(tmp, '.dsh', 'meme-packs', 'default'), '默认库位置不对: ' + fallback)
      const made = memes.ensureLibrary(fallback)
      const st2 = new memes.MemesStore(made)
      st2.close()
    } finally {
      if (prevHome === undefined) delete process.env.DSH_MEME_HOME
      else process.env.DSH_MEME_HOME = prevHome
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})
