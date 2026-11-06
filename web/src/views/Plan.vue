<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { generatePlan } from '../lib/copy'

const products = ref([])
const loading = ref(false)
const result = ref(null)
const isAi = ref(false)

const form = reactive({
  id: '',
  name: '2019新款迷你单肩包',
  shortName: '迷你单肩包',
  price: 99,
  material: 'PVC',
  colors: '红色、黑色',
  tone: '日韩',
  featuresText: '舒适护肩、车线工艺、细腻面料、压花皮表面',
  audience: '18-30岁都市女性，日常通勤与轻出行'
})

function productPayload() {
  return {
    ...form,
    features: form.featuresText.split(/[、,，]/).map((s) => s.trim()).filter(Boolean)
  }
}

function loadPreset(id) {
  const p = products.value.find((x) => x.id === id)
  if (!p) return
  Object.assign(form, {
    id: p.id,
    name: p.name,
    shortName: p.shortName,
    price: p.price,
    material: p.material,
    colors: p.colors,
    tone: p.tone,
    featuresText: p.features.join('、'),
    audience: p.audience
  })
}

async function generate() {
  loading.value = true
  isAi.value = false
  try {
    result.value = generatePlan(productPayload())
    const r = await api.aiText('plan', productPayload()).catch(() => ({ mode: 'rule' }))
    if (r.mode === 'ai' && r.content) {
      result.value = { ...result.value, ...r.content }
      isAi.value = true
      toast('AI 已生成策划方案')
    } else {
      toast('已用规则模式生成，配置 Key 后可调用大模型')
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    products.value = await api.products()
    if (products.value.length) loadPreset(products.value[0].id)
  } catch (e) {
    /* 忽略 */
  }
})
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Stage 01 · Planning</span>
        <h1 class="page-title">商品策划</h1>
        <p class="page-sub">输入商品参数，输出卖点、人群、差异化与定价建议，为视觉与文案提供依据。</p>
      </div>
      <span class="tag" :class="isAi ? 'tag-green' : 'tag-amber'">
        <i class="dot"></i>{{ isAi ? 'AI 生成' : '规则模式' }}
      </span>
    </div>

    <div class="layout">
      <aside class="card card-pad">
        <div class="field">
          <label>选择预设商品</label>
          <select class="select" :value="form.id" @change="loadPreset($event.target.value)">
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>商品名称</label>
          <input v-model="form.name" class="input" />
        </div>
        <div class="two-col">
          <div class="field">
            <label>现价（元）</label>
            <input v-model.number="form.price" class="input" type="number" />
          </div>
          <div class="field">
            <label>风格</label>
            <input v-model="form.tone" class="input" />
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
        <button class="btn btn-primary btn-block" :disabled="loading" @click="generate">
          {{ loading ? '分析中…' : '生成策划方案' }}
        </button>
      </aside>

      <main class="result">
        <div v-if="!result" class="card empty">
          <div class="empty-icon">01</div>
          填写左侧商品信息后点击生成，这里会出现策划结果。
        </div>

        <template v-else>
          <div class="card card-pad">
            <div class="res-head">
              <h3>核心卖点</h3>
              <span class="tag tag-brand">{{ result.positioning || form.tone + '风格' }}</span>
            </div>
            <div class="points">
              <div v-for="(p, i) in result.sellingPoints" :key="p" class="point">
                <span class="pno">{{ String(i + 1).padStart(2, '0') }}</span>
                <span>{{ p }}</span>
              </div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card card-pad">
              <h3>目标人群</h3>
              <p class="body-text">{{ result.audience }}</p>
            </div>
            <div class="card card-pad">
              <h3>定价建议</h3>
              <p class="body-text">{{ result.pricing }}</p>
            </div>
          </div>

          <div class="card card-pad">
            <h3>差异化建议</h3>
            <p class="body-text">{{ result.differentiation }}</p>
            <div class="kw-row">
              <span v-for="k in result.keywords" :key="k" class="tag">{{ k }}</span>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.res-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

h3 {
  font-size: 15px;
  margin-bottom: 8px;
}

.points {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.point {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  font-size: 13.5px;
  color: var(--ink-2);
}

.pno {
  font-size: 11px;
  font-weight: 700;
  color: var(--brand);
  background: var(--brand-soft);
  border-radius: 6px;
  padding: 2px 6px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.body-text {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.75;
}

.kw-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 14px;
}

@media (max-width: 900px) {
  .layout,
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
