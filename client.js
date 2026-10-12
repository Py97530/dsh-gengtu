/**
 * dsh-gengtu — 设置页梗图/表情包管理面板(Client 半边)。
 *
 * 以 dsh.client bundle 格式加载(与 dsh-ssh 同款):注册 settings.section
 * 「表情包」页,渲染完整管理面板(列表/上传/编辑/删除)。
 * 数据走本插件的 HTTP API(/dsh-memes-api,静态、重启不丢)。
 * 注册 id 必须等于 loader entry 名(= npm 包名 dsh-gengtu),否则 ModuleLoader 报
 * "loaded without registering dsh-gengtu"。
 */
window.__ModuleLoader__.load({
  id: 'dsh-gengtu',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')

    const CSS = [
      '.meme-panel{display:flex;flex-direction:column;gap:14px;padding:4px 0;font-size:13px;color:var(--dsw-alias-label-primary)}',
      '.meme-panel .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
      '.meme-panel .section-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.04em;margin:2px 0 -4px}',
      '.meme-panel .pack-dd{position:relative;flex:1;min-width:160px}',
      '.meme-panel .pack-dd-btn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;cursor:pointer;padding:8px 12px}',
      '.meme-panel .pack-dd-btn .caret{opacity:.55;font-size:11px;flex:none}',
      '.meme-panel .pack-dd-menu{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 4px);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:4px;max-height:240px;overflow:auto}',
      '.meme-panel .pack-dd-item{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;border:none;background:transparent;padding:8px 10px;border-radius:6px;cursor:pointer}',
      '.meme-panel .pack-dd-item:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.meme-panel .pack-dd-item.on{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}',
      '.meme-panel .pack-dd-item .hint{font-size:11px;color:var(--dsw-alias-label-secondary);flex:none}',
      '.meme-panel .switch{position:relative;width:36px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l1);cursor:pointer;transition:background .15s ease;flex:none;display:inline-block}',
      '.meme-panel .switch::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .15s ease}',
      '.meme-panel .switch.on{background:var(--dsw-alias-brand-primary)}',
      '.meme-panel .switch.on::after{transform:translateX(16px)}',
      '.meme-panel input[type=text],.meme-panel select,.meme-panel textarea{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:6px 10px;font-size:13px;outline:none;transition:border-color .12s ease}',
      '.meme-panel input[type=text]:focus,.meme-panel select:focus,.meme-panel textarea:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.meme-panel textarea{resize:vertical;font-family:inherit}',
      '.meme-panel button{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:5px 12px;font-size:13px;cursor:pointer;transition:border-color .12s ease,background .12s ease}',
      '.meme-panel button:hover{border-color:var(--dsw-alias-brand-primary)}',
      '.meme-panel button:disabled{opacity:.5;cursor:default}',
      '.meme-panel .btn-primary{background:var(--dsw-alias-button-primary-fill);border-color:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}',
      '.meme-panel .btn-primary:hover{background:var(--dsw-alias-button-primary-hover);border-color:var(--dsw-alias-button-primary-hover)}',
      '.meme-panel .notice{padding:7px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.meme-panel .meme-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}',
      '.meme-panel .meme-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:transform .12s ease,box-shadow .12s ease}',
      '.meme-panel .meme-card:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,.12)}',
      '.meme-panel .meme-thumb{width:100%;height:120px;background-size:contain;background-position:center center;background-repeat:no-repeat;background-color:var(--dsw-alias-bg-base)}',
      '.meme-modal .meme-shot{width:100%;height:220px;border-radius:8px;background-size:contain;background-position:center center;background-repeat:no-repeat;background-color:var(--dsw-alias-bg-base)}',
      '.meme-panel .meta{padding:8px 10px;display:flex;flex-direction:column;gap:5px;min-height:80px}',
      '.meme-panel .tag{display:inline-block;align-self:flex-start;font-size:11px;color:var(--dsw-alias-brand-primary);text-transform:lowercase;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);border-radius:999px;padding:1px 8px}',
      '.meme-panel .cap{font-size:12px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.meme-panel .acts{display:flex;gap:6px;margin-top:auto}',
      '.meme-panel .acts button{padding:3px 10px;font-size:12px;border-radius:6px}',
      '.meme-panel .acts button.danger:hover{border-color:#e5484d;color:#e5484d}',
      '.meme-panel .empty{color:var(--dsw-alias-label-secondary);padding:24px;text-align:center}',
      '.meme-modal-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}',
      '.meme-modal{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:16px;width:340px;max-width:100%;box-shadow:0 10px 36px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:10px}',
      '.meme-modal h3{margin:0;font-size:14px;font-weight:600}',
      '.meme-modal .field{display:flex;flex-direction:column;gap:4px}',
      '.meme-modal input[type=text],.meme-modal select,.meme-modal textarea{box-sizing:border-box;width:100%}',
      '.meme-modal .field label{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.meme-modal .hint{font-size:11px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
      // 即时校验:字段不合法时标签和边框变红,而不是等提交后在面板顶部报错
      '.meme-modal .field.bad label{color:#e5484d}',
      '.meme-modal .field.bad input[type=text]{border-color:#e5484d}',
      '.meme-modal .modal-acts{display:flex;gap:8px;justify-content:flex-end;margin-top:2px}',
      '.meme-modal .modal-acts button{padding:6px 14px}',
      '.mk-tabs{display:flex;gap:18px;border-bottom:1px solid var(--dsw-alias-border-l1);width:100%}',
      '.meme-panel .mk-tab{border:none;background:transparent;cursor:pointer;font-size:13px;color:var(--dsw-alias-label-secondary);padding:4px 2px 8px;border-bottom:2px solid transparent;margin-bottom:-1px;border-radius:0;transition:color .12s}',
      '.meme-panel .mk-tab:hover{color:var(--dsw-alias-label-primary);background:transparent;border-color:transparent;border-bottom-color:transparent}',
      '.meme-panel .mk-tab.on{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}',
      '.mk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;width:100%}',
      '.mk-card{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;transition:transform .12s ease,box-shadow .12s ease}',
      '.mk-card:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,.12)}',
      '.mk-cover{position:relative;width:100%!important;height:136px!important;background-color:var(--dsw-alias-bg-base);display:flex;align-items:center;justify-content:center;font-size:26px;color:var(--dsw-alias-label-secondary)}',
      '.mk-cover-img{position:absolute;inset:0;background-size:cover;background-position:center 28%;background-repeat:no-repeat}',
      '.mk-cover-fallback{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,var(--dsw-alias-bg-layer-2))}',
      '.mk-body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px;flex:1}',
      '.mk-title{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.mk-name{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.mk-meta{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.mk-desc{font-size:12px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.mk-chips{display:flex;gap:4px;flex-wrap:wrap}',
      '.mk-chip{font-size:10px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:999px;padding:1px 8px}',
      '.mk-progress-wrap{display:flex;flex-direction:column;gap:3px}',
      '.mk-progress{height:4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}',
      '.mk-progress-bar{height:100%;background:var(--dsw-alias-brand-primary);border-radius:999px;transition:width .3s ease}',
      '.mk-progress-text{font-size:10px;color:var(--dsw-alias-label-secondary)}',
      '.mk-progress-unknown{width:35%;animation:mk-slide 1.2s ease-in-out infinite}',
      '@keyframes mk-slide{0%{margin-left:0}50%{margin-left:65%}100%{margin-left:0}}',
      '.mk-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}',
      '.mk-acts button{padding:3px 12px;font-size:12px;border-radius:6px}',
      '.mk-acts button.mk-danger:hover{border-color:#e5484d;color:#e5484d}',
      '.mk-empty{width:100%;color:var(--dsw-alias-label-secondary);padding:20px;text-align:center;border:1px dashed var(--dsw-alias-border-l1);border-radius:10px;font-size:12px}',
      '.mk-card-open{cursor:pointer}',
      '.meme-modal-head{display:flex;align-items:flex-start;gap:8px;margin:-4px -4px 0 0}',
      '.meme-modal-head h3{flex:1;margin:0}',
      '.meme-panel .meme-x{flex:none;border:none;background:transparent;cursor:pointer;font-size:18px;line-height:1;padding:2px 8px;border-radius:6px;color:var(--dsw-alias-label-secondary)}',
      '.meme-panel .meme-x:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-color:transparent}',
      '.mk-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px;max-height:300px;overflow:auto;padding:2px}',
      '.mk-preview a{display:block;height:84px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background-size:contain;background-position:center;background-repeat:no-repeat;background-color:var(--dsw-alias-bg-base)}',
      '.meme-panel .meme-footer{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:8px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1);font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.meme-panel .meme-footer a{color:var(--dsw-alias-brand-primary);text-decoration:none;white-space:nowrap}',
      '.meme-panel .meme-footer a:hover{text-decoration:underline}',
    ].join('')

    // 分类中文显示(仅 UI,存储/搜索仍是英文 tag)
    // [patch-dsh-meme-pickmap] 点过的图：caption → url（MemeBoard 写、apply 读）
    // ⚠️ 必须在 factory 顶层：MemeBoard 定在 1444 行、apply 从 1916 行才开始，
    // 这俩（连带 memeCodeFromRow / MEME_CODE_RE）原来写在 apply() 里，
    // 结果 MemeBoard 里的点图处理器一跑就是 ReferenceError，
    // 整个 send() 当场死 → 用户看到「点图完全没反应」（2026-10-12 实测确认）。
    const memePickMap = new Map()
    // 行尾稳定码：`·c1a2b3`（keywords 里，由 _plugin_work\add-meme-codes.mjs 写入，
    // 算法 = 'c' + sha1(path).slice(0,6)）。不是 [m:…] 那种短码：[m:…] 是 token 的
    // 另一种写法，这个是「挂在标记后面的身份后缀」。
    // ⚠️ `{5,6}` 不是笔误：V8（Node 24 / Chrome 桌面端实测）在「字符类 + 精确量词」上有个
    // 可复现的怪癖 —— `c[0-9a-f]{6}` 匹配 'c0ffee' 返回 **false**（`{5}`、`{1,6}`、`{6,7}`
    // 都正常，`c[a-z]{6}` 也正常，就 `[0-9a-f]` 这一类 + `{6}` 不行）。换成区间量词立刻正常。
    const MEME_CODE_RE = /·(c[0-9a-f]{5,6})(?!\w)/
    const memeCodeFromRow = (row) => {
      const kw = String((row && row.keywords) || '')
      const found = kw.match(new RegExp(MEME_CODE_RE.source, 'g'))
      if (!found || !found.length) return ''
      return found[found.length - 1].slice(1)
    }

    const TAG_ZH = {
      angry: '生气', happy: '开心', sad: '难过', shy: '害羞', confused: '困惑',
      daily: '日常',
      surprised: '惊讶', sleep: '睡觉', meow: '喵喵', morning: '早上好', work: '上班',
      like: '喜欢', see: '看看', reply: '回复', sigh: '叹气', baka: '笨蛋',
      fool: '傻瓜', givemoney: '给钱', color: '彩色', cpu: 'CPU',
    }
    const tagZh = (t) => TAG_ZH[t] || t

    // [patch-dsh-meme-auth] 页面对本插件 API 的每个请求都得带来源校验头。
    // 关键:同源 GET 浏览器不发 Origin,只发 POST 那种才带 —— 所以 GET 也必须带头,
    // 否则宿主按"缺 Origin 且无 x-dsh-meme"拒掉(403),表现就是图库列表/搜索/发现页全空。
    function memeApiHeaders(extra) {
      return {
        'x-dsh-meme': '1',
        ...(window.__DSH_MEME_TOKEN__ ? { 'x-dsh-meme-token': window.__DSH_MEME_TOKEN__ } : {}),
        ...(extra || {}),
      }
    }
    async function apiGet(params) {
      const qs = new URLSearchParams()
      if (params.tag) qs.set('tag', params.tag)
      if (params.q) qs.set('q', params.q)
      if (params.remoteDir) qs.set('remoteDir', '1')
      return (await fetch('/dsh-memes-api?' + qs.toString(), { headers: memeApiHeaders() })).json()
    }
    async function apiPost(payload) {
      return (await fetch('/dsh-memes-api', {
        method: 'POST',
        headers: memeApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })).json()
    }

    function MemePanel(props) {
      const ctx = props && props.ctx
      const h = React.createElement
      const [memes, setMemes] = React.useState([])
      const [tags, setTags] = React.useState([])
      const [total, setTotal] = React.useState(0)
      const [q, setQ] = React.useState('')
      const [tagFilter, setTagFilter] = React.useState('')
      const [notice, setNotice] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [edit, setEdit] = React.useState(null)
      const [upTag, setUpTag] = React.useState('')
      const [upCaption, setUpCaption] = React.useState('')
      const [upKeywords, setUpKeywords] = React.useState('')
      const [uploading, setUploading] = React.useState(false)
      const [recognizing, setRecognizing] = React.useState(false)
      const [uploadOpen, setUploadOpen] = React.useState(false)
      const [memeRoot, setMemeRoot] = React.useState('')
      const [packId, setPackId] = React.useState('')
      const [packs, setPacks] = React.useState([])
      const [packsDir, setPacksDir] = React.useState('')
      const [packsDirInput, setPacksDirInput] = React.useState('')
      const [remoteDirInput, setRemoteDirInput] = React.useState('') // [patch-dsh-gengtu-remotedir-ui] 目录源输入框
      const [rootNotice, setRootNotice] = React.useState('')
      const [browseOpen, setBrowseOpen] = React.useState(false)
      const [browseList, setBrowseList] = React.useState(null)
      const [browseErr, setBrowseErr] = React.useState('')
      const [companionPrompt, setCompanionPrompt] = React.useState('') // 用户自定义覆盖(空=默认)
      const [defaultPrompt, setDefaultPrompt] = React.useState('') // 内置默认提示词
      const [promptOpen, setPromptOpen] = React.useState(false)
      const [promptDraft, setPromptDraft] = React.useState('') // 弹窗内草稿
      const [remoteSubs, setRemoteSubs] = React.useState([])
      const [remoteDir, setRemoteDir] = React.useState(null) // 服务端代拉的图库目录(null=暂不可用)
      const [remoteJobs, setRemoteJobs] = React.useState({})
      const [remoteBusy, setRemoteBusy] = React.useState(false)
      const [panelTab, setPanelTab] = React.useState('library')
      const [remoteQuery, setRemoteQuery] = React.useState('')
      const [packView, setPackView] = React.useState('') // 非空 = 进入该图库的表情包页(二级页,不是标签页)
      const [promptOn, setPromptOn] = React.useState(true)
      const [pluginVersion, setPluginVersion] = React.useState('')
      const applyRoot = (res) => {
        if (!res || !res.ok) return
        setMemeRoot(res.memeRoot || '')
        setPackId(res.packId || '')
        setPacks(Array.isArray(res.packs) ? res.packs : [])
        setPromptOn(res.promptEnabled !== false)
        setPluginVersion(res.pluginVersion || '')
        setPacksDir(res.packsDir || '')
        setPacksDirInput(res.packsDir || '')
        setRemoteDirInput(Array.isArray(res.remoteDirUser) ? res.remoteDirUser.join('\n') : String(res.remoteDirUser || ''))
        setCompanionPrompt(res.companionPrompt || '')
        setDefaultPrompt(res.defaultCompanionPrompt || '')
        setRemoteSubs(Array.isArray(res.remoteSubs) ? res.remoteSubs : [])
      }
      const localPackCards = packs.map((p) => {
        const entry = (remoteDir || []).find((e) => e.id === p.id) || null
        const sub = remoteSubs.find((s) => s.id === p.id) || null
        const isBundled = p.source === 'bundled'
        const isUserPack = p.source === 'user'
        const count = p.count || 0
        // 本地版本:市场装的看订阅记录,内置/导入/自建看自己的 manifest
        const installed = String((sub && sub.version) || p.version || '').trim()
        const hasUpdate = !!(entry && entry.version && installed && compareVersions(entry.version, installed) > 0)
        return {
          key: 'pack-' + p.id, packId: p.id,
          name: p.name || p.id, desc: '',
          // 已安装的图库用本地那张图当封面(插件自己的路由),不再依赖远程预览图
          cover: p.cover || null,
          meta: [
            isBundled ? '内置' : (isUserPack ? '导入' : '自定义'),
            installed ? 'v' + installed.replace(/^v/i, '') : '',
            count ? count + ' 张' : '',
            hasUpdate ? '可更新到 v' + String(entry.version).replace(/^v/i, '') : '',
          ].filter(Boolean).join(' · '),
          tags: (entry && (entry.keywords || entry.tags)) || [],
          entry, sub,
          installed: true, job: null,
          downloaded: true,
          hasUpdate,
          builtin: isBundled,
          enabled: p.enabled === true,
          onToggle: (next) => onTogglePack(p.id, next),
          pack: p,
        }
      })
      const onSaveCompanionPrompt = async () => {
        try {
          const res = await apiPost({ op: 'setCompanionPrompt', text: promptDraft })
          if (res && res.ok) {
            applyRoot(res)
            setPromptOpen(false)
            setRootNotice(res.message || '已保存')
          } else {
            setRootNotice('保存失败: ' + (res && res.error || ''))
          }
        } catch (e) {
          setRootNotice('保存失败')
        }
      }
      React.useEffect(() => {
        apiPost({ op: 'getMemeRoot' }).then(applyRoot).catch(() => {})
      }, [])
      // 远程图库目录:服务端代拉(逐源回退 + 60s 缓存),浏览器侧没有跨域问题
      React.useEffect(() => {
        let alive = true
        apiGet({ remoteDir: 1 }).then((res) => {
          if (alive && res && res.ok) setRemoteDir(Array.isArray(res.remoteDir) ? res.remoteDir : null)
        }).catch(() => {})
        return () => { alive = false }
      }, [])
      const pollRemoteJob = async (jobId) => {
        try {
          const res = await apiPost({ op: 'remoteJobStatus', jobId })
          if (!res || !res.ok) {
            setRemoteJobs((cur) => { const n = { ...cur }; delete n[jobId]; return n })
            return
          }
          if (res.state === 'running') {
            setRemoteJobs((cur) => ({ ...cur, [jobId]: res }))
            return
          }
          setRemoteJobs((cur) => { const n = { ...cur }; delete n[jobId]; return n })
          setRootNotice(res.message || (res.state === 'error' ? '下载失败' : '远程图库已就绪'))
          if (res.state !== 'error') {
            await load('', '')
            apiPost({ op: 'getMemeRoot' }).then(applyRoot).catch(() => {})
          }
        } catch (e) { /* 下一轮轮询再试 */ }
      }
      React.useEffect(() => {
        const ids = Object.keys(remoteJobs)
        if (ids.length === 0) return
        const t = setInterval(() => { for (const id of ids) pollRemoteJob(id) }, 1200)
        return () => clearInterval(t)
      }, [remoteJobs])
      const startRemote = async (manifestUrl, packId) => {
        const url = String(manifestUrl || '').trim()
        if (!url) { setRootNotice('先填远程图库清单 JSON 地址'); return }
        setRemoteBusy(true)
        try {
          const res = await apiPost({ op: 'subscribeRemote', manifestUrl: url, packId: packId || '' })
          if (res && res.ok) {
            setRemoteJobs((cur) => ({ ...cur, [res.id]: res }))
            setRemoteUrl('')
            setRootNotice('「' + res.name + '」开始下载(' + res.total + ' 张),完成后自动切换')
          } else {
            setRootNotice('订阅失败: ' + ((res && res.error) || '未知错误'))
          }
        } catch (e) {
          setRootNotice('订阅失败: ' + (e && e.message ? e.message : String(e)))
        }
        setRemoteBusy(false)
      }
      const startArchive = async (entry) => {
        const archiveUrl = String((entry && entry.archiveUrl) || '').trim()
        if (!archiveUrl) { setRootNotice('该图库没有可下载的 ZIP 地址'); return }
        setRemoteBusy(true)
        setRootNotice('正在下载并校验「' + (entry.name || entry.id || '图库') + '」…')
        try {
          const res = await apiPost({
            op: 'installRemoteArchive', archiveUrl,
            sha256: entry.sha256 || '', packId: entry.id || '',
            name: entry.name || '', version: entry.version || '',
          })
          if (res && res.ok) {
            // 走任务制:注册后由轮询更新进度条,装完 pollRemoteJob 会刷新列表
            setRemoteJobs((cur) => ({ ...cur, [res.id]: res }))
            setRootNotice('「' + (entry.name || entry.id || '图库') + '」开始下载安装…')
          } else {
            setRootNotice('安装失败: ' + ((res && res.error) || '未知错误'))
          }
        } catch (e) {
          setRootNotice('安装失败: ' + (e && e.message ? e.message : String(e)))
        }
        setRemoteBusy(false)
      }
      // 图库卡片「导出」:导出指定图库的 ZIP(不必先切过去)
      const onExportPack = async (id, name) => {
        try {
          setRootNotice('正在导出…')
          const response = await fetch('/dsh-memes-export?packId=' + encodeURIComponent(id))
          if (!response.ok) throw new Error((await response.text()) || '导出失败')
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'dsh-gengtu-' + id + '.zip'
          document.body.appendChild(link)
          link.click()
          link.remove()
          setTimeout(() => URL.revokeObjectURL(url), 60000)
          setRootNotice('已导出「' + (name || id) + '」的 ZIP')
        } catch (error) {
          setRootNotice(error.message || '导出失败，请重试')
        }
      }
      // 图库卡片开关:打开后模型可以用这个图库发图
      const onTogglePack = async (id, next) => {
        try {
          const res = await apiPost({ op: 'setPackEnabled', packId: id, enabled: next })
          if (!res || !res.ok) throw new Error((res && res.error) || '操作失败')
          applyRoot(res)
          setRootNotice(res.message || '')
        } catch (error) { setRootNotice(error.message || '操作失败') }
      }
      const onDeletePack = async (id) => {
        try {
          const res = await apiPost({ op: 'deleteMemePack', packId: id })
          if (!res || !res.ok) throw new Error((res && res.error) || '删除失败')
          applyRoot(res)
          if (packView === id) setPackView('')
          setRootNotice(res.message || '已删除')
          await load('', '')
        } catch (error) { setRootNotice(error.message || '删除失败') }
      }
      // 预览弹窗:已装的图库列它自己的图,没装的用目录里带的预览图
      const openPreview = async (row) => {
        const entry = row.entry || {}
        const catalogImages = [
          ...(entry.preview ? [entry.preview] : []),
          ...(Array.isArray(entry.previews) ? entry.previews : []),
        ]
        setPreviewPack({
          packId: row.packId || '', name: row.name || '', meta: row.meta || '',
          desc: row.desc || '', tags: row.tags || [],
          images: [...new Set(catalogImages)].filter(Boolean),
          total: Number(entry.count) || 0,
          // 已装的读本地图库、清单包读清单:这两种拿到的都是图库自己的图,能说「显示前 N 张」
          loading: !!(row.downloaded && row.packId) || !!entry.manifestUrl,
        })
        // 清单热链的包:没装也能看它列出的图(清单里有全部 128 条,比目录里那 19 张精选全)
        if ((!row.downloaded || !row.packId) && entry.manifestUrl) {
          try {
            const res = await apiPost({ op: 'previewManifest', manifestUrl: entry.manifestUrl })
            if (res && res.ok && Array.isArray(res.urls) && res.urls.length) {
              setPreviewPack((cur) => (cur && cur.packId === row.packId
                ? { ...cur, images: res.urls, total: Number(res.total) || res.urls.length, loading: false, fromPack: true }
                : cur))
              return
            }
          } catch (e) { /* 清单读不到就用目录里的预览图 */ }
        }
        if (!row.downloaded || !row.packId) {
          setPreviewPack((cur) => (cur && cur.packId === row.packId ? { ...cur, loading: false } : cur))
          return
        }
        try {
          const res = await fetch('/dsh-memes-api?packId=' + encodeURIComponent(row.packId), { headers: memeApiHeaders() }).then((r) => r.json())
          const urls = (res && Array.isArray(res.memes)) ? res.memes.map((m) => m.url).filter(Boolean) : []
          if (urls.length) {
            setPreviewPack((cur) => (cur && cur.packId === row.packId
              ? { ...cur, images: urls.slice(0, 60), total: urls.length, loading: false, fromPack: true }
              : cur))
            return
          }
        } catch (e) { /* 读不到就用目录里的预览图 */ }
        setPreviewPack((cur) => (cur && cur.packId === row.packId ? { ...cur, loading: false } : cur))
      }
      const onDeletePackPrompt = (row) => {
        setRootNotice('')
        setConfirmBox({
          title: '删除图库',
          lines: [
            '确认删除图库「' + (row.name || row.packId) + '」？',
            '该图库的目录和里面的图片都会被删掉，不可恢复。',
            ...(row.packId === packId ? ['这是当前图库（编辑/上传写进的那个），删除后会自动切到别的图库。'] : []),
            ...(row.builtin ? ['这是插件自带的内置图库，升级或重装插件后它会重新出现。'] : []),
          ],
          confirmLabel: '删除',
          onConfirm: () => onDeletePack(row.packId),
        })
      }
      // 图库卡片「编辑」:先切到该图库(上传/改/删只作用于当前图库),再进它的表情包页
      const onEditPack = async (id) => {
        const next = String(id || '').trim()
        if (!next) return
        try {
          if (next !== packId) {
            const res = await apiPost({ op: 'setPack', packId: next })
            if (!res || !res.ok) { setRootNotice('打开失败: ' + ((res && res.error) || '')); return }
            applyRoot(res)
          }
          setPackView(next)
          setQ('')
          setTagFilter('')
          await load('', '')
        } catch (e) { setRootNotice('打开失败') }
      }
      const onTogglePrompt = async (next) => {
        try {
          const res = await apiPost({ op: 'setPromptEnabled', enabled: next })
          if (res && res.ok) {
            applyRoot(res)
            setPromptOn(next)
            setRootNotice(res.message || (next ? '已开启陪伴提示词' : '已关闭陪伴提示词'))
          } else {
            setRootNotice('操作失败: ' + ((res && res.error) || ''))
          }
        } catch (e) { setRootNotice('操作失败') }
      }
      const [packDialog, setPackDialog] = React.useState('')
      const [packDraft, setPackDraft] = React.useState({ id: '', name: '', description: '' })
      const [packSaving, setPackSaving] = React.useState(false)
      // 新建弹窗的即时校验:规则与服务端 createMemePack 一致,不合法就别让点「创建」。
      // 红框只在碰过那个字段之后才显示——刚打开就一片红太吓人,空名字靠禁用按钮表达。
      const [packTouched, setPackTouched] = React.useState({})
      const packIdOk = /^[a-z0-9][a-z0-9_-]{0,39}$/.test(packDraft.id.trim())
      const packNameOk = packDraft.name.trim().length > 0
      const packDraftOk = packIdOk && packNameOk
      const packBad = (key) => !!packTouched[key] && !(key === 'id' ? packIdOk : packNameOk)
      const packSubmitOnEnter = (e) => { if (e.key === 'Enter' && packDraftOk && !packSaving) savePack() }
      // 应用内确认弹窗(不用浏览器原生 confirm):{title, lines, confirmLabel, onConfirm}
      const [confirmBox, setConfirmBox] = React.useState(null)
      const [previewPack, setPreviewPack] = React.useState(null) // 预览弹窗
      const [marketResult, setMarketResult] = React.useState('')
      const savePack = async () => {
        if (packSaving) return
        setPackSaving(true)
        setRootNotice('正在新建图库…')
        try {
          const res = await apiPost({ op: 'createMemePack', ...packDraft })
          if (!res || !res.ok) throw new Error(res && res.error || '操作失败')
          applyRoot(res)
          await load('', '')
          setQ('')
          setTagFilter('')
          setRootNotice('图库已新建并切换，可以开始添加图片')
          setPackDialog('')
        } catch (error) { setRootNotice(error.message || '操作失败，请重试') }
        finally { setPackSaving(false) }
      }
      const submitPack = async () => {
        if (packSaving) return
        const pack = packs.find(p => p.id === packId)
        if (!pack || !pack.count) { setRootNotice('空图库不能投稿，请先添加图片'); return }
        const params = new URLSearchParams({ template: 'submit-pack.yml',
          title: '[投稿] ' + pack.name, name: pack.name,
          description: (pack.description || '') + '\n图片数量：' + pack.count + '\n图库 ID：' + pack.id })
        const issueUrl = 'https://github.com/Py97530/dsh-gengtu/issues/new?' + params
        // Open synchronously in the click handler so browsers do not block the tab.
        const issueWindow = window.open('about:blank', '_blank')
        if (issueWindow) issueWindow.opener = null
        setPackSaving(true)
        setMarketResult('')
        setRootNotice('正在导出投稿 ZIP…')
        try {
          const response = await fetch('/dsh-memes-export?packId=' + encodeURIComponent(pack.id))
          if (!response.ok) throw new Error(await response.text() || '导出失败')
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'dsh-gengtu-' + pack.id + '.zip'
          document.body.appendChild(link)
          link.click()
          link.remove()
          setTimeout(() => URL.revokeObjectURL(url), 60000)
          setMarketResult(issueUrl)
          if (issueWindow && !issueWindow.closed) issueWindow.location.href = issueUrl
          setPackDialog('')
          setRootNotice('已发起 ZIP 下载。请在 GitHub 投稿页登录，拖入下载的 ZIP，补充来源和许可后提交。尚未提交或收录；如果页面未打开，请点击下方链接。')
        } catch (error) {
          if (issueWindow && !issueWindow.closed) issueWindow.close()
          setRootNotice(error.message || '导出失败，请重试')
        } finally { setPackSaving(false) }
      }
      const onSavePacksDir = async (dirArg) => {
        const dir = String(dirArg !== undefined ? dirArg : packsDirInput || '').trim()
        if (!dir) { setRootNotice('扫描目录不能为空'); return }
        try {
          const res = await apiPost({ op: 'setPacksDir', packsDir: dir })
          if (res && res.ok) {
            applyRoot(res)
            setRootNotice('已更新扫描目录')
          } else {
            setRootNotice('保存失败: ' + (res && res.error || ''))
          }
        } catch (e) {
          setRootNotice('保存失败')
        }
      }
      // [patch-dsh-gengtu-remotedir-ui] 保存「图库目录」:一行一个地址(逗号/空格也吃),留空 = 不挂目录。
      const onSaveRemoteDir = async () => {
        const list = String(remoteDirInput || '').split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
        for (const u of list) {
          if (!/^https?:\/\//i.test(u)) { setRootNotice('地址要以 http(s):// 开头: ' + u); return }
        }
        try {
          const res = await apiPost({ op: 'setRemoteDirUrl', remoteDirUrl: list })
          if (res && res.ok) {
            applyRoot(res)
            setRootNotice(res.message || '已保存')
          } else {
            setRootNotice('保存失败: ' + (res && res.error || ''))
          }
        } catch (e) {
          setRootNotice('保存失败')
        }
      }
      // 目录浏览走插件自己的 API(宿主 0.1.5 的客户端没有 workspaces 服务,
      // 之前依赖它 → 点了「选择目录」什么都不发生)
      const browseFetch = async (path) => {
        const res = await apiPost({ op: 'browse', path: path || '' })
        if (!res || !res.ok) throw new Error((res && res.error) || '读取失败')
        return { path: res.path, parent: res.parent, entries: res.entries, breadcrumbs: res.breadcrumbs }
      }
      const browseTo = async (path) => {
        setBrowseErr('')
        try {
          setBrowseList(await browseFetch(path))
        } catch (e) {
          setBrowseErr('读取失败: ' + (e && e.message ? e.message : String(e)))
        }
      }
      const onPickDir = async () => {
        setBrowseErr('')
        setBrowseList(null)
        try {
          setBrowseList(await browseFetch(String(packsDirInput || '').trim()))
        } catch (e) {
          // 失败原因要说出来,否则用户看到的就是「点了没反应」
          setRootNotice('打开目录浏览器失败: ' + (e && e.message ? e.message : String(e)))
        }
        setBrowseOpen(true)
      }

      const [upNewTag, setUpNewTag] = React.useState('')
      const [upFile, setUpFile] = React.useState(null)
      const [upData64, setUpData64] = React.useState('')
      const [upPreview, setUpPreview] = React.useState('')
      const fileRef = React.useRef(null)
      const importFileRef = React.useRef(null)
      const onImportPack = (ev) => {
        const file = ev.target.files && ev.target.files[0]
        ev.target.value = ''
        if (!file) return
        const reader = new FileReader()
        reader.onload = async () => {
          const b64 = String(reader.result || '').split(',')[1] || ''
          const name = String(file.name || '').replace(/\.zip$/i, '')
          setRootNotice('导入中…')
          try {
            const res = await apiPost({ op: 'importMemePack', dataBase64: b64, name })
            if (res && res.ok) {
              applyRoot(res)
              setRootNotice(res.message || '导入成功')
              await load(q, tagFilter)
            } else {
              setRootNotice('导入失败: ' + (res && res.error || ''))
            }
          } catch (e) {
            setRootNotice('导入失败')
          }
        }
        reader.onerror = () => setRootNotice('读取文件失败')
        reader.readAsDataURL(file)
      }

      const load = async (query, tagf) => {
        setBusy(true)
        try {
          const res = await apiGet({ q: query || '', tag: tagf || '' })
          if (res && res.ok) {
            setMemes(memeSortNewestFirst(res.memes || []))
            setTags(res.tags)
            setTotal(res.total)
            if (Array.isArray(res.packs)) setPacks(previous => previous.map(p => ({ ...p, count: (res.packs.find(next => next.id === p.id) || p).count })))
            setNotice('')
          } else {
            setNotice('加载失败' + (res && res.error ? ': ' + res.error : ''))
          }
        } catch (error) {
          setNotice('加载失败: ' + (error && error.message ? error.message : String(error)))
        }
        setBusy(false)
      }
      React.useEffect(() => { load('', '') }, [])

      const onDeleteTag = (tagArg) => {
        const tag = tagArg || (upTag === '__new__' ? '' : String(upTag || '').trim())
        if (!tag) return
        setConfirmBox({
          title: '删除分类',
          lines: [
            '确认删除分类「' + tagZh(tag) + ' (' + tag + ')」？',
            '这个分类下的表情包会一起删掉，不可恢复。',
          ],
          confirmLabel: '删除分类',
          onConfirm: () => doDeleteTag(tag),
        })
      }
      const doDeleteTag = async (tag) => {
        try {
          const res = await apiPost({ op: 'deleteTag', tag })
          setNotice(res && res.ok ? '已删除分类,共 ' + (res.deleted || 0) + ' 张' : '删除失败: ' + (res && res.error || ''))
          setUpTag('')
          setUpNewTag('')
          await load(q, tagFilter === tag ? '' : tagFilter)
        } catch (error) {
          setNotice('删除失败: ' + (error && error.message ? error.message : String(error)))
        }
      }

      const onPickFile = (ev) => {
        const file = ev.target.files && ev.target.files[0]
        ev.target.value = ''
        if (!file) return
        if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
          setNotice('仅支持 jpg/png/gif/webp')
          return
        }
        setUpFile(file)
        setUpPreview(URL.createObjectURL(file))
        // 换图后清掉上一张的识别结果,避免误存错标签
        setUpTag('')
        setUpCaption('')
        setUpKeywords('')
        const reader = new FileReader()
        reader.onload = () => setUpData64(String(reader.result || '').split(',')[1] || '')
        reader.readAsDataURL(file)
      }

      // AI 识别:上传前先让模型看图,自动填分类/描述/关键词;失败不阻塞手动填写
      const onRecognize = async () => {
        if (!upFile) { setNotice('先选择图片'); return }
        if (!upData64) { setNotice('图片还没读好,稍等片刻再试'); return }
        setRecognizing(true)
        try {
          const res = await apiPost({ op: 'recognize', fileName: upFile.name, dataBase64: upData64 })
          if (res && res.ok) {
            setUpTag(res.tag || '')
            setUpCaption(res.caption || '')
            setUpKeywords(res.keywords || '')
            setNotice('AI 已识别: [' + (res.tag || '?') + '] ' + (res.caption || ''))
          } else {
            setNotice('AI 识别失败: ' + (res && res.error || '未知错误'))
          }
        } catch (error) {
          setNotice('AI 识别失败: ' + (error && error.message ? error.message : String(error)))
        }
        setRecognizing(false)
      }

      const onConfirmUpload = async () => {
        const file = upFile
        if (!file) { setNotice('先选择图片文件'); return }
        const tag = upTag === '__new__' ? String(upNewTag || '').trim().toLowerCase() : String(upTag || '').trim()
        if (!tag) { setNotice('先选择或填写分类'); return }
        if (!/^[a-z0-9_-]+$/.test(tag)) { setNotice('分类只能是小写字母/数字/-/_'); return }
        setUploading(true)
        const reader = new FileReader()
        reader.onload = async () => {
          const data = String(reader.result || '').split(',')[1] || ''
          try {
            const res = await apiPost({
              op: 'upload',
              tag,
              caption: String(upCaption || '').trim(),
              keywords: String(upKeywords || '').trim(),
              fileName: file.name,
              dataBase64: data,
            })
            setNotice(res && res.ok && res.meme ? '已上传: ' + res.meme.path : '上传失败: ' + (res && res.error || ''))
            if (res && res.ok) {
              setUploadOpen(false)
              setUpFile(null)
              setUpPreview('')
              setUpTag('')
              setUpNewTag('')
              setUpCaption('')
              setUpKeywords('')
              await load(q, tagFilter)
            }
          } catch (error) {
            setNotice('上传失败: ' + (error && error.message ? error.message : String(error)))
          }
          setUploading(false)
        }
        reader.onerror = () => { setUploading(false); setNotice('读取文件失败') }
        reader.readAsDataURL(file)
      }

      const onSaveEdit = async () => {
        if (!edit) return
        try {
          const tag = edit.tag === '__new__' ? String(edit.newTag || '').trim().toLowerCase() : String(edit.tag || '').trim().toLowerCase()
          const res = await apiPost({
            op: 'update',
            path: edit.path,
            tag,
            caption: String(edit.caption || ''),
            keywords: String(edit.keywords || ''),
          })
          setNotice(res && res.ok ? '已保存' : '保存失败: ' + (res && res.error || ''))
          setEdit(null)
          await load(q, tagFilter)
        } catch (error) {
          setNotice('保存失败: ' + (error && error.message ? error.message : String(error)))
        }
      }

      const onDelete = (m) => {
        setConfirmBox({
          title: '删除表情包',
          lines: ['确认删除这张表情包？', m.path, '不可恢复。'],
          confirmLabel: '删除',
          onConfirm: () => doDelete(m),
        })
      }
      const doDelete = async (m) => {
        try {
          const res = await apiPost({ op: 'delete', path: m.path })
          if (res && res.ok) {
            // [patch-dsh-meme-window] 删一张就走全量 load() 的话，整库的行和缩略图会一起重来一遍
            // （本机实测拉满 979 张 ≈141MB / 5.6 秒随机读），删完那几秒整机卡就是这么来的。这里只摘掉这一格。
            setMemes((rows) => rows.filter((x) => x.path !== m.path))
            setTotal((n) => Math.max(0, (Number(n) || 0) - 1))
            setNotice('已删除')
          } else {
            setNotice('删除失败: ' + (res && res.error || ''))
            await load(q, tagFilter)
          }
        } catch (error) {
          setNotice('删除失败: ' + (error && error.message ? error.message : String(error)))
          await load(q, tagFilter)
        }
      }

      const searchInput = h('input', {
        type: 'text',
        placeholder: '搜索描述/关键词',
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => { if (e.key === 'Enter') load(q, tagFilter) },
        style: { width: 180 },
      })
      const tagSelect = h('select', {
        value: tagFilter,
        onChange: (e) => { setTagFilter(e.target.value); load(q, e.target.value) },
      }, [
        h('option', { key: '', value: '' }, '全部分类'),
        tags.map((t) => h('option', { key: t, value: t }, tagZh(t) + ' (' + t + ')')),
      ])

      const fileInput = h('input', {
        ref: fileRef,
        type: 'file',
        accept: 'image/*',
        style: { display: 'none' },
        onChange: onPickFile,
      })

      const curPack = packs.find((p) => p.id === packId) || null
      const cards = memes.map((m) => h('div', { key: m.path, className: 'meme-card' },
        // 用背景层而不是 <img>:宿主对 img 的全局样式会把图挤到左边(封面那次踩过)
        h('div', { className: 'meme-thumb', ref: (el) => { if (el) memeLazyBg(el, m.url) }, 'data-meme-src': m.url, 'data-meme-cap': m.caption || m.file_name }),
        h('div', { className: 'meta' },
          h('div', { className: 'tag' }, tagZh(m.tag)),
          h('div', { className: 'cap' }, m.caption || m.file_name),
          h('div', { className: 'acts' },
            h('button', { onClick: () => setEdit({ path: m.path, tag: m.tag, caption: m.caption || '', keywords: m.keywords || '' }) }, '编辑'),
            h('button', { className: 'danger', onClick: () => onDelete(m) }, '删除'),
          ),
        ),
      ))

      // 市场卡片:发现 = 目录条目;图库页 = 已安装图库(订阅记录 + 扫描到的本地图库)。搜索按 空格分词 全命中。
      const mkQuery = remoteQuery.trim().toLowerCase()
      const mkMatch = (hay) => !mkQuery || mkQuery.split(/\s+/).filter(Boolean).every((t) => hay.includes(t))
      const jobFor = (pid) => Object.values(remoteJobs).find((j) => j.packId === pid && j.state === 'running')
      const discoverCards = (() => {
        const cards = []
        for (const entry of (remoteDir || [])) {
          const pid = entry.id || ''
          const sub = remoteSubs.find((s) => s.id === pid)
            || remoteSubs.find((s) => s.url && s.url === entry.manifestUrl)
            || remoteSubs.find((s) => s.archiveUrl && s.archiveUrl === entry.archiveUrl)
            || null
          const keywords = Array.isArray(entry.keywords) ? entry.keywords : (Array.isArray(entry.tags) ? entry.tags : [])
          const author = entry.author || entry.maintainer || ''
          const hay = ((entry.name || '') + ' ' + author + ' ' + (entry.description || '') + ' ' + keywords.join(' ') + ' ' + pid).toLowerCase()
          if (!mkMatch(hay)) continue
          const local = pid ? packs.find((p) => p.id === pid) : null
          const downloaded = !!(pid && local)
          cards.push({
            key: 'dir-' + (pid || entry.manifestUrl || entry.archiveUrl), packId: pid,
            name: entry.name || pid, desc: entry.description || '',
            // 装过的用本地封面,没装的才用目录里的远程预览图
            cover: (downloaded && local.cover) ? local.cover : (entry.preview || (entry.previews || [])[0] || null),
            meta: [
              author,
              entry.version ? 'v' + String(entry.version).replace(/^v/i, '') : '',
              entry.count ? entry.count + ' 张' : '',
              entry.downloads ? '↓ ' + fmtCount(entry.downloads) : '',
            ].filter(Boolean).join(' · '),
            tags: keywords, entry, sub,
            installed: !!sub || downloaded,
            job: jobFor(pid),
            downloaded,
            downloads: Number(entry.downloads) || 0,
          })
        }
        // 默认按下载量排序;没有下载量的(清单热链的包、或额度/网络拉不到)排最后,
        // 同分保持目录原顺序(Array#sort 稳定)
        cards.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        return cards
      })()
      // 已安装:本地扫描到的图库(含内置/导入/自定义 + 下载的远程包)在前,订阅了但没扫到的追加在后
      const libraryCards = (() => {
        const cards = []
        for (const c of localPackCards) {
          const hay = ((c.name || '') + ' ' + c.packId + ' ' + (c.tags || []).join(' ') + ' ' + c.meta).toLowerCase()
          if (mkMatch(hay)) cards.push(c)
        }
        const seen = new Set(cards.map((c) => c.packId))
        for (const s of remoteSubs) {
          if (seen.has(s.id)) continue
          const hay = ((s.name || '') + ' ' + s.id + ' ' + (s.url || s.archiveUrl || '')).toLowerCase()
          if (!mkMatch(hay)) continue
          cards.push({
            key: 'sub-' + s.id, packId: s.id,
            name: s.name || s.id, desc: s.url || s.archiveUrl, cover: null,
            meta: ['未下载', s.version, s.total ? s.total + ' 张' : ''].filter(Boolean).join(' · '),
            tags: [], entry: null, sub: s,
            installed: true, job: jobFor(s.id),
            downloaded: false,
          })
        }
        return cards
      })()

      // 市场/图库共用的卡片:封面 + 名称 + 徽标 + meta + 标签 + 进度 + 操作
      const packCard = (row, acts, onOpen) => {
        const job = row.job
        const pct = job && job.total ? Math.round(((job.done + job.failed) / job.total) * 100) : 0
        return h('div', {
          key: row.key,
          className: 'mk-card' + (onOpen ? ' mk-card-open' : ''),
          // 整卡可点 = 打开预览;卡片内的按钮自己 stopPropagation,不会误触发
          ...(onOpen ? { onClick: () => onOpen(row), title: '点击打开' } : {}),
        },
          // 封面用背景图而不是 <img>:尺寸完全由我们这层样式决定,不受宿主对 img 的
          // 全局样式影响(之前实测在宿主里图片没铺满,露出一块空底色很难看)
          // 首字母始终是子节点:背景图正常时不透明看不见,加载失败(远程 404/断网)时就露出来,
          // 不会只留一块空白让人以为坏了 —— 之前 catalog 里漏了扩展名就是这个症状
          row.cover
            ? h('div', { className: 'mk-cover' },
              (row.name || '?').slice(0, 1),
              // 图片单独一层盖在首字母上面:加载成功(不透明)就看不见字,404/断网时露出来,
              // 不会只留一块空白让人以为坏了 —— catalog 里漏扩展名那次就是这个症状
              h('div', {
                className: 'mk-cover-img',
                style: {
                  backgroundImage: 'url("' + coverUrl(row.cover) + '")',
                  backgroundSize: 'cover', backgroundPosition: 'center 28%', backgroundRepeat: 'no-repeat',
                },
              }))
            : h('div', { className: 'mk-cover mk-cover-fallback' }, (row.name || '?').slice(0, 1)),
          h('div', { className: 'mk-body' },
            h('div', { className: 'mk-title' },
              h('span', { className: 'mk-name', title: row.name }, row.name),
              // 开关:打开后模型可以用这个图库发图(可以同时开多个)
              row.onToggle
                ? h('span', {
                  className: 'switch' + (row.enabled ? ' on' : ''),
                  title: row.enabled ? '模型正在使用这个图库,点击关闭' : '点击打开:模型可以用这个图库发图',
                  // 开关自己吞掉点击:卡片整张可点(进表情包页 / 开预览),别误触发
                  onClick: (e) => { e.stopPropagation(); row.onToggle(!row.enabled) },
                })
                : null,
            ),
            row.meta ? h('div', { className: 'mk-meta', title: row.meta }, row.meta) : null,
            row.desc ? h('div', { className: 'mk-desc', title: row.desc }, row.desc) : null,
            row.tags && row.tags.length
              ? h('div', { className: 'mk-chips' }, row.tags.slice(0, 4).map((t) => h('span', { key: t, className: 'mk-chip' }, t)))
              : null,
            job ? h('div', { className: 'mk-progress-wrap' },
              h('div', { className: 'mk-progress' },
                // total 为 0 = 上游没给 content-length:画不确定进度条,别假装 100%
                job.total
                  ? h('div', { className: 'mk-progress-bar', style: { width: pct + '%' } })
                  : h('div', { className: 'mk-progress-bar mk-progress-unknown' })),
              h('span', { className: 'mk-progress-text' }, (job.message || '下载中…') + (job.total ? ' ' + pct + '%' : '')),
            ) : null,
            h('div', { className: 'mk-acts', onClick: (e) => e.stopPropagation() }, acts),
          ),
        )
      }
      // 更新:有订阅走订阅,否则回落到目录条目;没下载过就是「安装」
      const updateBtn = (row) => h('button', {
        key: 'update',
        onClick: row.sub
          ? () => (row.sub.archiveUrl ? startArchive(row.sub) : startRemote(row.sub.url, row.sub.id))
          : () => (row.entry.archiveUrl ? startArchive(row.entry) : startRemote(row.entry.manifestUrl, row.entry.id || '')),
        disabled: remoteBusy || !!row.job,
      }, row.downloaded ? '更新' : '安装')
      return h('div', { className: 'meme-panel' },
        h('div', { className: 'mk-tabs', style: { width: '100%', marginBottom: 2 } },
          h('button', { className: 'mk-tab' + (panelTab === 'library' ? ' on' : ''), onClick: () => setPanelTab('library') }, '图库' + (packs.length ? ' (' + packs.length + ')' : '')),
          h('button', { className: 'mk-tab' + (panelTab === 'market' ? ' on' : ''), onClick: () => { setRootNotice(''); setPanelTab('market') } }, '发现'),
          h('button', { className: 'mk-tab' + (panelTab === 'settings' ? ' on' : ''), onClick: () => setPanelTab('settings') }, '设置'),
        ),
        // 图库页两态:已安装图库列表 ⇄ 某个图库的表情包页(二级页面,不是二级标签)
        panelTab === 'library' ? (packView
          ? h(React.Fragment, null,
            h('div', { className: 'row', style: { width: '100%' } },
              h('button', { onClick: () => { setPackView(''); setRootNotice('') } }, '← 图库列表'),
              h('span', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } },
                (curPack ? curPack.name : packView) + ' · ' + total + ' 张'),
            ),
            memeRoot ? h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', wordBreak: 'break-all' } }, memeRoot) : null,
            h('div', { className: 'row' },
              searchInput,
              h('button', { className: 'btn-primary', onClick: () => setUploadOpen(true) }, '上传表情包'),
              tagSelect,
              h('button', { onClick: () => load(q, tagFilter), disabled: busy }, '搜索'),
            ),
            notice ? h('div', { className: 'notice' }, notice) : null,
            memes.length === 0 && !busy
              ? h('div', { className: 'empty' }, '没有匹配的表情包')
              : h('div', { className: 'meme-grid' }, cards),
          )
          : h(React.Fragment, null,
            h('div', { className: 'row', style: { width: '100%' } },
              h('button', { className: 'btn-primary', disabled: packSaving, onClick: () => { setPackDraft({ id: 'pack-' + Date.now().toString(36), name: '', description: '' }); setPackTouched({}); setPackDialog('create') } }, '新建图包库'),
              h('button', { disabled: uploading, onClick: () => importFileRef.current && importFileRef.current.click() }, '导入图库'),
            ),
            h('input', { ref: importFileRef, type: 'file', accept: '.zip,application/zip', style: { display: 'none' }, onChange: onImportPack }),
            libraryCards.length === 0
              ? h('div', { className: 'empty' }, '还没有图库')
              : h('div', { className: 'mk-grid' }, libraryCards.map((row) => packCard(row, [
                row.downloaded
                  ? h('button', { key: 'export', onClick: () => onExportPack(row.packId, row.name) }, '导出')
                  : null,
                row.packId === packId && curPack && curPack.count > 0
                  ? h('button', { key: 'submit', disabled: packSaving, onClick: () => { setRootNotice(''); setPackDialog('submit') } }, '投稿')
                  : null,
                // 没下载的给「安装」,下载了且真有新版本才给「更新」
                (!row.downloaded || row.hasUpdate) ? updateBtn(row) : null,
                // 删除是唯一入口:内置、市场下载、自建/导入都走它(服务端也只留这一个 op)
                row.downloaded
                  ? h('button', { key: 'delete', className: 'mk-danger', disabled: packSaving, onClick: () => onDeletePackPrompt(row) }, '删除')
                  : null,
              ].filter(Boolean), () => onEditPack(row.packId)))),
          )
        ) : null,
        // 编辑弹窗
        edit ? h('div', { className: 'meme-modal-mask', onClick: () => setEdit(null) },
          h('div', { className: 'meme-modal', onClick: (e) => e.stopPropagation() },
            h('h3', null, '编辑表情包'),
            h('div', {
              className: 'meme-shot',
              style: { backgroundImage: 'url("' + (memes.find((m) => m.path === edit.path)?.url || '') + '")' },
            }),
            h('div', { className: 'field' },
              h('label', null, '分类'),
              h('div', { className: 'row', style: { width: '100%' } },
                h('select', { value: edit.tag, onChange: (e) => setEdit({ ...edit, tag: e.target.value }), style: { flex: 1 } },
                  (tags.includes(edit.tag) ? tags : [edit.tag, ...tags]).map((t) => h('option', { key: t, value: t }, tagZh(t) + ' (' + t + ')')),
                  h('option', { value: '__new__' }, '+ 新建分类'),
                ),
                h('button', { onClick: () => onDeleteTag(edit.tag), disabled: !edit.tag || edit.tag === '__new__', title: '删除该分类及其中所有表情包' }, '删除分类'),
              ),
              edit.tag === '__new__'
                ? h('input', { type: 'text', value: edit.newTag || '', placeholder: '新分类名,小写字母/数字/-/_', onChange: (e) => setEdit({ ...edit, newTag: e.target.value }), style: { width: '100%' } })
                : null,
            ),
            h('div', { className: 'field' },
              h('label', null, '描述'),
              h('textarea', { value: edit.caption, placeholder: '如:无语', rows: 2, onChange: (e) => setEdit({ ...edit, caption: e.target.value }) }),
            ),
            h('div', { className: 'field' },
              h('label', null, '关键词(空格分隔)'),
              h('input', { type: 'text', value: edit.keywords, placeholder: '搜索用', onChange: (e) => setEdit({ ...edit, keywords: e.target.value }) }),
            ),
            h('div', { className: 'modal-acts' },
              h('button', { onClick: () => setEdit(null) }, '取消'),
              h('button', { className: 'btn-primary', onClick: onSaveEdit }, '保存'),
            ),
          ),
        ) : null,
        // 上传弹窗
        uploadOpen ? h('div', { className: 'meme-modal-mask', onClick: () => setUploadOpen(false) },
          h('div', { className: 'meme-modal', onClick: (e) => e.stopPropagation() },
            h('h3', null, '上传表情包'),
            upFile
              ? h('div', {
                className: 'meme-shot',
                style: { backgroundImage: 'url("' + upPreview + '")' },
                title: upFile.name,
              })
              : h('div', { className: 'empty', style: { padding: '24px', border: '1px dashed var(--dsw-alias-border-l1)', borderRadius: 8 } },
                  h('button', { onClick: () => fileRef.current && fileRef.current.click() }, '选择图片'),
                ),

            h('div', { className: 'field' },
              h('label', null, upFile ? '已选: ' + upFile.name + ' (点击更换)' : '文件'),
              h('input', { type: 'text', placeholder: upFile ? '' : '先选图片', value: '', readOnly: true, style: { display: 'none' } }),
            ),
            // AI 识别:选图后一键自动填分类/描述/关键词,识别失败不阻塞手动填写
            upFile ? h('div', { className: 'row', style: { width: '100%' } },
              h('button', { className: 'btn-primary', onClick: onRecognize, disabled: recognizing }, recognizing ? 'AI 识别中…' : 'AI 识别'),
            ) : null,
            h('div', { className: 'field' },
              h('label', null, '分类(必填)'),
              h('div', { className: 'row', style: { width: '100%' } },
                h('select', { value: upTag, onChange: (e) => setUpTag(e.target.value), style: { flex: 1 } },
                  h('option', { value: '' }, '选择分类'),
                  tags.map((t) => h('option', { key: t, value: t }, tagZh(t) + ' (' + t + ')')),
                  h('option', { value: '__new__' }, '+ 新建分类'),
                ),
                h('button', { onClick: onDeleteTag, disabled: !upTag || upTag === '__new__', title: '删除该分类及其中所有表情包' }, '删除分类'),
              ),
              upTag === '__new__'
                ? h('input', { type: 'text', value: upNewTag, placeholder: '新分类名,小写字母/数字/-/_', onChange: (e) => setUpNewTag(e.target.value), style: { width: '100%' } })
                : null,
            ),
            h('div', { className: 'field' },
              h('label', null, '描述'),
              h('textarea', { value: upCaption, placeholder: '如:无语', rows: 2, onChange: (e) => setUpCaption(e.target.value) }),
            ),
            h('div', { className: 'field' },
              h('label', null, '关键词(空格分隔)'),
              h('input', { type: 'text', value: upKeywords, placeholder: '搜索用', onChange: (e) => setUpKeywords(e.target.value) }),
            ),
            h('div', { className: 'modal-acts' },
              h('button', { onClick: () => setUploadOpen(false) }, '取消'),
              h('button', { className: 'btn-primary', onClick: onConfirmUpload, disabled: uploading }, uploading ? '上传中…' : '上传'),
            ),
          ),
        ) : null,
        fileInput,
        panelTab === 'market' ? h(React.Fragment, null,
        h('div', { className: 'row', style: { width: '100%' } },
          h('input', {
            type: 'text', value: remoteQuery, onChange: (e) => setRemoteQuery(e.target.value),
            placeholder: '搜索图库…', style: { flex: 1, minWidth: 160 },
          }),
        ),
        discoverCards.length === 0
          ? h('div', { className: 'mk-empty' },
              mkQuery
                ? '没有匹配的图库'
                : (remoteDir === null
                    ? h(React.Fragment, null,
                        h('div', null, '图库目录暂不可用(检查网络或稍后重试)'),
                        h('div', { style: { fontSize: 11, marginTop: 4, color: 'var(--dsw-alias-label-secondary)' } },
                          '插件会按顺序试多个目录源;外网节点偶尔抽风,重拉一次通常就好。'),
                        h('button', {
                          style: { marginTop: 8 },
                          onClick: () => {
                            apiGet({ remoteDir: 1 })
                              .then((res) => { if (res && res.ok) setRemoteDir(Array.isArray(res.remoteDir) ? res.remoteDir : null) })
                              .catch(() => {})
                          },
                        }, '重新拉取目录'))
                    : h(React.Fragment, null,
                        // [patch-dsh-gengtu-nomarket] 没配目录源(默认就是空的)时的空态:
                        // 说清"这里只列目录里的包",并给出去处,别让人以为插件坏了
                        h('div', null, '还没有可用的图库目录'),
                        h('div', { style: { fontSize: 11, marginTop: 4, color: 'var(--dsw-alias-label-secondary)' } },
                          '这里只列「图库目录」里的包。想装自己的图库:去「图库」页点「导入图库」选 ZIP,或在「设置」里填扫描目录。'),
                      )))
          : h('div', { className: 'mk-grid' }, discoverCards.map((row) => packCard(row, [
            // 发现页只负责装:装过的这里不给按钮,更新去图库页(有新版本才显示)
            row.downloaded ? null : h('button', {
              key: 'install',
              className: 'btn-primary',
              onClick: () => row.entry.archiveUrl
                ? startArchive(row.entry)
                : startRemote(row.entry.manifestUrl, row.entry.id || ''),
              disabled: remoteBusy || !!row.job,
            }, row.job ? '下载中…' : '安装'),
          ].filter(Boolean), () => openPreview(row)))),

        ) : null,
        panelTab === 'settings' ? h(React.Fragment, null,
        promptOpen ? h('div', { className: 'meme-modal-mask', onClick: () => setPromptOpen(false) },
          h('div', { className: 'meme-modal', style: { width: 460 }, onClick: (e) => e.stopPropagation() },
            h('h3', null, '陪伴提示词(注入模型)'),
            h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
              '在默认提示词基础上修改,保存后下一条消息生效;留空 = 使用内置默认。'),
            h('textarea', {
              value: promptDraft,
              onChange: (e) => setPromptDraft(e.target.value),
              rows: 7,
              style: { boxSizing: 'border-box', width: '100%', minHeight: 140, fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6, background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 8, padding: 8 },
            }),
            h('div', { className: 'modal-acts' },
              h('button', { onClick: () => { setPromptDraft(defaultPrompt); setRootNotice('已重置为默认,点击保存生效') } }, '恢复默认'),
              h('button', { onClick: () => setPromptOpen(false) }, '取消'),
              h('button', { className: 'btn-primary', onClick: onSaveCompanionPrompt }, '保存'),
            ),
          ),
        ) : null,
        // 底部:扫描目录 / 提示词(导入导出在图库页)
        h('div', { className: 'section-title' }, '扫描目录'),
        h('div', { className: 'row', style: { width: '100%' } },
          h('input', { type: 'text', value: packsDirInput, onChange: (e) => setPacksDirInput(e.target.value), placeholder: '自动扫描含 index.db 的子文件夹', style: { flex: 1, minWidth: 160 } }),
          h('button', { onClick: () => onPickDir() }, '选择目录'),
          h('button', { className: 'btn-primary', onClick: () => onSavePacksDir() }, '保存'),
        ),
        h('div', { className: 'section-title' }, '图库目录（「发现」页列什么）'), // [patch-dsh-gengtu-remotedir-ui]
        h('div', { className: 'row', style: { width: '100%' } },
          h('input', {
            type: 'text', value: remoteDirInput,
            onChange: (e) => setRemoteDirInput(e.target.value),
            placeholder: '目录 JSON 地址,多个用逗号/换行分隔;留空 = 不挂任何目录',
            style: { flex: 1, minWidth: 160 },
          }),
          h('button', { className: 'btn-primary', onClick: () => onSaveRemoteDir() }, '保存'),
        ),
        h('div', { style: { fontSize: 11, marginTop: 4, color: 'var(--dsw-alias-label-secondary)' } },
          '填自己的静态目录地址就能让别人在「发现」页一键装你的图库(格式见 docs/remote-pack-spec.md);留空则「发现」页没有内容。'),
        h('div', { className: 'section-title' }, '陪伴提示词'),
        h('div', { className: 'row' },
          h('span', {
            className: 'switch' + (promptOn ? ' on' : ''),
            title: promptOn ? '点击关闭:模型不再主动斗图' : '点击开启:模型主动斗图',
            onClick: () => onTogglePrompt(!promptOn),
          }),
          h('span', { style: { fontSize: 12 } }, promptOn ? '已开启' : '已关闭'),
          h('button', { onClick: () => { setPromptDraft(companionPrompt || defaultPrompt); setPromptOpen(true) } }, '编辑提示词'),
          h('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
            companionPrompt ? '已自定义' : '使用默认'),
        ),

        ) : null,
        rootNotice ? h('div', { className: 'notice' }, rootNotice) : null,
        marketResult ? h('a', { href: marketResult, target: '_blank', rel: 'noopener noreferrer' }, '打开 GitHub 投稿页') : null,
        // 页脚:求 star + 反馈入口
        h('div', { className: 'meme-footer' },
          h('span', null, '觉得好用？'),
          h('a', { href: 'https://github.com/Py97530/dsh-gengtu', target: '_blank', rel: 'noopener noreferrer' }, '⭐ 去 GitHub 点个 Star'),
          h('span', null, '·'),
          h('a', {
            href: issueFormUrl(pluginVersion),
            target: '_blank', rel: 'noopener noreferrer',
          }, '💬 反馈建议 / 提 issue'),
        ),
        packDialog ? h('div', { className: 'meme-modal-mask', onClick: () => { if (!packSaving) setPackDialog('') } },
          h('div', {
            className: 'meme-modal',
            style: { width: packDialog === 'create' ? 400 : 440 },
            onClick: (e) => e.stopPropagation(),
          },
            h('div', { className: 'meme-modal-head' },
              h('h3', null, packDialog === 'create' ? '新建图包库' : '投稿到市场'),
              h('button', {
                className: 'meme-x', title: '关闭', 'aria-label': '关闭', disabled: packSaving,
                onClick: () => setPackDialog(''),
              }, '×'),
            ),
            rootNotice ? h('div', { className: 'notice', role: 'status' }, rootNotice) : null,
            packDialog === 'create' ? h(React.Fragment, null,
              h('div', { className: 'field' + (packBad('name') ? ' bad' : '') },
                h('label', null, '图库名称'),
                h('input', {
                  type: 'text', value: packDraft.name, maxLength: 60, autoFocus: true,
                  placeholder: '如：大肥鱼、官方表情包1号', disabled: packSaving,
                  onChange: (e) => { setPackTouched({ ...packTouched, name: true }); setPackDraft({ ...packDraft, name: e.target.value }) },
                  onKeyDown: packSubmitOnEnter,
                }),
                packBad('name') ? h('div', { className: 'hint' }, '起个名字——图库列表和模型都用它认这套图') : null,
              ),
              h('div', { className: 'field' + (packBad('id') ? ' bad' : '') },
                h('label', null, '图库 ID'),
                h('input', {
                  type: 'text', value: packDraft.id, maxLength: 40, disabled: packSaving,
                  placeholder: '如：my-cat-pack',
                  onChange: (e) => { setPackTouched({ ...packTouched, id: true }); setPackDraft({ ...packDraft, id: e.target.value }) },
                  onKeyDown: packSubmitOnEnter,
                }),
                h('div', { className: 'hint' }, packBad('id')
                  ? '只能用小写字母、数字、- 和 _，首字符不能是 - 或 _（1–40 位）'
                  : '图库就装在这个文件夹名下；以后分享给别人时保持 ID 不变'),
              ),
              h('div', { className: 'field' },
                h('label', null, '简介 / 图片来源（可选）'),
                h('textarea', {
                  value: packDraft.description, rows: 2, maxLength: 200, disabled: packSaving,
                  placeholder: '如：图是谁画的、来自哪个仓库、什么许可',
                  onChange: (e) => setPackDraft({ ...packDraft, description: e.target.value }),
                }),
              ),
            ) : h(React.Fragment, null,
              h('p', null, '自动导出当前图库 ZIP，并打开预填好的 GitHub 投稿页。'),
              h('p', null, '登录 GitHub 后，将下载的 ZIP 拖入“图库 ZIP”一栏，补充图片来源和许可，再提交。审核通过后收录到市场。'),
            ),
            h('div', { className: 'modal-acts' },
              h('button', { disabled: packSaving, onClick: () => setPackDialog('') }, '取消'),
              h('button', {
                className: 'btn-primary',
                disabled: packSaving || (packDialog === 'create' && !packDraftOk),
                title: packDialog === 'create' && !packDraftOk ? '先填图库名称和合法的图库 ID' : undefined,
                onClick: packDialog === 'create' ? savePack : submitPack,
              }, packSaving ? '处理中…' : packDialog === 'create' ? '创建并切换' : '导出 ZIP 并打开投稿页'),
            ),
          ),
        ) : null,
        // 图库预览弹窗:点卡片打开
        previewPack ? h('div', { className: 'meme-modal-mask', onClick: () => setPreviewPack(null) },
          h('div', {
            className: 'meme-modal', style: { width: 560, maxHeight: '82vh', overflow: 'auto' },
            onClick: (e) => e.stopPropagation(),
          },
            h('div', { className: 'meme-modal-head' },
              h('h3', null, previewPack.name),
              h('button', {
                className: 'meme-x', title: '关闭', 'aria-label': '关闭',
                onClick: () => setPreviewPack(null),
              }, '×'),
            ),
            previewPack.meta ? h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } }, previewPack.meta) : null,
            previewPack.desc ? h('p', { style: { margin: 0, fontSize: 12 } }, previewPack.desc) : null,
            previewPack.tags.length
              ? h('div', { className: 'mk-chips' }, previewPack.tags.map((t) => h('span', { key: t, className: 'mk-chip' }, t)))
              : null,
            previewPack.loading ? h('div', { className: 'notice' }, '正在读取图库图片…') : null,
            previewPack.images.length
              ? h('div', { className: 'mk-preview' }, previewPack.images.map((u, i) => h('a', {
                key: u + '#' + i, href: coverUrl(u), target: '_blank', rel: 'noopener noreferrer', title: '点开原图',
                style: { backgroundImage: 'url("' + coverUrl(u) + '")' },
              })))
              : (previewPack.loading ? null : h('div', { className: 'empty' }, '这个图库没有提供预览图')),
            previewPack.images.length && previewPack.total > previewPack.images.length
              ? h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
                previewPack.fromPack
                  ? '共 ' + previewPack.total + ' 张，这里显示前 ' + previewPack.images.length + ' 张'
                  : '目录里提供 ' + previewPack.images.length + ' 张预览；这个图库共 ' + previewPack.total + ' 张，安装后可以看全部')
              : null,
          ),
        ) : null,
        // 应用内确认弹窗(原生 confirm 在桌面壳里观感不一致)
        confirmBox ? h('div', { className: 'meme-modal-mask', onClick: () => setConfirmBox(null) },
          h('div', { className: 'meme-modal', onClick: (e) => e.stopPropagation() },
            h('h3', null, confirmBox.title),
            (confirmBox.lines || []).map((line, i) => h('p', { key: i }, line)),
            h('div', { className: 'row', style: { marginTop: 16 } },
              h('button', {
                className: 'btn-primary',
                onClick: () => { const run = confirmBox.onConfirm; setConfirmBox(null); if (run) run() },
              }, confirmBox.confirmLabel || '确认'),
              h('button', { onClick: () => setConfirmBox(null) }, '取消'),
            ),
          ),
        ) : null,
        // 目录浏览弹窗(WSL 无原生选择器,用 browse 能力前端浏览)
        browseOpen && browseList ? h('div', { className: 'meme-modal-mask', onClick: () => setBrowseOpen(false) },
          h('div', { className: 'meme-modal', style: { width: 420 }, onClick: (e) => e.stopPropagation() },
            h('h3', null, '选择表情包目录'),
            h('div', { className: 'total', style: { wordBreak: 'break-all' } }, browseList.path),
            h('div', { className: 'row', style: { flexWrap: 'wrap', gap: 4 } },
              h('button', {
                onClick: () => { if (browseList.parent) browseTo(browseList.parent) },
                disabled: !browseList.parent,
                style: { padding: '3px 8px', fontSize: 12 },
              }, '⬆ 上一级'),
              (browseList.breadcrumbs || []).map((c, i) =>
                h('button', { key: c.path, onClick: () => browseTo(c.path), style: { padding: '3px 8px', fontSize: 12 } },
                  (i === 0 ? '🏠 ' : '') + c.name)),
            ),
            h('div', { style: { height: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 8, padding: 4 } },
              (browseList.entries || []).length === 0
                ? h('div', { className: 'empty' }, '(空目录)')
                : (browseList.entries || []).map((e) =>
                    h('button', { key: e.path, onClick: () => browseTo(e.path), style: { textAlign: 'left', padding: '5px 10px', fontSize: 13 } },
                      '📁 ' + e.name)),
            ),
            browseErr ? h('div', { className: 'notice' }, browseErr) : null,
            h('div', { className: 'modal-acts' },
              h('button', { onClick: () => setBrowseOpen(false) }, '取消'),
              h('button', { className: 'btn-primary', onClick: () => {
                onSavePacksDir(browseList.path)
                setBrowseOpen(false)
              } }, '使用此目录'),
            ),
          ),
        ) : null,
      )
    }

    // ---- 输入框快捷发图(QQ 式):😊 按钮 + 悬浮面板 ----
    const memePickerCSS = [
      '.meme-trigger{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-secondary);background:transparent;border:none;line-height:1;outline:none;transition:background .12s,color .12s}',
      '.meme-trigger:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.meme-trigger.active{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}',
      '.meme-picker{position:absolute;bottom:calc(100% + 8px);left:0;width:min(360px,90vw);z-index:30;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:flex;flex-direction:column;gap:10px;padding:12px;max-height:46vh;overflow:hidden;font-size:12px;color:var(--dsw-alias-label-primary)}',
      '.meme-picker .mp-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
      '.meme-picker .mp-tabs{display:flex;gap:4px;align-items:center;overflow-x:auto;max-width:100%;padding-bottom:2px}',
      '.meme-picker .mp-tag{padding:3px 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);cursor:pointer;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap;flex:none;transition:background .12s,color .12s,border-color .12s}',
      '.meme-picker .mp-tag:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}',
      '.meme-picker .mp-tag.on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-layer-1)}',
      '.meme-picker .mp-grid{overflow-y:auto;display:flex;flex-wrap:wrap;gap:8px;max-height:38vh;padding:2px}',
      '.meme-picker .mp-search{display:flex;gap:6px;align-items:center;margin:6px 0 2px}', // [patch-dsh-meme-search]
      '.meme-picker .mp-search-input{flex:1 1 auto;min-width:0;height:28px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:inherit;font-size:12px;outline:none}',
      '.meme-picker .mp-search-input:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.meme-picker .mp-count{font-size:11px;opacity:.6;white-space:nowrap}',
      '.meme-picker .mp-quick{display:flex;flex-wrap:wrap;gap:4px;margin:2px 0 6px}',
      '.meme-picker .mp-cell{width:76px;height:76px;flex:0 0 76px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;overflow:hidden;cursor:pointer;background:var(--dsw-alias-bg-layer-2);padding:0;display:block;transition:border-color .12s,transform .12s,box-shadow .12s}',
      '.meme-picker .mp-cell:hover{border-color:var(--dsw-alias-brand-primary);transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.15)}',
      // [patch-dsh-meme-seedpick] 种子库挑选模式:选中打勾 + 序号
      '.meme-picker .mp-cell.on{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px var(--dsw-alias-brand-primary) inset}',
      // [patch-dsh-meme-window] 无限滚动的哨兵行
      '.meme-picker .mp-more{flex:1 0 100%;text-align:center;padding:10px 0 4px;font-size:12px;color:var(--dsw-alias-text-3);user-select:none}',
      '.meme-picker .mp-pick{position:absolute;top:3px;right:3px;min-width:16px;height:16px;padding:0 4px;border-radius:9px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-layer-1);font-size:10px;line-height:16px;text-align:center;font-weight:600}',
      '.meme-picker .mp-seedbar{display:flex;align-items:center;gap:8px;padding:6px 2px 0;font-size:11px}',
      // [patch-dsh-meme-diag] 点图没反应时的现场取证行（正常工作时不会出现）
      '.meme-picker .mp-diag{display:block;margin:4px 0 0;padding:3px 6px;border-radius:5px;background:rgba(255,170,60,.16);color:#b26b00;font-size:11px;line-height:1.5;word-break:break-all}',
      '.meme-picker .mp-seedbar .mp-ok{color:var(--dsw-alias-brand-primary)}',
      '.meme-picker .mp-empty{color:var(--dsw-alias-label-secondary);text-align:center;padding:28px 0}',
      // [patch-dsh-meme-glass] 表情包弹层 = 与输入框同款玻璃背景板(配方抄 dsh-plugin-wallpaper-engine):
      // 底色读输入框令牌 --dsw-specific-input-major(= 壁纸引擎改写后的玻璃色),釉面/模糊/阴影读 --we-*;
      // 整段挂 body[data-we-glass-page] ⇒ 引擎没开时不动原样。
      'body[data-we-glass-page] .meme-picker{background-color:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-1));background-image:linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05) 38%,rgba(255,255,255,0.02));-webkit-backdrop-filter:blur(var(--we-blur,16px)) saturate(var(--we-saturate,1.8)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);backdrop-filter:blur(var(--we-blur,16px)) saturate(var(--we-saturate,1.8)) brightness(var(--we-glass-brightness,1.04)) contrast(1.01);box-shadow:inset 0 1px 0 rgba(255,255,255,var(--we-glass-highlight,0.32)),inset 0 -1px 0 rgba(255,255,255,0.08),inset 0 0 0 0.5px rgba(255,255,255,0.08),0 12px 40px rgba(0,0,0,var(--we-glass-shadow,0.12))}',
    ].join('')

    /**
     * 比较版本号:按 `.` `-` `+` 切段,纯数字段按数值比,长度不足补 0。
     * 非数字段退化成字符串比较;任一侧为空返回 0(无法判断 = 不算有更新)。
     * @returns {number} 1 / 0 / -1
     */
    function compareVersions(a, b) {
      const parts = (v) => String(v == null ? '' : v).trim().replace(/^v/i, '').split(/[.\-+]/).filter(Boolean)
      const pa = parts(a)
      const pb = parts(b)
      if (pa.length === 0 || pb.length === 0) return 0
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] || '0'
        const y = pb[i] || '0'
        const nx = /^\d+$/.test(x)
        const ny = /^\d+$/.test(y)
        if (nx && ny) {
          const d = Number(x) - Number(y)
          if (d !== 0) return d > 0 ? 1 : -1
          continue
        }
        // 一边数字一边非数字:非数字那段是预发布后缀(1.2.0-beta),比不带后缀的旧
        if (nx !== ny) return nx ? 1 : -1
        if (x !== y) return x > y ? 1 : -1
      }
      return 0
    }

    /**
     * 封面用背景图而不是 <img>:尺寸完全由我们这层样式决定,不受宿主对 img 的
     * 全局样式影响(实测在宿主里 <img> 没铺满卡片,露出一块空底色很难看)
     */
    function coverUrl(u) {
      const raw = String(u || '')
      const m = /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/.exec(raw)
      // 远端预览图优先走 jsDelivr 镜像(raw.githubusercontent 在部分网络下不稳)
      return m ? 'https://cdn.jsdelivr.net/gh/' + m[1] + '/' + m[2] + '@' + m[3] + '/' + m[4] : raw
    }

    /**
     * 反馈入口:直接打开仓库里的「反馈 / Bug」表单,尽量替用户填好能自动拿到的信息
     * (插件版本来自 payload;运行环境只有浏览器 UA 可读,dsh 版本得让用户补)。
     */
    function issueFormUrl(version) {
      const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
      const env = ua ? (/Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : '') + (/(Electron\/[\d.]+)/.exec(ua) ? ' · ' + /(Electron\/[\d.]+)/.exec(ua)[1] : '') : ''
      const qs = new URLSearchParams({ template: 'feedback.yml' })
      if (version) qs.set('version', String(version))
      if (env) qs.set('env', env)
      return 'https://github.com/Py97530/dsh-gengtu/issues/new?' + qs.toString()
    }

    /** 下载量显示:上千折成 1.2k,省得数字把卡片撑爆 */
    function fmtCount(n) {
      const x = Number(n) || 0
      return x >= 1000 ? (Math.round(x / 100) / 10) + 'k' : String(x)
    }

    function makeMemeStore() {
      let open = false
      const subs = new Set()
      return {
        get: () => open,
        set: (v) => { open = !!v; subs.forEach((fn) => fn()) },
        toggle: () => { open = !open; subs.forEach((fn) => fn()) },
        subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn) },
      }
    }

    function makeMemeButton(store) {
      return function MemeButton(props) {
        const open = React.useSyncExternalStore(store.subscribe, store.get)
        return React.createElement('button', {
          className: open ? 'meme-trigger active' : 'meme-trigger',
          title: '表情包',
          onClick: (e) => {
            e.preventDefault(); e.stopPropagation()
            store.toggle()
          },
        }, React.createElement('svg', { viewBox: '0 0 24 24', width: 20, height: 20, style: { display: 'block' } },
          // Material 标准笑脸,currentColor 跟随主题
          React.createElement('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z', fill: 'currentColor' }),
        ))
      }
    }

    function MemeBoard(props) {
      const h = React.createElement
      const store = props.store
      const actions = props.inputActions
      // 草稿要从宿主实时读:本 slot 的 props 只有 inputActions 加 hooks 派生的 useInput
      // (宿主输入栏就是 useInput((s) => s)),没有 props.input;读不存在的属性不报错,
      // 只会静默拿到 undefined —— 别再回头去读 props.input.draft。
      // 拿不到钩子(宿主侧改动)时兜底为空串,即修复前的行为,不因此崩。
      const useLiveInput = typeof props.useInput === 'function' ? props.useInput : (() => null)
      const inputState = useLiveInput((s) => s)
      const open = React.useSyncExternalStore(store.subscribe, store.get)
      const [memes, setMemes] = React.useState([])
      const [packs, setPacks] = React.useState([]) // [{id,name,count}] 可切换的表情包组
      const [packId, setPackId] = React.useState('') // '' = 跟随当前激活图库
      const [memeQuery, setMemeQuery] = React.useState('') // [patch-dsh-meme-search] 选择器里的搜索词
      // [patch-dsh-meme-window] 一次只铺这么多格。库上千张时把整库格子全挂上，
      // Chromium 会同时发几百个图片请求（本机实测 979 张 ≈ 141MB、5.6 秒磁盘读），
      // 表现就是「打开面板/删完图，电脑卡几秒」。滚到底再续 72 张，体感一样。
      const [memeLimit, setMemeLimit] = React.useState(72)
      // [patch-dsh-meme-seedpick] 挑选模式（默认关）:点图 = 勾选、不发消息;勾完导出清单落盘。
      // 不做成默认开：挑图是给你自己攒「随包底图」用的开发动作，普通用户点图就该直接发出去。
      const [seedMode, setSeedMode] = React.useState(false)
      const [picked, setPicked] = React.useState([]) // [{path,url,caption,tag}]，数组顺序 = 勾选顺序
      const [seedNote, setSeedNote] = React.useState('')
      // [patch-dsh-meme-diag] 点图没反应时的现场取证（**默认关**）：
      // 出错时（点图抛错）无条件亮，用来抓「点了完全没反应」；
      // 平时那行「写:… | 数据:… | 句柄:… | 提:… | 图:…」只在下面这条开关打开时才写出来。
      // 开法（任一）：控制台 `__DSH_MEME_DIAG__ = true`，或 `localStorage.dshGengtuDiag = '1'`。
      const [diag, setDiag] = React.useState('')

      React.useEffect(() => { setMemeLimit(72) }, [memeQuery, packId]) // [patch-dsh-meme-window] 换词/换库从头铺

      React.useEffect(() => {
        if (!open) return
        let alive = true
        const qs = new URLSearchParams()
        if (packId) qs.set('packId', packId)
        fetch('/dsh-memes-api?' + qs.toString(), { headers: memeApiHeaders() })
          .then((r) => r.json())
          .then((res) => {
            if (!alive || !res || !res.ok) return
            setPacks(res.packs || [])
            setMemes(memeSortNewestFirst(res.memes || []))
            // 首次打开:锚定当前激活图库;切包后当前包不存在时回退激活包
            setPackId((cur) => {
              const valid = (res.packs || []).some((p) => p.id === cur)
              return cur && valid ? cur : (res.packId || '')
            })
          })
          .catch(() => {})
        return () => { alive = false }
      }, [open, packId])

      // 点外部(非面板、非 😊 按钮)自动收起。
      React.useEffect(() => {
        if (!open) return
        const onDown = (e) => {
          const t = e && e.target
          if (t && t.closest && !t.closest('.meme-picker') && !t.closest('.meme-trigger')) {
            store.set(false)
          }
        }
        document.addEventListener('pointerdown', onDown)
        return () => document.removeEventListener('pointerdown', onDown)
      }, [open])

      if (!open) return null

      // [patch-dsh-meme-seedpick] 勾选/取消一张（选择模式）
      const seedToggle = (m) => {
        if (!m) return
        setSeedNote('')
        setPicked((cur) => {
          const hit = cur.findIndex((x) => x.path === m.path)
          if (hit >= 0) return cur.filter((x, i) => i !== hit)
          return cur.concat([{ path: m.path, url: m.url, caption: m.caption || m.file_name || '', tag: m.tag || '' }])
        })
      }
      // [patch-dsh-meme-seedpick] 导出:POST 给本地打包服务落盘(开发时手动跑 dev/pick-server.mjs)。
      // 不做成插件自带路由 —— 随包公开分发时不该多一个「往你磁盘写清单」的接口。
      // [patch-dsh-meme-auth 2026-10-12] 原来这里有个 POST http://127.0.0.1:8796/submit（往本机
      // 一个“打包服务”送选中清单）。实测那个端口从来没人监听，等于把用户选中的图路径往外送、
      // 谁先占这个端口谁收；而且随包分发不该带一个出站请求。改成直接指路草稿那条兜底路径。
      const seedExport = async () => {
        if (picked.length === 0) { setSeedNote('还没勾'); return }
        setSeedNote('没有本地打包服务了，点「填进对话」贴给我')
      }
      // [patch-dsh-meme-seedpick] 兜底:直接把清单塞进对话草稿,他手点发送我照样能收到
      const seedToDraft = () => {
        if (picked.length === 0) { setSeedNote('还没勾'); return }
        const text = '种子库选定 ' + picked.length + ' 张：\n' + picked.map((p, i) => (i + 1) + '. ' + p.path).join('\n')
        try { if (actions && actions.setDraft) actions.setDraft(text) } catch (e) {}
        store.set(false)
      }

      // [patch-dsh-meme-dominsert] 不靠插槽 prop 的「写草稿 / 发送」兜底路径。
      // 背景:inputActions(setDraft/submit)是 ctx.uiSession 发给会话作用域插槽的标准 prop,
      // 有的 DSH 版本不给 conversation.input.overlay 这个插槽(实测点下去 actions 为空、
      // 两个 try/catch 把 undefined 静默吞掉 → 用户看到「点了什么都不出来」)。
      // 这里直接对输入框做合成输入,与宿主是什么版本无关。
      const editorEl = () => {
        const trig = document.querySelector('.meme-trigger')
        if (trig) {
          let box = trig.parentElement
          for (let up = 0; box && up < 8; up++) {
            const ed = box.querySelector('textarea, [contenteditable="true"]')
            if (ed && !isReadonlyEditor(ed)) return ed
            box = box.parentElement
          }
        }
        const alive = (el) => el && el.isConnected && el.offsetParent !== null && !isReadonlyEditor(el)
        return Array.prototype.slice.call(document.querySelectorAll('textarea, [contenteditable="true"]')).filter(alive).pop() || null
      }
      // 消息内容区本身也常常是 contenteditable（可选中复制）——别把消息写进聊天记录里
      const isReadonlyEditor = (el) => !!(el && el.closest && el.closest('[data-message-id], .dsh-message, article, [role="log"]'))
      const insertNative = (el, text) => {
        if (!el) return false
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
          setter.call(el, text)
          el.dispatchEvent(new Event('input', { bubbles: true }))
          return true
        }
        el.focus() // execCommand('insertText') 只对获得焦点的可编辑节点生效，漏了这步会静默失败
        const sel = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(el)
        sel.removeAllRanges()
        sel.addRange(range)
        let ok = false
        try { ok = document.execCommand('insertText', false, text) } catch (e) { ok = false }
        if (!ok) { try { ok = document.execCommand('paste') } catch (e2) { ok = false } }
        el.dispatchEvent(new Event('input', { bubbles: true }))
        return ok
      }
      const insertToEditor = (text) => {
        try {
          const el = editorEl()
          if (!el) return false
          const cur = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT'
            ? String(el.value || '')
            : String(el.innerText || el.textContent || '')
          const next = cur.trim() ? cur.replace(/\s+$/, '') + '\n' + text : text
          return insertNative(el, next)
        } catch (e) { return false }
      }
      const submitViaEditor = (el) => {
        const sendRe = /send|submit|发送/
        const nameOf = (b) => ((b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('data-testid') || '')).toLowerCase()
        const findByAttr = (sel) => {
          try { return Array.prototype.slice.call(document.querySelectorAll(sel)).pop() || null } catch (e) { return null }
        }
        try {
          let root = el && el.closest ? el.closest('form') : null
          let node = el
          for (let up = 0; !root && node && up < 8; up++) { node = node.parentElement; root = node }
          const scopes = [root, document.querySelector('form')].filter(Boolean)
          for (const sc of scopes) {
            const hit = Array.prototype.slice.call(sc.querySelectorAll('button')).filter((b) => sendRe.test(nameOf(b))).pop()
            if (hit) { hit.click(); return true }
          }
          // 发送按钮是页面上唯一带这些名字的按钮，认准了再点（别乱点别的控件）
          for (const sel of ['button[aria-label*="发送"]', 'button[title*="发送"]', 'button[aria-label*="Send" i]', 'button[data-testid*="send" i]']) {
            const hit = findByAttr(sel)
            if (hit) { hit.click(); return true }
          }
        } catch (e) {}
        // 按钮认不出来就回车提交（宿主 composer 一般是 Enter 发送）
        try {
          if (!el) return false
          for (const type of ['keydown', 'keypress', 'keyup']) {
            el.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }))
          }
          return true
        } catch (e2) { return false }
      }
      // 点击:发 [表情: 描述] 文本,前端按描述配图。
      // [patch-dsh-meme-diag] 取证开关，默认关（用户报「这行字一直挂在那儿」）：
      // 抛错那条永远亮（那才是真线索），平时那行只有开关打开才写。
      const memeDiagOn = () => {
        try { if (window.__DSH_MEME_DIAG__ === true) return true } catch (e) {}
        try { if (localStorage.getItem('dshGengtuDiag') === '1') return true } catch (e) {}
        return false
      }
      const send = async (m) => {
        if (!m) return
        // [patch-dsh-meme-diag] 独立点击计数（存 localStorage，重启也在）：
        // 用户报告位时，这个数就能区分「处理器压根没被调用」和「调用了但后面没走通」。
        let n = 0
        try { n = (parseInt(localStorage.getItem('dshGengtuClickN') || '0', 10) || 0) + 1; localStorage.setItem('dshGengtuClickN', String(n)) } catch (e) {}
        try { if (memeDiagOn()) setDiag('点到了(第' + n + '次)，正在看写哪儿…') } catch (e) {}
        try {
          await sendInner(m)
        } catch (err) {
          // [patch-dsh-meme-diag] 抛到这儿就是"点了完全没反应"的真身，别让它无声无息
          try { setDiag('点图抛错: ' + String((err && err.message) || err).slice(0, 120)) } catch (e) {}
          console.error('[dsh-gengtu] 点图失败', err)
        }
      }
      const sendInner = async (m) => {
        const desc = (m.caption || m.keywords || m.tag || '表情包').slice(0, 80)
        // [patch-dsh-meme-pickmap] 记住"用户点的这张" —— 点谁发谁，不再依赖模糊匹配
        try { if (m.url) memePickMap.set(String(m.caption || desc).trim(), String(m.url)) } catch (e) {}
        // [patch-dsh-meme-pincode] ② 码：把图库行的稳定码塞进标记后缀，用户点谁就是谁
        // （同一条 caption 挂多张图时，描述本身分辨不出来，码可以）。
        // [patch-dsh-meme-defensive] 取码失败只许丢码，绝不许拖垮整个发送：
        // 没码顶多是「模型按描述配图」，抛出去就是「点了一点反应都没有」。
        let code = ''
        try { code = memeCodeFromRow(m) } catch (e) { code = '' }
        const text = '[表情: ' + desc + ']' + (code ? ' ·' + code : '')
        // 草稿现状：只有**真的读到**宿主状态才算数。
        // [patch-dsh-meme-dominsert] 拿不到 useInput 时 inputState 是 null ——
        // 那时若照着空串去调 actions.setDraft(text)，等于把草稿整个换成我们这句；
        // 更糟的是宿主若把「状态快照为空」当成「草稿为空」，就会把刚写进去的又清掉，
        // 表现就是用户看到的「点了没反应、框里一个字都没多」。所以这时一律改走 DOM 那条路。
        const haveState = !!(inputState && typeof inputState.draft === 'string')
        const cur = haveState ? inputState.draft : ''
        const dataFrom = haveState ? 'host' : 'ledger'
        if (!haveState) {
          try {
            const g = typeof props.getConversation === 'function' ? props.getConversation() : null
            const st = g && typeof g.get === 'function' ? g.get() : null
            if (st && typeof st.draft === 'string') dataFrom = 'conversation:' + String(st.draft).length
          } catch (e) { dataFrom = 'ledger(取会话抛错)' }
        }
        let wrote = false
        let how = ''
        if (haveState) {
          try { if (actions && actions.setDraft) { actions.setDraft(cur.trim() ? cur + '\n' + text : text); wrote = true; how = 'setDraft' } } catch (e) { how = 'setDraft 抛错: ' + (e && e.message) }
        }
        // DOM 兜底：插槽没给句柄、或拿不到草稿状态时，自己戳真输入框（会自己读现有文字接在后面）
        if (!wrote) {
          wrote = insertToEditor(text)
          how = wrote ? 'DOM 写入' : (how ? how + ' / DOM 也没找到输入框' : 'DOM 也没找到输入框')
        }
        const ed = editorEl()
        if (!ed) how += ' / 认不出输入框'
        else if (ed.className) how += ' / 框类=' + String(ed.className).split(/\s+/)[0].slice(0, 22)
        const acts = (actions && actions.setDraft ? 's' : '-') + (actions && actions.submit ? 'b' : '-') + (actions && actions.insertText ? 'i' : '-')
        // 提交：句柄可用就用它（它会读宿主自己的草稿状态）；DOM 写入这条路等一帧再提，
        // 免得宿主还没把刚打进去的文字收进状态就被提交掉。
        const doSubmit = () => {
          let sub = 'no-actions'
          try { if (actions && actions.submit) { actions.submit(); sub = 'actions.submit' } } catch (e) { sub = 'submit 抛错: ' + (e && e.message) }
          if (sub !== 'actions.submit') sub = submitViaEditor(ed) ? '按钮/回车' : '没找到提交按钮'
          try { if (memeDiagOn()) setDiag('写:' + how + ' | 数据:' + dataFrom + ' | 句柄:' + acts + ' | 提:' + sub + ' | 图:' + (m.url ? '有' : '无')) } catch (e) {}
        }
        if (wrote && haveState) doSubmit()
        else if (typeof setTimeout === 'function') setTimeout(doSubmit, 90)
        else doSubmit()
        if (!wrote) console.warn('[dsh-gengtu] 没能把表情标记写进输入框：找不到输入框元素')
        store.set(false)
      }

      // [patch-dsh-meme-search] 搜索：空格分词、全部命中才算；匹配 caption/keywords/tag/文件名
      // [patch-dsh-meme-search-rank] 情绪词 → 分类加权，再按相关度排序（命中分类 100 分 > caption 开头 14+30 > 关键词 12 > 文件名 2）
      const MEME_TAG_HINTS = {
        可爱: ['happy', 'like', 'meow'], 萌: ['happy', 'like', 'meow'], 软萌: ['happy', 'like', 'meow'],
        开心: ['happy'], 高兴: ['happy'], 喜欢: ['like'], 比心: ['like'],
        生气: ['angry'], 愤怒: ['angry'], 火大: ['angry'], 急: ['angry'],
        悲伤: ['sad'], 难过: ['sad'], 委屈: ['sad'], 丧: ['sad'],
        无语: ['speechless'], 沉默: ['speechless'], 摆烂: ['speechless'],
        疑惑: ['confused'], 困惑: ['confused'], 懵逼: ['confused'],
        惊讶: ['surprised'], 震惊: ['surprised'],
        睡觉: ['sleep'], 困: ['sleep'], 上班: ['work'], 工作: ['work'], 加班: ['work'],
        害羞: ['shy'], 看戏: ['see'], 吃瓜: ['see'],
      }
      const memeTerms = String(memeQuery || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
      const memeScore = (m, t) => {
        let s = 0
        const tags = MEME_TAG_HINTS[t]
        if (tags && tags.indexOf(String(m.tag || '')) >= 0) s += 100
        const cap = String(m.caption || '')
        if (cap.indexOf(t) === 0) s += 14
        if (cap.indexOf(t) >= 0) s += 30
        if (String(m.keywords || '').indexOf(t) >= 0) s += 12
        if (String(m.file_name || '').toLowerCase().indexOf(t) >= 0) s += 2
        return s
      }
      const memeRanked = memeTerms.length === 0 ? [] : memes.map((m, i) => {
        let total = 0
        for (const t of memeTerms) { const s = memeScore(m, t); if (!s) return null; total += s }
        return { m, i, total }
      }).filter(Boolean).sort((a, b) => (b.total - a.total) || (a.i - b.i))
      const shownMemes = memeTerms.length === 0 ? memes : memeRanked.map((x) => x.m)
      // [patch-dsh-meme-window] 只渲染前 memeLimit 张,滚到底自动续
      const windowedMemes = shownMemes.slice(0, memeLimit)
      const memeQuickWords = ['可爱', '生气', '悲伤', '无语', '开心', '摆烂', '猫', '上班']

      // 表情包组 tab:大肥鱼 / 官方 / 导入的包,点选即切换数据源
      const cells = windowedMemes.map((m) => {
        const order = picked.findIndex((x) => x.path === m.path)
        return h('div', {
          key: m.path, className: 'mp-cell' + (order >= 0 ? ' on' : ''), 'data-meme-cap': m.caption || m.file_name,
          onClick: () => (seedMode ? seedToggle(m) : send(m)),
          title: seedMode ? '点一下勾选/取消' : (m.caption || m.file_name || ''),
          // [patch-dsh-meme-lazycells] 懒挂背景图：ref 拿不到节点(卸载)时跳过
          ref: (el) => { if (el) memeLazyBg(el, m.url) },
          'data-meme-src': m.url,
          style: {
            width: '74px', height: '74px', position: 'relative',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          },
        }, seedMode && order >= 0 ? h('span', { className: 'mp-pick' }, String(order + 1)) : null)
      })

      return h('div', { className: 'meme-picker', onClick: (e) => e.stopPropagation() },
        // [patch-dsh-meme-notabs] 已按要求去掉图库选择那一排（切图库请去设置页）
        h('div', { className: 'mp-search' }, // [patch-dsh-meme-search]
          h('input', {
            className: 'mp-search-input', type: 'search', value: memeQuery, placeholder: '搜表情：可爱 / 生气 / 悲伤 / 无语…',
            onChange: (e) => setMemeQuery(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Escape') setMemeQuery('') },
          }),
          memeQuery ? h('button', { type: 'button', className: 'mp-tag', onClick: () => setMemeQuery('') }, '清空') : null,
          h('button', {
            type: 'button', className: 'mp-tag' + (seedMode ? ' on' : ''), title: '挑选模式：点图只勾选、不发出去（用来攒随包底图）',
            onClick: () => { setSeedMode(!seedMode); setSeedNote('') },
          }, seedMode ? '挑选中 (' + picked.length + ')' : '挑选'),
          diag ? h('span', { className: 'mp-diag' }, diag) : null,
          // [patch-dsh-meme-notext 2026-10-12] 面板上留一个「自检」：点开就是索引状态和一次真发图。
          // 上回图全空（403）时我隔着屏幕只能猜，这个能让他一句话念给我。
          h('details', { className: 'mp-check' },
            h('summary', null, '自检'),
            h('div', { className: 'mp-check-body' },
              h('div', null, memeApiStatus || '索引还没拉'),
              h('button', {
                type: 'button', className: 'mp-tag',
                onClick: () => {
                  const probe = (memeIndex && memeIndex.size) || 0
                  const codes = memeCodeIndex ? memeCodeIndex.size : 0
                  const first = memeIndex ? memeIndex.values().next().value : null
                  const url = Array.isArray(first) ? first[0] : first
                  setDiag('索引 ' + probe + ' 键 | 码表 ' + codes + ' | 样本 ' + (url ? String(url).slice(-28) : '（无）'))
                },
              }, '查索引'),
            ),
          ),
          h('span', { className: 'mp-count' }, String(windowedMemes.length) + '/' + String(shownMemes.length) + (shownMemes.length < memes.length ? ' 共' + String(memes.length) : '')),
        ),
        seedMode ? h('div', { className: 'mp-seedbar' },
          h('span', null, '点图勾选，勾 ' + picked.length + ' 张'),
          h('button', { type: 'button', className: 'mp-tag on', onClick: seedExport }, '导出清单'),
          h('button', { type: 'button', className: 'mp-tag', onClick: seedToDraft }, '填进对话'),
          picked.length ? h('button', { type: 'button', className: 'mp-tag', onClick: () => { setPicked([]); setSeedNote('') } }, '清空') : null,
          seedNote ? h('span', { className: 'mp-ok' }, seedNote) : null,
        ) : null,
        h('div', { className: 'mp-quick' },
          ...memeQuickWords.map((w) => h('button', {
            type: 'button', key: w,
            className: 'mp-tag' + (memeQuery === w ? ' on' : ''),
            onClick: () => setMemeQuery(memeQuery === w ? '' : w),
          }, w)),
        ),
        shownMemes.length === 0
          ? h('div', { className: 'mp-empty' }, memeTerms.length ? '没搜到，换个词试试' : '没有匹配的表情包')
          : h('div', { className: 'mp-grid' }, cells, windowedMemes.length < shownMemes.length
            // [patch-dsh-meme-window] 底下这颗哨兵滚进视野就再铺 72 张(相当于无限滚动)
            ? h('div', {
              key: '__more', className: 'mp-more',
              ref: (el) => {
                if (!el) return
                if (typeof IntersectionObserver !== 'function') { setMemeLimit((n) => n + 72); return }
                if (!el.__dshMemeMoreIO) {
                  el.__dshMemeMoreIO = new IntersectionObserver((es) => {
                    if (es.some((e) => e.isIntersecting)) setMemeLimit((n) => n + 72)
                  }, { rootMargin: '300px 0px' })
                  el.__dshMemeMoreIO.observe(el)
                }
              },
            }, '加载中…')
            : null),
      )
    }

    const inject = ['slots', 'workspaces']

    // 模型常把 “” 抄成 ""；匹配时折叠引号和空白。
    // [patch-dsh-meme-lazycells] 图库可能上千张，一次性把原图当背景图挂上去会把 Chromium 的加载队列挤爆
    // (表现就是「前几张出来了、后面一片空白」)。统一走 IntersectionObserver：格子滚进
    // 视野(前后 240px 余量)才真正发请求。观察器挂在 window 上，免得每次 render 重建。
    const memeLazyBg = (el, src) => {
      try {
        if (!el || el.style.backgroundImage) return
        if (typeof IntersectionObserver !== 'function') { el.style.backgroundImage = 'url("' + src + '")'; return }
        if (!window.__dshMemeCellIO) {
          window.__dshMemeCellIO = new IntersectionObserver((entries) => {
            for (const en of entries) {
              if (!en.isIntersecting) continue
              const t = en.target
              const u = t.getAttribute('data-meme-src')
              if (u) { t.style.backgroundImage = 'url("' + u + '")'; t.removeAttribute('data-meme-src') }
              window.__dshMemeCellIO.unobserve(t)
            }
          }, { rootMargin: '240px 0px' })
        }
        window.__dshMemeCellIO.observe(el)
      } catch (e) {
        try { el.style.backgroundImage = 'url("' + src + '")' } catch (e2) {}
      }
    }

    // [patch-dsh-meme-datesort] 「时间越久越靠后」：接口返回顺序 = 入库顺序，这里按日期倒序排一遍再渲染。
    // 日期来自 keywords(导入脚本写入的发布日期) / caption / file_name，没有日期的排最后。
    const memeDateOf = (m) => {
      if (!m) return ''
      const s = String(m.keywords || '') + ' ' + String(m.caption || '') + ' ' + String(m.file_name || '')
      const hit = s.match(/(20\d\d-\d\d-\d\d)/)
      return hit ? hit[1] : ''
    }
    const memeSortNewestFirst = (rows) => {
      if (!Array.isArray(rows)) return []
      return rows.slice().sort((a, b) => {
        const da = memeDateOf(a)
        const db = memeDateOf(b)
        if (da && db) return da < db ? 1 : da > db ? -1 : 0
        if (da) return -1
        if (db) return 1
        return 0
      })
    }

    const foldCaption = (s) => String(s || '').trim()
      .replace(/[\u201c\u201d\u2018\u2019\u300c\u300d\u300e\u300f«»]/g, '"')
      .replace(/\s+/g, ' ')
    const looseCaption = (s) => foldCaption(s).replace(/["'\s]/g, '')
    // [patch-dsh-meme-matchspec] 标点盲的归一形：连中英文标点一起去掉,只留字与词。
    // 模型写描述时经常把逗号换成空格、把句号省掉,甚至把两层引号改成一层;
    // 整串比对必须对这种写法免疫,否则「同一个梗的两种排版」会掉进分词兜底配错图。
    const PUNCT_RE = /[\s,.!?;:、，。！？；：""''""''「」『』（）()\[\]【】《》〈〉…·～~\-—_/\\|+*#@!?。，、]+/g
    const stripPunct = (s) => foldCaption(s).replace(PUNCT_RE, '')
    // 描述里按中英文标点切词,长词优先(两字以下太泛,不参与匹配)。
    const splitDescTokens = (s) => foldCaption(s)
      .split(/[\s,.!?;:、，。！？；：""''()（）\[\]【】《》…·～~\-]+/)
      .map((t) => t.replace(/["']/g, ''))
      .filter((t) => t.length >= 2)
      .sort((a, b) => b.length - a.length)
    // 分词兜底的 haystack:caption/关键词/文件名的折叠与紧凑形态 + 分词。
    const buildMemeSearch = (rows, toUrl) => (rows || []).map((row) => {
      const hay = []
      const parts = []
      for (const s of [row.caption, row.keywords, row.file_name]) {
        const f = foldCaption(s)
        if (!f) continue
        const l = looseCaption(s)
        const p = stripPunct(s) // [patch-dsh-meme-matchspec]
        hay.push(f, ...(l && l !== f ? [l] : []), ...(p && p !== f && p !== l ? [p] : []))
        parts.push(s)
      }
      const tokens = [...new Set(splitDescTokens(parts.join(' ')))]
      return { hay, tokens, url: toUrl(row) }
    })
    // 组合匹配:精确(原文/折叠/紧凑三级)→ 分词在 caption/关键词里双向包含。
    // [patch-dsh-meme-matchspec] 两个鲁棒性补丁(2026-10-11,用户报「点了表情包却出一行注释文字」):
    //   ① splitDescTokens 按「长词优先」排,而下面的包含匹配「先命中就返回」——于是描述里
    //      最泛的那个词(如「一只猫」)会抢在真正区分性的词前面把行号定死,同一张图的不同
    //      写法能配到完全不同的图(实测:「灰白小猫坐下来周身冒星星…」带句号命中 happy、
    //      不带句号命中 angry)。改成**短词优先**:短词信息量低但要全字命中、误配面更小。
    //   ② 描述≥10 字时,先拿整串描述在所有行里找**唯一**的双向包含行。模型改写描述(去掉
    //      尾巴、少一个句号、换个标点)在这条路上就能救回来,不用掉进分词那一步。
    const matchDesc = (desc, index, search) => {
      const raw = String(desc || '').trim()
      if (index) {
        const exact = index.get(raw) || index.get(foldCaption(raw)) || index.get(looseCaption(raw))
        if (exact) return exact
      }
      const rows = search || []
      // 整串包含用**标点盲**的归一形（stripPunct）：模型爱把句读写成空格、把句号省掉，
      // 而索引里的原文是全角逗号，两边一归一就能对上 —— 这一步是「同一张图的两种排版」
      // 不被打分兜底抢走的关键。
      const whole = stripPunct(raw)
      if (whole.length >= 10) {
        let found = null
        for (const row of rows) {
          if (!(row.hay || []).some((hay) => hay.includes(whole) || whole.includes(hay))) continue
          if (found && found !== row.url) { found = null; break } // 不止一张像 → 不敢乱认
          found = row.url
        }
        if (found) return found
      }
      for (const token of [...splitDescTokens(desc)].sort((a, b) => a.length - b.length)) {
        const needle = looseCaption(token)
        if (!needle) continue
        for (const row of rows) {
          if (row.hay.some((hay) => hay.includes(needle))) return row.url
          if ((row.tokens || []).some((t) => { const lt = looseCaption(t); return lt && (needle.includes(lt) || lt.includes(needle)) })) return row.url
        }
      }
      return null
    }

    function apply(ctx) {
      const styleEl = document.createElement('style')
      styleEl.textContent = CSS
      document.head.appendChild(styleEl)
      ctx.effect(() => () => { styleEl.remove() }, 'dsh-expression-entry: styles')

      const pickerStyle = document.createElement('style')
      pickerStyle.textContent = memePickerCSS
      document.head.appendChild(pickerStyle)
      ctx.effect(() => () => { pickerStyle.remove() }, 'dsh-expression-entry: meme-picker styles')

      // 表情文本渲染:[表情: 描述] 或旧格式 [表情: 描述](url) → 图片。
      // 无 url 时先按描述精确匹配图库;失败再按分词在 caption/关键词里做包含匹配
      // 兜底(模型偶尔不抄候选原文、自己编描述);仍无命中显示描述原文,
      // 不把 [表情: ...] 标记裸露在气泡里(历史教训:社区反馈「表情显示不出来」)。
      // [patch-dsh-meme-dualcode] 同时认短码格式 [m:xxxx 短名]（码仅供码表用，短名负责可读与匹配）
      // [patch-dsh-meme-pincode] 第三个身份来源：标记后面跟的 ` ·c1a2b3`（图库行的稳定码，
      // 由 keywords 尾部的 `·<code>` 提供）。**码在就用码，绝不退回描述模糊匹配** ——
      // 这是「点的是 A、发出来是 B」的根治手段（见下面 memeCodeIndex）。
      const MEME_TEXT_RE = /\[(?:表情|m):\s*([^\]]+)\](?:\s*·(c[0-9a-f]{5,6}))?(?:\((https?:\/\/[^\s)]+)\))?/g
      // acceptNode 用不带 g 的副本。带 g 的正则 test() 会推进 lastIndex,下一个文本节点从
      // 上次的位置往后找——于是「这一条运气不好」的消息被静默跳过、永远不出图,还得等下一轮
      // 扫描碰巧把游标绕回 0(历史 bug:表现就是「表情有时显示不出来」)。
      const MEME_TEXT_TEST = /\[(?:表情|m):\s*([^\]]+)\](?:\s*·(c[0-9a-f]{5,6}))?(?:\((https?:\/\/[^\s)]+)\))?/ // [patch-dsh-meme-dualcode] 必须与 RE 同步
      let memeIndex = null
      let memeCodeIndex = new Map() // [patch-dsh-meme-pincode] code → url，码是稳定身份
      let memeIndexNeedsRecheck = false // 有条目因为索引里没码而没配出来 → 拉完再扫一轮
      let memeSearch = [] // 分词兜底用的 haystack:[{hay:[...], url}]
      let memeIndexLoading = false
      // [patch-dsh-meme-index] 索引新鲜度。图鉴只在页面加载后拉一次，之后新建的表情包
      // 永远进不了索引 → 命不中 → 降级成文字，只能刷新页面恢复。记下建成时刻，命中
      // 失败且索引过期时强制重拉（冷却 = TTL，避免刷屏式重拉）。
      let memeIndexAt = 0
      let memeRefreshGate = 0
      const MEME_INDEX_TTL = 60000
      let memeIndexRetryAfter = 0 // 失败后的冷却截止时刻(ms):冷却期内不再发请求
      let memeIndexAttempts = 0
      let memeIndexWarned = false
      // [patch-dsh-meme-notext 2026-10-12] 索引拉失败时面板上要看得见一句话。用户报「表情包无法
      // 显示」那回，症状是「图全空」而控制台里的 403 他根本看不到 —— 现场只有一句话可问，
      // 装进面板的详情里他点一下就能念给我。
      let memeApiStatus = ''
      // 索引拉取失败必须保持「可重试」状态。早先失败会往 memeIndex 写一个空 Map 兜底,
      // 而入口守卫是 `if (memeIndex || memeIndexLoading) return`——空 Map 也是真值,
      // 于是这个会话剩下的 [表情: x] 全部退化成描述文字,无报错、无提示,只能靠刷新恢复。
      // 现在失败就保持 null:之后再扫描到未装饰的 [表情: x] 会自然重试(指数退避,
      // 后端起来了自愈)。不另起定时器——扫描本身就是触发点,少一个要清理的生命周期。
      const MEME_INDEX_TIMEOUT = 15000
      // [patch-dsh-meme-notext 2026-10-12 第二刀] 索引还没到手时先把标记藏起来的宽限期(ms)。
      // 藏起来是为了消掉那一下闪现；超过这个时长图还没落下来就放回原文，宁可看见注释也别留空白。
      const MEME_MASK_GRACE = 1600
      const MEME_INDEX_RETRY_BASE = 2000
      const MEME_INDEX_RETRY_MAX = 30000
      const absMemeUrl = (u, path) => {
        if (u && /^https?:\/\//.test(u)) return u
        const rel = u || (path ? '/dsh-memes/' + path : '')
        try { return new URL(rel, window.location.origin).href } catch (e) { return rel }
      }
      const addCaptionKey = (map, key, url) => {
        const raw = String(key || '').trim()
        if (!raw) return
        map.set(raw, url)
        map.set(foldCaption(raw), url)
        const loose = looseCaption(raw)
        if (loose) map.set(loose, url)
      }
      // [patch-dsh-meme-pickmap] 点过的图：caption → url，精确优先
      // ⚠️ 提到 factory 顶层（原来在 apply() 里）——MemeBoard 定义在 apply() 之前，
      // 放里面点图时就是 ReferenceError: memePickMap is not defined（静默死在 try 里）。
      const findMemeUrl = (desc) => {
        const pinned = memePickMap.get(String(desc).trim())
        if (pinned) return pinned
        return matchDesc(desc, memeIndex, memeSearch)
      }
      // [patch-dsh-meme-dualcode] [m:1a2b 无语] → 只取「无语」；[表情: …] 原样
      const memeTokenLabel = (hit) => {
        const raw = String((hit && hit[1]) || '')
        if (!/^\[m:/i.test(String((hit && hit[0]) || ''))) return raw
        return raw.replace(/^[0-9a-z]{3,12}[\s:：_-]*/i, '').trim() || raw
      }
      // [patch-dsh-meme-pincode] 码 → URL。优先级：① 标记里的 URL（模型抄了完整 URL）
      // ② 标记后面的稳定码 ③ [m:xxxx] 短码 ④ 描述匹配（老数据兜底，且只在前三者都没有时用）。
      // 码查不到时**绝不退回描述匹配**——那正是「点的是 A、发出来是 B」；宁可不装饰，
      // 等索引重拉后再试（由 memeIndexNeedsRecheck 触发）。
      const memeSrcFor = (hit) => {
        if (!hit) return ''
        if (hit[3]) return hit[3] // 标记自带的完整 URL，最硬
        const code = hit[2]
        if (code) {
          const url = memeCodeIndex.get(code)
          if (url) return url
          memeIndexNeedsRecheck = true // 索引里还没这个码(多为刚入库的图) → 拉完再扫
          return ''
        }
        return findMemeUrl(memeTokenLabel(hit))
      }
      const loadMemeIndex = (force) => { // [patch-dsh-meme-index] force=绕过「已有索引」守卫
        if (memeIndexLoading) return
        if (memeIndex && !force) return
        if (Date.now() < memeIndexRetryAfter) return // 冷却中:上一次失败还没到重试时刻
        memeIndexLoading = true
        memeIndexAttempts++
        // fetch 挂起(既不 resolve 也不 reject)时连 catch 都不走,超时自己 abort 兜底
        const controller = typeof AbortController === 'function' ? new AbortController() : null
        const timeoutTimer = controller ? setTimeout(() => controller.abort(), MEME_INDEX_TIMEOUT) : 0
        // 拉全部包(带包前缀 URL),任意组的 [表情: 描述] 都能配图
        fetch('/dsh-memes-api?packId=all', { headers: memeApiHeaders(), ...(controller ? { signal: controller.signal } : {}) })
          .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
          .then((res) => {
            const rows = (res && res.memes) || []
            // [patch-dsh-meme-pincode] 码表先建（下面的扫尾要用它）：keywords 尾部那截
            // ` ·c1a2b3` 是每行独有的稳定身份，一条 caption 挂多张图时只有它能分辨。
            const codes = new Map()
            memeIndex = new Map()
            for (const row of rows) {
              const url = absMemeUrl(row.url, row.path)
              addCaptionKey(memeIndex, row.caption, url)
              addCaptionKey(memeIndex, row.file_name, url)
              addCaptionKey(memeIndex, row.keywords, url)
              addCaptionKey(memeIndex, String(row.caption || '').slice(0, 80), url)
              addCaptionKey(memeIndex, String(row.caption || '').slice(0, 100), url)
              const code = memeCodeFromRow(row)
              if (code) codes.set(code, url)
            }
            memeCodeIndex = codes
            memeSearch = buildMemeSearch(rows, (row) => absMemeUrl(row.url, row.path))
            memeIndexAt = Date.now() // [patch-dsh-meme-index]
            memeApiStatus = '索引就绪: ' + rows.length + ' 张 / 码表 ' + codes.size + ' 个'
            memeIndexAttempts = 0
            memeIndexRetryAfter = 0
            // 刚才因为「码还没进索引」而跳过的标记，索引到手后立刻补扫一遍，
            // 否则那条消息要等下一次别的触发才出图。
            const relook = memeIndexNeedsRecheck
            memeIndexNeedsRecheck = false
            decorateMemeText(relook)
          })
          .catch((error) => {
            // 失败保持 null(下次扫描还能重试),退避到下次重试时刻;提示只打一次,别刷屏
            const backoff = Math.min(MEME_INDEX_RETRY_MAX, MEME_INDEX_RETRY_BASE * Math.pow(2, Math.max(0, memeIndexAttempts - 1)))
            memeIndexRetryAfter = Date.now() + backoff
            memeApiStatus = '索引拉取失败: ' + String((error && error.message) || error).slice(0, 120)
            if (!memeIndexWarned) {
              memeIndexWarned = true
              console.warn('[dsh-expression] 表情索引加载失败,' + Math.round(backoff / 1000) + 's 后自动重试:', error && error.message ? error.message : error)
            }
          })
          .finally(() => {
            if (timeoutTimer) clearTimeout(timeoutTimer)
            memeIndexLoading = false
          })
      }
      // 把 [表情: x] 换成 <img> 之后,气泡里的 textContent 就变了。有些插件(注入记忆条那类)
      // 靠比对 textContent 判断「消息被改过」,于是重写 DOM → img 被打回文字 → 我们再装饰,
      // 来回打回闪个不停(issue #22 第 2 条)。所以每处替换都在 img 后面挂一个 display:none
      // 的 ghost span 装回原文标记:整段 textContent 与替换前逐字一致,谁来比都不觉得变过。
      const ghostFor = (raw) => {
        const ghost = document.createElement('span')
        ghost.setAttribute('data-meme-hidden', '1')
        ghost.style.cssText = 'display:none'
        ghost.textContent = raw
        return ghost
      }
      // [patch-dsh-meme-notext 2026-10-12] textWithoutGhosts 挪到工厂顶层了（原来在这行）——
      // 新加的那层 CSS/JS 兜底在 apply 外面，得能取到它。
      // [patch-dsh-meme-notext 2026-10-12] 把「已经配到图的那些 [表情: 描述] ·码 原文」从可见
      // 文本里摘掉——**不再假设它长在哪一层**。用户报：图是出来了，可那串给模型看的注释还杵在
      // 气泡里（他能选中、能复制）。前两版判据都押在 DOM 形状上：第一版要求注释元素是 img 的
      // **兄弟**（`~`），第二版押「气泡里没有任何可见文本」（`:has` + `[data-meme-bare]`），
      // 宿主换个裹法就又漏了。这版换成按**文本节点**动手：只要这条消息里已经有配好图
      // （img[data-meme-img]），就把同一行里还看得见的 [表情: …] 文本节点本身用
      // <span data-meme-hidden> 裹住（display:none）——span 是不是 img 的兄弟、爷爷是谁，
      // 全都无所谓。ghost 里那份原文照旧保留，别的插件比对 textContent 仍能逐字对上。
      // 同一节点只裹一次（裹完它就不在可见树里了），所以重复调用是幂等的。
      // 流式渲染会覆盖我们的注入,同一个 [表情: x] 可能被装饰两次 → 同一消息行挂两张相同的图
      // (issue #22 第 3 条:刷新后稳态只剩一张,说明是竞态而不是双注入)。按「消息行 + 描述」
      // 幂等去重:没有重复时零副作用,所以每轮扫描完无脑跑一次就行。
      const dedupeMemeImages = () => {
        const seenByRow = new Map()
        for (const img of document.querySelectorAll('img[data-meme-img]')) {
          const row = img.closest('[data-time-hover-root],[data-chat-flow-key]') || img.parentElement
          if (!row) continue
          let seen = seenByRow.get(row)
          if (!seen) seenByRow.set(row, seen = new Set())
          const caption = img.getAttribute('data-meme-img') || ''
          // [patch-dsh-meme-notext 2026-10-12] 去重键以前只有 caption（= foldCaption 后的描述），
          // 不含那条尾巴上的稳定码 → 同一条消息里两张码不同、描述一样的图，第二张会被当重复删掉
          // （评审 AC-4；库里 14 组 / 92 张抖音组图共用一句 desc，是现实触发源）。把 src 并进键里：
          // 码能查到时 src 就是那张图自己的 URL；查不到时 src 是描述查出来的兜底图 —— 那种情况才
          // 确实该去重，行为跟以前一致。
          const key = caption + '|' + (img.getAttribute('src') || '')
          if (seen.has(key)) { img.remove(); continue } // 留先出现的那张(已被提到行首的)
          seen.add(key)
        }
      }
      /* [patch-dsh-meme-zoom] 点击聊天里的表情图放大查看（滚轮缩放/双击复位/Esc 或点背景关闭） */
const installMemeZoom = () => {
  if (window.__dshMemeZoomInstalled) return;
  window.__dshMemeZoomInstalled = true;
  const style = document.createElement('style');
  style.textContent = '[data-chat-flow] img,[data-chat-flow-key] img{cursor:zoom-in}';
  document.head.appendChild(style);
  let box = null, pic = null, scale = 1;
  const ensure = () => {
    if (box) return box;
    box = document.createElement('div');
    box.setAttribute('data-dsh-meme-zoom', '1');
    box.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);cursor:zoom-out;padding:24px;box-sizing:border-box';
    pic = document.createElement('img');
    pic.style.cssText = 'max-width:100%;max-height:100%;border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.6);display:block;transition:transform .12s ease-out;transform-origin:center center';
    box.appendChild(pic);
    const tip = document.createElement('div');
    tip.textContent = '滚轮缩放 · 双击复位 · Esc 或点背景关闭';
    tip.style.cssText = 'position:absolute;bottom:18px;left:0;right:0;text-align:center;color:rgba(255,255,255,.72);font-size:12px;pointer-events:none';
    box.appendChild(tip);
    box.addEventListener('click', () => close());
    box.addEventListener('wheel', (e) => {
      e.preventDefault();
      scale = Math.min(6, Math.max(.4, scale * (e.deltaY < 0 ? 1.15 : .87)));
      pic.style.transform = 'scale(' + scale + ')';
    }, { passive: false });
    box.addEventListener('dblclick', () => { scale = 1; pic.style.transform = 'scale(1)'; });
    document.body.appendChild(box);
    return box;
  };
  const close = () => {
    if (!box) return;
    box.style.display = 'none';
    scale = 1;
    pic.style.transform = 'scale(1)';
  };
  const open = (url, alt) => {
    if (!url) return;
    ensure();
    pic.src = url;
    pic.alt = alt || '';
    scale = 1;
    pic.style.transform = 'scale(1)';
    box.style.display = 'flex';
  };
  window.__dshMemeZoom = { open, close };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, true);
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t || t.tagName !== 'IMG' || t === pic) return;
    if (!t.closest('[data-chat-flow],[data-chat-flow-key]')) return;
    e.preventDefault();
    e.stopPropagation();
    open(t.currentSrc || t.src, t.alt);
  }, true);
};
installMemeZoom();
// [patch-dsh-meme-fitimg] 尺寸归一：短边 112、长边 264、不超过原图
;(() => {
  if (document.getElementById('dsh-meme-fit-css')) return
  const st = document.createElement('style')
  st.id = 'dsh-meme-fit-css'
  st.textContent = 'img[data-meme-img][data-meme-fit]{width:var(--meme-w)!important;height:var(--meme-h)!important;max-width:none!important;max-height:none!important;object-fit:contain}'
  document.head.appendChild(st)
  const SHORT = 112
  const LONG_MAX = 264
  const fit = (img) => {
    if (!img || img.dataset.memeFit === '1') return
    const apply = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (!w || !h) return
      img.dataset.memeFit = '1'
      let scale = Math.min(1, SHORT / Math.min(w, h))
      if (Math.max(w, h) * scale > LONG_MAX) scale = LONG_MAX / Math.max(w, h)
      const dw = Math.max(48, Math.round(w * scale))
      const dh = Math.max(48, Math.round(h * scale))
      img.style.setProperty('--meme-w', dw + 'px')
      img.style.setProperty('--meme-h', dh + 'px')
    }
    if (img.complete && img.naturalWidth) apply()
    else img.addEventListener('load', apply, { once: true })
  }
  const all = () => { document.querySelectorAll('img[data-meme-img]').forEach(fit) }
  try { new MutationObserver(all).observe(document.body, { childList: true, subtree: true }) } catch (e) {}
  all()
})();

