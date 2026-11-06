<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast, toastError } from '../lib/toast'
import { appState } from '../lib/state'
import { buildBannerCopy } from '../lib/copy'
import { drawBanner, exportDataUrl, downloadDataUrl } from '../lib/renderer'
import { SIZES, LAYOUTS, THEMES, COPY_MODES, themeByKey } from '../lib/themes'

const route = useRoute()
const router = useRouter()

const catalogs = ref([])
const activeCategory = ref('single')
const products = ref([])
const uploading = ref(false)
const exporting = ref(false)
const canvasRef = ref(null)
const fileInput = ref(null)

const state = reactive({
  sizeKey: 'template1',
  width: 950,
  height: 250,
  theme: 'spring',
  layout: 'img-left',
  mode: 'promo',
  autoCopy: true,
  aiBackground: '',
  product: { src: '/assets/single/01.jpg', scale: 1, x: 0, y: 0, shadow: true, radius: 0 },
  copy: {
    brand: 'LUMI',
    eyebrow: 'SPRING',
    title: '迷你单肩包',
    subtitle: '舒适护肩 · 车线工艺 · 细腻面料',
    price: '¥99',
    original: '',
    badge: '春日上新',
    cta: '立即选购',
    tagline: '全国包邮 · 现货速发'
  }
})

const currentTheme = ref(themeByKey('spring'))
const activeProduct = ref(null)
const aiBgBusy = ref(false)

async function genAiBg() {
  aiBgBusy.value = true
  try {
    const t = currentTheme.value
    const prompt = `电商 Banner 背景底图，${t.label}配色，柔和渐变与光影，简洁氛围装饰，大面积留白，高级质感，不出现文字、水印、logo、商品，适合作为横幅背景`
    const d = await api.aiImage(prompt)
    if (!d || !d.url) {
      toast('图像模型未配置或未生成成功')
      return
    }
    state.aiBackground = d.url
    toast('AI 背景已生成')
  } catch (e) {
    toastError(e)
  } finally {
    aiBgBusy.value = false
  }
}

function clearAiBg() {
  state.aiBackground = ''
}

function applyTheme(key) {
  state.theme = key
  currentTheme.value = themeByKey(key)
  if (state.autoCopy) refreshCopy()
}

function refreshCopy() {
  const p = activeProduct.value || { shortName: state.copy.title, features: [] }
  state.copy = { ...state.copy, ...buildBannerCopy(p, state.theme, state.mode, 0) }
}

function applySize(key) {
  state.sizeKey = key
  if (key !== 'custom') {
    const s = SIZES.find((x) => x.key === key)
    state.width = s.width
    state.height = s.height
  }
}

function clampSize() {
  state.width = Math.min(2560, Math.max(320, Number(state.width) || 950))
  state.height = Math.min(1200, Math.max(120, Number(state.height) || 250))
}

async function draw() {
  if (!canvasRef.value) return
  try {
    await drawBanner(canvasRef.value, state)
  } catch (e) {
    /* 单次渲染失败不打断交互 */
  }
}

let timer = null
watch(
  () => state,
  () => {
    clearTimeout(timer)
    timer = setTimeout(draw, 120)
  },
  { deep: true }
)

watch(
  () => [state.theme, state.mode],
  () => {
    currentTheme.value = themeByKey(state.theme)
    if (state.autoCopy) refreshCopy()
  }
)

function selectImage(url) {
  state.product.src = url
  const srcMatch = url.match(/\/assets\/(\w+)\//)
  if (srcMatch) {
    const p = products.value.find(
      (item) => item.category === srcMatch[1] && item.images.includes(url)
    )
    activeProduct.value = p || activeProduct.value
  }
}

async function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    toast('图片超过 10MB 限制', 'err')
    e.target.value = ''
    return
  }
  uploading.value = true
  try {
    const d = await api.upload(file)
    state.product.src = d.url
    toast('图片已上传')
  } catch (err) {
    toastError(err)
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

/* 拖拽商品 */
let dragging = false
let lastX = 0
let lastY = 0

function onPointerDown(e) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  e.currentTarget.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!dragging) return
  const rect = e.currentTarget.getBoundingClientRect()
  const dx = (e.clientX - lastX) / rect.width
  const dy = (e.clientY - lastY) / rect.height
  lastX = e.clientX
  lastY = e.clientY
  state.product.x = Math.max(-0.45, Math.min(0.45, state.product.x + dx))
  state.product.y = Math.max(-0.4, Math.min(0.4, state.product.y + dy))
}

