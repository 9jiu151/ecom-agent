<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { downloadText } from '../lib/renderer'
import {
  CAPABILITIES,
  CAP_MAP,
  buildCapability,
  capabilityText,
  listingCsv
} from '../lib/capabilities'

const route = useRoute()
const router = useRouter()

const products = ref([])
const active = ref(CAP_MAP[route.query.cap] ? route.query.cap : 'shoot')
const result = ref(null)
const budget = ref(500)
const question = ref('')
const answer = ref('')

const form = reactive({
  id: '',
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
  category: 'single'
})

const cap = computed(() => CAP_MAP[active.value] || CAPABILITIES[0])

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
    originalPrice: p.originalPrice || 0,
    material: p.material,
    colors: p.colors,
    featuresText: p.features.join('、'),
    audience: p.audience,
    tone: p.tone,
    promo: p.promo,
    category: p.category
  })
}

function generate() {
  result.value = buildCapability(active.value, payload(), { budget: budget.value })
  answer.value = ''
  question.value = ''
}

function switchCap(key) {
  if (active.value === key) return
  active.value = key
  router.replace({ name: 'studio', query: { ...route.query, cap: key } })
  generate()
}

function exportText() {
  if (!result.value) return
  downloadText(capabilityText(active.value, result.value, payload()), `${cap.value.name}-${form.shortName}.txt`)
  toast(`已导出 ${cap.value.name} 方案`)
}

