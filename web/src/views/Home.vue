<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { drawBanner } from '../lib/renderer'
import { buildBannerCopy } from '../lib/copy'
import { SIZES, themeByKey } from '../lib/themes'

const router = useRouter()
const products = ref([])
const heroCanvas = ref(null)
const modal = ref(null)

const stages = [
  { no: '01', name: '商品策划', desc: 'AI 商品调研、卖点提炼与定价建议', status: 'done', route: 'plan', tag: '已实现' },
  { no: '02', name: '商品拍摄', desc: '拍摄分镜、场景清单与主图合规检查', status: 'done', route: 'studio', cap: 'shoot', tag: '已实现' },
  { no: '03', name: '美工设计', desc: '模板合成、9 种主题风格、多尺寸导出', status: 'done', route: 'banner', tag: '已实现' },
  { no: '04', name: '内容创作', desc: '标题、卖点短文案、短视频分镜脚本', status: 'done', route: 'content', tag: '已实现' },
  { no: '05', name: '店铺运营', desc: '首页装修排布、活动日历与上新节奏', status: 'done', route: 'studio', cap: 'ops', tag: '已实现' },
  { no: '06', name: '商品上架', desc: '标题关键词、类目属性与 SKU 表', status: 'done', route: 'studio', cap: 'listing', tag: '已实现' },
  { no: '07', name: '营销推广', desc: '人群包、预算分配与素材清单', status: 'done', route: 'studio', cap: 'promo', tag: '已实现' },
  { no: '08', name: '直播营销', desc: '直播时间轴、逐段话术与场控提示', status: 'done', route: 'studio', cap: 'live', tag: '已实现' },
  { no: '09', name: '客户服务', desc: '商品知识库与咨询问答', status: 'done', route: 'studio', cap: 'service', tag: '已实现' },
  { no: '10', name: '跨文化沟通', desc: '多语言文案本地化与文化提示', status: 'done', route: 'studio', cap: 'culture', tag: '已实现' },
  { no: '11', name: '跨境运营', desc: '目标市场、平台规则与合规清单', status: 'done', route: 'studio', cap: 'crossborder', tag: '已实现' },
  { no: '12', name: '数据分析', desc: '销量趋势、转化漏斗与优化建议', status: 'done', route: 'data', tag: '已实现' }
]

const doneCount = stages.filter((s) => s.status === 'done').length

function enter(stage) {
  modal.value = stage
}

function goStage(stage) {
  modal.value = null
  if (stage.route === 'studio') {
    router.push({ name: 'studio', query: { cap: stage.cap } })
  } else {
    router.push({ name: stage.route })
  }
}

function useProduct(p) {
  router.push({ name: 'banner', query: { product: p.id } })
}

onMounted(async () => {
  try {
    products.value = await api.products()
  } catch (e) {
    products.value = []
  }

  const p = products.value[1] || products.value[0]
  if (p && heroCanvas.value) {
    await drawBanner(heroCanvas.value, {
      width: 950,
      height: 250,
      theme: 'spring',
      layout: 'img-left',
      mode: 'brand',
      product: { src: p.images[0], scale: 1, x: 0, y: 0, shadow: true, radius: 0 },
      copy: buildBannerCopy(p, 'spring', 'brand', 0)
    })
  }
})
</script>

