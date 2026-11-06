import { themeByKey } from './themes'

function pick(list, variant = 0) {
  return list[variant % list.length]
}

export function buildBannerCopy(product, themeKey, mode = 'promo', variant = 0) {
  const theme = themeByKey(themeKey)
  const p = product || {}
  const features = (p.features || []).slice(0, 3)
  const price = Number(p.price || 0)
  const original = Number(p.originalPrice || 0)

  if (mode === 'brand') {
    return {
      brand: p.brand || 'LUMI',
      eyebrow: theme.en,
      title: pick(theme.headline, variant),
      subtitle: `${p.shortName || p.name || '新品'} · ${p.material || '精选材质'}`,
      price: '',
      original: '',
      badge: '',
      cta: '',
      tagline: `${p.tone || '简约'}设计 · ${p.audience ? '为日常而生' : '当季新品'}`
    }
  }

  return {
    brand: p.brand || 'LUMI',
    eyebrow: theme.en,
    title: p.shortName || p.name || '当季新品',
    subtitle: features.length ? features.join(' · ') : '精选材质 · 舒适耐用',
    price: price ? `¥${price}` : '',
    original: original && original > price ? `¥${original}` : '',
    badge: theme.badge,
    cta: theme.cta,
    tagline: (p.promo || '').includes('包邮') ? '全国包邮 · 现货速发' : '当季新品 · 限时优选'
  }
}

export function generatePlan(product) {
  const p = product || {}
  const features = p.features || []
  const points = [
    features[0] ? `${features[0]}，久背不累` : '轻量设计，久背不累',
    features[1] ? `${features[1]}，细节可见` : '工艺扎实，细节可见',
    `${p.material || '优选'}材质，日常好打理`,
    `${p.colors || '多色'}可选，适配多种穿搭`
  ]

  const audience =
    p.audience || '20-35 岁都市女性，通勤、逛街与短途出行场景'
  const differentiation = `${p.tone || '简约'}风格 + ${p.material || '优选'}材质，在同类同价位商品中以工艺细节取胜`
  const price = Number(p.price || 0)
  const pricing = price
    ? `建议维持 ${price} 元到手价，用包邮与赠品提升转化，不与低价款正面对比`
    : '建议以中位价切入，配合包邮策略测试转化'

  return {
    sellingPoints: points,
    audience,
    differentiation,
    pricing,
    keywords: [
      p.shortName || '新品',
      p.material || '材质',
      p.tone ? `${p.tone}风` : '百搭',
      '通勤包',
      '包邮'
    ],
    positioning: `${p.tone || '日韩'}风格 · ${p.material || '优选'}材质 · ${p.colors || '多色可选'}`
  }
}

export function generateContent(product, variant = 0) {
  const p = product || {}
  const name = p.shortName || p.name || '当季新品'
  const tone = p.tone || '简约'
  const material = p.material || '优选材质'
  const price = Number(p.price || 0)
  const features = p.features || []

  const titles = [
    `${name} ${tone}风${material}${features[0] || '百搭'} ${price ? price + '元包邮' : '当季新款'}`,
    `${p.brand || 'LUMI'}新款 ${name} 通勤百搭 ${p.colors || '多色'}可选`,
    `${features[0] || '轻便'}·${features[1] || '耐用'} ${name} ${price ? '限时' + price + '元' : '新品上市'}`
  ]

  const banners = [
    `${tone}新选，一眼心动`,
    features[0] ? `${features[0]}，久背不累` : '轻盈上身，久背不累',
    `${material}质感，细节见真章`,
    price ? `到手价 ¥${price}，全国包邮` : '当季新款，现货速发',
    `${p.colors || '多色'}可选，总有一款适合你`
  ]

  const script = [
    `0-3s|开场特写：${name}正面 45° 机位，柔光箱打亮|这款${name}，第一眼就被质感打动。`,
    `3-8s|细节推镜：五金、车线、包边依次划过|${features[0] || '车线工整'}，${features[1] || '细节经得起近看'}。`,
    `8-14s|上身演示：模特单肩/手提通勤场景|日常通勤、周末出门，一只就够。`,
    `14-20s|容量展示：依次放入手机、口红、纸巾|看着小巧，装得下日常所需。`,
    `20-26s|配色对比：${p.colors || '多色'}依次出镜|${p.colors || '多色'}可选，通勤和约会都能搭。`,
    `26-30s|收尾：商品+价格卡+品牌落版|${price ? '到手价 ' + price + ' 元，包邮到家。' : '当季新款，点击了解。'}`
  ]

  return { titles, banners, script }
}

export function generateData(product) {
  const p = product || {}
  const base = Number(p.price || 99)
  const exposure = 12800 + base * 36
  const clicks = Math.round(exposure * 0.041)
  const carts = Math.round(clicks * 0.22)
  const orders = Math.round(carts * 0.58)
  const conversion = ((orders / clicks) * 100).toFixed(2)

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const trend = [0.82, 0.9, 0.95, 1.02, 1.12, 1.28, 1.18].map((f, i) => ({
    day: days[i],
    exposure: Math.round(exposure / 7 * f),
    clicks: Math.round((clicks / 7) * f)
  }))

  return {
    summary: `7 日累计曝光 ${exposure.toLocaleString()}，点击率 4.1%，成交转化 ${conversion}%，周末为高峰。`,
    metrics: [
      { label: '曝光量', value: exposure.toLocaleString(), delta: '+12.4%' },
      { label: '点击量', value: clicks.toLocaleString(), delta: '+8.1%' },
      { label: '加购量', value: carts.toLocaleString(), delta: '+6.7%' },
      { label: '成交量', value: orders.toLocaleString(), delta: '+9.3%' },
      { label: '点击率', value: '4.10%', delta: '+0.3pt' },
      { label: '转化率', value: `${conversion}%`, delta: '+0.6pt' }
    ],
    trend,
    channels: [
      { name: '搜索', value: 46 },
      { name: '推荐', value: 31 },
      { name: '店铺首页', value: 15 },
      { name: '外部投放', value: 8 }
    ],
    suggestions: [
      '主图点击率高于类目均值，建议保留当前风格并测试深色版本',
      '周六曝光转化最高，建议将活动资源集中到周五晚至周日',
      '加购到成交的流失偏高，建议在详情首屏补充尺寸与容量说明'
    ]
  }
}

export function buildPlanText(product, plan, content, data) {
  const p = product || {}
  const lines = [
    `【电商全流程智能体 · 上新方案】`,
    `商品：${p.name || ''}`,
    `价格：${p.price ? p.price + ' 元' : '待定'}`,
    `人群：${plan.audience}`,
    ``,
    `一、商品策划`,
    ...plan.sellingPoints.map((s, i) => `${i + 1}. ${s}`),
    `差异化：${plan.differentiation}`,
    `定价建议：${plan.pricing}`,
    `关键词：${plan.keywords.join(' / ')}`,
    ``,
    `二、内容创作`,
    `标题：`,
    ...content.titles.map((t, i) => `${i + 1}. ${t}`),
    `短文案：`,
    ...content.banners.map((t, i) => `${i + 1}. ${t}`),
    `短视频脚本：`,
    ...content.script.map((t) => `- ${t}`),
    ``,
    `三、数据分析`,
    data.summary,
    ...data.suggestions.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `四、Banner 规格`,
    `模板一 950×250 / 模板二 1920×600`,
    ``,
    `说明：本方案由电商全流程智能体生成，AI 内容需人工复核后使用。`
  ]
  return lines.join('\n')
}
