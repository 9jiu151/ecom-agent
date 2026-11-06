<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../lib/api'
import { generateData } from '../lib/copy'

const products = ref([])
const selected = ref('')
const data = ref(null)

function load(p) {
  if (!p) return
  selected.value = p.id
  data.value = generateData(p)
}

const chart = computed(() => {
  if (!data.value) return { line: '', area: '', points: [] }
  const rows = data.value.trend
  const w = 700
  const h = 200
  const padX = 30
  const padY = 24
  const max = Math.max(...rows.map((r) => r.clicks)) * 1.1
  const min = Math.min(...rows.map((r) => r.clicks)) * 0.85
  const stepX = (w - padX * 2) / (rows.length - 1)
  const points = rows.map((r, i) => {
    const x = padX + i * stepX
    const y = h - padY - ((r.clicks - min) / (max - min)) * (h - padY * 2)
    return { x, y, ...r }
  })
  const line = points.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `${padX},${h - padY} ${line} ${w - padX},${h - padY}`
  return { line, area, points, max, w, h }
})

onMounted(async () => {
  try {
    products.value = await api.products()
    if (products.value.length) load(products.value[0])
  } catch (e) {
    data.value = generateData({})
  }
})
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Stage 12 · Analytics</span>
        <h1 class="page-title">数据分析</h1>
        <p class="page-sub">箱包类目示例数据：曝光、点击、加购、成交与转化漏斗，附优化建议。</p>
      </div>
      <select class="select product-select" :value="selected" @change="load(products.find((p) => p.id === $event.target.value))">
        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <template v-if="data">
      <div class="metrics">
        <div v-for="m in data.metrics" :key="m.label" class="metric card">
          <span class="metric-label">{{ m.label }}</span>
          <strong>{{ m.value }}</strong>
          <span class="metric-delta">{{ m.delta }}</span>
        </div>
      </div>

      <div class="grid">
        <div class="card card-pad">
          <div class="chart-head">
            <h3>7 日点击趋势</h3>
            <span class="tag">示例数据</span>
          </div>
          <svg class="chart" :viewBox="`0 0 ${chart.w} ${chart.h}`" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.24" />
                <stop offset="100%" stop-color="#4f46e5" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line v-for="n in 4" :key="n" :x1="30" :x2="670" :y1="24 + (n - 1) * 50" :y2="24 + (n - 1) * 50" stroke="#eef0f4" />
            <polygon :points="chart.area" fill="url(#fill)" />
            <polyline :points="chart.line" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linejoin="round" />
            <g v-for="p in chart.points" :key="p.day">
              <circle :cx="p.x" :cy="p.y" r="4" fill="#fff" stroke="#4f46e5" stroke-width="2" />
              <text :x="p.x" :y="chart.h - 4" text-anchor="middle" font-size="11" fill="#98a2b3">{{ p.day }}</text>
            </g>
          </svg>
        </div>

        <div class="card card-pad">
          <h3>流量渠道占比</h3>
          <div class="channels">
            <div v-for="c in data.channels" :key="c.name" class="channel">
              <span class="ch-name">{{ c.name }}</span>
              <span class="ch-bar"><i :style="{ width: c.value + '%' }"></i></span>
              <span class="ch-val">{{ c.value }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-pad summary-card">
        <div>
          <h3>结论</h3>
          <p class="summary">{{ data.summary }}</p>
        </div>
        <div>
          <h3>优化建议</h3>
          <ul class="points">
            <li v-for="s in data.suggestions" :key="s">{{ s }}</li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.product-select {
  width: 260px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.metric-label {
  font-size: 12px;
  color: var(--muted);
}

.metric strong {
  font-size: 24px;
  letter-spacing: -0.02em;
}

.metric-delta {
  font-size: 12px;
  color: #067647;
}

.grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart {
  width: 100%;
  height: 220px;
  display: block;
}

h3 {
  font-size: 15px;
  margin-bottom: 12px;
}

.channels {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 6px;
}

.channel {
  display: grid;
  grid-template-columns: 72px 1fr 40px;
  gap: 10px;
  align-items: center;
  font-size: 12.5px;
  color: var(--ink-2);
}

.ch-bar {
  height: 8px;
  border-radius: 999px;
  background: #f0f1f5;
  overflow: hidden;
}

.ch-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
}

.ch-val {
  text-align: right;
  color: var(--muted);
}

.summary-card {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 28px;
}

.summary {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.75;
}

.points {
  margin: 0;
  padding-left: 16px;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.9;
}

@media (max-width: 1080px) {
  .metrics {
    grid-template-columns: repeat(3, 1fr);
  }
  .grid,
  .summary-card {
    grid-template-columns: 1fr;
  }
}
</style>
