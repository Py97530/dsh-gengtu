# memes/ —— 随包分发的图库放这里

**当前这个目录是空的**，这是故意的。

早先包里带过 24 张示例图（`dafeiyu-001`，来自上游 `yyh-001/dsh-meme`），但那批图的
授权是 `personal` —— 只能个人用，**不能再随包分发**。所以本仓库不再自带任何图片。

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
   里写清 `license` 与来源）—— 网络收集的梗图别往里放；
2. 打标（`tag` + `caption` + `keywords`）要和图对得上，模型是靠 caption 挑图的；
3. 体积别太大，包本身走 npm 分发，图库更适合走「导入 ZIP / 远程目录」
   （见 README 的「图库放哪」一节）。
