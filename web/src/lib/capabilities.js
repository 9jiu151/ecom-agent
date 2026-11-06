/* 8 个电商环节的生成规则：输入商品信息，输出可执行方案（不依赖第三方平台接口） */

export const CAPABILITIES = [
  { key: 'shoot', no: '02', name: '商品拍摄', desc: '拍摄分镜、场景清单与主图合规检查', deliverable: '分镜表 + 合规清单' },
  { key: 'ops', no: '05', name: '店铺运营', desc: '首页装修排布、活动日历与上新节奏', deliverable: '装修方案 + 活动排期' },
  { key: 'listing', no: '06', name: '商品上架', desc: '标题关键词、类目属性与 SKU 表', deliverable: '上架表（CSV）' },
  { key: 'promo', no: '07', name: '营销推广', desc: '人群包、预算分配与素材清单', deliverable: '投放计划' },
  { key: 'live', no: '08', name: '直播营销', desc: '直播时间轴、逐段话术与场控提示', deliverable: '直播台本' },
  { key: 'service', no: '09', name: '客户服务', desc: '商品知识库与咨询问答', deliverable: 'FAQ 知识库' },
  { key: 'culture', no: '10', name: '跨文化沟通', desc: '多语言文案本地化与文化提示', deliverable: '多语言文案' },
  { key: 'crossborder', no: '11', name: '跨境运营', desc: '目标市场、平台规则与合规清单', deliverable: '跨境方案' }
]

export const CAP_MAP = Object.fromEntries(CAPABILITIES.map((c) => [c.key, c]))

const FX = { USD: 0.139, JPY: 20.4, EUR: 0.128, KRW: 190 }

