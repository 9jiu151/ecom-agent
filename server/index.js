const express = require('express')
const compression = require('compression')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const ROOT = path.resolve(__dirname, '..')
const ASSETS_DIR = path.join(ROOT, 'assets')
const UPLOAD_DIR = path.join(ROOT, 'uploads')
const OUTPUT_DIR = path.join(ROOT, 'outputs')
const DATA_DIR = path.join(ROOT, 'data')
const GENERATED_DIR = path.join(DATA_DIR, 'generated')
const WEB_DIST = path.join(ROOT, 'web', 'dist')

for (const dir of [ASSETS_DIR, UPLOAD_DIR, OUTPUT_DIR, DATA_DIR, GENERATED_DIR]) {
  fs.mkdirSync(dir, { recursive: true })
}

const app = express()
app.disable('x-powered-by')
app.use(compression())
app.use(express.json({ limit: '25mb' }))

const CATEGORY_LABELS = {
  single: '单肩包',
  backpack: '双肩背包',
  handbag: '手提包',
  suitcase: '拉杆箱',
  wallet: '钱包'
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))
  } catch (e) {
    return fallback
  }
}

function writeJson(file, value) {
  const tmp = path.join(DATA_DIR, file + '.tmp')
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8')
  fs.renameSync(tmp, path.join(DATA_DIR, file))
}

let settings = withEnv(readJson('settings.json', { llm: {}, image: {} }))
let history = readJson('history.json', [])

/* 环境变量优先，便于部署时预置 Key、前端无需配置 */
function withEnv(s) {
  const out = { llm: { ...(s.llm || {}) }, image: { ...(s.image || {}) } }
  const map = {
    llm: { baseUrl: 'AI_LLM_BASE_URL', model: 'AI_LLM_MODEL', apiKey: 'AI_LLM_KEY' },
    image: { baseUrl: 'AI_IMAGE_BASE_URL', model: 'AI_IMAGE_MODEL', apiKey: 'AI_IMAGE_KEY' }
  }
  for (const part of ['llm', 'image']) {
    for (const [field, key] of Object.entries(map[part])) {
      if (process.env[key]) out[part][field] = process.env[key]
    }
  }
  return out
}

function masked(value) {
  if (!value) return ''
  if (value.length <= 8) return '••••'
  return value.slice(0, 3) + '••••' + value.slice(-4)
}

function publicSettings() {
  return {
    llm: {
      baseUrl: settings.llm?.baseUrl || '',
      model: settings.llm?.model || '',
      configured: Boolean(settings.llm?.apiKey),
      keyMasked: masked(settings.llm?.apiKey)
    },
    image: {
      baseUrl: settings.image?.baseUrl || '',
      model: settings.image?.model || '',
      configured: Boolean(settings.image?.apiKey),
      keyMasked: masked(settings.image?.apiKey)
    }
  }
}

/* ---------------- 基础接口 ---------------- */

app.get('/api/health', (req, res) => {
  res.json({ ok: true, data: { status: 'up', time: new Date().toISOString() } })
})

/* ---------------- 素材目录 ---------------- */

app.get('/api/catalog', (req, res) => {
  const categories = []
  for (const key of Object.keys(CATEGORY_LABELS)) {
    const dir = path.join(ASSETS_DIR, key)
    if (!fs.existsSync(dir)) continue
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort()
    categories.push({
      key,
      label: CATEGORY_LABELS[key],
      count: files.length,
      images: files.map((f) => ({
        name: f,
        url: `/assets/${key}/${encodeURIComponent(f)}`
      }))
    })
  }
  res.json({ ok: true, data: { categories } })
})

/* ---------------- 商品预设 ---------------- */

const PRODUCTS = [
  {
    id: 'bag-single',
    name: '2019新款迷你单肩包',
    shortName: '迷你单肩包',
    category: 'single',
    brand: 'LUMI',
    price: 99,
    originalPrice: 0,
    promo: '心动价 99 元包邮',
    features: ['舒适护肩', '车线工艺', '细腻面料', '压花皮表面'],
    material: 'PVC',
    colors: '红色、黑色',
    audience: '18-30岁都市女性，日常通勤与轻出行',
    tone: '日韩',
    images: ['/assets/single/01.jpg', '/assets/single/02.jpg', '/assets/single/03.jpg']
  },
  {
    id: 'bag-hand',
    name: '2020年新款凯莉贝母手提包',
    shortName: '凯莉贝母手提包',
    category: 'handbag',
    brand: 'LUMI',
    price: 199,
    originalPrice: 239,
    promo: '原价239元 活动价199元包邮',
    features: ['实用双提把', '金属锁扣装饰', 'PU皮革', '磁扣开合'],
    material: 'PU革',
    colors: '奶白色、绿色、黑色',
    audience: '青年女性，通勤与休闲聚会场景',
    tone: '轻奢',
    images: ['/assets/handbag/01.jpg', '/assets/handbag/02.jpg', '/assets/handbag/03.jpg']
  }
]