function exportCsv() {
  if (!result.value) return
  const blob = new Blob([listingCsv(result.value)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `上架表-${form.shortName}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  toast('已导出上架 CSV')
}

function ask() {
  if (!result.value || !question.value.trim()) return
  const text = question.value.trim()
  const scored = result.value.faq
    .map((f) => ({ ...f, score: f.keys.filter((k) => text.includes(k)).length }))
    .sort((a, b) => b.score - a.score)
  const best = scored[0]
  answer.value = best && best.score > 0
    ? best.a
    : '未在知识库命中，建议转人工：先把「材质、颜色、容量、发货、退换」中对应问题补充进知识库。'
}

onMounted(async () => {
  try {
    products.value = await api.products()
    const qid = route.query.product
    if (qid && products.value.some((p) => p.id === qid)) {
      loadPreset(qid)
    } else if (products.value.length) {
      loadPreset(products.value[0].id)
    }
  } catch (e) {
    /* 预设加载失败时保留默认值 */
  }
  generate()
})
</script>

<template>
  <div class="page page-wide studio-page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Capability Studio</span>
        <h1 class="page-title">能力中心</h1>
        <p class="page-sub">8 个电商环节的可执行工作台：输入商品参数，即时生成方案与交付物，可复制、可下载。</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost btn-sm" @click="router.push('/')">返回矩阵</button>
        <button class="btn btn-ghost btn-sm" @click="exportText">导出方案 TXT</button>
        <button class="btn btn-primary btn-sm" @click="router.push('/pipeline')">跑全流程</button>
      </div>
    </div>

    <div class="cap-tabs">
      <button
        v-for="c in CAPABILITIES"
        :key="c.key"
        class="cap-tab"
        :class="{ on: active === c.key }"
        @click="switchCap(c.key)"
      >
        <span class="cap-no">{{ c.no }}</span>
        <span class="cap-name">{{ c.name }}</span>
      </button>
    </div>

    <div class="studio">
      <aside class="card card-pad input-card">
        <div class="card-title">商品输入</div>
        <div class="field">
          <label>选择预设商品</label>
          <select class="select" :value="form.id" @change="loadPreset($event.target.value); generate()">
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>商品名称</label>
          <input v-model="form.name" class="input" @input="form.id = ''" />
        </div>
        <div class="two-col">
          <div class="field">
            <label>现价（元）</label>
            <input v-model.number="form.price" class="input" type="number" />
          </div>
          <div class="field">
            <label>原价（元，可空）</label>
            <input v-model.number="form.originalPrice" class="input" type="number" />
          </div>
        </div>
        <div class="two-col">
          <div class="field">
            <label>材质</label>
            <input v-model="form.material" class="input" />
          </div>
          <div class="field">
            <label>风格</label>
            <input v-model="form.tone" class="input" />
          </div>
        </div>
        <div class="field">
          <label>颜色（顿号分隔）</label>
          <input v-model="form.colors" class="input" />
        </div>
        <div class="field">
          <label>核心卖点（顿号分隔）</label>
          <textarea v-model="form.featuresText" class="textarea" rows="2"></textarea>
        </div>
        <div class="field">
          <label>目标人群</label>
          <textarea v-model="form.audience" class="textarea" rows="2"></textarea>
        </div>
        <div class="field">
          <label>促销信息（可空）</label>
          <input v-model="form.promo" class="input" />
        </div>
        <div v-if="active === 'promo'" class="field">
          <label>日预算（元）</label>
          <input v-model.number="budget" class="input" type="number" min="50" step="50" />
        </div>
        <button class="btn btn-primary btn-block" @click="generate">生成{{ cap.name }}方案</button>
        <p class="hint">规则引擎本地运行，配置 AI Key 后可升级为模型生成；输出内容需人工复核。</p>
      </aside>

      <main class="output card">
        <div class="out-head">
          <div>
            <span class="eyebrow">Stage {{ cap.no }} · {{ cap.name }}</span>
            <h2 class="out-title">{{ cap.name }} · {{ cap.deliverable }}</h2>
          </div>
          <div class="out-actions">
            <span class="tag tag-green"><i class="dot"></i>规则模式</span>
            <button v-if="active === 'listing'" class="btn btn-ghost btn-sm" @click="exportCsv">导出 CSV</button>
            <button class="btn btn-ghost btn-sm" @click="exportText">导出 TXT</button>
          </div>
        </div>

        <div v-if="result" class="out-body">
          <!-- 02 商品拍摄 -->
          <section v-if="active === 'shoot'" class="out-section">
            <h3>拍摄分镜</h3>
            <table class="tbl">
              <thead>
                <tr><th>#</th><th>镜头</th><th>场景布置</th><th>机位与光线</th><th>用途</th></tr>
              </thead>
              <tbody>
                <tr v-for="s in result.scenes" :key="s.no">
                  <td>{{ s.no }}</td>
                  <td><strong>{{ s.shot }}</strong></td>
                  <td>{{ s.setup }}</td>
                  <td>{{ s.camera }}</td>
                  <td class="muted">{{ s.use }}</td>
                </tr>
              </tbody>
            </table>
            <h3>拍摄清单</h3>
            <ul class="list">
              <li v-for="c in result.checklist" :key="c">{{ c }}</li>
            </ul>
            <h3>主图合规检查</h3>
            <div class="checks">
              <div v-for="c in result.compliance" :key="c.item" class="check" :class="c.level">
                <span class="check-name">{{ c.item }}</span>
                <span class="check-note">{{ c.note }}</span>
              </div>
            </div>
          </section>

          <!-- 05 店铺运营 -->
          <section v-else-if="active === 'ops'" class="out-section">
            <h3>首页装修模块</h3>
            <div class="mod-grid">
              <div v-for="m in result.modules" :key="m.area" class="mod">
                <span class="mod-area">{{ m.area }}</span>
                <span class="mod-content">{{ m.content }}</span>
                <span class="mod-reason">{{ m.reason }}</span>
              </div>
            </div>
            <h3>四周活动日历</h3>
            <table class="tbl">
              <thead><tr><th>周期</th><th>动作</th><th>渠道</th><th>说明</th></tr></thead>
              <tbody>
                <tr v-for="c in result.calendar" :key="c.week">
                  <td>{{ c.week }}</td>
                  <td><strong>{{ c.action }}</strong></td>
                  <td>{{ c.channel }}</td>
                  <td class="muted">{{ c.note }}</td>
                </tr>
              </tbody>
            </table>
            <h3>日常节奏</h3>
            <div class="chips">
              <span v-for="r in result.rhythm" :key="r" class="chip">{{ r }}</span>
            </div>
            <h3>运营指标</h3>
            <ul class="list">
              <li v-for="k in result.kpi" :key="k">{{ k }}</li>
            </ul>
          </section>

          <!-- 06 商品上架 -->
          <section v-else-if="active === 'listing'" class="out-section">
            <h3>上架标题</h3>
            <div class="title-box">
              <p class="listing-title">{{ result.title }}</p>
              <span class="tag" :class="result.titleLen > 60 ? 'tag-amber' : 'tag-green'">{{ result.titleLen }} 字符</span>
            </div>
            <p class="hint">{{ result.warning }}</p>
            <h3>标题关键词</h3>
            <div class="chips">
              <span v-for="k in result.keywords" :key="k" class="chip">{{ k }}</span>
            </div>
            <h3>类目属性</h3>
            <table class="tbl">
              <thead><tr><th>字段</th><th>填写值</th></tr></thead>
              <tbody>
                <tr v-for="a in result.attributes" :key="a.field">
                  <td>{{ a.field }}</td>
                  <td>{{ a.value }}</td>
                </tr>
              </tbody>
            </table>
            <h3>SKU 与库存</h3>
            <table class="tbl">
              <thead><tr><th>颜色</th><th>售价</th><th>原价</th><th>库存</th><th>编码</th></tr></thead>
              <tbody>
                <tr v-for="s in result.sku" :key="s.code">
                  <td>{{ s.color }}</td>
                  <td>¥{{ s.price }}</td>
                  <td>{{ s.original ? '¥' + s.original : '—' }}</td>
                  <td>{{ s.stock }}</td>
                  <td class="muted">{{ s.code }}</td>
                </tr>
              </tbody>
            </table>
            <p class="hint">右上角「导出 CSV」可直接用于批量上架模板；规格与编码需按店铺实际规则调整。</p>
          </section>

          <!-- 07 营销推广 -->
          <section v-else-if="active === 'promo'" class="out-section">
            <h3>人群包策略</h3>
            <table class="tbl">
              <thead><tr><th>人群</th><th>占比</th><th>圈选依据</th><th>出价策略</th></tr></thead>
              <tbody>
                <tr v-for="a in result.audiences" :key="a.name">
                  <td><strong>{{ a.name }}</strong></td>
                  <td>{{ a.weight }}%</td>
                  <td>{{ a.reason }}</td>
                  <td>{{ a.action }}</td>
                </tr>
              </tbody>
            </table>
            <h3>预算分配（每日）</h3>
            <div class="bars">
              <div v-for="b in result.budget" :key="b.channel" class="bar-row">
                <span class="bar-label">{{ b.channel }}</span>
                <span class="bar-track"><i :style="{ width: b.ratio * 2 + '%' }"></i></span>
                <span class="bar-val">¥{{ b.amount }} · {{ b.ratio }}%</span>
                <span class="bar-note muted">{{ b.note }}</span>
              </div>
            </div>
            <h3>素材清单</h3>
            <table class="tbl">
              <thead><tr><th>类型</th><th>规格</th><th>内容</th><th>投放位</th></tr></thead>
              <tbody>
                <tr v-for="c in result.creatives" :key="c.type">
                  <td>{{ c.type }}</td>
                  <td>{{ c.spec }}</td>
                  <td>{{ c.content }}</td>
                  <td class="muted">{{ c.use }}</td>
                </tr>
              </tbody>
            </table>
            <h3>投放节奏</h3>
            <ul class="list">
              <li v-for="s in result.schedule" :key="s">{{ s }}</li>
            </ul>
            <p class="hint">{{ result.note }}</p>
          </section>

          <!-- 08 直播营销 -->
          <section v-else-if="active === 'live'" class="out-section">
            <h3>直播时间轴与话术</h3>
            <table class="tbl">
              <thead><tr><th>时间</th><th>环节</th><th>话术</th><th>场控提示</th></tr></thead>
              <tbody>
                <tr v-for="t in result.timeline" :key="t.time">
                  <td class="nowrap">{{ t.time }}</td>
                  <td><strong>{{ t.segment }}</strong></td>
                  <td>{{ t.script }}</td>
                  <td class="muted">{{ t.control }}</td>
                </tr>
              </tbody>
            </table>
            <h3>留人钩子</h3>
            <div class="chips">
              <span v-for="h in result.hooks" :key="h" class="chip">{{ h }}</span>
            </div>
            <h3>货盘结构</h3>
            <ul class="list">
              <li v-for="r in result.roles" :key="r">{{ r }}</li>
            </ul>
            <p class="hint">{{ result.note }}</p>
          </section>

          <!-- 09 客户服务 -->
          <section v-else-if="active === 'service'" class="out-section">
            <h3>商品知识库</h3>
            <div class="faq-grid">
              <div v-for="f in result.faq" :key="f.q" class="faq">
                <p class="faq-q">Q：{{ f.q }}</p>
                <p class="faq-a">A：{{ f.a }}</p>
              </div>
            </div>
            <h3>快捷回复</h3>
            <div class="chips">
              <span v-for="q in result.quickReplies" :key="q" class="chip">{{ q }}</span>
            </div>
            <h3>模拟咨询</h3>
            <div class="ask">
              <input v-model="question" class="input" placeholder="输入买家问题，例如：能装下手机吗？" @keyup.enter="ask" />
              <button class="btn btn-primary btn-sm" @click="ask">提问</button>
            </div>
            <p v-if="answer" class="answer">{{ answer }}</p>
            <p class="hint">{{ result.note }}</p>
          </section>

          <!-- 10 跨文化沟通 -->
          <section v-else-if="active === 'culture'" class="out-section">
            <h3>多语言文案</h3>
            <div class="lang-grid">
              <article v-for="l in result.langs" :key="l.code" class="lang">
                <div class="lang-top">
                  <strong>{{ l.label }}</strong>
                  <span class="tag">{{ l.code.toUpperCase() }}</span>
                </div>
                <p class="lang-title">{{ l.title }}</p>
                <p class="lang-sub">{{ l.subtitle }}</p>
                <ul class="list">
                  <li v-for="pt in l.points" :key="pt">{{ pt }}</li>
                </ul>
                <p class="hint">{{ l.note }}</p>
              </article>
            </div>
            <h3>文化禁忌提示</h3>
            <table class="tbl">
              <thead><tr><th>市场</th><th>注意点</th></tr></thead>
              <tbody>
                <tr v-for="t in result.taboos" :key="t.market">
                  <td>{{ t.market }}</td>
                  <td>{{ t.point }}</td>
                </tr>
              </tbody>
            </table>
            <p class="hint">{{ result.note }}</p>
          </section>

          <!-- 11 跨境运营 -->
          <section v-else class="out-section">
            <h3>目标市场与参考售价</h3>
            <table class="tbl">
              <thead><tr><th>市场</th><th>平台</th><th>参考售价</th><th>选品理由</th></tr></thead>
              <tbody>
                <tr v-for="m in result.markets" :key="m.market">
                  <td><strong>{{ m.market }}</strong></td>
                  <td>{{ m.platform }}</td>
                  <td>{{ m.price }}</td>
                  <td>{{ m.reason }}</td>
                </tr>
              </tbody>
            </table>
            <h3>平台规则差异</h3>
            <table class="tbl">
              <thead><tr><th>平台</th><th>关键规则</th></tr></thead>
              <tbody>
                <tr v-for="r in result.rules" :key="r.platform">
                  <td>{{ r.platform }}</td>
                  <td>{{ r.note }}</td>
                </tr>
              </tbody>
            </table>
            <h3>合规清单</h3>
            <ul class="list">
              <li v-for="c in result.compliance" :key="c">{{ c }}</li>
            </ul>
            <h3>物流方案</h3>
            <table class="tbl">
              <thead><tr><th>方式</th><th>时效</th><th>说明</th></tr></thead>
              <tbody>
                <tr v-for="l in result.logistics" :key="l.mode">
                  <td>{{ l.mode }}</td>
                  <td>{{ l.time }}</td>
                  <td class="muted">{{ l.note }}</td>
                </tr>
              </tbody>
            </table>
            <p class="hint">{{ result.note }}</p>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.studio-page {
  padding-bottom: 48px;
}

.head-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cap-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 18px;
}

.cap-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: var(--ink-2);
  font-size: 12.5px;
  white-space: nowrap;
  cursor: pointer;
  transition: 0.18s;
}

.cap-tab:hover {
  border-color: var(--brand);
  color: var(--brand-ink);
}

.cap-tab.on {
  background: var(--brand-soft);
  border-color: var(--brand);
  color: var(--brand-ink);
  font-weight: 700;
}

.cap-no {
  font-size: 11px;
  color: var(--muted);
}

.cap-tab.on .cap-no {
  color: var(--brand);
}

.studio {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.input-card {
  position: sticky;
  top: 84px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 12px;
}

.output {
  padding: 22px 24px 26px;
}

.out-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.out-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}

.out-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.out-body {
  margin-top: 18px;
}

.out-section h3 {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  margin: 22px 0 10px;
}

.out-section h3:first-child {
  margin-top: 0;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  color: var(--ink-2);
}

.tbl th {
  text-align: left;
  font-weight: 600;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
  padding: 8px 10px;
  white-space: nowrap;
}

.tbl td {
  padding: 9px 10px;
  border-bottom: 1px dashed var(--line);
  vertical-align: top;
  line-height: 1.6;
}

.tbl tbody tr:last-child td {
  border-bottom: none;
}

.nowrap {
  white-space: nowrap;
}

.muted {
  color: var(--muted);
}

.list {
  margin: 0;
  padding-left: 18px;
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.9;
}

.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  font-size: 11.5px;
  color: var(--ink-2);
}

.checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.check {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  font-size: 12px;
}

.check.ok {
  border-left: 3px solid #16a34a;
}

.check.warn {
  border-left: 3px solid #f59e0b;
}

.check.todo {
  border-left: 3px solid #6366f1;
}

.check-name {
  font-weight: 600;
  color: var(--ink);
}

.check-note {
  color: var(--muted);
}

.mod-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mod {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 13px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.mod-area {
  font-weight: 700;
  font-size: 12.5px;
  color: var(--ink);
}

.mod-content {
  font-size: 12px;
  color: var(--ink-2);
} 

.mod-reason {
  font-size: 11.5px;
  color: var(--muted);
}

.title-box {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: var(--surface-2);
}

.listing-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.6;
  flex: 1;
  min-width: 220px;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-row {
  display: grid;
  grid-template-columns: 80px 1fr 110px 1.2fr;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.bar-label {
  color: var(--ink);
  font-weight: 600;
}

.bar-track {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  overflow: hidden;
}

.bar-track i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  border-radius: 999px;
}

.bar-val {
  color: var(--ink-2);
  white-space: nowrap;
}

.bar-note {
  font-size: 11.5px;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.faq {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface-2);
}

.faq-q {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
}

.faq-a {
  font-size: 12px;
  color: var(--ink-2);
  margin-top: 4px;
  line-height: 1.65;
}

.ask {
  display: flex;
  gap: 8px;
}

.ask .input {
  flex: 1;
}

.answer {
  margin-top: 10px;
  padding: 11px 13px;
  border-radius: 10px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 12.5px;
  line-height: 1.7;
}

.lang-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.lang {
  padding: 13px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface-2);
}

.lang-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12.5px;
  color: var(--ink);
}

.lang-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.5;
}

.lang-sub {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 8px;
}

.hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.7;
  margin-top: 8px;
}

@media (max-width: 1080px) {
  .studio {
    grid-template-columns: minmax(0, 1fr);
  }
  .input-card {
    position: static;
    max-height: none;
  }
  .lang-grid,
  .faq-grid,
  .mod-grid,
  .checks {
    grid-template-columns: 1fr;
  }
  .bar-row {
    grid-template-columns: 72px 1fr 96px;
  }
  .bar-note {
    display: none;
  }
  .tbl {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>
