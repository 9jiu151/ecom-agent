<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { generateContent } from '../lib/copy'

const router = useRouter()
const products = ref([])
const loading = ref(false)
const result = ref(null)
const isAi = ref(false)

const form = reactive({
  id: '',
  name: '2019新款迷你单肩包',
  shortName: '迷你单肩包',
  brand: 'LUMI',
  price: 99,
  material: 'PVC',
  colors: '红色、黑色',
  tone: '日韩',
  featuresText: '舒适护肩、车线工艺、细腻面料、压花皮表面'
})

function payload() {
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
    brand: p.brand,
    price: p.price,
    material: p.material,
    colors: p.colors,
    tone: p.tone,
    featuresText: p.features.join('、')
  })
}

async function generate() {
  loading.value = true
  isAi.value = false
  try {
    result.value = generateContent(payload())
    const r = await api.aiText('copy', payload()).catch(() => ({ mode: 'rule' }))
    if (r.mode === 'ai' && r.content) {
      result.value = {
        titles: r.content.titles || result.value.titles,
        banners: r.content.banners || result.value.banners,
        script: r.content.script || result.value.script
      }
      isAi.value = true
      toast('AI 已生成文案与脚本')
    } else {
      toast('已用规则模式生成，配置 Key 后可调用大模型')
    }
  } finally {
    loading.value = false
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    toast('已复制')
  } catch (e) {
    toast('复制失败，请手动选择', 'err')
  }
}

function useInBanner(title) {
  router.push({ name: 'banner', query: { product: form.id, copy: title } })
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
        <span class="eyebrow">Stage 04 · Content</span>
        <h1 class="page-title">内容创作</h1>
        <p class="page-sub">一次生成商品标题、Banner 短文案与 30 秒短视频分镜脚本。</p>
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
        <button class="btn btn-primary btn-block" :disabled="loading" @click="generate">
          {{ loading ? '创作中…' : '生成内容' }}
        </button>
      </aside>

      <main class="result">
        <div v-if="!result" class="card empty">
          <div class="empty-icon">04</div>
          点击生成，获得标题、短文案与短视频脚本。
        </div>

        <template v-else>
          <div class="card card-pad">
            <h3>商品标题</h3>
            <div v-for="t in result.titles" :key="t" class="row-item">
              <span>{{ t }}</span>
              <span class="row-actions">
                <button class="mini" @click="copy(t)">复制</button>
                <button class="mini" @click="useInBanner(t)">用于 Banner</button>
              </span>
            </div>
          </div>

          <div class="card card-pad">
            <h3>Banner 短文案</h3>
            <div class="chips">
              <button v-for="t in result.banners" :key="t" class="chip" @click="copy(t)">{{ t }}</button>
            </div>
          </div>

          <div class="card card-pad">
            <div class="script-head">
              <h3>30 秒短视频脚本</h3>
              <button class="btn btn-ghost btn-sm" @click="copy(result.script.join('\n'))">复制脚本</button>
            </div>
            <div class="table">
              <div class="table-row head">
                <span>时间</span><span>画面</span><span>口播</span>
              </div>
              <div v-for="line in result.script" :key="line" class="table-row">
                <template v-for="(part, i) in line.split('|')" :key="i">
                  <span>{{ part }}</span>
                </template>
              </div>
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

h3 {
  font-size: 15px;
  margin-bottom: 12px;
}

.row-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--line);
  font-size: 13.5px;
  color: var(--ink-2);
}

.row-item:last-child {
  border-bottom: none;
}

.row-actions {
  display: flex;
  gap: 6px;
  flex: none;
}

.mini {
  height: 26px;
  padding: 0 9px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  font-size: 12px;
  cursor: pointer;
  color: var(--ink-2);
}

.mini:hover {
  border-color: var(--brand);
  color: var(--brand);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 8px 12px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  font-size: 13px;
  color: var(--ink-2);
  cursor: pointer;
}

.chip:hover {
  border-color: var(--brand);
  background: #faf9ff;
}

.script-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.script-head h3 {
  margin-bottom: 0;
}

.table {
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 90px 1.1fr 1.2fr;
  gap: 10px;
  padding: 9px 12px;
  font-size: 12.5px;
  color: var(--ink-2);
  border-bottom: 1px dashed var(--line);
  line-height: 1.6;
}

.table-row.head {
  background: var(--surface-2);
  font-weight: 700;
  color: var(--muted);
  font-size: 11.5px;
  letter-spacing: 0.04em;
}

.table-row:last-child {
  border-bottom: none;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .table-row {
    grid-template-columns: 70px 1fr;
  }
  .table-row span:last-child {
    grid-column: 1 / -1;
  }
}
</style>
