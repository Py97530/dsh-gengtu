# memes/ —— 随包分发的图库放这里

**当前这个目录是空的**，这是故意的 —— 随包的底图现在走 [`seed/`](../seed)（首启种图），
不在这儿放整包图库。

早先包里带过 24 张示例图（`dafeiyu-001`，来自上游 `yyh-001/dsh-meme`），但那批图的
授权是 `personal` —— 只能个人用，**不能再随包分发**，所以撤了；现在随包带的是自己挑的
`seed/`（28 张，清单见 [`seed/manifest.json`](../seed/manifest.json)）。

## 没有自带图库会怎样

插件装的第一个图库里没有图，仍然能正常工作：

- 面板照常打开，可以直接**上传图片**或让模型 `learn_meme` 学图，库就长起来了；
- 也可以「导入图库」选一个 ZIP（[打包格式](https://github.com/Py97530/dsh-gengtu/blob/main/docs/remote-pack-spec.md)）；
- 或在「设置 → 扫描目录」指到一个已经装好图库的父目录。

首次启动时宿主会就地建一个空库（`ensureLibrary()`，见 `memes.js`），所以**不会因为缺图报错**。

## 想自带一个种子库

把图库目录直接放这儿就行，布局和用户图库完全一样：

```
memes/<包id>/index.db        # 表 memes(path, tag, file_name, caption, keywords, mtime, captioned_at)
memes/<包id>/manifest.json   # { id, name, version, description, license, count, ... }
memes/<包id>/memes/*.jpg     # 图片，索引里的 path 相对包目录
```

要求：

1. **图的授权必须允许再分发**（自己拍的 / 自己画的 / CC0 / CC-BY 这类，并在 `manifest.json`
   里写清 `license` 与来源）——**网络收集的梗图有风险**：早期带过 57 张从抖音收来的底图，
   上架前就为这个撤过一次。现在 `seed/` 里那 28 张是作者自己挑的示例图；
   版权方要求下架就删（根 README 底部有 issue 入口）。
2. 打标（`tag` + `caption` + `keywords`）要和图对得上，模型是靠 caption 挑图的；
3. 体积别太大，包本身走 npm 分发，图库更适合走「导入 ZIP / 远程目录」
   （见 README 的「图库放哪」一节）。

## 另一种自带方式：`seed/` 首启种图

除了上面「整包放 `memes/<包id>/`」，还可以放一个 `seed/manifest.json`（格式：

    { "id": "...", "name": "...", "count": N,
      "items": [ { "file": "seed-001.jpg", "tag": "happy", "caption": "...", "keywords": "..." } ] }

图命名 `seed-001.jpg` 这种**不带路径**的文件名）。`memes.js` 的 `seedLibrary()` 会在
**空库**（`index.db` 建出来但 0 行、且没有 `.seeded` 记号）上逐张 `INSERT OR IGNORE` 导入，
路径写成 `memes/<tag>/<原文件名>`，稳定码按新路径重算，种完写 `.seeded` 记号
（用户自己把图删光后重启不会被硬塞回来）。

用户挑图的完整流程（2026-10-15 走通）：面板里点「挑选」（默认关）→ 勾图 → 「填进对话」
把清单落进输入框 → 存成 `dev/seed-list.txt` → `node dev/build-seed.mjs --list dev/seed-list.txt --clear`
打出 `seed/`（图 + manifest，tag / caption / 关键词从源图库的 `index.db` 抄，稳定码导入时重算）。
旧的 `dev/pick-server.mjs`（监听 8796 的本地打包服务）已弃用。