app.get('/api/products', (req, res) => {
  res.json({ ok: true, data: PRODUCTS })
})

/* ---------------- 上传 ---------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png'
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      cb(new Error('仅支持 JPG / PNG / WebP 格式'))
      return
    }
    cb(null, true)
  }
})

app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? '图片超过 10MB 限制' : err.message
      return res.status(400).json({ ok: false, error: msg })
    }
    if (!req.file) return res.status(400).json({ ok: false, error: '未收到文件' })
    res.json({
      ok: true,
      data: {
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        name: req.file.originalname
      }
    })
  })
})

/* ---------------- 历史记录 ---------------- */

app.get('/api/history', (req, res) => {
  res.json({ ok: true, data: history })
})

app.post('/api/history', (req, res) => {
  const { dataUrl, meta = {} } = req.body || {}
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return res.status(400).json({ ok: false, error: '缺少有效图片数据' })
  }
  const base64 = dataUrl.split(',')[1]
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > 12 * 1024 * 1024) {
    return res.status(400).json({ ok: false, error: '图片过大' })
  }
  const id = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  const filename = `banner-${id}.png`
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer)
  const record = {
    id,
    url: `/outputs/${filename}`,
    width: meta.width,
    height: meta.height,
    theme: meta.theme,
    themeLabel: meta.themeLabel,
    layout: meta.layout,
    mode: meta.mode,
    title: meta.title || '未命名 Banner',
    createdAt: new Date().toISOString()
  }
  history.unshift(record)
  if (history.length > 200) history = history.slice(0, 200)
  writeJson('history.json', history)
  res.json({ ok: true, data: record })
})

app.delete('/api/history/:id', (req, res) => {
  const record = history.find((h) => h.id === req.params.id)
  if (!record) return res.status(404).json({ ok: false, error: '记录不存在' })
  history = history.filter((h) => h.id !== req.params.id)
  writeJson('history.json', history)
  const file = path.join(OUTPUT_DIR, path.basename(record.url))
  fs.existsSync(file) && fs.unlinkSync(file)
  res.json({ ok: true })
})

/* ---------------- 设置 ---------------- */

app.get('/api/settings', (req, res) => {
  res.json({ ok: true, data: publicSettings() })
})

app.post('/api/settings', (req, res) => {
  const body = req.body || {}
  for (const group of ['llm', 'image']) {
    if (!body[group]) continue
    settings[group] = settings[group] || {}
    if (typeof body[group].baseUrl === 'string') settings[group].baseUrl = body[group].baseUrl.trim()
    if (typeof body[group].model === 'string') settings[group].model = body[group].model.trim()
    if (typeof body[group].apiKey === 'string' && body[group].apiKey.trim()) {
      settings[group].apiKey = body[group].apiKey.trim()
    }
    if (body[group].clearKey) settings[group].apiKey = ''
  }
  writeJson('settings.json', settings)
  res.json({ ok: true, data: publicSettings() })
})

/* ---------------- AI 代理 ---------------- */

function llmConfigured() {
  return Boolean(settings.llm?.apiKey && settings.llm?.baseUrl)
}