function splitColors(colors = '') {
  return colors
    .split(/[、,，/]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function featuresOf(p) {
  const list = Array.isArray(p.features) ? p.features : String(p.features || '').split(/[、,，]/)
  return list.map((s) => String(s).trim()).filter(Boolean)
}

function categoryOf(p) {
  if (p.category === 'handbag') return '女包 > 手提包'
  if (p.category === 'single') return '女包 > 单肩包'
  return '女包 > 单肩包/手提包'
}

/* ---------- 02 商品拍摄 ---------- */

function genShoot(p) {
  const name = p.shortName || p.name || '商品'
  const material = p.material || '优选材质'
  const colors = p.colors || '主推色'
  return {
    scenes: [
      { no: '01', shot: '主图 · 正面', setup: '纯白背景，商品居中，留白 12%-15%', camera: '正面平视，柔光箱 45° 双侧打光', use: '平台主图第 1 张' },
      { no: '02', shot: '主图 · 45° 侧身', setup: '浅灰无缝纸，商品斜放', camera: '45° 俯拍，补充轮廓光', use: '主图第 2 张 / 详情首屏' },
      { no: '03', shot: '细节 · 五金与车线', setup: '局部特写，背景虚化', camera: '微距 90mm，侧逆光', use: '详情页卖点区' },
      { no: '04', shot: '细节 · 内里与容量', setup: '打开包盖，放入手机/口红/纸巾', camera: '俯拍 60°，顶光', use: '详情页容量说明' },
      { no: '05', shot: '上身 · 通勤场景', setup: `${p.audience || '都市女性'}日常穿搭`, camera: '半身人像，自然光 + 反光板', use: '详情页场景图 / 短视频封面' },
      { no: '06', shot: '配色 · 全家福', setup: `并列展示 ${colors}`, camera: '正面平视，统一光比', use: 'SKU 选择区' }
    ],
    checklist: [
      '主图底色为纯白或浅灰，商品占比不低于 70%',
      '主图不带促销文字、水印、拼接边框',
      '图片短边不小于 800px，建议 1200×1200 以上',
      `材质（${material}）纹理清晰，避免过度磨皮丢失质感`,
      '同一链接内所有 SKU 色差与实物一致',
      '搭配场景图不得出现第三方品牌 logo'
    ],
    compliance: [
      { item: '白底主图', level: 'ok', note: '按上述场景 01 拍摄即可满足' },
      { item: '促销信息位置', level: p.promo ? 'warn' : 'ok', note: p.promo ? '促销语只放详情与 Banner，主图保持干净' : '未设置促销语，主图直接发布' },
      { item: '尺寸与清晰度', level: 'todo', note: '导出后请核对短边 ≥ 800px、文件 ≤ 3MB' },
      { item: '真人模特授权', level: 'todo', note: '使用模特图需保留肖像授权凭证' }
    ]
  }
}

/* ---------- 05 店铺运营 ---------- */

function genOps(p) {
  const name = p.shortName || p.name || '新品'
  return {
    modules: [
      { area: '首屏海报', content: `${name} 主推海报 + 到手价利益点`, reason: '承接搜索与推荐流量，第一时间传达卖点' },
      { area: '新品专区', content: '2 主推 + 2 搭配款，横向三栏', reason: '提高关联购买与停留时长' },
      { area: '卖点楼层', content: '材质、工艺、容量三组图文', reason: '对应详情页高频咨询点' },
      { area: '活动楼层', content: '限时价 + 包邮寄送信息', reason: '放大促销转化' },
      { area: '店铺推荐', content: '同风格包袋 4 款', reason: '承接未成交流量' }
    ],
    calendar: [
      { week: '第 1 周', action: '上新预热', channel: '店铺首页 / 私域', note: '发布 3 张场景图与 1 条短视频' },
      { week: '第 2 周', action: '主推开售', channel: '搜索 + 推荐', note: '主图与详情同步上线，设置首周价' },
      { week: '第 3 周', action: '内容种草', channel: '短视频 / 直播切片', note: '集中投放上身与容量场景' },
      { week: '第 4 周', action: '返场收尾', channel: '私域 + 复购', note: '清理库存色，推搭配款' }
    ],
    rhythm: ['周一 10:00 上新预热', '周三 20:00 短视频发布', '周五 20:00 主推开售', '周日 返场与数据复盘'],
    kpi: ['首页停留时长 ≥ 45 秒', '主推款点击率 ≥ 4%', '加购率 ≥ 8%', '首周动销率 ≥ 30%']
  }
}

/* ---------- 06 商品上架 ---------- */

function genListing(p) {
  const name = p.shortName || p.name || '新品'
  const tone = p.tone || '简约'
  const material = p.material || '优选材质'
  const colors = splitColors(p.colors)
  const feats = featuresOf(p)
  const title = `${p.brand || 'LUMI'} ${name} ${tone}风${material} ${feats[0] || '百搭'} ${colors.length ? colors.join('/') + '可选' : ''}`.trim()
  const attributes = [
    { field: '类目', value: categoryOf(p) },
    { field: '品牌', value: p.brand || 'LUMI' },
    { field: '材质', value: material },
    { field: '风格', value: tone },
    { field: '颜色分类', value: colors.join('、') || '按实物' },
    { field: '适用人群', value: p.audience || '青年女性' },
    { field: '闭合方式', value: '按实物填写（拉链 / 磁扣）' },
    { field: '流行元素', value: '车缝线 / 金属扣' }
  ]
  const sku = (colors.length ? colors : ['默认色']).map((c, i) => ({
    color: c,
    price: i === 0 ? Number(p.price || 99) : Number(p.price || 99),
    original: Number(p.originalPrice || 0),
    stock: i === 0 ? 80 : 40,
    code: `${(p.brand || 'LM').slice(0, 2).toUpperCase()}-${i + 1}`
  }))
  return {
    title,
    titleLen: title.length,
    keywords: [
      name,
      material,
      `${tone}风`,
      '通勤包',
      '单肩包',
      colors[0] || '百搭',
      '包邮'
    ].filter(Boolean),
    attributes,
    sku,
    warning: title.length > 60 ? '标题超过 60 字符，建议精简' : '标题长度符合主流平台要求'
  }
}

/* ---------- 07 营销推广 ---------- */

function genPromo(p, extra = {}) {
  const budget = Number(extra.budget || 500)
  const name = p.shortName || p.name || '主推款'
  return {
    audiences: [
      { name: '同类目高意向人群', reason: '近 30 天浏览/加购同类女包', action: '高出价抢首屏', weight: 40 },
      { name: '相似店铺人群', reason: '同价位女包店铺成交用户', action: '中等溢价，测试素材', weight: 30 },
      { name: '内容兴趣人群', reason: '穿搭、通勤、日韩风格内容互动', action: '低价广覆盖', weight: 20 },
      { name: '店铺老客', reason: '历史成交与复购用户', action: '私域触达，低成本', weight: 10 }
    ],
    budget: [
      { channel: '搜索推广', ratio: 40, amount: Math.round(budget * 0.4), note: '承接明确购买意图' },
      { channel: '信息流', ratio: 35, amount: Math.round(budget * 0.35), note: '放大场景图素材' },
      { channel: '达人合作', ratio: 15, amount: Math.round(budget * 0.15), note: '小预算测试 2-3 位腰部达人' },
      { channel: '私域复购', ratio: 10, amount: Math.round(budget * 0.1), note: '老客专属券' }
    ],
    creatives: [
      { type: '方图 1:1', spec: '800×800', content: `${name} 白底主图 + 卖点标签`, use: '搜索 / 推荐' },
      { type: '横版 Banner', spec: '950×250', content: `${name} 场景图 + 价格利益点`, use: '店铺首页 / 活动页' },
      { type: '竖版短视频封面', spec: '1080×1920', content: '上身演示首帧 + 大字卖点', use: '信息流 / 内容平台' }
    ],
    schedule: ['第 1-3 天 小预算测素材', '第 4-7 天 放量优质素材', '第 8-14 天 稳定出价，控 ROI', '每 3 天淘汰低点击素材'],
    note: `日预算 ${budget} 元为输入值，实际出价需按平台实时竞争调整；人群规模以平台后台为准。`
  }
}

/* ---------- 08 直播营销 ---------- */

function genLive(p) {
  const name = p.shortName || p.name || '主推款'
  const price = Number(p.price || 99)
  const feats = featuresOf(p)
  return {
    timeline: [
      { time: '00:00-00:03', segment: '开场留人', script: `欢迎进直播间，今天主推${name}，先点关注，整点抽一位免单。`, control: '置顶评论：关注+评论抽免单' },
      { time: '00:03-00:08', segment: '痛点引入', script: '通勤包不是越大越好，装得下手机口红、又不变形，才是日常刚需。', control: '展示空包与装满对比' },
      { time: '00:08-00:15', segment: '卖点演示', script: `${feats[0] || '轻量设计'}，${feats[1] || '细节扎实'}，镜头拉近看车线和五金。`, control: '特写机位切换' },
      { time: '00:15-00:20', segment: '上身展示', script: `单肩、手提、斜挎三种背法，${p.colors || '多色'}都能搭。`, control: '主播换装演示' },
      { time: '00:20-00:25', segment: '价格逼单', script: `日常价 ${price} 元，今天直播间到手 ${price} 元再加赠品，库存只有 80 件。`, control: '挂购物袋 + 倒计时贴纸' },
      { time: '00:25-00:30', segment: '答疑收尾', script: '尺码、发货、退换问题打在公屏，客服一对一回复。', control: '重复念高频问题' }
    ],
    hooks: [
      '整点抽免单，停留 3 分钟即可参与',
      '前 20 单加赠防尘袋',
      '点赞到 5000 解锁第二色半价',
      '评论区扣「通勤」领 10 元券'
    ],
    roles: ['主推款（讲解 10 分钟）', '福利款（9.9 元引流）', '搭配款（连带成交）'],
    note: '话术为规则模板，正式开播前需按实际库存、赠品与平台规则调整。'
  }
}

/* ---------- 09 客户服务 ---------- */

function genService(p) {
  const name = p.shortName || p.name || '这款包'
  const material = p.material || '优选材质'
  const colors = p.colors || '多色'
  const price = Number(p.price || 0)
  const faq = [
    { q: '是什么材质？', a: `${name}采用${material}，表面纹理清晰，日常擦拭即可打理。`, keys: ['材质', '面料', '皮'] },
    { q: '有几个颜色？', a: `目前在售 ${colors}，页面可选颜色以下单时库存为准。`, keys: ['颜色', '配色', '色'] },
    { q: '能装下什么？', a: '可放入手机、短款钱包、口红、纸巾与钥匙，通勤日常够用。', keys: ['容量', '装', '大小', '尺寸'] },
    { q: '怎么背？', a: '支持单肩与手提，肩带可调节；斜挎需求建议先确认肩带长度。', keys: ['背', '肩带', '斜挎'] },
    { q: '多少钱，有优惠吗？', a: price ? `当前到手价 ${price} 元，活动期以页面价格为准，可领店铺券。` : '价格以页面活动为准。', keys: ['价格', '多少钱', '优惠', '便宜'] },
    { q: '多久发货？', a: '现货 48 小时内发出，节假日顺延；物流单号会在订单页同步。', keys: ['发货', '物流', '快递', '多久'] },
    { q: '支持退换吗？', a: '支持 7 天无理由退换，商品不影响二次销售即可；运费按平台规则执行。', keys: ['退', '换', '售后', '退款'] },
    { q: '怎么保养？', a: `${material}避免长时间暴晒与接触溶剂，脏污用软布蘸清水轻擦，阴干即可。`, keys: ['保养', '清洗', '打理', '脏'] }
  ].map(({ keys, ...rest }) => ({ ...rest, keys }))
  return {
    faq,
    quickReplies: [
      '亲，这款是现货，48 小时内发出～',
      '颜色以页面库存为准，拍下前可以帮您确认～',
      '支持 7 天无理由，退换按平台规则处理～',
      '需要看上身图或细节图，我这边马上发您～'
    ],
    note: '知识库由商品参数生成，正式使用前请按实物信息校对；接入大模型后可升级为语义检索问答。'
  }
}

/* ---------- 10 跨文化沟通 ---------- */

const TONE_EN = { 日韩: 'Korean-inspired', 轻奢: 'affordable luxury', 简约: 'minimalist', 时尚: 'trendy', 复古: 'vintage' }
const FEATURE_EN = [
  [/护肩/, 'comfortable shoulder support'],
  [/车线/, 'precision stitching'],
  [/面料/, 'fine fabric'],
  [/压花/, 'embossed finish'],
  [/提把/, 'dual handles'],
  [/锁扣/, 'metal lock detail'],
  [/磁扣/, 'magnetic closure'],
  [/轻/, 'lightweight build']
]

function localize(p, lang) {
  const name = p.shortName || p.name || 'Bag'
  const material = p.material || 'selected material'
  const tone = TONE_EN[p.tone] || 'modern'
  const feats = featuresOf(p)
  const enFeat = feats
    .map((f) => {
      const hit = FEATURE_EN.find(([re]) => re.test(f))
      return hit ? hit[1] : null
    })
    .filter(Boolean)
    .slice(0, 3)

  if (lang === 'en') {
    return {
      code: 'en',
      label: '英语',
      title: `${name} ${tone} ${material} Bag`,
      subtitle: enFeat.length ? enFeat.join(' · ') : 'lightweight · everyday-ready',
      points: [
        'Fits phone, wallet and daily essentials',
        'Adjustable strap for shoulder or hand carry',
        'Available in multiple colors',
        'Ships within 48 hours'
      ],
      note: '英文为模板本地化，正式投放前建议母语者复核。'
    }
  }
  if (lang === 'ja') {
    return {
      code: 'ja',
      label: '日语',
      title: `${name} ${p.tone === '轻奢' ? '上品' : 'ベーシック'}な${material}バッグ`,
      subtitle: '軽量・毎日使いにちょうどいい',
      points: ['スマホ・財布・コスメが収まる', '肩掛け・手持ちの2WAY', 'カラー展開あり', '48時間以内に発送'],
      note: '日语为模板本地化，敬语与尺寸描述需人工确认。'
    }
  }
  return {
    code: 'ko',
    label: '韩语',
    title: `${name} ${p.tone === '轻奢' ? '럭셔리' : '데일리'} ${material} 백`,
    subtitle: '가볍고 실용적인 데일리 백',
    points: ['휴대폰·지갑·화장품 수납 가능', '숄더·핸드 2WAY', '다양한 컬러', '48시간 내 발송'],
    note: '韩语为模板本地化，建议本地运营复核用词。'
  }
}

function genCulture(p) {
  return {
    langs: ['en', 'ja', 'ko'].map((l) => localize(p, l)),
    taboos: [
      { market: '欧美', point: '避免使用绝对化用语（best / No.1），广告法风险高' },
      { market: '日本', point: '价格与赠品表述需清晰，避免「必ず」等绝对承诺' },
      { market: '韩国', point: '慎用与年龄、外貌相关的描述，避免物化表达' },
      { market: '中东', point: '配色与图案需避开宗教敏感元素' }
    ],
    note: '文化提示为通用清单，具体市场投放前请结合当地法规与平台审核规则。'
  }
}

/* ---------- 11 跨境运营 ---------- */

function round(n) {
  return Math.round(n * 100) / 100
}

function genCrossborder(p) {
  const price = Number(p.price || 99)
  const name = p.shortName || p.name || '商品'
  const landed = round(price * FX.USD * 1.35 + 3.2)
  return {
    markets: [
      { market: '美国', platform: 'Amazon US', price: `≈ $${landed}`, reason: '通勤包需求稳定，客单价适中' },
      { market: '日本', platform: 'Amazon JP / 乐天', price: `≈ ¥${Math.round(price * FX.JPY * 1.25)}`, reason: '偏好轻量、多WAY设计' },
      { market: '欧洲', platform: 'Amazon EU / 独立站', price: `≈ €${round(price * FX.EUR * 1.35 + 2.8)}`, reason: '需提前处理 VAT 与合规' },
      { market: '东南亚', platform: 'Shopee / Lazada', price: `≈ S$${round(price * 0.19 * 1.2 + 2)}`, reason: '价格敏感，适合轻小件' }
    ],
    rules: [
      { platform: 'Amazon', note: '主图纯白底，标题 ≤ 200 字符，禁止促销语与价格信息' },
      { platform: 'Shopee', note: '标题堆叠热搜词有效，需维护 48 小时发货率' },
      { platform: 'TikTok Shop', note: '短视频与直播为流量主入口，素材需真人出镜' },
      { platform: '独立站', note: '需自建支付与物流方案，注意退换政策披露' }
    ],
    compliance: [
      '皮革/PU 制品需清晰标注材质与产地',
      '美国市场注意加州 65 号提案警示标签',
      '欧盟需符合 REACH 化学物质限制',
      `外观设计避免与知名品牌（如 ${name} 同类款）构成混淆`,
      '商标与图案需确认无侵权后上线'
    ],
    logistics: [
      { mode: '空运小包', time: '7-12 天', note: '适合轻小件，单价高' },
      { mode: '专线小包', time: '10-18 天', note: '性价比平衡，可追踪' },
      { mode: '海外仓', time: '2-5 天', note: '需提前备货，适合稳定爆款' }
    ],
    note: '价格按参考汇率折算并预估头程与平台佣金，实际以结算为准；合规清单不构成法律意见。'
  }
}

export function buildCapability(key, product, extra = {}) {
  const p = product || {}
  switch (key) {
    case 'shoot':
      return { key, ...genShoot(p) }
    case 'ops':
      return { key, ...genOps(p) }
    case 'listing':
      return { key, ...genListing(p) }
    case 'promo':
      return { key, ...genPromo(p, extra) }
    case 'live':
      return { key, ...genLive(p) }
    case 'service':
      return { key, ...genService(p) }
    case 'culture':
      return { key, ...genCulture(p) }
    case 'crossborder':
      return { key, ...genCrossborder(p) }
    default:
      return { key }
  }
}

export function listingCsv(result) {
  const rows = [['字段', '值']].concat(result.attributes.map((a) => [a.field, a.value]))
  rows.push(['标题', result.title])
  rows.push(['关键词', result.keywords.join(' ')])
  rows.push([])
  rows.push(['颜色', '售价', '原价', '库存', '编码'])
  result.sku.forEach((s) => rows.push([s.color, s.price, s.original || '', s.stock, s.code]))
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
}

export function capabilityText(key, result, product) {
  const p = product || {}
  const head = [
    `【电商全流程智能体 · ${CAP_MAP[key]?.name || '能力'}】`,
    `商品：${p.name || p.shortName || ''}`,
    ''
  ]
  if (key === 'shoot') {
    return head.concat([
      '一、拍摄分镜',
      ...result.scenes.map((s) => `${s.no} ${s.shot}｜场景：${s.setup}｜机位：${s.camera}｜用途：${s.use}`),
      '',
      '二、拍摄清单',
      ...result.checklist.map((c, i) => `${i + 1}. ${c}`),
      '',
      '三、主图合规检查',
      ...result.compliance.map((c) => `- [${c.level}] ${c.item}：${c.note}`)
    ]).join('\n')
  }
  if (key === 'ops') {
    return head.concat([
      '一、首页装修模块',
      ...result.modules.map((m, i) => `${i + 1}. ${m.area}｜${m.content}｜理由：${m.reason}`),
      '',
      '二、四周活动日历',
      ...result.calendar.map((c) => `- ${c.week}｜${c.action}｜${c.channel}｜${c.note}`),
      '',
      '三、日常节奏',
      ...result.rhythm.map((r) => `- ${r}`),
      '',
      '四、运营指标',
      ...result.kpi.map((k) => `- ${k}`)
    ]).join('\n')
  }
  if (key === 'listing') {
    return head.concat([
      `标题（${result.titleLen} 字符）：${result.title}`,
      `关键词：${result.keywords.join(' / ')}`,
      '',
      '类目属性：',
      ...result.attributes.map((a) => `- ${a.field}：${a.value}`),
      '',
      'SKU：',
      ...result.sku.map((s) => `- ${s.color}｜售价 ${s.price} 元｜库存 ${s.stock}｜编码 ${s.code}`),
      '',
      result.warning
    ]).join('\n')
  }
  if (key === 'promo') {
    return head.concat([
      '一、人群包',
      ...result.audiences.map((a) => `- ${a.name}（${a.weight}%）：${a.reason}；策略：${a.action}`),
      '',
      '二、预算分配',
      ...result.budget.map((b) => `- ${b.channel} ${b.ratio}%｜${b.amount} 元/日｜${b.note}`),
      '',
      '三、素材清单',
      ...result.creatives.map((c) => `- ${c.type} ${c.spec}｜${c.content}｜${c.use}`),
      '',
      '四、投放节奏',
      ...result.schedule.map((s) => `- ${s}`),
      '',
      result.note
    ]).join('\n')
  }
  if (key === 'live') {
    return head.concat([
      '一、直播时间轴',
      ...result.timeline.map((t) => `${t.time}｜${t.segment}｜话术：${t.script}｜场控：${t.control}`),
      '',
      '二、留人钩子',
      ...result.hooks.map((h) => `- ${h}`),
      '',
      `三、货盘结构：${result.roles.join(' / ')}`,
      '',
      result.note
    ]).join('\n')
  }
  if (key === 'service') {
    return head.concat([
      '一、商品知识库',
      ...result.faq.map((f) => `Q：${f.q}\nA：${f.a}`),
      '',
      '二、快捷回复',
      ...result.quickReplies.map((q) => `- ${q}`),
      '',
      result.note
    ]).join('\n')
  }
  if (key === 'culture') {
    return head.concat(
      result.langs.map(
        (l) => `【${l.label}】\n标题：${l.title}\n副标：${l.subtitle}\n卖点：\n${l.points.map((x) => '- ' + x).join('\n')}\n备注：${l.note}`
      ),
      ['', '文化禁忌提示', ...result.taboos.map((t) => `- ${t.market}：${t.point}`), '', result.note]
    ).join('\n')
  }
  return head.concat([
    '一、目标市场',
    ...result.markets.map((m) => `- ${m.market}｜${m.platform}｜参考售价 ${m.price}｜${m.reason}`),
    '',
    '二、平台规则差异',
    ...result.rules.map((r) => `- ${r.platform}：${r.note}`),
    '',
    '三、合规清单',
    ...result.compliance.map((c) => `- ${c}`),
    '',
    '四、物流方案',
    ...result.logistics.map((l) => `- ${l.mode}｜${l.time}｜${l.note}`),
    '',
    result.note
  ]).join('\n')
}
