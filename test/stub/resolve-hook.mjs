const STUBBED = '@deepseek-ai/dsh-tools'
const STUB_URL = new URL('./dsh-tools.mjs', import.meta.url).href

export async function resolve(specifier, context, nextResolve) {
  if (specifier === STUBBED) return { url: STUB_URL, shortCircuit: true }
  return nextResolve(specifier, context)
}
