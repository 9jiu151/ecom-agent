<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast, toastError } from '../lib/toast'
import { buildBannerCopy, generateContent, generateData, generatePlan, buildPlanText } from '../lib/copy'
import { drawBanner, exportDataUrl, downloadDataUrl, downloadText } from '../lib/renderer'
import { themeByKey } from '../lib/themes'

const router = useRouter()
const products = ref([])
const selectedId = ref('')
const customMode = ref(false)
const running = ref(false)
const finished = ref(false)
const elapsed = ref(0)
const canvasEls = ref([])

const form = reactive({
  name: '2019新款迷你单肩包',
  shortName: '迷你单肩包',
  brand: 'LUMI',
  price: 99,
  originalPrice: 0,
  material: 'PVC',
  colors: '红色、黑色',
  featuresText: '舒适护肩、车线工艺、细腻面料、压花皮表面',
  audience: '18-30岁都市女性，日常通勤与轻出行',
  tone: '日韩',
  promo: '心动价 99 元包邮',
  category: 'single',
  images: ['/assets/single/01.jpg', '/assets/single/02.jpg', '/assets/single/03.jpg']
})

const results = reactive({
  plan: null,
  assets: null,
  visual: null,
  content: null,
  data: null
})

const stages = reactive([
  { key: 'plan', no: '01', name: '商品策划', desc: '卖点提炼 · 人群画像 · 定价建议', status: 'idle' },
  { key: 'assets', no: '02', name: '素材筛选', desc: '商品图筛选 · 主图确定', status: 'idle' },
  { key: 'visual', no: '03', name: '视觉生成', desc: '3 版 Banner · 多尺寸 · 多风格', status: 'idle' },
  { key: 'content', no: '04', name: '内容创作', desc: '标题 · 短文案 · 短视频脚本', status: 'idle' },
  { key: 'data', no: '05', name: '数据简报', desc: '曝光转化 · 优化建议', status: 'idle' }
])

const currentProduct = computed(() => {
  if (customMode.value) {
    return {
      ...form,
      features: form.featuresText.split(/[、,，]/).map((s) => s.trim()).filter(Boolean)
    }
  }
  return products.value.find((p) => p.id === selectedId.value) || null
})

function selectProduct(p) {
  selectedId.value = p.id
  customMode.value = false
}

function enableCustom() {
  const p = products.value.find((x) => x.id === selectedId.value) || products.value[0]
  if (p) {
    Object.assign(form, {
      name: p.name,
      shortName: p.shortName,
      brand: p.brand,
      price: p.price,
      originalPrice: p.originalPrice || 0,
      material: p.material,
      colors: p.colors,
      featuresText: p.features.join('、'),
      audience: p.audience,
      tone: p.tone,
      promo: p.promo,
      category: p.category,
      images: p.images
    })
  }
  customMode.value = true
}

function resetStages() {
  stages.forEach((s) => (s.status = 'idle'))
  Object.keys(results).forEach((k) => (results[k] = null))
  finished.value = false
  elapsed.value = 0
}

