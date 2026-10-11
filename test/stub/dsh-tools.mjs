// @deepseek-ai/dsh-tools 的最小替身：测试只用到 defineTool，
// 真身由 DSH 宿主在运行时提供（peerDependencies），装包的人不必装它。
export function defineTool(def) {
  return def
}
