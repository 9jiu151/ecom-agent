export const SIZES = [
  { key: 'template1', label: '模板一', width: 950, height: 250, note: '实训标准 · 950×250' },
  { key: 'template2', label: '模板二', width: 1920, height: 600, note: '宽屏焦点图 · 1920×600' },
  { key: 'custom', label: '自定义', width: 1200, height: 400, note: '按需设定宽高' }
]

export const LAYOUTS = [
  { key: 'img-left', label: '左图右文' },
  { key: 'img-right', label: '左文右图' },
  { key: 'center', label: '居中对称' },
  { key: 'full', label: '全屏背景' }
]

export const THEMES = [
  {
    key: 'spring',
    label: '春季新品',
    en: 'SPRING',
    desc: '柔粉花瓣 · 轻盈春日',
    bg: ['#FFF8F6', '#FCE8E8', '#F7D6DC'],
    ink: '#3B2B2F',
    muted: '#8C6E74',
    accent: '#D2647C',
    accent2: '#F3B9C6',
    panel: '#FFFDFC',
    decor: 'petals',
    tone: 'light',
    headline: ['春日新选', '把春天背在肩上', '轻盈出发'],
    badge: '春日上新',
    cta: '立即选购'
  },
  {
    key: 'summer',
    label: '夏日清凉',
    en: 'SUMMER',
    desc: '浅海蓝调 · 清凉通透',
    bg: ['#F1FBFF', '#DDF3FA', '#CDEAF3'],
    ink: '#0D3A49',
    muted: '#4F7C8A',
    accent: '#1399B0',
    accent2: '#A6E1EC',
    panel: '#FDFEFF',
    decor: 'bubbles',
    tone: 'light',
    headline: ['夏日轻装', '清凉出发', '一场夏日的轻旅行'],
    badge: '夏日限定',
    cta: '去看看'
  },
  {
    key: 'autumn',
    label: '秋季焕新',
    en: 'AUTUMN',
    desc: '暖橘奶油 · 换季质感',
    bg: ['#FFF9F1', '#F8E8D0', '#F1D5AF'],
    ink: '#3D2A1A',
    muted: '#826245',
    accent: '#B96E3E',
    accent2: '#EBC79C',
    panel: '#FFFCF7',
    decor: 'leaves',
    tone: 'light',
    headline: ['秋日焕新', '秋色新装', '换季新选择'],
    badge: '秋季上新',
    cta: '即刻入手'
  },
  {
    key: 'winter',
    label: '冬日暖阳',
    en: 'WINTER',
    desc: '雾蓝柔光 · 温暖随行',
    bg: ['#F9FBFF', '#E8EFF9', '#DCE6F4'],
    ink: '#1F3141',
    muted: '#5F7488',
    accent: '#5F86AF',
    accent2: '#CBDBEC',
    panel: '#FEFFFF',
    decor: 'snow',
    tone: 'light',
    headline: ['冬日暖阳', '温暖随行', '为冬天添一件'],
    badge: '暖冬推荐',
    cta: '带它回家'
  },
  {
    key: 'fashion',
    label: '时尚潮流',
    en: 'NEW DROP',
    desc: '深色底调 · 撞色几何',
    bg: ['#16161B', '#24242C', '#2E2E38'],
    ink: '#FFFFFF',
    muted: '#A6A6B8',
    accent: '#FF5B3D',
    accent2: '#FFC94A',
    panel: '#FFFFFF',
    decor: 'geo',
    tone: 'dark',
    headline: ['就现在', '不被定义', '新一季态度'],
    badge: 'NEW DROP',
    cta: '抢先入手'
  },
  {
    key: 'luxury',
    label: '高端奢华',
    en: 'ATELIER',
    desc: '黑金质感 · 留白克制',
    bg: ['#14100C', '#221B14', '#2C2318'],
    ink: '#F7ECD9',
    muted: '#BFAE93',
    accent: '#C9A468',
    accent2: '#8C6B37',
    panel: '#F9F2E6',
    decor: 'goldline',
    tone: 'dark',
    headline: ['优雅自成', '质感日常', '低调的讲究'],
    badge: '臻选系列',
    cta: '探索系列'
  },
  {
    key: 'minimal',
    label: '简约大气',
    en: 'LESS IS MORE',
    desc: '纯白留白 · 一条细线',
    bg: ['#FFFFFF', '#F4F5F8', '#E9ECF2'],
    ink: '#15202E',
    muted: '#6B7787',
    accent: '#2E5AAC',
    accent2: '#C9D6E8',
    panel: '#FFFFFF',
    decor: 'lines',
    tone: 'light',
    headline: ['少即是多', '回归本真', '简而有度'],
    badge: '经典常售',
    cta: '了解更多'
  },
  {
    key: 'festival',
    label: '节日促销',
    en: 'LIMITED',
    desc: '红金礼遇 · 放射礼花',
    bg: ['#C0141F', '#A00E17', '#7C0810'],
    ink: '#FFF4DE',
    muted: '#FFD7AE',
    accent: '#FFCE55',
    accent2: '#FF8159',
    panel: '#FFF6E4',
    decor: 'rays',
    tone: 'dark',
    headline: ['限时开抢', '福利来了', '一年一次的价'],
    badge: '限时特惠',
    cta: '马上抢'
  },
  {
    key: 'business',
    label: '商务大气',
    en: 'PROFESSIONAL',
    desc: '深蓝光带 · 通勤专业',
    bg: ['#0E2740', '#173A5A', '#1E4A71'],
    ink: '#EEF6FD',
    muted: '#B0C9DE',
    accent: '#6FB3E0',
    accent2: '#2C5C82',
    panel: '#FFFFFF',
    decor: 'grid',
    tone: 'dark',
    headline: ['专业之选', '从容通勤', '为效率而生'],
    badge: '通勤优选',
    cta: '立即购买'
  }
]

export function themeByKey(key) {
  return THEMES.find((t) => t.key === key) || THEMES[0]
}

export const COPY_MODES = [
  { key: 'promo', label: '促销转化', desc: '含价格、卖点、行动引导' },
  { key: 'brand', label: '品牌视觉', desc: '纯视觉表达，不放价格' }
]