function setCanvas(i, el) {
  if (el) canvasEls.value[i] = el
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function runStage(index) {
  const stage = stages[index]
  stage.status = 'running'
  const start = Date.now()

  if (stage.key === 'plan') {
    const product = currentProduct.value
    results.plan = generatePlan(product)
    const r = await api.aiText('plan', product).catch(() => ({ mode: 'rule' }))
    if (r.mode === 'ai' && r.content) {
      results.plan = { ...results.plan, ...r.content, ai: true }
    }
    stage.desc = results.plan.ai ? 'AI 已完成卖点与人群分析' : '已完成卖点提炼（规则模式）'
  } else if (stage.key === 'assets') {
    results.assets = {
      picked: currentProduct.value.images.slice(0, 3),
      note: `已从素材库筛选 ${currentProduct.value.images.length} 张，推荐主图 1 张`
    }
    stage.desc = '已筛选 3 张素材，确定主图'
  } else if (stage.key === 'visual') {
    const product = currentProduct.value
    const variants = [
      { theme: 'spring', layout: 'img-left', width: 950, height: 250, label: '模板一 · 春季新品' },
      { theme: 'fashion', layout: 'img-right', width: 950, height: 250, label: '模板一 · 时尚潮流' },
      { theme: 'festival', layout: 'full', width: 1920, height: 600, label: '模板二 · 节日促销' }
    ]
    results.visual = variants.map((v, i) => ({
      ...v,
      config: {
        width: v.width,
        height: v.height,
        theme: v.theme,
        layout: v.layout,
        mode: 'promo',
        product: { src: product.images[0], scale: 1, x: 0, y: 0, shadow: true, radius: 0 },
        copy: buildBannerCopy(product, v.theme, 'promo', i)
      }
    }))
    stage.desc = '已生成 3 版 Banner'
  } else if (stage.key === 'content') {
    const product = currentProduct.value
    results.content = generateContent(product)
    const r = await api.aiText('copy', product).catch(() => ({ mode: 'rule' }))
    if (r.mode === 'ai' && r.content) {
      results.content = {
        titles: r.content.titles || results.content.titles,
        banners: r.content.banners || results.content.banners,
        script: r.content.script || results.content.script,
        ai: true
      }
    }
    stage.desc = results.content.ai ? 'AI 已完成文案与脚本' : '已生成标题与脚本（规则模式）'
  } else if (stage.key === 'data') {
    results.data = generateData(currentProduct.value)
    stage.desc = '已生成 7 日数据简报'
  }

  elapsed.value += Math.round((Date.now() - start) / 100) / 10
  stage.status = 'done'

  if (stage.key === 'visual') {
    await nextTick()
    for (let i = 0; i < results.visual.length; i++) {
      const el = canvasEls.value[i]
      if (el) await drawBanner(el, results.visual[i].config)
    }
  }
}

async function run() {
  if (!currentProduct.value) {
    toast('请先选择商品', 'err')
    return
  }
  if (running.value) return
  running.value = true
  resetStages()
  try {
    for (let i = 0; i < stages.length; i++) {
      await runStage(i)
      await sleep(420)
    }
    finished.value = true
    toast('上新方案已生成')
  } catch (err) {
    toastError(err)
  } finally {
    running.value = false
  }
}

function editVariant(v) {
  router.push({
    name: 'banner',
    query: { product: currentProduct.value.id || '', theme: v.theme }
  })
}

async function downloadVariant(v, i) {
  try {
    const dataUrl = await exportDataUrl(v.config, 'image/png')
    downloadDataUrl(dataUrl, `banner-plan-${i + 1}-${v.width}x${v.height}.png`)
  } catch (e) {
    toastError(e)
  }
}

function downloadPlan() {
  const t = buildPlanText(currentProduct.value, results.plan, results.content, results.data)
  downloadText(t, `上新方案-${currentProduct.value.shortName || '商品'}.txt`)
}

onMounted(async () => {
  try {
    products.value = await api.products()
    if (products.value.length) {
      selectedId.value = products.value[0].id
    }
  } catch (e) {
    toastError(e)
  }
})
</script>

<template>
  <div class="page page-wide">
    <div class="page-head">
      <div>
        <span class="eyebrow">Agent Pipeline</span>
        <h1 class="page-title">全流程智能体</h1>
        <p class="page-sub">输入一个商品，智能体依次完成策划、素材、视觉、文案与数据五个阶段，产出完整上新方案。</p>
      </div>
      <div class="head-actions">
        <span class="tag" :class="finished ? 'tag-green' : ''">
          <i class="dot"></i>{{ finished ? '方案已产出' : running ? '执行中' : '待运行' }}
        </span>
        <button v-if="finished" class="btn btn-ghost btn-sm" @click="downloadPlan">下载方案 TXT</button>
      </div>
    </div>

    <div class="layout">
      <aside class="input-card card card-pad">
        <h3 class="card-title">选择商品</h3>
        <div class="product-list">
          <button
            v-for="p in products"
            :key="p.id"
            class="product-item"
            :class="{ on: selectedId === p.id && !customMode }"
            @click="selectProduct(p)"
          >
            <img :src="p.images[0]" alt="" />
            <span class="pi-body">
              <strong>{{ p.shortName }}</strong>
              <small>{{ p.price }} 元 · {{ p.material }}</small>
            </span>
          </button>
        </div>

        <button class="btn btn-ghost btn-sm btn-block" @click="enableCustom">自定义商品信息</button>

        <div v-if="customMode" class="custom-form">
          <div class="field">
            <label>商品名称</label>
            <input v-model="form.name" class="input" />
          </div>
          <div class="field">
            <label>简称</label>
            <input v-model="form.shortName" class="input" />
          </div>
          <div class="two-col">
            <div class="field">
              <label>现价</label>
              <input v-model.number="form.price" class="input" type="number" />
            </div>
            <div class="field">
              <label>原价</label>
              <input v-model.number="form.originalPrice" class="input" type="number" />
            </div>
          </div>
          <div class="field">
            <label>核心卖点（顿号分隔）</label>
            <textarea v-model="form.featuresText" class="textarea" rows="2"></textarea>
          </div>
          <div class="field">
            <label>目标人群</label>
            <textarea v-model="form.audience" class="textarea" rows="2"></textarea>
          </div>
        </div>

        <div class="divider"></div>

        <button class="btn btn-primary btn-block btn-lg" :disabled="running" @click="run">
          {{ running ? '智能体执行中…' : '运行智能体' }}
        </button>
        <p class="hint">
          规则模式无需 API Key 即可产出完整方案；配置 Key 后文案与策划由大模型生成。
        </p>
      </aside>

      <main class="result">
        <div v-for="s in stages" :key="s.key" class="stage-card" :class="s.status">
          <div class="stage-head">
            <span class="stage-no">{{ s.no }}</span>
            <div class="stage-title">
              <h3>{{ s.name }}</h3>
              <p>{{ s.desc }}</p>
            </div>
            <span class="stage-state">
              <template v-if="s.status === 'running'">执行中…</template>
              <template v-else-if="s.status === 'done'">✓ 完成</template>
              <template v-else>等待</template>
            </span>
          </div>

          <div v-if="s.status === 'done'" class="stage-body">
            <template v-if="s.key === 'plan'">
              <div class="plan-grid">
                <div class="plan-block">
                  <span class="label">核心卖点</span>
                  <ul class="points">
                    <li v-for="p in results.plan.sellingPoints" :key="p">{{ p }}</li>
                  </ul>
                </div>
                <div class="plan-block">
                  <span class="label">目标人群</span>
                  <p>{{ results.plan.audience }}</p>
                  <span class="label" style="margin-top: 10px">定价建议</span>
                  <p>{{ results.plan.pricing }}</p>
                </div>
                <div class="plan-block">
                  <span class="label">差异化</span>
                  <p>{{ results.plan.differentiation }}</p>
                  <div class="kw-row">
                    <span v-for="k in results.plan.keywords" :key="k" class="tag">{{ k }}</span>
                  </div>
                </div>
              </div>
              <button class="link-btn" @click="router.push('/plan')">进入商品策划工作台 →</button>
            </template>

            <template v-else-if="s.key === 'assets'">
              <div class="asset-picked">
                <img v-for="img in results.assets.picked" :key="img" :src="img" alt="" />
                <div class="asset-note">
                  <strong>主图建议</strong>
                  <span>{{ results.assets.note }}</span>
                </div>
              </div>
            </template>

            <template v-else-if="s.key === 'visual'">
              <div class="variants">
                <div v-for="(v, i) in results.visual" :key="i" class="variant">
                  <div class="variant-canvas">
                    <canvas :ref="(el) => setCanvas(i, el)"></canvas>
                  </div>
                  <div class="variant-meta">
                    <span class="variant-label">{{ v.label }}</span>
                    <span class="muted">{{ v.width }} × {{ v.height }}</span>
                    <div class="variant-actions">
                      <button class="btn btn-ghost btn-sm" @click="downloadVariant(v, i)">下载</button>
                      <button class="btn btn-soft btn-sm" @click="editVariant(v)">去精修</button>
                    </div>
                  </div>
                </div>
              </div>
              <button class="link-btn" @click="router.push('/banner')">打开 Banner 生成器 →</button>
            </template>

            <template v-else-if="s.key === 'content'">
              <div class="content-grid">
                <div class="plan-block">
                  <span class="label">商品标题</span>
                  <p v-for="t in results.content.titles" :key="t" class="line-item">{{ t }}</p>
                </div>
                <div class="plan-block">
                  <span class="label">短文案</span>
                  <p v-for="t in results.content.banners" :key="t" class="line-item">· {{ t }}</p>
                </div>
              </div>
              <div class="script">
                <span class="label">30 秒短视频脚本</span>
                <div v-for="line in results.content.script" :key="line" class="script-line">
                  {{ line }}
                </div>
              </div>
              <button class="link-btn" @click="router.push('/content')">进入内容创作工作台 →</button>
            </template>

            <template v-else-if="s.key === 'data'">
              <p class="summary">{{ results.data.summary }}</p>
              <div class="metrics">
                <div v-for="m in results.data.metrics" :key="m.label" class="metric">
                  <span class="metric-label">{{ m.label }}</span>
                  <strong>{{ m.value }}</strong>
                  <span class="metric-delta">{{ m.delta }}</span>
                </div>
              </div>
              <ul class="points suggestions">
                <li v-for="sug in results.data.suggestions" :key="sug">{{ sug }}</li>
              </ul>
              <button class="link-btn" @click="router.push('/data')">进入数据分析 →</button>
            </template>
          </div>
        </div>

        <div v-if="finished" class="done-bar">
          <div>
            <strong>方案已生成</strong>
            <span class="muted">用时约 {{ elapsed.toFixed(1) }} 秒 · 3 版 Banner · 5 条文案 · 1 份数据简报</span>
          </div>
          <div class="done-actions">
            <button class="btn btn-ghost btn-sm" @click="downloadPlan">下载方案 TXT</button>
            <button class="btn btn-primary btn-sm" @click="router.push('/banner')">去精修 Banner</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.input-card {
  position: sticky;
  top: 84px;
}

.card-title {
  font-size: 15px;
  margin-bottom: 12px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 10px;
}

.product-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
}

