# dsh-gengtu · DSH 梗图插件

DeepSeek Harness 的表情包 / 梗图插件：**本地图库 + 情绪与关键词搜图 + 中文抽象梗图**，模型能主动"斗图"。

> 基于 [`yyh-001/dsh-meme`](https://github.com/yyh-001/dsh-meme)（MIT）二次开发。
> 本仓库把原先散在 `node_modules` 里的 20 项改动**并进了源码**，逐条列在 [`PATCHES.md`](PATCHES.md)，
> 并由 `test/basic.test.mjs` 逐个核对标记是否还在 —— 拿上游原版覆盖文件会让 CI 立刻变红。

---

## 它是怎么工作的

1. 模型**只输出一行文本**：`[表情: 描述]`（旧语法）或 `[m:短码 短名]`（短码语法）。
2. 前端把这段文本换成 `<img>` —— **图片不下发给模型，不烧视觉 token**。
3. 选图有三层：短码/描述精确匹配 → 关键词与情绪桶 → 分词兜底；命不中就降级成一行描述文字，绝不裸露机器标记。
4. "什么时候该发图"由插件往系统提示注入一段规则（设置页可整页关掉）。

## 安装

```bash
# 从 GitHub 装（推荐）
dsh plugin --profile <你的 profile> add github:Py97530/dsh-gengtu

# 或者从本地目录装（开发用）
dsh plugin --profile desktop add file:/绝对路径/dsh-gengtu
```

装完 **重启桌面端**，再在界面里 **Ctrl+R**（客户端半边是页面加载时读的）。

⚠️ **不要和上游 `dsh-meme` 同时安装** —— 两者的插件 id 都是 `dsh-expression`，
同时挂会抢同一个位置。切换脚本见使用说明。

## 图库怎么放

- 图库目录：`~/.dsh/meme-packs/<包名>/`，结构是 `index.db` + `manifest.json` + `memes/<情绪桶>/<文件>`。
- 设置页能：切换图库、导入 / 导出整包 ZIP、在「发现」里直接装远程图库。
- 想用自己的图库源：在设置页「扫描目录」指过去，或把地址加到 `index.js` 的 `DEFAULT_REMOTE_DIR_URLS`（数组最前面）。
- **本仓库不打包大图库**：网络收集的梗图版权不属于本项目，包里只带 0.9MB 的示例库（大肥鱼 24 张）。

## 版权与删除请求

- **代码**：MIT，见 [`LICENSE`](LICENSE)（保留原项目版权行，这是 MIT 的要求）。
- **梗图**：版权归各自原作者。本项目**不再分发**任何网络收集的图片；示例库来自上游 dsh-meme。
- 如果你是某张图的作者并要求移除：开一个 issue（面板底部有直达按钮），说明是哪张，我们删。

## 测试

```bash
npm test                                                        # CI 里跑
node --import ./test/stub/register.mjs test/basic.test.mjs      # 本机跑（不需要装 DSH）
```

覆盖：包身份三处一致（包名 / patch 里的 name / 客户端 loader id）、发布清单齐全、
源码里没有本机路径、补丁标记没被上游覆盖、ZIP 读写闭环、图库能扫包开库、路径不许越界、
以及发布 ZIP 里"索引条数 = 图片数"。

---

## English

**dsh-gengtu** — a meme/sticker plugin for DeepSeek Harness: local pack library,
emotion & keyword search, Chinese abstract memes, and the model can send memes proactively.

- The model only emits text (`[表情: description]` or `[m:code name]`); the client turns it
  into an image. **Images are never sent to the model** — no vision tokens burned.
- Fork of [`yyh-001/dsh-meme`](https://github.com/yyh-001/dsh-meme) (MIT) with 20 local patches
  merged into the source; see [`PATCHES.md`](PATCHES.md).

```bash
dsh plugin --profile <profile> add github:Py97530/dsh-gengtu
```

⚠️ Do **not** install alongside upstream `dsh-meme` — both use the plugin id `dsh-expression`.

Packs live in `~/.dsh/meme-packs/<pack>/` (`index.db` + `manifest.json` + `memes/<tag>/`).
No large image library is shipped in this repo: **meme images belong to their original authors.**
Takedown requests: open an issue.

MIT — original work © Selfloom contributors (`dsh-meme`).