function onPointerUp() {
  dragging = false
}

async function doExport(type) {
  exporting.value = true
  try {
    const mime = type === 'jpg' ? 'image/jpeg' : 'image/png'
    const dataUrl = await exportDataUrl(state, mime, 0.92)
    const meta = {
      width: state.width,
      height: state.height,
      theme: state.theme,
      themeLabel: currentTheme.value.label,
      layout: state.layout,
      mode: state.mode,
      title: state.copy.title
    }
    try {
      await api.saveHistory(dataUrl, meta)
    } catch (e) {
      /* 历史保存失败不影响下载 */
    }
    const filename = `banner-${state.width}x${state.height}-${state.theme}.${type === 'jpg' ? 'jpg' : 'png'}`
    downloadDataUrl(dataUrl, filename)
    toast(`已导出 ${state.width}×${state.height} ${type.toUpperCase()}`)
  } catch (err) {
    toastError(err)
  } finally {
    exporting.value = false
  }
}

async function aiCopy() {
  try {
    const r = await api.aiText('copy', activeProduct.value || {})
    if (r.mode === 'rule' || !r.content) {
      toast('未配置 AI Key，已使用规则模式生成')
      refreshCopy()
      return
    }
    const banners = r.content.banners || []
    if (banners.length) state.copy.title = banners[0]
    toast('AI 文案已生成')
  } catch (err) {
    toastError(err)
  }
}

onMounted(async () => {
  try {
    const c = await api.catalog()
    catalogs.value = c.categories
  } catch (e) {
    catalogs.value = []
  }
  try {
    products.value = await api.products()
  } catch (e) {
    products.value = []
  }

  const themeQ = route.query.theme
  if (themeQ && THEMES.some((t) => t.key === themeQ)) {
    state.theme = themeQ
    currentTheme.value = themeByKey(themeQ)
  }

  const pid = route.query.product
  if (pid) {
    const p = products.value.find((x) => x.id === pid)
    if (p) {
      activeProduct.value = p
      state.product.src = p.images[0]
      state.copy = buildBannerCopy(p, state.theme, state.mode, 0)
    }
  } else {
    activeProduct.value = products.value[0] || null
    if (activeProduct.value) {
      state.product.src = activeProduct.value.images[0]
      state.copy = buildBannerCopy(activeProduct.value, state.theme, state.mode, 0)
    }
  }

  if (route.query.copy) {
    state.autoCopy = false
    state.copy.title = String(route.query.copy)
  }
  draw()
})
</script>