async function callLLM(system, user) {
  const base = settings.llm.baseUrl.replace(/\/$/, '')
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.llm.apiKey}`
      },
      body: JSON.stringify({
        model: settings.llm.model || 'qwen-plus',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7
      }),
      signal: controller.signal
    })
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`模型接口返回 ${resp.status}: ${text.slice(0, 200)}`)
    }
    const json = await resp.json()
    return json.choices?.[0]?.message?.content || ''
  } finally {
    clearTimeout(timer)
  }
}

const TASK_PROMPTS = {
  plan: '你是资深电商运营专家。根据商品信息输出 JSON：{"sellingPoints":["4条卖点，每条不超过12字"],"audience":"目标人群一句话","differentiation":"竞品差异化建议一句话","pricing":"定价建议一句话"}。只输出 JSON。',
  copy: '你是电商视觉文案专家。根据商品信息输出 JSON：{"titles":["3个商品标题，每个不超过30字"],"banners":["5条Banner短文案，每条不超过14字"],"script":["30秒短视频脚本分镜，6条，每条格式 时间|画面|口播"]}。只输出 JSON。',
  data: '你是电商数据分析师。根据商品信息输出 JSON：{"summary":"一句话结论","suggestions":["3条优化建议"]}。只输出 JSON。'
}

/* AI 接口限流：公网演示时保护 Key，避免被刷 */
const aiHits = new Map()
const AI_LIMITS = { '/text': 30, '/image': 5, '/test': 10 }
const AI_WINDOW = 10 * 60 * 1000

function aiGuard(req, res, next) {
  const forwarded = req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const ip = forwarded || req.ip || 'unknown'
  if (!forwarded && (ip === '127.0.0.1' || ip === '::1')) return next()
  const limit = AI_LIMITS[req.path]
  if (!limit) return next()
  const key = `${req.path}:${ip}`
  const now = Date.now()
  const rec = aiHits.get(key)
  if (!rec || now - rec.start > AI_WINDOW) {
    aiHits.set(key, { start: now, count: 1 })
    return next()
  }
  if (rec.count >= limit) {
    return res.status(429).json({ ok: false, error: '请求过于频繁，请稍后再试' })
  }
  rec.count += 1
  next()
}

app.use('/api/ai', aiGuard)

app.get('/api/ai/status', (req, res) => {
  res.json({
    ok: true,
    data: {
      llm: llmConfigured(),
      image: Boolean(settings.image?.apiKey),
      mode: llmConfigured() ? 'ai' : 'rule'
    }
  })
})

app.post('/api/ai/test', async (req, res) => {
  if (!llmConfigured()) {
    return res.json({ ok: false, error: '尚未配置文案大模型' })
  }
  try {
    const content = await callLLM('你是助手，只回复"连接成功"四个字。', '测试连接')
    res.json({ ok: true, data: { reply: content.slice(0, 50) } })
  } catch (err) {
    res.json({ ok: false, error: err.message })
  }
})

app.post('/api/ai/text', async (req, res) => {
  const { task, product } = req.body || {}
  if (!TASK_PROMPTS[task]) {
    return res.status(400).json({ ok: false, error: '未知任务类型' })
  }
  if (!llmConfigured()) {
    return res.json({ ok: true, data: { mode: 'rule', content: null } })
  }
  try {
    const raw = await callLLM(TASK_PROMPTS[task], JSON.stringify(product || {}))
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    res.json({ ok: true, data: { mode: 'ai', content: parsed } })
  } catch (err) {
    res.json({ ok: true, data: { mode: 'rule', content: null, fallbackReason: err.message } })
  }
})

app.post('/api/ai/image', async (req, res) => {
  if (!settings.image?.apiKey) {
    return res.json({ ok: true, data: { mode: 'rule', url: null } })
  }
  const prompt = String(req.body?.prompt || '').trim()
  if (!prompt) return res.status(400).json({ ok: false, error: '缺少提示词' })
  const base = (settings.image.baseUrl || 'https://ark.cn-beijing.volces.com/api/v3/images/generations').replace(/\/$/, '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 150000)
  try {
    const resp = await fetch(base, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.image.apiKey}`
      },
      body: JSON.stringify({
        model: settings.image.model || 'doubao-seedream-5-0-flash-260915',
        prompt: prompt.slice(0, 900),
        response_format: 'url',
        size: '2K',
        stream: false,
        watermark: false
      }),
      signal: controller.signal
    })
    const text = await resp.text()
    if (!resp.ok) throw new Error(`图像接口返回 ${resp.status}: ${text.slice(0, 200)}`)
    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      throw new Error('图像接口返回格式异常')
    }
    const remote = json.data?.[0]?.url || json.url
    if (!remote) throw new Error('图像接口未返回图片地址')

    const imgResp = await fetch(remote, { signal: controller.signal })
    if (!imgResp.ok) throw new Error(`图片下载失败 ${imgResp.status}`)
    const ctype = imgResp.headers.get('content-type') || 'image/png'
    const ext = ctype.includes('jpeg') ? 'jpg' : ctype.includes('webp') ? 'webp' : 'png'
    const name = `ai-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
    fs.writeFileSync(path.join(GENERATED_DIR, name), Buffer.from(await imgResp.arrayBuffer()))
    res.json({ ok: true, data: { mode: 'ai', url: `/generated/${name}` } })
  } catch (err) {
    res.json({ ok: false, error: err.message })
  } finally {
    clearTimeout(timer)
  }
})

/* ---------------- 静态资源 ---------------- */

app.use('/assets', express.static(ASSETS_DIR, { maxAge: '7d' }))
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))
app.use('/outputs', express.static(OUTPUT_DIR, { maxAge: '1d' }))
app.use('/generated', express.static(GENERATED_DIR, { maxAge: '7d' }))

if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST))
  app.get(/^\/(?!api|assets|uploads|outputs|generated).*/, (req, res) => {
    res.sendFile(path.join(WEB_DIST, 'index.html'))
  })
} else {
  app.get('/', (req, res) => {
    res.type('text/plain').send('前端尚未构建，请先运行 npm run build，或使用 npm run dev 访问 http://localhost:5173')
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ ok: false, error: '服务器内部错误' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`电商全流程智能体服务已启动: http://localhost:${PORT}`)
})
