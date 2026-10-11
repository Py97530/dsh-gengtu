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

## 高风险操作令牌

`[patch-dsh-meme-auth]` 之后，导出/删除/改提示词这类操作要带 `x-dsh-meme: 1` 头；
令牌落在 `~/.dsh/dsh-expression.token`，本机脚本用 `_plugin_work/add-auth-headers.mjs` 统一补过。