.product-item.on {
  border-color: var(--brand);
  background: #faf9ff;
}

.product-item img {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  object-fit: cover;
  background: #f2f4f7;
}

.pi-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pi-body strong {
  font-size: 13.5px;
}

.pi-body small {
  font-size: 11.5px;
  color: var(--muted);
}

.custom-form {
  margin-top: 12px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 18px;
  transition: all 0.2s;
}

.stage-card.running {
  border-color: #c9c3ff;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
}

.stage-card.idle {
  opacity: 0.72;
}

.stage-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stage-no {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 12px;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex: none;
}

.stage-card.done .stage-no {
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #fff;
}

.stage-title {
  flex: 1;
  min-width: 0;
}

.stage-title h3 {
  font-size: 15px;
}

.stage-title p {
  font-size: 12px;
  color: var(--muted);
}

.stage-state {
  font-size: 12px;
  color: var(--muted);
  flex: none;
}

.stage-card.done .stage-state {
  color: #067647;
  font-weight: 600;
}

.stage-body {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}

.plan-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 16px;
}

.plan-block p {
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.7;
}

.label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.points {
  margin: 0;
  padding-left: 16px;
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.8;
}

.kw-row {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.link-btn {
  margin-top: 12px;
  border: none;
  background: none;
  color: var(--brand);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.asset-picked {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asset-picked img {
  width: 76px;
  height: 76px;
  border-radius: 10px;
  object-fit: cover;
  background: #f2f4f7;
  border: 1px solid var(--line);
}

.asset-note {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: var(--muted);
  margin-left: 6px;
}

.asset-note strong {
  color: var(--ink);
  font-size: 13px;
}

.variants {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.variant {
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-2);
}

.variant-canvas {
  padding: 10px;
  display: grid;
  place-items: center;
  min-height: 110px;
}

.variant-canvas canvas {
  width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: var(--shadow-sm);
}

.variant-meta {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--surface);
  border-top: 1px solid var(--line);
}

.variant-label {
  font-size: 12.5px;
  font-weight: 600;
}

.variant-meta .muted {
  font-size: 11.5px;
}

.variant-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.line-item {
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.8;
}

.script {
  margin-top: 14px;
}

.script-line {
  font-size: 12px;
  color: var(--ink-2);
  padding: 6px 0;
  border-bottom: 1px dashed var(--line);
  line-height: 1.7;
}

.summary {
  font-size: 13px;
  color: var(--ink-2);
  margin-bottom: 12px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.metric {
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 11px;
  color: var(--muted);
}

.metric strong {
  font-size: 16px;
}

.metric-delta {
  font-size: 11px;
  color: #067647;
}

.suggestions {
  margin-top: 12px;
}

.done-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  background: linear-gradient(120deg, #eefdf5, #f7fbf8);
  border: 1px solid #c7ecd9;
}

.done-bar strong {
  display: block;
  font-size: 14px;
  color: #05603a;
}

.done-bar .muted {
  font-size: 12px;
}

.done-actions {
  display: flex;
  gap: 8px;
}

.hint {
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.7;
  margin-top: 10px;
}

@media (max-width: 1080px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .input-card {
    position: static;
  }
  .variants {
    grid-template-columns: 1fr;
  }
  .plan-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
  .metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
