# tools/ —— 一次性诊断脚本（不是测试）

这些是**排查时用一次**的小脚本，故意不放在 `test/`：`test/` 里只留六个真测试
（`node --import ./test/stub/register.mjs test/<名字>.test.mjs`），
放一起会被 `node --test` 之类一股脑收走、报一堆假失败。

全部**只读**源码（`../client.js` / `../index.js`），不改任何文件。

| 脚本 | 干什么 | 怎么跑 |
| --- | --- | --- |
| `_diag-apply.mjs` | 假 DOM + 假 cordis ctx 里**真调一次 `apply()`**，确认整块结构闭合、三个插槽（`settings.section/memes`、`conversation.input.left/meme-picker`、`conversation.input.overlay/meme-picker`）都注册上 | `node tools/_diag-apply.mjs` |
| `_diag-auth.mjs` | 把 `index.js` 里 `LOOPBACK_HOSTS`/`hostIsLoopback`/`assertLocalRequest` 抠出来打 12 条用例（谁放行、谁 403） | `node tools/_diag-auth.mjs` |
| `_diag-stale.mjs` | 兜底层（`hideMemeRawText`/`markStaleRawText`/`hideStaleRawText`）的假 DOM 复现 | `node tools/_diag-stale.mjs` |
| `_diag-scope.mjs` | 列某个符号的「声明行 / 引用行@所属函数」，查前向引用 | `node --import ./test/stub/register.mjs tools/_diag-scope.mjs 名字` |
| `_diag-fnstart.mjs` | 列「闭包前向引用」候选（顶层的自由变量） | `node tools/_diag-fnstart.mjs` |
| `_diag-extract.mjs` | 打印测试里那几条正则从 `client.js` 抠出来的源码 + 语法自检 | `node tools/_diag-extract.mjs` |
| `_diag-braces.mjs` | 逐行数花括号净数（启发式，**对正则字面量会误判**） | `node tools/_diag-braces.mjs [起始行]` |
| `_diag-depth.mjs` | 严格词法数括号，打印指定行区间的深度 | `node tools/_diag-depth.mjs [from] [to]` |
| `_diag-runaway.mjs` | 从某行起算花括号净数（**结果必须 0**，不然就是漏/多括号） | `node tools/_diag-runaway.mjs <起始行>` |
| `_diag-unbalanced.mjs` | 列出没闭合的括号位置 | `node tools/_diag-unbalanced.mjs` |

## 两个已经踩过的坑

1. **`client.js` 和 `index.js` 都是 CRLF。** 从源码里抠东西之前先
   `.replace(/\r\n/g, '\n')`；拿缩进/行尾当锚点的正则（`\n {6}\}` 这种）一挪函数就抠错，
   抠出来会拼成 `SyntaxError`。
2. **别再用「数括号」当结构验证手段**，它是启发式的（正则字面量里的 `{`、字符串里的引号都能骗过它，
   2026-10-12 那次「净数 -4」就是被 `\r` 骗的）。要验结构就 `_diag-apply.mjs`：假 DOM 里真跑一遍。