// [patch-dsh-meme-bareimage] 纯 CSS：抹掉气泡壳子的背板感，但绝不参与显隐
;(() => {
  if (document.getElementById('dsh-meme-bareimage-css')) return
  const st = document.createElement('style')
  st.id = 'dsh-meme-bareimage-css'
  st.textContent = [
    '[data-meme-bare]{background:transparent!important;background-color:transparent!important;background-image:none!important;border-color:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
    '[data-meme-bare] img[data-meme-img]{display:block!important;visibility:visible!important;opacity:1!important;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.32)}',
  ].join('')
  document.head.appendChild(st)
})();
// [patch-dsh-meme-noflip] 用 CSS（而不是 JS 改显示）把「已经配到图」的 [表情: 描述] 原文藏掉。
// 用户反馈（2026-10-11）：点了表情包发出去，气泡里先闪一整行给模型看的注释文字，要等一拍才
// 变图。宿主流式渲染会在我们注入之后重写纯文本子节点，JS 隐藏会被它翻回来；CSS 规则每次都
// 重新求值，盖得住。只对**兄弟里有 img[data-meme-hide-raw] 的文本**和**正在配图的
// [data-meme-pending]** 生效——真配不上图（降级成描述文字）时没有任何 img，原文照旧可见，
// 不会出现「空气泡」。ghost（display:none，存着原文供别的插件比对）不受影响。
;(() => {
  if (document.getElementById('dsh-meme-noflip-css')) return
  const st = document.createElement('style')
  st.id = 'dsh-meme-noflip-css'
  // [patch-dsh-meme-notext 2026-10-12] 用户又报「点了表情包，图不立马出来，先出现一串给 ai 的
  // 注释」——上一版的 `img[data-meme-hide-raw]~span` 要求「注释元素是 img 的**兄弟**」。可落点
  // 补丁把 img 提到气泡层之后，注释文本往往被宿主缠在 <p>/<span> 里（img 和它同父不同层），
  // `~` 一个都匹配不上 → 注释就一直晾着。这里补两条「父级/祖先级」判据：
  //   ① img 同一层里还有别的元素（那个多半就是装注释的 p/span）→ 藏掉（不碰 ghost、不碰 img）；
  //   ② 整个气泡里只要有 img[data-meme-hide-raw]、且没有任何**可见文本**（!textWithoutGhosts），
  //      就把这层里所有 span/div/p 收掉——正好匹配落点补丁那条「气泡只被掏走了文本节点」的形状。
  st.textContent = [
    'img[data-meme-hide-raw]~span:not([data-meme-hidden]),img[data-meme-hide-raw]~div:not([data-meme-hidden]),img[data-meme-hide-raw]~p:not([data-meme-hidden]){display:none!important}',
    'img[data-meme-hide-raw]~*:not([data-meme-hidden]):not(img):not([data-meme-img]){display:none!important}',
    '[data-meme-bare]:has(img[data-meme-hide-raw]) span:not([data-meme-hidden]),[data-meme-bare]:has(img[data-meme-hide-raw]) div:not([data-meme-hidden]):not(:has([data-meme-img])),[data-meme-bare]:has(img[data-meme-hide-raw]) p:not([data-meme-hidden]){display:none!important}',
    // 配图中：0.25s 兜底（原 4s）。结论早知道早好——图 200ms 内就回来了，等 4 秒没有意义；
    // 真配不上时 250ms 后原文自己回来，气泡也不会空着。
    '[data-meme-pending] span:not([data-meme-hidden]){display:none!important;animation:dsh-meme-noflip-show .25s step-end 1 forwards}',
    '[data-meme-pending]:not(:has(img[data-meme-img])) p:not([data-meme-hidden]),[data-meme-pending]:not(:has(img[data-meme-img])) div:not([data-meme-hidden]){display:none!important;animation:dsh-meme-noflip-show .25s step-end 1 forwards}',
    '@keyframes dsh-meme-noflip-show{0%,99.9%{display:none}100%{display:inline}}',
  ].join('')
  document.head.appendChild(st)
})();
// [patch-dsh-meme-hover] 悬停预览：停 140ms 浮出大图 + 描述
const installMemeHoverPreview = () => {
  if (window.__dshMemeHover) return
  window.__dshMemeHover = true
  let box = null
  let timer = 0
  let current = null
  const ensure = () => {
    if (box) return box
    box = document.createElement('div')
    box.className = 'dsh-meme-hover'
    box.style.cssText = 'position:fixed;z-index:2147483001;pointer-events:none;display:none;padding:6px;border-radius:12px;background:rgba(22,22,26,.95);box-shadow:0 14px 44px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.08)'
    const img = document.createElement('img')
    img.alt = ''
    img.style.cssText = 'display:block;max-width:328px;max-height:328px;border-radius:8px;background:rgba(255,255,255,.04)'
    box.appendChild(img)
    document.body.appendChild(box)
    return box
  }
  const hide = () => {
    clearTimeout(timer)
    current = null
    if (box) box.style.display = 'none'
  }
  const show = (cell) => {
    if (!cell.isConnected) return
    const url = cell.dataset.memeSrc || (String(cell.style.backgroundImage).match(/url\(["']?(.*?)["']?\)/) || [])[1]
    if (!url) return
    const b = ensure()
    const img = b.querySelector('img')
    if (img.getAttribute('src') !== url) img.setAttribute('src', url)
    b.style.display = 'block'
    const r = cell.getBoundingClientRect()
    const bw = b.offsetWidth
    const bh = b.offsetHeight
    let left = Math.max(10, Math.min(window.innerWidth - bw - 10, r.left + r.width / 2 - bw / 2))
    let top = r.top - bh - 10
    if (top < 10) top = Math.min(window.innerHeight - bh - 10, r.bottom + 10)
    b.style.left = left + 'px'
    b.style.top = Math.max(10, top) + 'px'
  }
  document.addEventListener('mouseover', (e) => {
    const t = e.target
    const cell = t && t.closest ? t.closest('.mp-cell,.meme-thumb') : null
    if (!cell || cell === current) return
    // 顺手摘掉原生 title 提示（否则浏览器自己会浮出一行描述，用户不需要看到注释）
    if (cell.hasAttribute && cell.hasAttribute('title')) {
      cell.dataset.memeTitle = cell.getAttribute('title') || ''
      cell.removeAttribute('title')
    }
    current = cell
    clearTimeout(timer)
    timer = setTimeout(() => show(cell), 140)
  }, true)
  document.addEventListener('mouseout', (e) => {
    const t = e.target
    const cell = t && t.closest ? t.closest('.mp-cell,.meme-thumb') : null
    if (!cell) return
    if (e.relatedTarget && cell.contains(e.relatedTarget)) return
    hide()
  }, true)
  document.addEventListener('scroll', hide, true)
  document.addEventListener('pointerdown', hide, true)
  window.addEventListener('blur', hide)
}
installMemeHoverPreview();

const decorateMemeText = () => {
        let degraded = false // [patch-dsh-meme-index]
        // [patch-dsh-meme-pincode] 认不出的稳定码只允许触发一次索引重拉（拉完就是第二遍），
        // 免得每轮扫描都因为一条早被删掉的旧消息反复打接口。
        const recheck = memeIndexNeedsRecheck
        if (recheck) memeIndexNeedsRecheck = false
        // 宿主重渲染(切语言/切主题/HMR)会让 React 对纯文本 children 走 textContent 覆写:
        // 注入的 img 和 ghost 一起被抹掉、原文裸露,而 data-meme-decorated 在元素属性上,
        // 覆写不影响它 → 标记还在、注入已不在,下面的 acceptNode 见标记就永久跳过,图再也
        // 回不来,刷新页面才恢复(issue #26)。每轮扫描先摘孤儿标记:注入 = img + ghost,
        // 两个都不在了才认孤儿;降级装饰(图库未命中、只有 ghost)不能动,否则每轮扫描都在
        // 白白重写这段 DOM。摘完标记本轮就会重新装饰;上一轮幸存的同描述图由 dedupeMemeImages 去重。
        // 同一轮顺带处理「隐藏残留」:hide walk 只藏不露,React 之后往同一个元素写回可见文本
        // (流式追加/编辑消息)时元素还带着 display:none,内容会永久不可见——按「现在有没有
        // 可见文本」翻回来,只动打过 data-meme-empty 标记的,宿主自己隐藏的元素不碰。
        for (const el of document.querySelectorAll('[data-meme-decorated],[data-meme-empty]')) {
          // [patch-dsh-meme-notext 2026-10-12] 孤儿判据以前是「既没图、又没 ghost」。摘标记改成
          // 文本级之后，一条消息正文里的标记也会留下 [data-meme-hidden] 的 ghost → 那些被宿主
          // 覆写掉 img、只剩 ghost 的元素再也摘不掉标记，本轮扫描照样跳过它，图回不来（刷新才行）。
          // 改成「没图 + 子节点全是 ghost（除了 ghost 没别的东西）」才算孤儿。
          let onlyGhosts = true
          for (const child of el.childNodes) {
            if (child.nodeType === 1 && child.dataset && child.dataset.memeHidden) continue
            onlyGhosts = false
            break
          }
          if (!el.querySelector('img[data-meme-img]') && onlyGhosts) delete el.dataset.memeDecorated
          // [patch-dsh-meme-index] 降级装饰（只有 ghost、没图）是「当时索引里没有这张」的产物。
          // 索引一旦重拉过就给它一次重试机会：ghost 里装着原文标记，textContent 拼起来与
          // 替换前逐字一致，还原成裸文本让本轮扫描重新处理即可。只在「元素子节点除了 ghost
          // 再没别的元素」时才动手，避免把带格式(br/strong/链接)的消息压平。
          else if (el.dataset.memeDegradedAt && !el.querySelector('img[data-meme-img]') && el.dataset.memeDegradedAt !== String(memeIndexAt)) {
            let onlyGhosts = true
            for (const child of el.children) { if (!child.dataset || !child.dataset.memeHidden) { onlyGhosts = false; break } }
            if (onlyGhosts) {
              el.textContent = el.textContent
              delete el.dataset.memeDecorated
              delete el.dataset.memeDegradedAt
            }
          }
          if (el.dataset.memeEmpty && textWithoutGhosts(el).trim()) {
            delete el.dataset.memeEmpty
            el.style.display = ''
          }
        }
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement
            if (!parent) return NodeFilter.FILTER_REJECT
            // 只渲染「对话」气泡。轨迹 / Think / 工具卡 / 输入框保持纯文本。
            // 容器标记认两个:老版本是 data-chat-flow,DSH 0.1.2 起消息行是 data-chat-flow-key
            // (issue #22 附录,使用者在新版上实测)。只认前者的话新版上 TreeWalker 一个节点都
            // 扫不到、表情永不转图;多认一个纯增益。
            const flowEl = parent.closest('[data-chat-flow],[data-chat-flow-key]')
            if (!flowEl) return NodeFilter.FILTER_REJECT
            if (parent.closest('input,textarea,[contenteditable="true"],[data-variant="think"],[data-variant="others"],pre,code')) {
              return NodeFilter.FILTER_REJECT
            }
            // 自己的 ghost 里装着 [表情: x] 原文,不排掉就会被反复装饰
            if (parent.closest('[data-meme-hidden]')) return NodeFilter.FILTER_REJECT
            if (parent.dataset && parent.dataset.memeDecorated) return NodeFilter.FILTER_REJECT
            // 0.2 宿主(dsh-client-ui-chat 0.2.0-rc.2)源码核对:① 工具/步骤轨迹整行是
            // data-chat-flow-kind="turn-process",宿主自己枚举行时也排除它,不排的话新版上
            // 轨迹文本会被装饰;② 分组折叠容器 ChatGroupSeat 的根上同时挂着
            // data-chat-group-key 和 data-chat-flow-key,分组头部文本最近命中的是分组本身,
            // 放行会把图提到分组顶上。消息行(FlowItem)只有 flow-key,不受影响。两个标记
            // 老版宿主都没有,加了纯增益。
            if (parent.closest('[data-chat-flow-kind="turn-process"]')) return NodeFilter.FILTER_REJECT
            if (flowEl.getAttribute('data-chat-group-key') !== null) return NodeFilter.FILTER_REJECT
            return MEME_TEXT_TEST.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
          },
        })
        const nodes = []
        let n
        while ((n = walker.nextNode())) nodes.push(n)
        for (const node of nodes) {
          const parent = node.parentElement
          if (!parent || parent.dataset.memeDecorated) continue
          const text = node.nodeValue || ''
          MEME_TEXT_RE.lastIndex = 0
          const matches = []
          let m
          while ((m = MEME_TEXT_RE.exec(text))) matches.push(m)
          if (matches.length === 0) continue
          const needsLookup = matches.some((hit) => !hit[2]) // [patch-dsh-meme-pincode] 有码就不用查表
          // [patch-dsh-meme-notext 2026-10-12 第二刀] 用户报：「发表情包的时候，注释不会立马
          // 消失，先冒出来一串给 AI 的注释」。这一支就是那个空窗：码/描述还没查表，图一个都没
          // 插上，而下面所有隐藏逻辑的前提都是「这一行已经有 img[data-meme-img]」——
          // 于是索引没到手之前（最长 15s）那串注释就明晃晃挂着。
          // 先把它摘掉（只摘那一段字，正文不动），等图落下来就自然留着藏；宽限期到点图还没来，
          // unmaskStalePending() 会把原文放回去，不会留一块空气泡。用户在 DSH 里发的时候，
          // 宿主那边「已发送」的气泡走的也是这段文本节点，所以这一下闪现在自己发的消息上最明显。
          maskMarksInTextNode(node)
          parent.dataset.memePendingAt = String(Date.now())
          loadMemeIndex()

          if (needsLookup && recheck) {
            // 这一遍本来就是「码表刚更新」的重扫，还是查不到就直接放弃这一条（不装饰、
            // 不标 memeDecorated，下次别的事件驱动扫描还能再试），别再触发第三遍。
            continue
          }
          parent.dataset.memeDecorated = '1'
          delete parent.dataset.memeDegradedAt // [patch-dsh-meme-index] 装饰成功 → 不再是降级态
          // [patch-dsh-meme-noflip] 这一条消息里有「配得到图」的标记 → 先把整个 text 节点按
          // 「配图中」藏起来（CSS 规则），图注入完成的瞬间这里就撤标记。索引里没有对应图、
          // 后面走降级分支时也不会留标记（只有 fig 配到才设）。万一图片请求挂了，样式表里
          // 那个 4s 兜底动画会把原文放回来，不会留一个空气泡。
          if (matches.some((hit) => memeSrcFor(hit))) { // [patch-dsh-meme-pincode]
            parent.dataset.memePending = '1'
            parent.dataset.memePendingAt = String(Date.now())
          }
          const frag = document.createDocumentFragment()
          const imgs = []
          let last = 0
          for (const hit of matches) {
            if (hit.index > last) frag.appendChild(document.createTextNode(text.slice(last, hit.index)))
            const label = memeTokenLabel(hit) // [patch-dsh-meme-dualcode]
            const src = memeSrcFor(hit) // [patch-dsh-meme-pincode] 码/URL 优先，描述匹配只兜底
            if (src) {
              const img = document.createElement('img')
              img.src = src
              // [patch-dsh-meme-notext 2026-10-12] 长会话里几百张图一起解码会把主线程堵住 → 丢帧、
              // 图迟迟不出来。原生懒加载 + 异步解码：屏幕外的图不抢带宽和解码时间。
              img.loading = 'lazy'
              img.decoding = 'async'
              img.alt = hit[0].slice(0, 60)
              // [patch-dsh-meme-notitle] 不留 title：鼠标停在图上也别浮出描述文字
              img.dataset.memeImg = foldCaption(label) // 去重用的描述标记 // [patch-dsh-meme-dualcode]
              // [patch-dsh-meme-noflip] 图已经拿到手了 → 让 CSS 把同一层的注释原文吃掉
              // （没走「配图中」那条路的命中——例如插了短码的老消息——也一并藏掉）。
              img.setAttribute('data-meme-hide-raw', '1')
              img.style.cssText = 'max-width:var(--dsh-meme-inline-size,130px);max-height:var(--dsh-meme-inline-size,130px);border-radius:10px;display:block;margin:8px 0'
              frag.appendChild(img)
              frag.appendChild(ghostFor(hit[0]))
              imgs.push(img)
            } else {
              // 无命中:降级只显示描述原文,不把 [表情: ...] 标记裸露给用户。方括号单独用 ghost
              // 藏起来——可见的只有描述本身,而 textContent 仍是替换前那个 [表情: x] 逐字不差,
              // 否则比对 textContent 的插件照样会把这条打回(issue #22 第 2 条)。
              const at = hit[0].indexOf(']') - hit[1].length
              const codePart = hit[1].length > label.length ? hit[1].slice(0, hit[1].length - label.length) : ''
              frag.appendChild(ghostFor(hit[0].slice(0, at))) // [patch-dsh-meme-dualcode]
              if (codePart) frag.appendChild(ghostFor(codePart))
              frag.appendChild(document.createTextNode(label))
              frag.appendChild(ghostFor(hit[0].slice(at + hit[1].length)))
              parent.dataset.memeDegradedAt = String(memeIndexAt) // [patch-dsh-meme-index]
              degraded = true
            }
            last = hit.index + hit[0].length
          }
          if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
          parent.replaceChild(frag, node)
          // [patch-dsh-meme-noflip] 图已经落到 DOM 上，撤掉「配图中」标记，交给
          // img[data-meme-hide-raw] 那条规则继续压着原文。
          delete parent.dataset.memePending
          delete parent.dataset.memePendingAt
          const row = parent.closest('[data-time-hover-root],[data-chat-flow-key]')
          if (row && imgs.length > 0) {
            // 用户 / steering 消息是右对齐的,但那个右对齐挂在气泡外面那层 flex 列容器
            // (宿主 MessageItem 的 userRow,align-items:flex-end)上;而这里为了掏空气泡把图
            // 提到了行元素(FlowItem,只是个普通 block)的行首,block 图落在 block 容器里默认
            // 贴左 → 自己发的表情包跑到屏幕左边(助手行本来就左对齐,一直看不出来)。按行角色
            // 补一次左外边距 auto 把图推回右边。data-chat-flow-kind 是 0.2 宿主才有的标记,
            // 老宿主取不到,行为保持原样。
            const kind = row.getAttribute('data-chat-flow-kind')
            if (kind === 'user' || kind === 'steering') {
              for (const img of imgs) img.style.marginLeft = 'auto'
            }
            // [patch-dsh-meme-below-text] 落点：气泡所在的那一层，插在气泡**紧后面**。
            // 不能塞进行元素(row)——桌面版 0.2 的行是横向 flex(头像+气泡并排)，
            // 塞进去的图会跟文字并排而不是掉到下面(2026-10-09 实测)。
            // 也不留在气泡里——气泡的 textContent 会被改，别的插件会对不上(上游 issue #22)。
            let memeHost = parent.parentElement
            if (memeHost && memeHost !== row && memeHost.isConnected) {
              let anchor = parent.nextSibling
              for (const img of imgs) memeHost.insertBefore(img, anchor)
              // 气泡只被掏走了文本节点、现在又把图放回它外面，气泡自己必须重新可见，
              // 否则图就成了「没有主人的浮块」。
              // [patch-dsh-meme-bareimage] 只有表情包的消息：只加标记交给 CSS 抹壳子，绝不改 display/尺寸
              {
                let shell = parent
                for (let up = 0; up < 6 && shell && shell.parentElement; up++) {
                  if (/bubble/i.test(String(shell.className || ''))) break
                  shell = shell.parentElement
                }
                if (imgs.length > 0 && textWithoutGhosts(shell).trim() === "") shell.setAttribute('data-meme-bare', '1')
                else shell.removeAttribute('data-meme-bare')
              }
            } else {
              // 兜底：宿主若真是「行 = 气泡」(web 版那种结构)，退回 v1 的落点。
              for (const img of imgs) row.appendChild(img)
            }
            // 中间层被掏空才隐藏,并打 memeEmpty 标记(回显逻辑见函数开头的清理段)
            let el = parent
            while (el && el !== row) {
              // [patch-dsh-meme-index] 别把「装着图的那一层」也藏了：落点补丁把 img 提到气泡层，
              // 整条消息只有一个 [表情: x] 时气泡里就没有可见文本 —— 照旧藏掉等于把图一起藏了，
              // 用户只看到一块空白（2026-10-09 实测：自己发一张纯表情包消息＝空白）。
              if (!textWithoutGhosts(el).trim() && !el.querySelector('img[data-meme-img]')) {
                el.style.display = 'none'
                el.dataset.memeEmpty = '1'
              }
              el = el.parentElement
            }
          }
        }
        // [patch-dsh-meme-index] 有降级、且索引已过期 → 强制重拉一次（冷却一个 TTL）。
        // 拉完 loadMemeIndex 自己会再扫一遍，降级那条由上面的还原逻辑救回来。
        if (memeIndex && Date.now() - memeIndexAt > MEME_INDEX_TTL && Date.now() > memeRefreshGate) { // [patch-dsh-meme-pickmap] 去掉 degraded 条件
          memeRefreshGate = Date.now() + MEME_INDEX_TTL
          loadMemeIndex(true)
        }
        dedupeMemeImages()
        hideMemeRawText() // [patch-dsh-meme-notext] 图配上了就把注释原文摘出可见树
        markStaleRawText() // [patch-dsh-meme-notext] 宿主流式渲染重写过的文本节点：盖个记号
        hideStaleRawText() // [patch-dsh-meme-notext] 把那一行里还露着标记的层收掉
        unmaskStalePending() // [patch-dsh-meme-notext 第二刀] 宽限期内没配上图的，把摘掉的原文放回来
      }
      // 设置侧边栏「表情包」行的齿轮图标替换成笑脸(dsh navIcon 硬编码,不支持自定义)
      const decorateNavIcon = () => {
        const nav = document.querySelector('[role="dialog"] nav')
        if (!nav) return
        // 同 decorateMemeText 的孤儿标记(issue #26):面板重渲染抹掉注入后,btn 上的标记
        // 不该再拦着重新装饰。标记分两档:真注入过的才是 '1'(svg 上有 data-meme-nav-icon
        // 为证),没图标/图标是 IMG 这种「没得换」的记 'skip',清理时不碰。
        for (const btn of nav.querySelectorAll('button[data-meme-nav="1"]')) {
          if (!btn.querySelector('svg[data-meme-nav-icon]')) delete btn.dataset.memeNav
        }
        for (const btn of nav.querySelectorAll('button')) {
          if (btn.dataset.memeNav) continue
          if (!btn.textContent || !btn.textContent.includes('表情包')) continue
          const icon = btn.firstElementChild
          if (!icon || icon.tagName === 'IMG') { btn.dataset.memeNav = 'skip'; continue }
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          svg.setAttribute('viewBox', '0 0 24 24')
          svg.setAttribute('data-meme-nav-icon', '1')
          svg.style.cssText = 'width:16px;height:16px;flex:none'
          const mk = (tag, attrs) => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
            for (const k in attrs) el.setAttribute(k, attrs[k])
            return el
          }
          svg.appendChild(mk('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z', fill: 'currentColor' }))
          icon.replaceWith(svg)
          btn.dataset.memeNav = '1'
        }
      }
      // 扫描是「全文档 TreeWalker + 每个文本节点跑一遍正则」,不便宜;流式输出期间
      // mutation 密集,每来一条就整篇扫一遍会在长会话里雪崩(点进去明显卡顿)。
      // 防抖 300ms,但必须有 maxWait 兜底:纯 trailing 防抖在 mutation 连续不断时会被
      // 无限重排(每次 mutation 都清掉重排 300ms),页面从此不再扫描、[表情: x] 一路
      // 裸露,刷新也不自愈——这是比卡顿更难查的一层。
      const SCAN_DEBOUNCE = 300
      const SCAN_MAX_WAIT = 1200
      let scanTimer = 0
      let scanDeadline = 0
      let scanning = false
      const runScan = () => {
        if (scanning) return // 重入保护:装饰本身改 DOM,会再触发 observer
        scanning = true
        try {
          // [patch-dsh-meme-notext 第二刀] 先查有没有「藏超时」的（索引挂了的时候，藏起来的那段
          // 注释得放回去）。放在 decorateMemeText 前面：它可能会清 memeDecorated，正好让这一遍重扫。
          unmaskStalePending()
          decorateMemeText()
          decorateNavIcon()
        } catch (error) {
          // 装饰失败不该打断宿主渲染:最多是这一轮表情不转图
          console.warn('[dsh-expression] 表情装饰失败:', error && error.message ? error.message : error)
        } finally {
          scanning = false
        }
      }
      const scheduleScan = () => {
        const now = Date.now()
        if (scanDeadline === 0) scanDeadline = now + SCAN_MAX_WAIT
        clearTimeout(scanTimer)
        scanTimer = setTimeout(() => {
          scanTimer = 0
          scanDeadline = 0
          runScan()
        }, Math.max(0, Math.min(SCAN_DEBOUNCE, scanDeadline - now)))
      }
      const observer = new MutationObserver((records) => {
        // 只认真正影响文本的变动;纯属性变化(宿主的 hover/动画很吵)不值得重扫
        for (const record of records) {
          if (record.type === 'characterData' || record.addedNodes.length || record.removedNodes.length) {
            scheduleScan()
            return
          }
        }
      })
      observer.observe(document.body, { childList: true, subtree: true, characterData: true })
      runScan()
      ctx.effect(() => () => {
        observer.disconnect()
        clearTimeout(scanTimer)
        scanTimer = 0
        scanDeadline = 0
      }, 'dsh-expression-entry: meme text observer')

      const slots = ctx.get('slots')
      if (slots === undefined) return
      slots.inject('settings.section', () => slots.register(
        { name: 'settings.section', id: 'memes', order: 25, label: '表情包' },
        () => React.createElement(MemePanel, { ctx }),
      ))

      // 输入框快捷发图(QQ 式)。
      const store = makeMemeStore()
      // Hoisted out of the render callback on purpose: makeMemeButton() returns a fresh
      // function component on every call, so creating it inside the slot render callback
      // hands React a new component type on every re-render → the trigger button is
      // unmounted and remounted each time (measured 20+ rebuilds/second while a turn is
      // streaming), which in turn wakes every full-body MutationObserver in the host.
      const MemeButton = makeMemeButton(store)
      slots.inject('conversation.input.left', () => slots.register(
        { name: 'conversation.input.left', id: 'meme-picker', order: 5, label: '表情包' },
        () => React.createElement(MemeButton),
      ))
      slots.inject('conversation.input.overlay', () => slots.register(
        { name: 'conversation.input.overlay', id: 'meme-picker', order: 5, label: '表情包' },
        (props) => React.createElement(MemeBoard, {
          store,
          inputActions: props.inputActions,
          useInput: props.useInput,
          getConversation: () => ctx.get('conversation'),
        }),
      ))
    }

    // [patch-dsh-meme-notext 2026-10-12] 这两块本来写在 apply() 里，现在提到工厂顶层：
    // 兜底那一层要在 apply 外面也能调 hideMemeRawText，而且它自己要用 textWithoutGhosts。
    // 判断「这层是不是已经空了、要不要隐藏」必须无视 ghost——ghost 里装着原文标记，
    // 拿 textContent 判空会永远非空，气泡里会留一块空白。
    const textWithoutGhosts = (el) => {
      let out = ''
      for (const child of el.childNodes) {
        if (child.nodeType === 3) { out += child.nodeValue || ''; continue }
        if (child.nodeType !== 1) continue
        if (child.dataset && child.dataset.memeHidden) continue
        out += textWithoutGhosts(child)
      }
      return out
    }

    // [patch-dsh-meme-notext 2026-10-12] 摘标记时要绕开的容器：输入框、代码块，以及轨迹 / Think /
    // 工具卡。装饰侧（2358 那一带）本来就排这些，兜底层当初只排了输入框 —— 结果「正文里演示一下
    // 这个格式」的代码块会被当成注释收掉（评审 AC-3）。
    const MEME_EXCLUDE_SEL = 'input,textarea,[contenteditable="true"],[data-variant="think"],[data-variant="others"],pre,code'

    // [patch-dsh-meme-notext 2026-10-12] 把**一个文本节点**里的标记段包成 ghost，正文原样留着。
    // 返回是否真的动过手。两层共用：第一层（配图成功那条路）和第二层（宿主把文本节点重写之后）
    // 要摘的形状完全一样，复制两份迟早走样 —— 评审就是在这里抓到「元素级 vs 文本级」不一致的。
    // 边界只吃到 `]`（可选带上 ·码）：尾巴上的 (URL) 留着不摘，它本来也不显眼，而多吃一个字符
    // 就多一次把正文吃进去的机会。
    const maskMarksInTextNode = (node) => {
      const parent = node.parentNode
      if (!parent) return false
      const text = node.nodeValue || ''
      const re = /\[(?:表情|m):[^\]]*\](?:\s*·c[0-9a-f]{5,6})?/g
      let at = 0
      let hit
      let wrapped = false
      const frag = document.createDocumentFragment()
      while ((hit = re.exec(text))) {
        if (hit.index > at) frag.appendChild(document.createTextNode(text.slice(at, hit.index)))
        const ghost = document.createElement('span')
        ghost.setAttribute('data-meme-hidden', '1')
        ghost.style.display = 'none'
        ghost.textContent = hit[0]
        frag.appendChild(ghost)
        wrapped = true
        at = hit.index + hit[0].length
      }
      if (!wrapped) return false
      if (at < text.length) frag.appendChild(document.createTextNode(text.slice(at)))
      parent.replaceChild(frag, node)
      return true
    }

    // [patch-dsh-meme-notext 2026-10-12 第二刀] 上面那一下「索引没到手就先摘掉」的兜底：
    // 宽限期内图还没落下来（索引挂了 / 这张图真不在库里），就把摘掉的那段原文**放回可见**。
    // 只认我们自己盖的两个东西：memePendingAt 和 [data-meme-hidden]；已经长出
    // img[data-meme-img] 的行不动（那条路的藏是有依据的）。
    const unmaskStalePending = () => {
      if (!document.querySelector('[data-meme-pending-at]')) return // 常态下这一句就返回了
      const stale = []
      for (const el of document.querySelectorAll('[data-meme-pending-at]')) {
        const at = parseInt(el.getAttribute('data-meme-pending-at') || '0', 10) || 0
        if (!at || Date.now() - at < MEME_MASK_GRACE) continue
        stale.push(el)
      }
      for (const el of stale) {
        el.removeAttribute('data-meme-pending-at')
        if (el.querySelector('img[data-meme-img]')) continue // 图已经来了，藏得有理
        for (const ghost of el.querySelectorAll('[data-meme-hidden]')) {
          // 只放回**我们摘的那种**（装的是标记原文）；ghostFor() 造的占位 ghost 不动
          if (/^\[(?:表情|m):/.test(ghost.textContent || '')) ghost.style.display = '' // 内联 display:none 撤掉
        }
        // 这一行还露着标记 → 别让下一遍冻结它，重新走一次装饰（真配不到图会走降级，只显示描述）
        if (/\[(?:表情|m):/.test(textWithoutGhosts(el))) {
          delete el.dataset.memeDecorated
          delete el.dataset.memeDegradedAt
        }
        scheduleScan()
      }
    }

    const hideMemeRawText = () => {
      if (!document.querySelector('img[data-meme-img],img[data-meme-hide-raw]')) return
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/\[(?:表情|m):/.test(n.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) })
      const found = []
      let cur
      while ((cur = walker.nextNode())) found.push(cur)
      for (const node of found) {
        const parent = node.parentElement
        if (!parent) continue
        if (parent.closest('[data-meme-hidden]')) continue // 我们自己那份 ghost，留着
        if (parent.closest(MEME_EXCLUDE_SEL)) continue
        const row = parent.closest('[data-chat-flow],[data-chat-flow-key],[data-time-hover-root]')
        if (!row || !row.querySelector('img[data-meme-img]')) continue // 这条消息真把图配上了才摘
        maskMarksInTextNode(node)
      }
    }

    // [patch-dsh-meme-notext 2026-10-12] 兜底那层：JS 摘过之后，宿主的流式渲染还会把纯文本
    // 子节点**重写成新的文本节点**，而父元素还挂着 data-meme-decorated → decorateMemeText 的
    // TreeWalker 直接跳过、JS 再也不会碰它，气泡里就永久留着一行 [表情: …]（用户 2026-10-12
    // 复制给我的就是这个）。这里做两件事：① 在「还露着标记、而且这一行真配到图了」的消息行上
    // 盖 data-meme-rawleft；② 把那一行里还露着的标记**按文本段**摘掉。
    // ⚠️ 2026-10-12 评审改：② 原来是「这一层含标记字样就 el.style.display='none'」（元素级），
    // 同一条 <p> 里的正文会跟着消失，而且没盖任何标记 → 装饰侧的恢复逻辑找不到它，只能刷新才
    // 回来。现在改成跟 ① 层一样的**文本级**处理：只把标记那一段包进 [data-meme-hidden] 的
    // span，正文原样留着、宿主写回也不受影响。用 JS 逐文本判而不是纯 CSS——CSS 没有「这个元素
    // 里有这段字」的选择器，`:has(>img)` 也匹配不到「img 在兄弟层、注释在祖父层」的形状。
    // 没配到图的行一律不碰（降级态要看得见描述，不能给空气泡）。
    const markStaleRawText = () => {
      for (const el of document.querySelectorAll('[data-meme-rawleft]')) delete el.dataset.memeRawleft
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/\[(?:表情|m):/.test(n.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) })
      let cur
      while ((cur = walker.nextNode())) {
        const parent = cur.parentElement
        if (!parent) continue
        if (parent.closest('[data-meme-hidden]')) continue // 自己那份 ghost 不算
        if (parent.closest(MEME_EXCLUDE_SEL)) continue
        const row = parent.closest('[data-chat-flow],[data-chat-flow-key],[data-time-hover-root]')
        if (!row || !row.querySelector('img[data-meme-img]')) continue
        row.dataset.memeRawleft = '1'
      }
    }
    const hideStaleRawText = () => {
      for (const row of document.querySelectorAll('[data-meme-rawleft]')) {
        const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/\[(?:表情|m):/.test(n.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) })
        const found = []
        let cur
        while ((cur = walker.nextNode())) found.push(cur)
        for (const node of found) {
          const parent = node.parentElement
          if (!parent) continue
          if (parent.closest('[data-meme-hidden]')) continue // 已经摘过的 ghost
          if (parent.closest(MEME_EXCLUDE_SEL)) continue // 代码块 / Think 里的字面量不动
          if (maskMarksInTextNode(node)) { /* 摘掉一段 */ }
        }
      }
    }
    ;(() => {
      if (document.getElementById('dsh-meme-notext-css')) return
      const st = document.createElement('style')
      st.id = 'dsh-meme-notext-css'
      // [patch-dsh-meme-notext 2026-10-12] 老兄弟判据：注释元素真跟图片同层、而且它就是纯文字
      // 容器时，CSS 比 JS 快一步（不等下一轮扫描）。
      // ⚠️ 原来这条是 `~*`（图片之后的**所有**兄弟元素），评审 AC-5 指出它会连 <br>/<strong>/<a>
      // 甚至正文段落一起 `display:none!important`，而且 !important 一旦命中，JS 想恢复都恢复不了。
      // 现在只认纯文字容器（span/div/p），`<br>` 和行内元素不碰——真漏了还有 JS 那层按文本段摘。
      st.textContent = 'img[data-meme-img]:not([data-meme-hidden])~span:not([data-meme-hidden]):not([data-meme-img]),img[data-meme-img]:not([data-meme-hidden])~div:not([data-meme-hidden]):not([data-meme-img]),img[data-meme-img]:not([data-meme-hidden])~p:not([data-meme-hidden]):not([data-meme-img]){display:none!important}'
      document.head.appendChild(st)
    })()
    exports.apply = apply
    exports.inject = inject
    // 纯函数导出仅用于回归测试(node --test),宿主/打包不消费
    exports.__test = { foldCaption, looseCaption, splitDescTokens, buildMemeSearch, matchDesc, compareVersions }
    return module.exports
  },
})