<template>
  <div class="hero">
    <div class="hero-grid"></div>
    <div class="hero-inner">
      <div class="hero-copy">
        <span class="hero-badge">问题 2 · AI 赋能电商全流程场景化应用</span>
        <h1>一个商品进<br />一套上新方案出</h1>
        <p>
          把商品策划、美工设计、内容创作与数据分析串成一条流水线。
          12 个电商环节组成能力矩阵，箱包类目已跑通从素材到成图的全过程。
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" @click="router.push('/pipeline')">开始全流程</button>
          <button class="btn btn-ghost btn-lg" @click="router.push('/banner')">打开 Banner 生成器</button>
        </div>
        <div class="hero-meta">
          <span><b>12</b> 电商环节</span>
          <span class="sep"></span>
          <span><b>{{ doneCount }}</b> 环节已实现</span>
          <span class="sep"></span>
          <span><b>2</b> 套实训模板</span>
        </div>
      </div>

      <div class="hero-visual">
        <div class="preview-card">
          <canvas ref="heroCanvas"></canvas>
          <div class="preview-cap">
            <span class="dot-live"></span>
            真实渲染 · 春季新品 / 品牌视觉模式 / 950×250
          </div>
        </div>
        <div class="hero-tags">
          <span class="hero-tag">模板合成 1-3s</span>
          <span class="hero-tag">AI 增强可选</span>
          <span class="hero-tag">离线可运行</span>
        </div>
      </div>
    </div>
  </div>

  <div class="page">
    <section class="section">
      <div class="section-head">
        <div>
          <span class="eyebrow">Capability Matrix</span>
          <h2 class="section-title">12 环节能力矩阵</h2>
          <p class="page-sub">点击任意环节直接进入对应工作台，全部环节均可操作。</p>
        </div>
        <div class="legend">
          <span class="tag tag-green"><i class="dot"></i>已实现 {{ doneCount }} / 12</span>
          <span class="tag">规则引擎可离线运行</span>
        </div>
      </div>

      <div class="matrix">
        <button
          v-for="s in stages"
          :key="s.no"
          class="stage"
          :class="[s.status, { active: s.status === 'done' }]"
          @click="enter(s)"
        >
          <span class="stage-no">{{ s.no }}</span>
          <span class="stage-body">
            <span class="stage-name">{{ s.name }}</span>
            <span class="stage-desc">{{ s.desc }}</span>
          </span>
          <span class="stage-tag" :class="s.status === 'done' ? 'tag-green' : ''">{{ s.tag }}</span>
        </button>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <span class="eyebrow">Case Study</span>
          <h2 class="section-title">箱包类目实训案例</h2>
          <p class="page-sub">来自《网店经营》实训手册任务 3，两种商品、两档尺寸，可直接生成。</p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="router.push('/about')">查看验收标准</button>
      </div>

      <div class="cases">
        <article v-for="p in products" :key="p.id" class="case-card">
          <div class="case-thumb">
            <img :src="p.images[0]" :alt="p.name" />
          </div>
          <div class="case-body">
            <div class="case-top">
              <h3>{{ p.name }}</h3>
              <span class="tag tag-brand">{{ p.tone }}</span>
            </div>
            <p class="case-meta">{{ p.material }} · {{ p.colors }} · {{ p.price }} 元</p>
            <p class="case-feat">{{ p.features.join(' · ') }}</p>
            <div class="case-actions">
              <button class="btn btn-primary btn-sm" @click="useProduct(p)">用此商品生成</button>
              <button class="btn btn-ghost btn-sm" @click="router.push('/pipeline')">跑全流程</button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="flow-card card card-pad">
        <div class="flow-head">
          <h3>智能体执行链路</h3>
          <span class="tag tag-amber">规则引擎可离线运行</span>
        </div>
        <div class="flow">
          <div v-for="(f, i) in ['商品信息', '策划分析', '素材筛选', '视觉生成', '文案产出', '数据简报']" :key="f" class="flow-step">
            <span class="flow-idx">{{ i + 1 }}</span>
            <span>{{ f }}</span>
          </div>
        </div>
      </div>
    </section>

    <div v-if="modal" class="modal-mask" @click.self="modal = null">
      <div class="modal">
        <span class="eyebrow">Stage {{ modal.no }} · {{ modal.name }}</span>
        <h3>{{ modal.name }} · 环节流程</h3>
        <p class="muted">{{ modal.desc }}</p>
        <div class="modal-steps">
          <div class="modal-step">
            <span class="step-idx">1</span>
            <span>选择或填写商品</span>
          </div>
          <div class="modal-step">
            <span class="step-idx">2</span>
            <span>规则引擎生成方案</span>
          </div>
          <div class="modal-step">
            <span class="step-idx">3</span>
            <span>查看并导出交付物</span>
          </div>
        </div>
        <div class="divider"></div>
        <p class="muted">
          该环节已实现，进入工作台即可生成结果并导出；涉及平台数据的部分仅给建议，不接第三方后台。
        </p>
        <div class="modal-actions">
          <button class="btn btn-ghost btn-sm" @click="modal = null">留在首页</button>
          <button class="btn btn-primary btn-sm" @click="goStage(modal)">进入工作台</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background: radial-gradient(1200px 520px at 78% -10%, #4f46e5 0%, transparent 60%),
    linear-gradient(135deg, #101a33 0%, #1a2450 55%, #131b38 100%);
  color: #fff;
  padding: 56px 0 64px;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(900px 400px at 60% 20%, #000 20%, transparent 80%);
}

.hero-inner {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 28px;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 44px;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #d9d6ff;
}

.hero h1 {
  font-size: 44px;
  line-height: 1.16;
  letter-spacing: -0.03em;
  margin: 18px 0 16px;
  font-weight: 800;
  background: linear-gradient(100deg, #ffffff 20%, #cfc9ff 70%, #ffffff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero p {
  color: rgba(255, 255, 255, 0.72);
  max-width: 520px;
  font-size: 15px;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.hero-actions .btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.hero-actions .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 30px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.hero-meta b {
  color: #fff;
  font-size: 16px;
  margin-right: 2px;
}

.sep {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.2);
}

.hero-visual {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preview-card {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

.preview-card canvas {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 10px;
  background: #fff;
}

.preview-cap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.dot-live {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.18);
}

.hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-tag {
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
}

.section {
  margin-top: 46px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.legend {
  display: flex;
  gap: 8px;
}

.matrix {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stage {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  padding: 16px 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  cursor: pointer;
  transition: all 0.18s ease;
  min-height: 96px;
}

.stage:hover {
  border-color: #c7c2ff;
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stage.active {
  background: linear-gradient(180deg, #ffffff, #faf9ff);
  border-color: #e0dcff;
}

.stage-no {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  opacity: 0.9;
}

.stage.plan .stage-no {
  background: #98a2b3;
  opacity: 0.55;
}

.stage-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.stage-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.stage-desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

.stage-tag {
  flex: none;
  align-self: flex-start;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--muted);
}

.stage-tag.tag-green {
  background: var(--green-soft);
  border-color: #c7ecd9;
  color: #067647;
}

.cases {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.case-card {
  display: grid;
  grid-template-columns: 168px 1fr;
  gap: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.18s;
}

.case-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.case-thumb {
  border-radius: 12px;
  overflow: hidden;
  background: #f2f4f7;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
}

.case-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  mix-blend-mode: multiply;
}

.case-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.case-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.case-top h3 {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.case-meta {
  color: var(--muted);
  font-size: 12px;
  margin-top: 6px;
}

.case-feat {
  color: var(--ink-2);
  font-size: 12px;
  margin-top: 8px;
  line-height: 1.6;
}

.case-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
}

.flow-card {
  background: linear-gradient(120deg, #ffffff, #f8f7ff);
}

.flow-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.flow-head h3 {
  font-size: 16px;
}

.flow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--line);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
}

.flow-step:not(:last-child)::after {
  content: '→';
  margin-left: 6px;
  color: #c4c9d4;
}

.flow-idx {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.modal-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 0 12px;
}

.modal-step {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface-2);
  font-size: 12px;
  color: var(--ink-2);
}

.step-idx {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 1080px) {
  .matrix {
    grid-template-columns: repeat(3, 1fr);
  }
  .hero-inner {
    grid-template-columns: 1fr;
  }
  .hero h1 {
    font-size: 34px;
  }
}

@media (max-width: 760px) {
  .matrix {
    grid-template-columns: repeat(2, 1fr);
  }
  .cases {
    grid-template-columns: 1fr;
  }
  .case-card {
    grid-template-columns: 120px 1fr;
  }
  .modal-steps {
    grid-template-columns: 1fr;
  }
}
</style>
