# dsh-gengtu 已并入的改动

这份包基于 [`yyh-001/dsh-meme`](https://github.com/yyh-001/dsh-meme)（MIT）二次开发，
把原先散在本地的一批补丁**并进源码**再发版，避免每次上游更新冲掉改动。

标记写法：源码里留 `[patch-<名字>]` 注释，`test/basic.test.mjs` 会逐个核对；
少一个就说明有人（多半是我）拿上游原版覆盖了文件。

| 文件 | 标记 | 干了什么 | 为什么 |
| --- | --- | --- | --- |
| client.js | `[patch-dsh-meme-lazycells]` | 图库网格懒加载（滚动到可视区才解码） | 库到几百张时整页卡死 |
| client.js | `[patch-dsh-meme-datesort]` | 图库按发布日期倒序 | 新图永远排最后，翻不到 |
| client.js | `--dsh-meme-inline-size` | 图片节点带内联尺寸 | 解码前先占位，消息列表不跳 |
| client.js | `[patch-dsh-meme-index]` | 描述索引带 TTL 保鲜、过期重取 | 索引是加载时快照，新入库的图发不出去 |
| client.js | `[patch-dsh-meme-glass]` | 图库/选择器毛玻璃样式 | 好看 |
| client.js | `[patch-dsh-meme-below-text]` | 表情包渲染在文字下方 | 文字在上、图在下，读起来顺 |
| client.js | `[patch-dsh-meme-zoom]` | 点消息里的图放大看 | 小图看不清 |
| client.js | `[patch-dsh-meme-pickmap]` | 点选图后按 caption→url 精确发送 | 点 A 发出 B（靠描述模糊匹配会串图）；⭐ `memePickMap` 等三个符号**必须待在 factory 顶层** —— 原先放在 `apply()` 里，而点图 UI `MemeBoard`（1464 行）在 `apply(ctx)`（1939 行）**之前**，一跑就是 `ReferenceError`，见 `[patch-dsh-meme-defensive]` |
| client.js | `[patch-dsh-meme-dualcode]` | 同时认 `[m:CODE]` 和 `[表情: 描述]` | 短码是稳定身份，旧语法是回退 |
| client.js | `[patch-dsh-meme-hover]` | 悬停出大图预览 | 不用点开就知道是哪张 |
| client.js | `[patch-dsh-meme-notitle]` | 摘掉原生 title 气泡 | 和悬停预览叠在一起，挡视线 |
| client.js | `[patch-dsh-meme-bareimage]` | 单图消息抹掉气泡壳子 | 只有一张图时壳子纯属碍事（**纯 CSS + 一个属性，带可见性兜底**） |
| client.js | `[patch-dsh-meme-search]` | 选择器搜索框 + 快捷词 | 库大了靠翻页找图不现实 |
| client.js | `[patch-dsh-meme-fitimg]` | 消息里图片尺寸归一（短边 112 / 长边 264，不放大） | 长图短图混在一起，时间线参差不齐 |
| client.js | `[patch-dsh-meme-search-rank]` | 搜索按分类加权排序 | 顺嘴提一句的图和真·同类图同权，搜「悲伤」只有 2 张 |
| client.js | `[patch-dsh-meme-notabs]` | 去掉选择器里的图库选择排 | 与搜索框叠字被挡；切图库去设置页 |
| index.js | `[patch-dsh-meme-vision]` | 候选图连描述一起给模型看 | 有视觉通道时先看再挑，发图准得多 |
| index.js | `[patch-dsh-meme-auth]` | `/dsh-memes-api` 无 Origin 即 403 + 高风险操作要令牌 | 本机任意进程/插件都能改库、改提示词 |
| index.js | `[patch-dsh-meme-pathguard]` | 图片/导出/删除路由路径归一化 | 索引里的 `path` 能越出图库根 |
| index.js | `[patch-dsh-meme-hardening]` | 上传限 8MB + 魔术字节校验；`learn_meme` 拒绝内网地址 | 无上限上传、SSRF |
| index.js | `[patch-dsh-gengtu-nomarket]` | `DEFAULT_REMOTE_DIR_URLS` 留空；没配源时按「空目录」返回 | 默认去装别人收集的表情包，版权与归属都不对；也别把「没配源」报成「网络挂了」 |
| client.js | `[patch-dsh-gengtu-nomarket]` | 发现页空态文案（「还没有可用的图库目录」+ 去处提示） | 同上 |
| index.js | `[patch-dsh-gengtu-noseed]` | 包里不再带那 24 张种子图；启动前 `ensureLibrary()` 就地建空库 | 那批图授权是 `personal`，不能再随包分发；缺索引又会让插件整个装不起来，所以空库得能自己建出来 |
| index.js | `[patch-dsh-gengtu-remotedir-ui]` | 新增 `setRemoteDirUrl` op（高风险，要令牌）+ 返回 `remoteDirUser` | 设置页要能填「图库目录」，以前只能手改 `~/.dsh/dsh-expression.json` |
| client.js | `[patch-dsh-gengtu-remotedir-ui]` | 设置页「图库目录」输入框 + 保存 | 同上 |
| client.js | `[patch-dsh-meme-matchspec]` | 描述匹配三处加固：整串**标点盲**唯一命中优先（≥10 字）、分词兜底改成短词优先、haystack 多一档去标点形 | 模型不抄候选原文时（少个句号、把逗号写成空格）同一张图会配到别的行；「先命中就返回」让最泛的长词（「一只猫」）抢走判定 |
| client.js | `[patch-dsh-meme-noflip]` | 纯 CSS 把「已配到图」的 `[表情: 描述]` 原文吃掉（`img[data-meme-hide-raw]` 兄弟选择器），配图中先压 4s 兜底动画，失败自动放回原文 | 用户报：点了表情包发出去，气泡里先闪一整行给模型看的注释文字再变图；JS 隐藏会被宿主流式渲染重写翻回来 |
| client.js + memes.js | `[patch-dsh-meme-pincode]` | 每行 keywords 尾部挂稳定码 `·c1a2b3`（`'c'+sha1(path).slice(0,6)`，由 `_plugin_work/add-meme-codes.mjs` 写入）；`memes.js` 的候选行与 `hits` 都带码；`client.js` 的标记正则多认一个 `·码` 后缀，解析改成 **标记里的 URL > 码表 > 描述匹配**，码查不到时**直接放弃、绝不退回描述匹配**（拉完索引再扫一轮） | 用户报：点的是 A、发出来是 B。病根是一个抖音帖的整组图共用一句 desc 当 caption（库里 14 组 / 92 张撞车），前端索引 `caption→url` 后写覆盖先写、描述匹配又只取「第一个像的」 |
| memes.js | `[patch-dsh-meme-seed]` | 保留「首启种图」机制但**包里不带图**（曾短暂带过自己挑的 57 张底图，后撤掉）：`seedLibrary()` 读包内 `seed/manifest.json`，没有就返回 0；有则 `INSERT OR IGNORE` 逐张导入、码按新路径(`memes/<tag>/seed-NNN.jpg`)重算、种完写 `.seeded` 记号（用户自己删光图后重启**不会**被硬塞回来） | 装完插件图库空空如也，新用户没法用；但随包分发别人的图有版权风险，所以机制留着、图不带 —— 想自带就自己放 `seed/` |
| client.js | `[patch-dsh-meme-seedpick]` | 图库面板加「挑选」模式（默认关；点图只勾选、右上角序号；「填进对话」把清单贴进草稿——本地打包服务 `127.0.0.1:8796` 已撤，按钮只提示走「填进对话」） | 要能在聊天窗口里直接挑图攒一份自带底图，不用另开窗口；做成默认关，普通用户点图就该直接发出去 |
| client.js + index.js | `[patch-dsh-meme-window]` | 图库面板一次只铺 72 格、滚到底自动续（IntersectionObserver 哨兵 `mp-more`）；删图改成只摘掉本地那一格（失败才回退全量 `load()`）；宿主 `op:'delete'` 的存在性校验从全表 `list().some()` 改成按主键单查 | 用户报：删完表情包电脑卡几秒。本机实测整库 979 张铺满 = 141MB / 5.6 秒随机读，`node:sqlite` 又跑在后端主线程上 |
| client.js | `[patch-dsh-meme-dominsert]` | 点图后的兜底不依赖插槽 prop：`actions.setDraft` 缺席时直接把 `[表情: 描述] ·码` 打进输入框（contenteditable 走 `execCommand('insertText')`、textarea/input 走原型原生 value setter + `input` 事件）；提交按 插槽 `submit` → 输入框那一带的发送按钮（按 `aria-label`/`title`/`data-testid` 认）→ 回车 依次试；认输入框时排除消息内容区 | 用户报：点了表情包**输入框里什么都不出来**。DSH 有的版本不给 `conversation.input.overlay` 这个插槽发 `inputActions`，`actions.setDraft`/`actions.submit` 都是 undefined，而调用点在 try/catch 里被静默吞掉 |
| client.js | `[patch-dsh-meme-defensive]` | `memeCodeFromRow` / `MEME_CODE_RE` / `memePickMap` 三样提到 factory 顶层（`apply()` 里那份删掉）；取码包 `try`（失败只丢码、不许拖垮发送）；草稿现状改成「只有**真读到**宿主状态才认」（`haveState`），拿不到就一律走 DOM 那条路，免得拿 null 快照去 `setDraft` 反把草稿清空 | 用户 m00585 念出的现场行是 `点图抛错: memeCodeFromRow is not defined` —— 点图处理器第一句就 `ReferenceError`，抛在写草稿/提交**之前**，所以表现是「点了完全没反应」；前几轮全猜错了方向（插槽、鉴权、旧代码） |
| client.js | `[patch-dsh-meme-diag]` | `send()` 拆成外壳 + `sendInner()`，外壳 `catch` 把异常写到图库面板顶上的取证行（`.mp-diag`，CSS 在样式表里），并记 `localStorage.dshGengtuClickN` 点击数；取证行内容 = `写:how / 数据:from / 句柄:sbi / 提:sub / 图:有`。**默认关**：抛错那条无条件亮，平时那行只在 `__DSH_MEME_DIAG__ = true` 或 `localStorage.dshGengtuDiag = '1'` 时才写（`memeDiagOn()`） | 「点了没反应」时前端一点线索都不给，只能靠猜；有这一行用户念一句就能定位（这次就是这么破的案）。**后来用户盯着这行念了两回 —— 班排完了它就是噪音**，所以改成默认不亮、开关留在控制台/localStorage 里，出事照样能取证 |
| client.js + index.js + memes.js + panel.html | `[patch-dsh-gengtu-hardening2]` | 2026-10-12 评审整改一整批：兜底层从「元素级隐藏」改成**文本级摘除**（`maskMarksInTextNode`，正文一个字都不吞）、排除面与装饰侧对齐、去重键带上图 URL、CSS `~*` 收窄成三条；后端 `HIGH_RISK_OPS` 补 `update/delete/upload/recognize`、新增 `assertLocalRequest()`（Host 必须回环 + Origin 同源 + 无 Origin 要头）、导出/图库页共用这道门、`update` 的 caption/keywords 补 `.slice(0,200)`、`readBody` 32MB→128MB；`MOODS.sad` 收编 `speechless`；面板请求带头带令牌。详见下面「2026-10-12 评审整改」 | 评审团查出：① 我那层兜底是**元素级** `display:none`，同一元素里的正文会被一起吞掉、宿主再写回来也翻不回来；② `update`/`delete`（改一行 caption、删一张图）**恰好不在** HIGH_RISK_OPS 里 —— 等于"删整包要令牌、删单张不要"；③ `/dsh-memes-api` 的 GET 走不到鉴权、`/memes-panel` 与 `/dsh-memes-export` 零鉴权、`sameOrigin` 是自己跟自己比（DNS rebinding 通杀）；④ `speechless` 142 张（全库 14.5%）不在任何情绪桶里，按情绪抽样永远抽不到 |
| client.js | `[patch-dsh-meme-notext]` | 注释原文的隐藏改成**按文本节点摘**，不再押 DOM 形状：这条消息里已经有 `img[data-meme-img]` 时，把同一行里还看得见的 `[表情: …] ·码` 文本节点用 `<span data-meme-hidden>` 裹住（ghost 里那份原文保留）；CSS 另补两条父级/气泡级判据（`:has()`），「配图中」兜底从 4s 收到 0.25s | 用户报：「图不立马出来，先出现一串给 ai 的注释」，图出来了注释还杵在气泡里、**能选中能复制**。前两版都押在形状上：`~` 要求注释元素是图片**兄弟**、`:has`+`[data-meme-bare]` 要求气泡里没有别的可见文本 —— 宿主一换裹法就全漏。这版只认「这行配到图了」+「这段文本是标记」，层级无所谓 |

## 高风险操作令牌

`[patch-dsh-meme-auth]` 之后，导出/删除/改提示词这类操作要带 `x-dsh-meme: 1` 头；
令牌落在 `~/.dsh/dsh-expression.token`，本机脚本用 `_plugin_work/add-auth-headers.mjs` 统一补过。

## 2026-10-11 事后修复（auth 加固的两个漏网之鱼）

1. **页面侧的 GET 没带头**：浏览器对**同源 GET 不发 `Origin`**，只对跨站/非 GET 才发。
   加固后的宿主把「无 Origin 且无 `x-dsh-meme`」一律 403 —— 于是页面里 5 处请求全会被拒：
   `apiGet`（发现页目录 + 搜索）、图库包预览、选择器取全部包、**表情索引 `packId=all`**
   （这个一挂，模型发的 `[表情: …]` 就全变纯文字）。
   修法：client.js 新增 `memeApiHeaders()`，**所有** API 调用点统一带头（含 GET）。
2. **宿主侧再认一条 `sec-fetch-site: same-origin`**：浏览器同源请求必发这个头，
   作为「页面漏带头」的兜底，免得以后再漏一处就把功能打成空白。
   （它不降低安全性：本机进程照样能伪造它，真正的护栏是高风险 op 的令牌。）

同批顺带：发现页空态加「重新拉取目录」按钮；默认目录源加 `fastly.jsdelivr.net` /
`testingcf.jsdelivr.net` 两个备用节点（`raw.githubusercontent.com` 本机不通）；
「空目录源」不再顶掉后面的真目录。

## 2026-10-11 第二刀：拆掉默认图库市场

原来的 `DEFAULT_REMOTE_DIR_URLS` 内置了上游的公共图库市场（`yyh-001/dsh-meme-packs` 的
`catalog.json`，4 个镜像地址 + 2 个空文件地址）。现在**整个数组清空**：

- 图库目录 = "谁提供内容、谁负责版权"的东西，默认指向别人收集的表情包不合适。
- 没配目录源时 `fetchRemoteDirectory()` 返回 `[]`（空目录），不再是 `null`（那是"网络挂了"）。
- 发现页空态改成「还没有可用的图库目录」+ 去处提示（导入 ZIP / 扫描目录）。
- 自建目录的三种配置方式、多源顺序、缓存与踩坑记录，全写进 `docs/remote-pack-spec.md`。

顺带记一笔实测数据（用来定"别用 raw"这条规矩）：
`raw.githubusercontent.com` 四轮里成功 1 次、其余是 10~12 秒超时；`cdn/fastly/testingcf.jsdelivr.net`
节点 124~435ms 稳定；`?t=` 时间戳不影响成败（带的时候反而更快）。

## 2026-10-11 第三刀：包里不再带图 + 图库目录可填

1. **撤掉随包分发的 24 张种子图**（`memes/dafeiyu-001`）。它们的 `license` 是 `personal`
   —— 个人可以用，**不能随包再分发**。图挪到仓库外的归档里（`_plugin_work/`，不随包发）。
   代价是装上不再有图，所以：
   - `memes.js` 新增 `ensureLibrary()`：目录/`index.db` 缺了就地建一个空库；
   - `defaultMemeRoot()`：有自带种子库就用它，没有则回落到 `<home>/.dsh/meme-packs/default`；
   - `index.js` 启动与 `reloadMemeStore()` 都先过 `ensureLibrary()` —— 否则 `MemesStore`
     会因缺索引抛错、`apply` 直接 `return`，表现是"插件没装上"（历史事故）；
   - `memes/README.md` 写清空目录是故意的、以及想自带种子库时对图授权的要求。
2. **设置页能填「图库目录」**（`setRemoteDirUrl`，进 `HIGH_RISK_OPS`，要本机令牌）。
   一行一个地址，逗号/空格/分号都吃；留空 = 不挂任何目录。以前只能手改
   `~/.dsh/dsh-expression.json`，等于把这个功能藏起来了。
   `packPayload()` 只回用户自己设的值（`remoteDirUser`），别把解析后的默认值塞回输入框。

## 2026-10-11 第四刀：撤掉自带底图，准备上架

1. **删掉 `seed/`**（自己从图库里挑的 57 张底图 + `manifest.json`）。当时加它是因为
   「装完图库空空如也」，但那 57 张全部来自抖音搬运号，**随包分发（npm / 插件市场）的版权
   性质和「存在自己硬盘里斗图」完全不同**，上架前撤掉最稳。`package.json` 的 `files` 里
   也去掉了 `seed/`。
   - **机制留着**：`memes.js` 的 `seedLibrary()` 还在，包内没有 `seed/manifest.json` 时
     静默返回 0；将来想自带底图（自己画的 / CC0 / 买了授权的）只要把 `seed/` 放回来就行。
   - 空库依旧能自己建出来（`ensureLibrary()` 不动），所以撤图不会让插件装不上。
2. **删掉宿主路由 `POST /dsh-memes-seed-pick`**。它只服务于「挑图打包」这个开发动作，
   随包发一个「往你磁盘写清单」的写接口没有必要。挑选模式还在（面板「挑选」按钮，默认关），
   导出改走本地打包服务 `http://127.0.0.1:8796/submit`（开发时手动跑）。
3. `test/basic.test.mjs` 里那段断言（原来断言「首启至少 1 张自带图」）改回
   **空库断言**：索引建得出来、0 行、目录里没有残留图、`tags` 为空、`search()` 返回数组、
   越界路径仍然抛错 —— 保证「包里不带图」这条约定以后不会被误改回去。

## 2026-10-12 评审整改（三个人三份报告，全在这天落实）

三份报告原文在 `_plugin_work\评审-架构线-2026-10-12.md`、`_plugin_work\安全线评审-dsh-gengtu.md`、
`_plugin_work\sec-probe-result.txt`；合订与我的复核在 `_plugin_work\评审汇总-2026-10-12.md`。
这天的改动全部收在一个标记 `[patch-dsh-gengtu-hardening2]` 下。

### 一、兜底层：从「藏元素」改成「摘掉那一段字」

原先 `hideStaleRawText()` 的判据是「这个元素里**含**标记文字」→ `el.style.display = 'none'`。
后果比它要修的问题还糟：**同一元素里的正文一起消失**（用户实际会看到「今晚加班，先这样吧。」整句没），
而且没盖任何标记，宿主再往那个元素里写新正文时那段字**永远回不来，只能刷新页面**。

现在的做法：`maskMarksInTextNode(node)` 只把文本节点里的标记段（`[表情: …]` 或 `[m:…]`，可选带 `·码`）
裹进 `<span data-meme-hidden="1" style="display:none">`，**正文原样留在同一个文本节点里**。
两层（首轮装饰 `hideMemeRawText` 与兜底 `hideStaleRawText`）都走这一个函数。

顺手对齐的四处口径：

1. **排除面**：新增 `MEME_EXCLUDE_SEL = 'input,textarea,[contenteditable="true"],[data-variant="think"],[data-variant="others"],pre,code'`。
   装饰侧本来就排这些，兜底层以前只排输入框 —— 于是**本会话里正在调试的标记格式出现在代码块里时会被吃掉**。
2. **孤儿判据**：宿主覆写会把 `img` 连 `ghost` 一起抹掉；原来的判据是「元素里没有 `img[data-meme-img]` 也没有
   `[data-meme-hidden]` 就摘掉 `data-meme-decorated` 让它重新装饰」。文本级摘除之后**正文里的标记也会留下 ghost**，
   那些元素永远不再被当成孤儿、图回不来。改成先算 `onlyGhosts`（子节点里除了 `[data-meme-hidden]` 没别的），
   再「没有 `img` 且只剩 ghosts」才重新装饰。
3. **去重键**：`dedupeMemeImages` 原来按 caption 去重，而 caption **不含稳定码** → 同一条消息里两张
   caption 相同、码不同的图会被当重复丢掉（库里 14 组抖音组图共用一句 desc，现实触发源）。
   现在键是 `caption + '|' + img.getAttribute('src')`：码查得到时 src 是那张图自己的地址，只有都查不到
   （降级到描述兜底）时才去重。
4. **CSS**：`dsh-meme-notext-css` 原来是 `img[data-meme-img] ~ *`，会连图片**后面所有**兄弟元素一起吞掉，
   而且 `!important` 撤不回来。收窄成 `~span` / `~div` / `~p` 三条（各自排除已摘的与图片自身）。

### 二、鉴权：这道门原来漏了全部改库路径

`PATCHES.md` 自己在下面写着「真正的护栏是高风险 op 的令牌」—— 而 `update` / `delete` / `upload` /
`recognize` **四个最常用的写操作都不在** `HIGH_RISK_OPS` 里。粒度还正好反着：删**整包**要令牌、删**单张**不要；
改提示词要令牌、改**任意一行 caption** 不要。实测（`sec-probe-result.txt`）带 `x-dsh-meme: 1` 不带令牌时
这四个 op 全走到业务逻辑里（400「未知路径」/「缺少图片数据」），而 `browse`/`deleteTag` 那些 403 挡得住。

同一天查实的另外三条：

- `/dsh-memes-api` 的 **GET 分支在鉴权之前就 return**（`index.js:1218`）→ 全部 caption/keywords/绝对路径裸奔，
  369 KB 无头 curl 就能拿走；加 `Origin: http://evil.example` 也 200。
- `/memes-panel`（8993 B）与 `/dsh-memes-export`（**114 MB**）零鉴权；`panel.html` 的 `apiGet`/`apiPost`
  不带头不带令牌，而它调的 `update`/`delete` 恰好免令牌 → **一个 URL 就是完整读写删管理台**。
- `sameOrigin = o.host === String(req.headers.host || '')` 是**自己跟自己比**：攻击者把 Host 和 Origin
  都设成自己的域名就全通（DNS rebinding）；决定性对照 `Host: 127.0.0.1:1` + `Origin: http://127.0.0.1:1` → 200。

改法：新增 `LOOPBACK_HOSTS` / `hostIsLoopback()` / `assertLocalRequest()`（Host 必须回环；有 Origin 必须与
Host 同源；没 Origin 要 `x-dsh-meme: 1` 或 `sec-fetch-site: same-origin`），**放在 `/dsh-memes-api` handler
最前面**（GET 一并守住，原来埋在 POST 分支里那段删掉），导出与图库页各加一行、失败码 500→403；
`update` 的 caption/keywords 补 `.slice(0, 200)`（对照 upload 早有这个上限，写库路径反而没有，
上限只剩 `readBody`）；`panel.html` 新增 `memeHeaders()` 统一带头带令牌。
`test/_diag-auth.mjs` 把这三个函数从源码里抠出来打 12 条用例（同源 / 带头 / `sec-fetch-site` / `localhost` /
`[::1]` 放行；裸 curl / 跨站 Origin / rebinding / Host 缺省 / 别的机器 / `127.0.0.1.evil.example` 拦下）。

### 三、顺带

- `readBody` 上限 32 MB → **128 MB**：导出是 zipStore 不压缩、库已 110 MB，导入又走 base64（×1.33），
  「导出→导入」这条**唯一的整库回滚路径**原来必然超限。
- `MOODS.sad` 收编 `speechless`，`MOOD_WORDS.sad` 补「说不出话」：全库 142 张（14.5%）原来不在任何情绪桶里，
  按情绪抽样永远抽不到（这次评审就是抽「悲伤」抽不到才发现的）。
- `seedExport` 出站 `127.0.0.1:8796`（实测没人监听的死代码，谁先占谁收数据）删掉，只留文案提示。

### 四、还没验的部分（别当成已验）

- 这套改动**全部只落在工作区**，宿主进程里跑的还是旧代码 —— 重启 + 刷新之后才算现场验收：
  注释不再露 / 正文不再被吞 / 图库页与导出照常（**门收紧了，最怕把自己的页面打成 403 空白**）。
- 六份单测（basic / match / pincode / dominsert / scope-order / notext=16 条）+ `_diag-apply.mjs` 三个插槽 +
  `_diag-auth.mjs` 12 条全绿，但这都是**假 DOM / 抠源码**级别的验证，没有一条是浏览器里的端到端。
- 验收线剩下的 AC-8（导出导入往返）、AC-4（去重键）只有推理与单测，没在真机上走过一遍。

## 2026-10-12 第五刀：注释的闪现（第二刀）

标记还是 `[patch-dsh-meme-notext]`，但治的是**另一种病**：不是「图出来了注释还杵着」（那是前几刀），
而是「图还没出来、注释先闪一下」。用户原话：「表情包他不会立马出来而是会出现一串给 ai 的注释，
我希望屏蔽或过滤这段注释文本，只输出表情包」。

病根在 `decorateMemeText()` 里那支 `if (needsLookup && !memeIndex) { loadMemeIndex(); continue }`：
码/描述要查表才知道配哪张图，而**所有隐藏逻辑的前提都是「这一行已经有 `img[data-meme-img]`」**
（`hideMemeRawText()` 第一句就是这个判断）。索引没到手（`MEME_INDEX_TIMEOUT` 最长 15 秒）
那段时间里，`[表情: …] ·码` 明晃晃挂在气泡里。用户自己发的消息最明显 —— 宿主把「已发送」的气泡
也渲染成带标记的文本节点。

改法：**索引没到手也先把标记摘掉，再盖一个宽限时间戳；到点图还没来就放回原文。**

- 新常量 `MEME_MASK_GRACE = 1600`（紧挨 `MEME_INDEX_TIMEOUT`）：藏多久算「等不到了」。
- 那支分支里先 `maskMarksInTextNode(node)`，再 `parent.dataset.memePendingAt = String(Date.now())`，
  然后才是 `loadMemeIndex()`（不再 `continue` —— 这一遍照样往下走降级逻辑）。
- 新增工厂顶层 `unmaskStalePending()`：`if (!document.querySelector('[data-meme-pending-at]')) return`
  常态一句返回；超期的行里把**我们摘的那种** ghost（内容以 `/^\[(?:表情|m):/` 开头）的
  `style.display` 撤掉放回（`ghostFor()` 造的占位 ghost 不动）；这一行若仍露着标记就
  `delete el.dataset.memeDecorated` / `delete el.dataset.memeDegradedAt`（否则下一遍 TreeWalker
  跳过它、永不重试），最后 `scheduleScan()` 让重扫走装饰 → 真配不到就降级、只显示描述。
- 调用点两处：`decorateMemeText()` 末尾 `hideStaleRawText()` 之后；`runScan()` 的 try 里**放在
  `decorateMemeText()` 之前**（它会清 `memeDecorated`，正好让这一遍重扫）。

回归测试 `test/notext.test.mjs` 从 11 条加到 **16 条**，新增 5 条走「注入假时钟」这条路：
宽限期内先摘掉 / 超期放回 / 宽限期内不许放回 / 图真配上了超期也不放回 / 放回后重扫且幂等。
`test/scope-order.test.mjs` 的 `KNOWN_CLOSURE_FORWARD` 补 `maskMarksInTextNode` / `unmaskStalePending`
（两个调用点都在扫描驱动的执行路径上，不在 `apply()` 的同步起点）。

⚠️ 这一刀顺带修掉两处**测试脚手架自己的假红**（不是产品代码的 bug，但不修就测不出真东西）：

1. 假 DOM 的 `textContent` 原来是个死字段 `textContent: ''` → `maskMarksInTextNode` 里
   `ghost.textContent = hit[0]` **赋值被悄悄丢掉**，ghost 是空的，`unmaskStalePending` 判「这是不是
   我们摘的注释」永远不认。真 DOM 的 `textContent` 可写，假 DOM 得给 setter。
2. `visibleText()`（测试里拼「还看得见什么」的那个镜头）只认 `data-meme-hidden` 属性。可
   `unmaskStalePending` 的放回动作是 `ghost.style.display = ''` —— **属性还在、样式撤了**。
   镜头不改就会把「放回来了」误判成「还藏着」。现在按真 DOM 口径：还按着 `display:none`、
   或者只有属性且没有内联样式，才算看不见。

诊断脚本 `tools/_diag-flash.mjs`：把 `unmaskStalePending` 那一族真源码抠出来、往关键步骤插打印，
用最小假 DOM 走一遍「摘 → 超期 → 放回」。

## 2026-10-12 第六刀：门把自家界面挡在外面（「表情包无法显示」）

用户重启后报：**表情包无法显示**（图全空，连图库面板里的图也不出来）。

现场取证（只读探针打宿主）：

- `GET /dsh-memes-api?packId=all` 无头 → **403**，`{"ok":false,"error":"缺少来源校验头(本地脚本请带 x-dsh-meme: 1)"}`；
  `GET /memes-panel` 无头 → 403。带 `x-dsh-meme: 1` 拿到的库是完全正常的：978 行、字段
  `path,tag,file_name,caption,keywords,url` 齐全；图片路由 `/dsh-memes/<packId>/<rel>` 六种头组合
  **全是 200** —— 库和图片服务都没坏，坏的是「客户端拿不到那张码表」。
- 根因：客户端的索引请求 `fetch('/dsh-memes-api?packId=all', { headers: memeApiHeaders() })`（`client.js:2042`）
  是**同源 GET，浏览器不发 Origin**（fetch 规范只对跨源请求带 Origin）→ 掉进 `assertLocalRequest` 最后那条分支；
  而 `memeApiHeaders()`（`client.js:140`）在拿不到 `window.__DSH_MEME_TOKEN__` 时只有 `Content-Type`，
  `x-dsh-meme: 1` 也没带 → **403 → `memeCodeIndex` 空 → 每处 `[表情: …] ·码` 的 `memeSrcFor(hit)` 都返回 `''`
  → 走「无命中」降级分支**：注释被摘掉、图一张不插。就是第五刀那道门把自家界面挡在外面。

改法（`index.js`：`assertLocalRequest` 上游新增 `sameOriginInitiator`）：

- GET 额外认浏览器自己盖的同源戳 **`Sec-Fetch-Site: same-origin`**；`same-site` / `cross-site` 显式拦下
  （正向判据，不是 `else return true` —— 将来宿主把 web 挪到子域也不会悄悄放宽）。
- `assertLocalRequest` 顺序：Host 回环 → 有 Origin 必须同源 → `x-dsh-meme: 1` 放行 → 只读 GET 且带同源戳 →
  否则抛「缺少来源校验头」。**写路径一点没松**：不带 Origin 的写操作照样被挡在这里，高风险 op 照样要令牌。
- **砍掉的一版**：本来还认「Referer 与 Host 同源」。实测（`node -e` 打活宿主）带 `Referer` 的请求仍然 403 ——
  Node 的 fetch 根本不发 Referer（lib 开 no-referrer），浏览器在 `Referrer-Policy: no-referrer` 下也不发，
  这条判据在真机上是死的。留着只会让人以为多一道保险，所以只留 `Sec-Fetch-Site`。
- 顺带（`client.js`）：注入的 `<img>` 加 `loading="lazy"` + `decoding="async"`（长会话几百张图一起解码会卡帧、
  图迟迟不出来）；面板加一个可点开的「自检」（索引状态 + 一次真发图探测），下回再出「图全空」他能一句话念给我。

验证：`tools/_diag-auth.mjs` 从 12 条加到 **17 条全绿**（新增：同源戳 GET 放行、same-site / cross-site 拦下、
只剩 Referer 拦下、裸 curl GET 拦下）；六个测试文件全绿（basic 6 / match 4 / pincode 5 / dominsert 7 /
scope-order 10 / notext 16，`scope-order` 的 `KNOWN_CLOSURE_FORWARD` 认领了面板自检用的
`memeIndex` / `memeCodeIndex` / `memeApiStatus`）；活宿主实测 7 条：裸 GET 索引 403、同源戳 200（264216B）、
cross-site 403、`x-dsh-meme` 200、跨站 Origin 403、面板裸取 403、面板同源戳 200。

## 2026-10-12 第七刀：面板「自检」跨作用域引用，把整个面板炸开（「表情包界面直接打不开」）

第六刀顺带加的那个「自检」块自己埋了颗雷：`MemeBoard`（factory 顶层，`client.js:1464` 定义）
render 里直接读 `memeApiStatus` / `memeIndex` / `memeCodeIndex`，而这三个当时声明在 `apply()`
内部（`client.js:1982` 一带）。render 表达式是**渲染当帧就跑**，不是「点下去才读」——
组件一挂载就是 `ReferenceError: memeApiStatus is not defined`，面板整个打不开。
用户原话：「越修越乱现在表情包界面直接打不开」。

病根跟当年 `memeCodeFromRow` 那次一模一样（factory 组件引用 apply 作用域的 let），
区别是那次死在 onClick 里（点图没反应），这次死在 render 里（面板根本出不来）。

改法：

- 三个变量提到 factory 顶层（`memePickMap` 旁边，`client.js:133-135`），`apply()` 开头只做
  重置赋值，声明归 factory —— 与 `memePickMap` / `MEME_CODE_RE` / `memeCodeFromRow` 同一姿势。
- `test/scope-order.test.mjs`：把 `KNOWN_CLOSURE_FORWARD` 里认领的这三个名字**删掉**
  （上一刀那次认领本身就是错的：那不是「闭包前向引用」，是跨作用域 undefined 变量，
  豁免名单不是这么用的）；同时把三个名字加进「点击路径依赖的符号都在 factory 顶层」和
  「函数定义必须早于它引用的 factory 级声明」两道用例 —— 钉死，防再犯。

验证：六个测试文件全绿（basic 6 / match 4 / pincode 5 / dominsert 7 / scope-order 10 / notext 16）、
`_diag-apply.mjs` apply() 真跑通、`_diag-auth.mjs` 17 条全绿、`node --check` 两个文件通过。
真机验收仍要等重启 + 刷新：面板能开、点图能发、图能出、注释不露。

## 2026-10-12 第八刀：装饰中途 `replaceChild` 抛错，一抛就把整趟扫描带崩（「只显示文字」）

病根是 `client.js` 的 `decorateMemeText()` 里**两行的先后顺序**：

```js
maskMarksInTextNode(node)                    // ← 无条件先跑
parent.dataset.memePendingAt = String(Date.now())
...
parent.replaceChild(frag, node)              // ← 后面每一条都炸在这
```

`maskMarksInTextNode` 的实现是拿一段文档片段**整个替换掉那个文本节点** —— node 的 identity 当场作废。
于是**每一条能配到图的消息**（恰恰是最常见的那条路）走到下面那句就抛：

```
Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.
```

它抛在 for 循环里，旁边没有 per-node 的 try —— 整趟装饰当场断在这里：这条消息之后的节点全不处理，
`dedupeMemeImages` / `hideMemeRawText` / `markStaleRawText` / 索引 TTL 重拉**全部跳过**。
用户看到的就是「只显示文字」。2026-10-12 用户 m03064 从面板「自检」里念出来的那句
「索引拉取失败: Failed to execute 'replaceChild'…」就是它 —— 异常从 `loadMemeIndex()` 的 `.catch`
里漏出来，于是被写成「索引拉取失败」，而索引本身好好的。

改法：

- `maskMarksInTextNode(node)` + `memePendingAt` **挪进 `if (needsLookup && recheck)` 那一支** ——
  只有「这一遍注定不出图、也不降级」时才摘原文；`loadMemeIndex()` 单独提到前面一行（它自带守卫）。
- `parent.replaceChild(frag, node)` 前加兜底：
  `if (node.parentNode !== parent) { memeDecorateStatus = '跳过一条消息：文本节点已被换走'; continue }` ——
  真 DOM 下宁可这一条不装饰，也别拖垮全趟。
- **装饰的异常不再伪装成索引异常**：`loadMemeIndex().then` 里的 `decorateMemeText(relook)` 单独 try/catch，
  `runScan()` 的 catch 也记一笔，两者都写进 `memeDecorateStatus`（factory 顶层新声明，
  `noteDecorateFailure` 统一写）。面板「自检」多一行：`装饰: 正常 | 已出图 N 张`
  （`memeImgCount` 累计真正插进 DOM 的 `<img>` 数）—— 下回再犯，这一行直接念得出来。
- `unmaskStalePending()` 放回原文的动作改掉：原来是 `ghost.style.display = ''`，可 `[data-meme-hidden]`
  属性还挂在那个 span 上，而装饰侧 TreeWalker 一见它就 REJECT —— 等于这条消息**永久**裸着标记、
  再也配不上图。现在 `holder.replaceChild(document.createTextNode(ghost.textContent || ''), ghost)`，
  放回去的是**裸文本节点**。
- 顺带（评审 AC-4）：`dedupeMemeImages()` 的去重键从 `caption` 改成 `caption + '|' + src` ——
  原来同一条消息里两张描述一样、码不同的图（库里 10 组 / 58 张抖音组图共用一句 desc）会被当重复删掉第二张。

新增回归测试 `test/decorate.test.mjs`（4 条）+ 假 DOM `test/stub/dom.mjs` —— 那个假 DOM 会**真断言子节点关系**，
所以上面那句 `replaceChild` 一旦回退，测试当场变红：
① 能配到图：图落进 DOM、原文标记不再可见、整趟不抛错；② 配不到图又赶上「码表刚更新」那一遍：先摘原文顶着，但不标装饰完成；
③ 宽限期过了：原文放回可见树，而且是**裸文本节点**；④ 兜底：轮到自己时文本节点已被换走 → 跳过这一条，别把整趟扫描带崩。

⚠️ 写这几条用例时踩的坑：`·码` 必须写在方括号**外面**（`[表情: 猫猫] ·c17928d`），
这和 `memes.js:580` / `client.js:1691` 两处生成候选行的写法一致；写成 `[表情: 猫猫 ·c17928d]`
正则的码捕获组（挂在 `]` 之后）就抓不到，用例会以「图没落进 DOM」的样子红 —— 那是测试写错了，不是产品坏了。

验证：`decorate` 4/4 绿、其余六个测试文件全绿（basic 6 / match 4 / pincode 5 / dominsert 7 / scope-order 10 / notext 16）；
新增活宿主只读探针 `tools/_diag-live.mjs`（打 19387 上**正在跑**的那个）：无头 GET 索引 403、带头 200、
跨站 Origin 403、`delete` 无令牌 403、面板无头 403、图片路由 200；并核对「全库 978 行 / 977 行带码 /
caption 撞车 10 组 58 张 / 磁盘 978 张 = 索引 978 行 / 服务端候选行 978 条全能被前端那条正则咬住」。
真机验收仍要等重启 + 刷新：面板能开、点图能发、图能出、注释不露。

## 2026-10-12 版本号 0.1.0 → 0.2.0

`v0.1.0` 那个 tag 之后一共攒了 20 个提交：

- 一个真新功能：`97642f3` 随包带 57 张自选种子图 + 首启就地种图（`.seeded` 记号、种子挑选模式）；
- 一个性能：`f2c3d0e` 面板改窗口化渲染 + 删图不再全量重载；
- 一个上架整理：`d8e0edb` 撤掉自带底图 `seed/`、删掉挑选清单写盘接口；
- 其余都是修：点谁发谁（`45cf11f`）、注释先闪一行（`a569b07`）、`x-dsh-meme` 头补全（`888656f`）、
  拆掉默认图库市场（`87a002c`）、空库与图库目录可填（`c4673f0`），
  再加 10-12 这一串装饰链路修复（`1c1457e` … `65716d7`）。

按语义化版本，带 `feat` 就该动 minor —— 升成 `0.2.0`，打 tag `v0.2.0`。
旧 tag `v0.1.0` 留着不动：它指的就是 `cf60b2b` 那个「20 项改动并入源码」的初版。

## 2026-10-12 上传弹窗：AI 识别的反馈全被遮罩盖住（「点了没反应，啥也不弹」）

用户报：上传表情包弹窗里点「AI 识别」，点了没反应、什么都不弹。

**病根不在识图本身。** 后端整条链路是好的 —— 活宿主实测 `op:'recognize'`（`tools/_diag-recognize.mjs`）：
1.6 秒返回 `{"ok":true,"tag":"happy","caption":"可爱的蓝发鲸鱼娘女仆，睁着大眼睛开心张嘴笑，萌态十足。","keywords":"鲸鱼娘 女仆 Q版 可爱 开心"}`。

问题在**提示渲染的位置**：`client.js:996` 那行 `notice ? h('div', { className: 'notice' }, notice) : null`
渲染在**面板主体**上，而上传弹窗是**全屏遮罩**（`meme-modal-mask`）—— 弹窗一开，那行通知就被盖在底下。
于是不管识别成功还是失败，用户在弹窗里**什么都看不到**；识别失败时三个框也不会被填，
观感就是「点了没反应，啥也不弹」。

改法（`[patch-dsh-gengtu-upnotice]`，只动「上传弹窗 + AI 识别」这一条线，`client.js` 四处）：

- 新增弹窗自己的状态 `upNotice` / `setUpNotice`（跟 `upFile` / `upData64` 放在一起）；
- `onRecognize()` 里所有反馈从面板级 `setNotice` 改成 `setUpNotice`；
- 进函数第一句先报 `识别中…正在让模型看图` —— 这样「点到底点上没有」本身也可见；
- 令牌兜底：`window.__DSH_MEME_TOKEN__` 为空时直接明说 —— `recognize` 在 `HIGH_RISK_OPS` 里，
  没有令牌必然 403，而以前那个 403 只会写进那行**看不见**的 notice；
- 弹窗里按钮下面加一行 `upNotice ? h('div', { className: 'notice' }, upNotice) : null`；
- 换图时（`onPickFile`）顺手清空 `upNotice`。

验证：`node --check client.js` 通过；七个测试文件全绿（basic 6 + 1 skip / match 4 / pincode 5 /
dominsert 7 / scope-order 10 / notext 16 / decorate 4）；`git diff --stat` = 1 file changed, +20/−5
（除 client.js 外一个字没动）。

真机验收：界面 **Ctrl+R**（客户端半边，不用重启桌面端）→ 上传弹窗选图 → 点「AI 识别」→
弹窗里应出现 `识别中…`，随后是 `AI 已识别: [happy] …`，或者一句明确的失败原因。

**2026-10-12 实测**：Ctrl+R 后弹出来的正是那句明确的失败原因 ——
`AI 识别失败: 页面没拿到插件令牌(window.__DSH_MEME_TOKEN__ 为空),刷新页面后重试`。
这条兜底检查把真病根揪出来了：**问题不在识图，在令牌压根没注进页面**，见下一节。

## 2026-10-12 令牌注入兜底：桌面端 `tapIndex` 静默失效，页面自己取一次（`[patch-dsh-gengtu-tokenfetch]`）

**病根**：`window.__DSH_MEME_TOKEN__` 从来没进过页面。
注入挂在 `index.js` 的 `webServer.tapIndex((html) => html.replace('</head>', …))` 上，
而 `String.prototype.replace` **匹配不到不会抛错** —— 紧跟的 `catch` 只 `console.error`，静默失败。

（把 `…\resources\app.asar` 解开看过：`tapIndex(transform) { this.indexTaps.push(transform); … }`
实现没变、签名也对；但它的文档写明这条链由「SPA dist 服务器渲染 index 时」触发 —— 桌面端这条路没走到。）

**后果**（比「AI 识图坏了」大得多）：`HIGH_RISK_OPS` 里的 op 全部 403 ——
`upload` / `update` / `delete` / `deleteTag` / `recognize` / `importMemePack` / `setMemeRoot` …，
表现就是「点了没反应」；**同一个注入点还负责「聊天里表情包显示成小图」的 CSS**，所以那也一起没了。

**改法（只加不减，原 `tapIndex` 一个字没动）**：

1. `index.js`：新增只读路由 `GET /dsh-memes-token`，走 `assertLocalRequest`，返回 `{ ok: true, token }`。
2. `client.js`：新增 `ensureMemeToken()` —— 注进去了就用注入的；为空才 fetch 一次并写回
   `window.__DSH_MEME_TOKEN__`；**取不到不抛错、不弹窗**，只是维持原状（高危 op 仍 403，与修复前一致）。
   页面加载即调用一次，`apiPost()` 前再 `await` 一次兜底。
3. `panel.html`：同样的 `ensureMemeToken()` + `apiPost()` 前 await（面板页不引 `client.js`，得自带一份）。
4. `onRecognize()`：原令牌检查前加 `await ensureMemeToken()`，避免「刚加载完就点」的假失败。

**为什么安全级别没变**：`/dsh-memes-token` 与其余 API 走**同一道门**（`assertLocalRequest`：回环 +
同源，或带 `x-dsh-meme` 头），而本机进程本来就直接读得到 `~/.dsh/dsh-expression.token`。没有新增暴露面。

**验证**：`node --check` index.js / client.js 均通过；七个测试文件全绿（basic 6 + 1 skip / scope-order 10 /
decorate 4 / dominsert 7 / match 4 / notext 16 / pincode 5）。探针 `tools/_diag-token.mjs` 打三条：
无头 403 / 带 `x-dsh-meme` 200 + token / 跨站 Origin 403。

**真机验收**：**重启桌面端**（新路由在宿主半边 `index.js` 里）+ 界面 Ctrl+R → 上传弹窗点「AI 识别」，
应能出标签和描述；上传、删除、改标签也应一并恢复。

**2026-10-12 实测**：重启后探针 `tools/_diag-token.mjs` 三条全对（无头 403 / 带 `x-dsh-meme` 200 + 40 字符
token / 跨站 Origin 403），`tools/_diag-live.mjs` 原有接口体检全绿（978 行 / 977 带码 / 图片路由 200 /
该拦的全拦住）。**注意：关开插件不够** —— DSH 的关/开只重跑 `apply()`，不会重读已被 ESM 缓存住的
`index.js`，必须重启桌面端进程新路由才存在（第一次探针返回 404 就是踩了这个）。

## 2026-10-12 版本号 0.2.0 → 0.2.1

纯修复版本：桌面端 `tapIndex` 静默失效 ⇒ 高风险 op 全 403（上传 / AI 识图 / 删除 / 改标签 / 导图库包）。
没有新功能、没有行为变更，按语义化版本只能走 patch。

- `[patch-dsh-gengtu-tokenfetch]`：`index.js` 新增只读路由 `/dsh-memes-token`，`client.js` 与
  `panel.html` 各自带 `ensureMemeToken()` 兜底（见上一节）。
- **已知且故意不修的另一半**：聊天里表情包的小图 CSS 同样挂在死掉的 `tapIndex` 上。用户 2026-10-12
  明确表示**不修** —— 160px 的梗图看不清（「在小了就看不清了」），保留原图尺寸。将来若有人把这当成
  bug 顺手"修好"，等于把用户的图全变成小图，属于**倒退**，先问再说。

