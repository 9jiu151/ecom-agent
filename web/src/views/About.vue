<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const acceptance = [
  ['单肩包 Banner', '950×250 或 1920×600，商品主体清晰、卖点可见', '已支持'],
  ['手提包 Banner', '同上，含原价与活动价对比', '已支持'],
  ['商品还原度', '商品图不裁切变形，主体占比 ≥ 30%', '等比 contain + 去白底'],
  ['视觉规范', '主题风格明确、配色统一、有电商感', '9 种主题 × 4 种布局'],
  ['文件可用', 'PNG/JPG，尺寸精确，可直接上传', '像素级导出'],
  ['能力中心', '8 个环节可切换生成并导出 TXT/CSV', '已支持']
]

const stack = [
  ['前端', 'Vue 3 + Vite', '组件化单页应用，路由与状态管理'],
  ['视觉', '自研 Canvas 渲染器', '参数化模板，确定性像素导出'],
  ['后端', 'Node.js + Express', '上传、历史、AI 代理、静态托管'],
  ['存储', 'JSON 文件', '无数据库依赖，便于迁移'],
  ['AI', 'OpenAI 兼容协议', '可替换任意国内大模型'],
  ['部署', '单端口 + Docker', '本地与公网同一套构建']
]
</script>

<template>
  <div class="page about">
    <div class="page-head">
      <div>
        <span class="eyebrow">Project Overview</span>
        <h1 class="page-title">项目说明</h1>
        <p class="page-sub">面向指导老师与评审：项目定位、需求分析结论、技术架构、AI 开发流程与验收对照。</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="router.push('/pipeline')">体验全流程</button>
    </div>

    <section class="block">
      <h2>一、项目定位</h2>
      <p>
        「电商全流程智能体」不是单一工具，而是一套以 12 个电商环节为能力地图的 AI 工作台。
        本期以「一个商品进，一套上新方案出」为主线，策划、拍摄、美工、内容、运营、上架、推广、直播、客服、
        跨文化与跨境 11 个环节均可在能力中心直接操作，数据环节提供转化分析，全部环节可产出结果。
      </p>
      <div class="kv">
        <div><span>课程要求</span><b>选择案例 → 分析需求 → 编写需求文档 → 按 AI 开发规范完成开发</b></div>
        <div><span>选定案例</span><b>电商全流程智能体</b></div>
        <div><span>实证素材</span><b>《网店经营》实训手册任务 3 · 箱包类目</b></div>
        <div><span>交付形态</span><b>可公网访问的 Web 应用 + 项目需求文档（V2.0）+ AI 开发记录</b></div>
      </div>
    </section>

    <section class="block">
      <h2>二、需求分析结论</h2>
      <div class="cards">
        <div class="mini-card">
          <span class="mini-no">01</span>
          <h3>核心矛盾</h3>
          <p>规划方案要求「纯视觉、不加促销」，实训手册却必须体现价格与卖点。解决方式是双模式：品牌视觉 / 促销转化，一键切换。</p>
        </div>
        <div class="mini-card">
          <span class="mini-no">02</span>
          <h3>范围收敛</h3>
          <p>12 个环节统一收敛为「生成型能力」：输入商品参数，本地规则引擎产出方案与可下载交付物；平台真实数据接口明确列为不做，不虚构数据。</p>
        </div>
        <div class="mini-card">
          <span class="mini-no">03</span>
          <h3>智能体特征</h3>
          <p>通过流水线把模块串成闭环，输入商品即可连续产出策划、视觉、文案与数据，避免"工具集合"的定位。</p>
        </div>
      </div>
    </section>

    <section class="block">
      <h2>三、技术架构</h2>
      <div class="arch">
        <div class="arch-row"><span class="arch-label">用户层</span><span class="arch-box">浏览器 · 局域网 / 公网访问</span></div>
        <div class="arch-arrow">↓ HTTP</div>
        <div class="arch-row"><span class="arch-label">前端</span><span class="arch-box">Vue 3 + Vite · 首页矩阵 / 流水线 / Banner / 能力中心</span></div>
        <div class="arch-arrow">↓ REST API</div>
        <div class="arch-row"><span class="arch-label">服务层</span><span class="arch-box">Express · 上传 / 历史 / AI 代理 / 静态托管</span></div>
        <div class="arch-arrow">↓</div>
        <div class="arch-row"><span class="arch-label">数据层</span><span class="arch-box">素材目录 · 生成图片 · JSON 记录与配置</span></div>
      </div>
      <table class="table">
        <thead>
          <tr><th>层</th><th>技术</th><th>说明</th></tr>
        </thead>
        <tbody>
          <tr v-for="[a, b, c] in stack" :key="a">
            <td>{{ a }}</td>
            <td>{{ b }}</td>
            <td>{{ c }}</td>
          </tr>
        </tbody>
      </table>
      <p class="note">
        与原规划方案的差异：原方案选型 Fabric.js + Sharp，本项目改为自研 Canvas 渲染器。
        原因是 Banner 需要参数化模板与像素级确定输出，自研渲染层更可控、体积更小，也便于同一套代码复用到流水线缩略图。
      </p>
    </section>

    <section class="block">
      <h2>四、AI 开发规范执行</h2>
      <div class="flow-list">
        <div class="flow-item"><span>1</span><div><b>需求先行</b><p>先产出《项目需求文档》，明确范围、验收与降级策略，再进入编码。</p></div></div>
        <div class="flow-item"><span>2</span><div><b>人机分工</b><p>AI 负责脚手架、渲染器、文案规则与页面实现；人负责范围决策、视觉验收与关键取舍。</p></div></div>
        <div class="flow-item"><span>3</span><div><b>过程留痕</b><p>记录提示词、生成范围与人工修改点，形成《AI 开发记录》，可追溯每一处 AI 产出。</p></div></div>
        <div class="flow-item"><span>4</span><div><b>复核机制</b><p>AI 输出统一标注"需人工复核"；文案、配色、导出尺寸均设人工验收点。</p></div></div>
      </div>
    </section>

    <section class="block">
      <h2>五、验收对照（实训手册任务 3）</h2>
      <table class="table">
        <thead>
          <tr><th>验收项</th><th>标准</th><th>实现情况</th></tr>
        </thead>
        <tbody>
          <tr v-for="[a, b, c] in acceptance" :key="a">
            <td>{{ a }}</td>
            <td>{{ b }}</td>
            <td><span class="tag tag-green">{{ c }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="block">
      <h2>六、交付物清单</h2>
      <ul class="delivery">
        <li><b>项目需求文档</b>：docs/项目需求文档.md（DOCX / PDF 同目录）</li>
        <li><b>可运行 Web 应用</b>：本站在线可访问</li>
        <li><b>AI 开发记录</b>：docs/AI开发记录.md</li>
        <li><b>部署说明</b>：docs/部署说明.md</li>
        <li><b>箱包素材与案例</b>：assets/ 五类商品图</li>
      </ul>
      <p class="note">
        本页面所有数据中，Banner 渲染、文案生成、数据分析与能力中心方案均为实时计算；数据分析与跨境价格使用内置示例或参考汇率，已明确标注。
      </p>
    </section>
  </div>
</template>

<style scoped>
.about {
  max-width: 1000px;
}

.block {
  margin-top: 34px;
}

.block h2 {
  font-size: 19px;
  letter-spacing: -0.01em;
  margin-bottom: 12px;
}

.block > p {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.85;
}

.kv {
  margin-top: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
}

.kv > div {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 16px;
  padding: 11px 16px;
  border-bottom: 1px dashed var(--line);
  font-size: 13px;
}

.kv > div:last-child {
  border-bottom: none;
}

.kv span {
  color: var(--muted);
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.mini-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px;
}

.mini-no {
  font-size: 11px;
  font-weight: 700;
  color: var(--brand);
  background: var(--brand-soft);
  padding: 2px 7px;
  border-radius: 6px;
}

.mini-card h3 {
  font-size: 14px;
  margin: 10px 0 6px;
}

.mini-card p {
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.75;
}

.arch {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 14px;
}

.arch-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 14px;
  align-items: center;
}

.arch-label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.arch-box {
  padding: 11px 14px;
  border-radius: 9px;
  background: linear-gradient(120deg, #f7f6ff, #eef2ff);
  border: 1px solid #e4e0ff;
  font-size: 13px;
  color: var(--brand-ink);
}

.arch-arrow {
  font-size: 11px;
  color: var(--muted);
  padding: 4px 0 4px 104px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  font-size: 12.5px;
}

.table th,
.table td {
  text-align: left;
  padding: 10px 14px;
  border-bottom: 1px dashed var(--line);
  color: var(--ink-2);
  line-height: 1.6;
}

.table th {
  background: var(--surface-2);
  font-size: 11.5px;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.table tr:last-child td {
  border-bottom: none;
}

.note {
  margin-top: 10px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.75;
  padding-left: 12px;
  border-left: 3px solid var(--brand-soft);
}

.flow-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-item {
  display: flex;
  gap: 12px;
  padding: 13px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.flow-item > span {
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: 7px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 11.5px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.flow-item b {
  font-size: 13.5px;
}

.flow-item p {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.7;
  margin-top: 2px;
}

.delivery {
  margin: 0;
  padding-left: 18px;
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 2;
}

@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