<template>
  <div class="page page-wide banner-page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Design Studio</span>
        <h1 class="page-title">Banner 生成器</h1>
        <p class="page-sub">上传商品图，选尺寸与主题，实时预览并导出精确像素的电商 Banner。</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost btn-sm" @click="router.push('/history')">生成历史</button>
        <button class="btn btn-primary btn-sm" @click="router.push('/pipeline')">跑全流程</button>
      </div>
    </div>

    <div class="workspace">
      <aside class="panel">
        <section class="block">
          <div class="block-title"><span class="idx">01</span>商品素材</div>
          <div class="upload" @click="fileInput?.click()">
            <span class="upload-icon">＋</span>
            <span>点击上传商品图</span>
            <small>JPG / PNG / WebP，最大 10MB</small>
          </div>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleFile" />
          <p v-if="uploading" class="hint">正在上传…</p>

          <div class="cat-tabs">
            <button
              v-for="c in catalogs"
              :key="c.key"
              class="cat-tab"
              :class="{ on: activeCategory === c.key }"
              @click="activeCategory = c.key"
            >
              {{ c.label }}
            </button>
          </div>
          <div class="asset-grid">
            <button
              v-for="img in (catalogs.find((c) => c.key === activeCategory)?.images || []).slice(0, 8)"
              :key="img.url"
              class="asset"
              :class="{ on: state.product.src === img.url }"
              @click="selectImage(img.url)"
            >
              <img :src="img.url" alt="" loading="lazy" />
            </button>
          </div>
        </section>

        <section class="block">
          <div class="block-title"><span class="idx">02</span>输出尺寸</div>
          <div class="size-list">
            <button
              v-for="s in SIZES"
              :key="s.key"
              class="size-item"
              :class="{ on: state.sizeKey === s.key }"
              @click="applySize(s.key)"
            >
              <span class="size-name">{{ s.label }}</span>
              <span class="size-note">{{ s.note }}</span>
            </button>
          </div>
          <div v-if="state.sizeKey === 'custom'" class="custom-size">
            <input v-model.number="state.width" class="input" type="number" @change="clampSize" />
            <span>×</span>
            <input v-model.number="state.height" class="input" type="number" @change="clampSize" />
          </div>
        </section>

        <section class="block">
          <div class="block-title"><span class="idx">03</span>主题风格</div>
          <div class="theme-grid">
            <button
              v-for="t in THEMES"
              :key="t.key"
              class="theme"
              :class="{ on: state.theme === t.key }"
              @click="applyTheme(t.key)"
            >
              <span
                class="theme-swatch"
                :style="{ background: `linear-gradient(135deg, ${t.bg[0]}, ${t.accent} 90%)` }"
              ></span>
              <span class="theme-name">{{ t.label }}</span>
            </button>
          </div>
        </section>

        <section class="block">
          <div class="block-title"><span class="idx">04</span>布局方式</div>
          <div class="layout-grid">
            <button
              v-for="l in LAYOUTS"
              :key="l.key"
              class="layout"
              :class="{ on: state.layout === l.key }"
              @click="state.layout = l.key"
            >
              <span class="layout-icon" :class="l.key"></span>
              <span>{{ l.label }}</span>
            </button>
          </div>
        </section>

        <section class="block">
          <div class="block-title"><span class="idx">05</span>商品调节</div>
          <div class="row">
            <label>缩放</label>
            <span class="val">{{ Math.round(state.product.scale * 100) }}%</span>
          </div>
          <input
            v-model.number="state.product.scale"
            type="range"
            min="0.5"
            max="1.8"
            step="0.02"
            :style="{ '--pct': ((state.product.scale - 0.5) / 1.3) * 100 + '%' }"
          />

          <div class="switches">
            <div class="switch-row">
              <span>商品投影</span>
              <button
                class="switch"
                :class="{ on: state.product.shadow }"
                @click="state.product.shadow = !state.product.shadow"
              ></button>
            </div>
            <div class="switch-row">
              <span>圆角裁切</span>
              <button
                class="switch"
                :class="{ on: state.product.radius > 0 }"
                @click="state.product.radius = state.product.radius > 0 ? 0 : 30"
              ></button>
            </div>
            <div class="switch-row">
              <span>自动文案</span>
              <button class="switch" :class="{ on: state.autoCopy }" @click="state.autoCopy = !state.autoCopy"></button>
            </div>
          </div>
          <p class="hint">在预览区拖拽商品可调整位置，双击画布可复位。</p>
          <button class="btn btn-ghost btn-sm btn-block" @click="state.product.x = 0; state.product.y = 0; state.product.scale = 1">
            复位位置与缩放
          </button>
        </section>

        <section class="block">
          <div class="block-title">
            <span class="idx">06</span>文案内容
            <button class="mini-btn" @click="aiCopy">AI 生成</button>
          </div>
          <div class="mode-switch">
            <button
              v-for="m in COPY_MODES"
              :key="m.key"
              class="mode-btn"
              :class="{ on: state.mode === m.key }"
              @click="state.mode = m.key"
            >
              {{ m.label }}
            </button>
          </div>
          <div class="field">
            <label>主标题</label>
            <input v-model="state.copy.title" class="input" @input="state.autoCopy = false" />
          </div>
          <div class="field">
            <label>辅助文案</label>
            <input v-model="state.copy.subtitle" class="input" @input="state.autoCopy = false" />
          </div>
          <div v-if="state.mode === 'promo'" class="two-col">
            <div class="field">
              <label>现价</label>
              <input v-model="state.copy.price" class="input" />
            </div>
            <div class="field">
              <label>原价</label>
              <input v-model="state.copy.original" class="input" placeholder="可留空" />
            </div>
          </div>
          <div v-if="state.mode === 'promo'" class="field">
            <label>角标 / 行动按钮</label>
            <div class="two-col">
              <input v-model="state.copy.badge" class="input" placeholder="角标" />
              <input v-model="state.copy.cta" class="input" placeholder="按钮" />
            </div>
          </div>
          <div v-else class="field">
            <label>品牌语</label>
            <input v-model="state.copy.tagline" class="input" />
          </div>
        </section>

        <section class="block">
          <div class="block-title"><span class="idx">07</span>AI 背景（可选）</div>
          <p class="hint">调用豆包 Seedream 生成氛围底图，叠在主题渐变之上；不影响商品抠图与导出。</p>
          <div v-if="state.aiBackground" class="ai-bg-preview">
            <img :src="state.aiBackground" alt="AI 背景" />
          </div>
          <button class="btn btn-ghost btn-sm btn-block" :disabled="aiBgBusy" @click="genAiBg">
            {{ aiBgBusy ? '生成中…约 15 秒' : (state.aiBackground ? '重新生成背景' : '生成 AI 背景') }}
          </button>
          <button v-if="state.aiBackground" class="btn btn-ghost btn-sm btn-block" @click="clearAiBg">
            移除 AI 背景
          </button>
        </section>
      </aside>

      <main class="stage">
        <div class="stage-bar">
          <div class="stage-tags">
            <span class="tag tag-brand">{{ state.width }} × {{ state.height }}</span>
            <span class="tag">{{ currentTheme.label }}</span>
            <span class="tag">{{ state.mode === 'promo' ? '促销转化' : '品牌视觉' }}</span>
          </div>
          <span class="tag" :class="appState.llm ? 'tag-green' : 'tag-amber'">
            <i class="dot"></i>
            {{ appState.llm ? 'AI 增强可用' : '规则模式' }}
          </span>
        </div>

        <div class="canvas-wrap">
          <canvas
            ref="canvasRef"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          ></canvas>
        </div>

        <div class="stage-foot">
          <div class="foot-note">
            <strong>{{ state.copy.title }}</strong>
            <span>· {{ state.copy.subtitle }}</span>
          </div>
          <div class="foot-actions">
            <button class="btn btn-ghost btn-sm" @click="doExport('jpg')" :disabled="exporting">导出 JPG</button>
            <button class="btn btn-primary" @click="doExport('png')" :disabled="exporting">
              {{ exporting ? '导出中…' : '下载 PNG' }}
            </button>
          </div>
        </div>

        <div class="tip-line">
          导出的图片尺寸与上方标注完全一致（{{ state.width }}×{{ state.height }}），可直接上传电商平台。AI 生成内容请人工复核后使用。
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.banner-page {
  padding-bottom: 48px;
}

