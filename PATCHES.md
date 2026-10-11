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
| client.js | `[patch-dsh-meme-pickmap]` | 点选图后按 caption→url 精确发送 | 点 A 发出 B（靠描述模糊匹配会串图） |
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
| memes.js + seed/ + package.json | `[patch-dsh-meme-seed]` | 包里带 `seed/`（用户亲手挑的 57 张底图 4.3MB + manifest.json）；`ensureLibrary()` 首启就地种进用户库，路径 `memes/<tag>/seed-NNN.jpg`，码按新路径重算，种完写 `.seeded` 记号 → **用户删光自己的图后重启不会被硬塞回来** | 装完插件图库空空如也，新用户没法用；原来那 24 张原作者授权是 personal 不能带，这 57 张是自己选的 |
| index.js + client.js | `[patch-dsh-meme-seedpick]` | 图库选择器加「种子库」挑选模式（点图即勾选、右上角序号）；宿主新增 `POST /dsh-memes-seed-pick` 收清单落盘（默认 `<home>/.dsh/dsh-memes-seed-pick.json`，可用 `dir` 覆盖；拒绝写进图库目录），浏览器兜底 `http://127.0.0.1:8796/submit` | 要在聊天窗口里直接挑随包分发的底图，不用另开窗口 |
| client.js + index.js | `[patch-dsh-meme-window]` | 图库面板一次只铺 72 格、滚到底自动续（IntersectionObserver 哨兵 `mp-more`）；删图改成只摘掉本地那一格（失败才回退全量 `load()`）；宿主 `op:'delete'` 的存在性校验从全表 `list().some()` 改成按主键单查 | 用户报：删完表情包电脑卡几秒。本机实测整库 979 张铺满 = 141MB / 5.6 秒随机读，`node:sqlite` 又跑在后端主线程上 |

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
