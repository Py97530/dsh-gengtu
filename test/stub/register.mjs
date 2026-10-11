// 把 '@deepseek-ai/dsh-tools' 指到 test/stub/dsh-tools.mjs，好在没有 DSH 宿主的机器上跑测试。
// 用法：node --import ./test/stub/register.mjs test/basic.test.mjs
import { register } from 'node:module'

register(new URL('./resolve-hook.mjs', import.meta.url).href)