.workspace {
  display: grid;
  grid-template-columns: 352px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 6px 18px 18px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  position: sticky;
  top: 84px;
}

.block {
  padding: 16px 0;
  border-bottom: 1px dashed var(--line);
}

.block:last-child {
  border-bottom: none;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 12px;
}

.idx {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.mini-btn {
  margin-left: auto;
  height: 24px;
  padding: 0 9px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  font-size: 12px;
  color: var(--brand-ink);
  cursor: pointer;
}

.upload {
  border: 1.5px dashed var(--line-strong);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  background: var(--surface-2);
  transition: all 0.16s;
}

.upload:hover {
  border-color: var(--brand);
  background: #faf9ff;
}

.upload-icon {
  font-size: 22px;
  color: var(--brand);
}

.upload span:nth-child(2) {
  font-size: 13px;
  font-weight: 600;
}

.upload small {
  font-size: 11px;
  color: var(--muted);
}

.hint {
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.6;
  margin-top: 8px;
}

.cat-tabs {
  display: flex;
  gap: 4px;
  margin: 12px 0 8px;
  flex-wrap: wrap;
}

.cat-tab {
  padding: 4px 8px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: var(--surface-2);
  font-size: 11.5px;
  color: var(--muted);
  cursor: pointer;
}

.cat-tab.on {
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-weight: 600;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.asset {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  background: #f4f5f7;
  cursor: pointer;
}

.asset img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset.on {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}

.size-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.size-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
}

.size-item.on {
  border-color: var(--brand);
  background: #faf9ff;
}

.size-name {
  font-size: 13px;
  font-weight: 600;
}

.size-note {
  font-size: 11px;
  color: var(--muted);
}

.custom-size {
  display: grid;
  grid-template-columns: 1fr 16px 1fr;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
}

.custom-size .input {
  height: 34px;
  text-align: center;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.theme {
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 5px;
  background: var(--surface);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme.on {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12);
}

.theme-swatch {
  height: 22px;
  border-radius: 6px;
}

.theme-name {
  font-size: 11px;
  color: var(--ink-2);
  text-align: center;
  white-space: nowrap;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.layout {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 12px;
  cursor: pointer;
}

.layout.on {
  border-color: var(--brand);
  background: #faf9ff;
  color: var(--brand-ink);
  font-weight: 600;
}

.layout-icon {
  width: 22px;
  height: 15px;
  border-radius: 3px;
  border: 1px solid #cfd4e0;
  background: linear-gradient(90deg, #dfe3ec 0 42%, #fff 42% 100%);
}

.layout-icon.img-right {
  background: linear-gradient(90deg, #fff 0 58%, #dfe3ec 58% 100%);
}

.layout-icon.center {
  background: linear-gradient(90deg, #fff 0 26%, #dfe3ec 26% 62%, #fff 62% 100%);
}

.layout-icon.full {
  background: #c9d2e2;
}

.row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}

.row .val {
  color: var(--ink);
  font-weight: 600;
}

.switches {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--ink-2);
}

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  margin-bottom: 12px;
}

.mode-btn {
  height: 30px;
  border-radius: 7px;
  border: none;
  background: transparent;
  font-size: 12.5px;
  color: var(--muted);
  cursor: pointer;
}

.mode-btn.on {
  background: var(--surface);
  color: var(--brand-ink);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stage {
  position: sticky;
  top: 84px;
}

.stage-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stage-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.canvas-wrap {
  background:
    linear-gradient(45deg, #f0f1f5 25%, transparent 25%),
    linear-gradient(-45deg, #f0f1f5 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f1f5 75%),
    linear-gradient(-45deg, transparent 75%, #f0f1f5 75%),
    #fafbfc;
  background-size: 18px 18px;
  background-position: 0 0, 0 9px, 9px -9px, -9px 0;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px;
  display: grid;
  place-items: center;
  min-height: 320px;
  box-shadow: var(--shadow-sm);
}

.canvas-wrap canvas {
  width: 100%;
  height: auto;
  max-height: 62vh;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  cursor: grab;
  touch-action: none;
}

.canvas-wrap canvas:active {
  cursor: grabbing;
}

.stage-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
  padding: 14px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
}

.foot-note {
  font-size: 13px;
  color: var(--muted);
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.foot-note strong {
  color: var(--ink);
}

.foot-actions {
  display: flex;
  gap: 8px;
  flex: none;
}

.tip-line {
  margin-top: 12px;
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.7;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.ai-bg-preview {
  margin-bottom: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.ai-bg-preview img {
  display: block;
  width: 100%;
  height: 64px;
  object-fit: cover;
}

@media (max-width: 1080px) {
  .workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .panel {
    position: static;
    max-height: none;
  }
  .stage {
    position: static;
  }
}
</style>
