import { themeByKey } from './themes'

/* ---------- 基础工具 ---------- */

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function seeded(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const imageCache = new Map()
const preparedCache = new Map()

export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src)
  const p = new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
  imageCache.set(src, p)
  return p
}

/** 读取图片并尝试去除纯白背景，返回可用于绘制的 canvas */
export function prepareProduct(src) {
  if (preparedCache.has(src)) return preparedCache.get(src)
  const task = (async () => {
    const img = await loadImage(src)
    const maxSide = 1800
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const c = makeCanvas(img.naturalWidth * k, img.naturalHeight * k)
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0, c.width, c.height)

    try {
      const imgData = ctx.getImageData(0, 0, c.width, c.height)
      const data = imgData.data
      const w = c.width
      const h = c.height
      const corners = [
        [0, 0],
        [w - 1, 0],
        [0, h - 1],
        [w - 1, h - 1]
      ].map(([x, y]) => {
        const i = (y * w + x) * 4
        return [data[i], data[i + 1], data[i + 2]]
      })
      const whiteCorners = corners.filter((p) => p.every((v) => v > 228))

      if (whiteCorners.length >= 2) {
        const avg = whiteCorners.reduce(
          (a, p) => [
            a[0] + p[0] / whiteCorners.length,
            a[1] + p[1] / whiteCorners.length,
            a[2] + p[2] / whiteCorners.length
          ],
          [0, 0, 0]
        )
        // 从四边向内洪泛填充，只清除与边缘连通的纯白背景，保留商品内部高光
        const tol = 30
        const visited = new Uint8Array(w * h)
        const queue = new Int32Array(w * h)
        let head = 0
        let tail = 0
        const nearBg = (idx) => {
          const i = idx * 4
          const dr = data[i] - avg[0]
          const dg = data[i + 1] - avg[1]
          const db = data[i + 2] - avg[2]
          return Math.sqrt(dr * dr + dg * dg + db * db) < tol
        }
        const push = (idx) => {
          if (visited[idx]) return
          if (!nearBg(idx)) return
          visited[idx] = 1
          queue[tail++] = idx
        }
        for (let x = 0; x < w; x++) {
          push(x)
          push((h - 1) * w + x)
        }
        for (let y = 0; y < h; y++) {
          push(y * w)
          push(y * w + w - 1)
        }
        while (head < tail) {
          const idx = queue[head++]
          const x = idx % w
          const y = (idx - x) / w
          if (x > 0) push(idx - 1)
          if (x < w - 1) push(idx + 1)
          if (y > 0) push(idx - w)
          if (y < h - 1) push(idx + w)
        }
        for (let idx = 0; idx < w * h; idx++) {
          if (visited[idx]) data[idx * 4 + 3] = 0
        }
        ctx.putImageData(imgData, 0, 0)
      }
    } catch (e) {
      /* 跨域图片无法读取像素时保持原图 */
    }
    return c
  })()
  preparedCache.set(src, task)
  return task
}

/* ---------- 布局 ---------- */

export function layoutBoxes(state) {
  const w = state.width
  const h = state.height
  const layout = state.layout || 'img-left'
  const pad = h * 0.14
  let product
  let text
  let align = 'left'

  if (layout === 'img-right') {
    product = { x: w * 0.56, y: pad, w: w * 0.40, h: h - pad * 2 }
    text = { x: w * 0.05, y: pad, w: w * 0.46, h: h - pad * 2 }
  } else if (layout === 'center') {
    product = { x: w * 0.58, y: pad * 0.7, w: w * 0.36, h: h - pad * 1.4 }
    text = { x: w * 0.05, y: pad, w: w * 0.48, h: h - pad * 2 }
    align = 'center'
  } else if (layout === 'full') {
    product = { x: w * 0.60, y: h * 0.08, w: w * 0.34, h: h * 0.84 }
    text = { x: w * 0.06, y: h * 0.12, w: w * 0.46, h: h * 0.76 }
  } else {
    product = { x: w * 0.04, y: pad, w: w * 0.40, h: h - pad * 2 }
    text = { x: w * 0.50, y: pad, w: w * 0.46, h: h - pad * 2 }
  }

  const s = state.product || {}
  const scale = s.scale || 1
  if (scale !== 1) {
    const cx = product.x + product.w / 2
    const cy = product.y + product.h / 2
    product.w *= scale
    product.h *= scale
    product.x = cx - product.w / 2
    product.y = cy - product.h / 2
  }
  product.x += (s.x || 0) * w
  product.y += (s.y || 0) * h
  return { product, text, align }
}

/* ---------- 背景与装饰 ---------- */

function paintBackground(ctx, w, h, theme) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, theme.bg[0])
  g.addColorStop(0.55, theme.bg[1])
  g.addColorStop(1, theme.bg[2] || theme.bg[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w * 0.72, h * 0.2, 0, w * 0.72, h * 0.2, w * 0.55)
  glow.addColorStop(0, theme.accent2 + '55')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
}

function paintDecor(ctx, w, h, theme, state) {
  const rnd = seeded(theme.key.length * 977 + Math.round(w))
  ctx.save()
  switch (theme.decor) {
    case 'petals': {
      for (let i = 0; i < 5; i++) {
        const x = w * (0.05 + rnd() * 0.9)
        const y = h * (0.1 + rnd() * 0.8)
        const r = h * (0.09 + rnd() * 0.12)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rnd() * Math.PI)
        ctx.globalAlpha = 0.28
        ctx.fillStyle = i % 2 ? theme.accent2 : theme.accent
        ctx.beginPath()
        ctx.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      break
    }
    case 'bubbles': {
      for (let i = 0; i < 12; i++) {
        const x = w * rnd()
        const y = h * rnd()
        const r = h * (0.03 + rnd() * 0.1)
        ctx.globalAlpha = 0.18 + rnd() * 0.2
        ctx.strokeStyle = theme.accent
        ctx.lineWidth = Math.max(1, h * 0.006)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      break
    }
    case 'leaves': {
      for (let i = 0; i < 7; i++) {
        const x = w * rnd()
        const y = h * rnd()
        const r = h * (0.06 + rnd() * 0.08)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rnd() * Math.PI * 2)
        ctx.globalAlpha = 0.22
        ctx.fillStyle = i % 2 ? theme.accent2 : theme.accent
        ctx.beginPath()
        ctx.ellipse(0, 0, r, r * 0.34, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      break
    }
    case 'snow': {
      for (let i = 0; i < 30; i++) {
        ctx.globalAlpha = 0.15 + rnd() * 0.35
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(w * rnd(), h * rnd(), h * (0.006 + rnd() * 0.02), 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'geo': {
      ctx.globalAlpha = 0.16
      ctx.fillStyle = theme.accent
      ctx.beginPath()
      ctx.arc(w * 0.86, h * 0.2, h * 0.28, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 0.14
      ctx.fillStyle = theme.accent2
      ctx.fillRect(w * 0.72, h * 0.55, w * 0.3, h * 0.5)
      ctx.globalAlpha = 0.2
      ctx.strokeStyle = theme.accent
      ctx.lineWidth = h * 0.012
      ctx.beginPath()
      ctx.moveTo(0, h * 0.9)
      ctx.lineTo(w * 0.4, 0)
      ctx.stroke()
      break
    }
    case 'goldline': {
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = theme.accent
      ctx.lineWidth = Math.max(1, h * 0.004)
      const m = h * 0.06
      ctx.beginPath()
      ctx.moveTo(m, m)
      ctx.lineTo(w * 0.28, m)
      ctx.moveTo(w - m, h - m)
      ctx.lineTo(w * 0.72, h - m)
      ctx.stroke()
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.arc(w * 0.28 + m * 0.5, h * 0.5, h * 0.008, 0, Math.PI * 2)
      ctx.fillStyle = theme.accent
      ctx.fill()
      break
    }
    case 'lines': {
      ctx.globalAlpha = 0.35
      ctx.strokeStyle = theme.accent2
      ctx.lineWidth = 1
      for (let i = 0; i < 4; i++) {
        const x = w * (0.62 + i * 0.09)
        ctx.beginPath()
        ctx.moveTo(x, h * 0.08)
        ctx.lineTo(x, h * 0.92)
        ctx.stroke()
      }
      break
    }
    case 'rays': {
      ctx.globalAlpha = 0.18
      ctx.strokeStyle = theme.accent
      ctx.lineWidth = h * 0.012
      const cx = w * 1.02
      const cy = -h * 0.1
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * 0.5 + i * 0.13
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(a) * w * 1.4, cy + Math.sin(a) * w * 1.4)
        ctx.stroke()
      }
      for (let i = 0; i < 18; i++) {
        ctx.globalAlpha = 0.4 + rnd() * 0.4
        ctx.fillStyle = i % 2 ? theme.accent : '#FFFFFF'
        ctx.fillRect(w * rnd(), h * rnd(), h * 0.012, h * 0.012)
      }
      break
    }
    case 'grid':
    default: {
      ctx.globalAlpha = 0.1
      ctx.strokeStyle = theme.ink
      ctx.lineWidth = 1
      const gap = h * 0.12
      for (let x = gap; x < w; x += gap) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.2
      const band = ctx.createLinearGradient(w * 0.2, 0, w * 0.75, h)
      band.addColorStop(0, 'rgba(255,255,255,0)')
      band.addColorStop(0.5, theme.accent2 + '44')
      band.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = band
      ctx.beginPath()
      ctx.moveTo(w * 0.15, 0)
      ctx.lineTo(w * 0.45, 0)
      ctx.lineTo(w * 0.72, h)
      ctx.lineTo(w * 0.42, h)
      ctx.closePath()
      ctx.fill()
      break
    }
  }
  ctx.restore()
}

/* ---------- 商品 ---------- */

function drawProduct(ctx, state, theme, box, img) {
  if (!img) return
  const w = state.width
  const h = state.height
  const p = state.product || {}

  if (state.layout === 'full') {
    const cover = Math.max(w / img.width, h / img.height) * 1.18
    const dw = img.width * cover
    const dh = img.height * cover
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.filter = `blur(${Math.max(4, Math.round(h * 0.022))}px)`
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    ctx.restore()

    const scrim = ctx.createLinearGradient(0, 0, w * 0.72, 0)
    scrim.addColorStop(0, 'rgba(8,10,18,0.86)')
    scrim.addColorStop(0.55, 'rgba(8,10,18,0.54)')
    scrim.addColorStop(1, 'rgba(8,10,18,0.16)')
    ctx.fillStyle = scrim
    ctx.fillRect(0, 0, w, h)
  }

  const isDark = theme.tone === 'dark' && state.layout !== 'full'
  if (isDark) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.34)'
    ctx.shadowBlur = h * 0.08
    ctx.shadowOffsetY = h * 0.025
    ctx.fillStyle = theme.panel
    roundRect(ctx, box.x - h * 0.05, box.y + h * 0.02, box.w + h * 0.1, box.h - h * 0.04, h * 0.07)
    ctx.fill()
    ctx.restore()
  }

  const fit = Math.min(box.w / img.width, box.h / img.height)
  const dw = img.width * fit
  const dh = img.height * fit
  const dx = box.x + (box.w - dw) / 2
  const dy = box.y + (box.h - dh) / 2

  ctx.save()
  if (p.shadow !== false) {
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(16,24,40,0.22)'
    ctx.shadowBlur = h * 0.09
    ctx.shadowOffsetY = h * 0.03
  }
  if (p.radius && p.radius > 0) {
    roundRect(ctx, dx, dy, dw, dh, (p.radius / 100) * Math.min(dw, dh) * 0.4)
    ctx.clip()
  }
  ctx.drawImage(img, dx, dy, dw, dh)
  ctx.restore()

  if (isDark) {
    ctx.save()
    ctx.globalAlpha = 0.12
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.ellipse(box.x + box.w / 2, box.y + box.h + h * 0.01, box.w * 0.34, h * 0.02, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/* ---------- 文本 ---------- */

function wrapText(ctx, text, maxWidth, maxLines) {
  if (!text) return []
  const chars = Array.from(text)
  const lines = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
      if (lines.length === maxLines) break
    } else {
      line = test
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1]
    if (last) {
      let out = last
      while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) out = out.slice(0, -1)
      lines[maxLines - 1] = out + (Array.from(text).length > lines.join('').length ? '…' : '')
    }
  }
  return lines
}

function drawCopyBlock(ctx, state, theme, textBox, align) {
  const c = state.copy || {}
  const mode = state.mode || 'promo'
  const h = state.height
  const maxW = textBox.w

  const brandSize = Math.max(10, h * 0.042)
  const eyebrowSize = Math.max(9, h * 0.038)
  const titleSize = h * (mode === 'brand' ? 0.19 : 0.155)
  const subSize = Math.max(10, h * 0.058)
  const priceSize = h * 0.13
  const ctaSize = Math.max(11, h * 0.048)

  ctx.textAlign = align === 'center' ? 'center' : 'left'
  const anchorX = align === 'center' ? textBox.x + textBox.w / 2 : textBox.x

  ctx.font = `700 ${titleSize}px "PingFang SC","Microsoft YaHei",sans-serif`
  const titleLines = wrapText(ctx, c.title || '', maxW, 2)

  const blocks = []
  blocks.push({ type: 'brand', size: brandSize, gap: h * 0.035 })
  blocks.push({ type: 'eyebrow', size: eyebrowSize, gap: h * 0.03 })
  blocks.push({ type: 'title', size: titleSize, lines: titleLines, gap: h * 0.045, lh: 1.12 })

  if (mode === 'promo') {
    if (c.subtitle) blocks.push({ type: 'sub', size: subSize, gap: h * 0.05 })
    if (c.price) blocks.push({ type: 'price', size: priceSize, gap: h * 0.045 })
    if (c.cta) blocks.push({ type: 'cta', size: ctaSize, gap: h * 0.05 })
  } else {
    blocks.push({ type: 'rule', gap: h * 0.05 })
    if (c.subtitle) blocks.push({ type: 'sub', size: subSize, gap: h * 0.045 })
    if (c.tagline) blocks.push({ type: 'tagline', size: eyebrowSize, gap: h * 0.035 })
  }

  const total = blocks.reduce((sum, b) => {
    if (b.type === 'title') return sum + b.size * b.lh * b.lines.length + b.gap
    if (b.type === 'rule') return sum + h * 0.004 + b.gap * 2
    if (b.type === 'cta') return sum + b.size * 2.1 + b.gap
    return sum + b.size * 1.25 + b.gap
  }, 0)

  let y = textBox.y + Math.max(0, (textBox.h - total) / 2)

  for (const b of blocks) {
    if (b.type === 'brand') {
      ctx.textBaseline = 'top'
      ctx.font = `700 ${b.size}px "PingFang SC","Microsoft YaHei",sans-serif`
      const label = `${c.brand || 'LUMI'}`
      ctx.save()
      if (align !== 'center') {
        ctx.globalAlpha = 0.72
        ctx.letterSpacing = `${Math.round(b.size * 0.16)}px`
        ctx.fillStyle = theme.ink
        ctx.fillText(label, anchorX, y)
        ctx.letterSpacing = '0px'
      } else {
        ctx.fillStyle = theme.ink
        ctx.fillText(label, anchorX, y)
      }
      ctx.restore()
      y += b.size * 1.25 + b.gap
    } else if (b.type === 'eyebrow') {
      ctx.font = `600 ${b.size}px "PingFang SC","Microsoft YaHei",sans-serif`
      ctx.fillStyle = theme.accent
      ctx.letterSpacing = `${Math.round(b.size * 0.18)}px`
      ctx.fillText(c.eyebrow || '', anchorX, y)
      ctx.letterSpacing = '0px'
      y += b.size * 1.25 + b.gap
    } else if (b.type === 'title') {
      ctx.font = `800 ${b.size}px "PingFang SC","Microsoft YaHei",sans-serif`
      ctx.fillStyle = theme.ink
      ctx.textBaseline = 'top'
      for (const line of b.lines) {
        ctx.fillText(line, anchorX, y)
        y += b.size * b.lh
      }
      y += b.gap
    } else if (b.type === 'sub') {
      ctx.font = `500 ${b.size}px "PingFang SC","Microsoft YaHei",sans-serif`
      ctx.fillStyle = theme.ink
      ctx.globalAlpha = 0.78
      const lines = wrapText(ctx, c.subtitle || '', maxW, 1)
      ctx.fillText(lines[0] || '', anchorX, y)
      ctx.globalAlpha = 1
      y += b.size * 1.4 + b.gap
    } else if (b.type === 'price') {
      ctx.font = `800 ${b.size}px "PingFang SC","Microsoft YaHei",sans-serif`
      ctx.fillStyle = theme.accent
      ctx.textBaseline = 'alphabetic'
      const priceText = c.price || ''
      ctx.fillText(priceText, anchorX, y + b.size)
      const pw = ctx.measureText(priceText).width
      let endX = align === 'center' ? anchorX + pw / 2 : anchorX + pw
      if (c.original) {
        ctx.font = `500 ${b.size * 0.46}px sans-serif`
        ctx.fillStyle = theme.muted
        const ox = endX + 12
        ctx.fillText(c.original, ox, y + b.size)
        const ow = ctx.measureText(c.original).width
        ctx.strokeStyle = theme.muted
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(ox, y + b.size * 0.52)
        ctx.lineTo(ox + ow, y + b.size * 0.52)
        ctx.stroke()
        endX = ox + ow
      }
      if (c.badge) {
        const bs = Math.max(9, b.size * 0.42)
        ctx.font = `600 ${bs}px "PingFang SC","Microsoft YaHei",sans-serif`
        const tw = ctx.measureText(c.badge).width
        const bh = b.size * 0.66
        const bw = tw + bh * 1.0
        const bx = endX + 14
        const by = y + b.size - bh
        if (bx + bw <= textBox.x + textBox.w) {
          ctx.fillStyle = theme.accent
          roundRect(ctx, bx, by, bw, bh, bh / 2)
          ctx.fill()
          ctx.fillStyle = theme.tone === 'dark' ? '#1A1208' : '#FFFFFF'
          ctx.textAlign = 'center'
          ctx.fillText(c.badge, bx + bw / 2, by + bh * 0.7)
          ctx.textAlign = align === 'center' ? 'center' : 'left'
        }
      }
      y += b.size * 1.25 + b.gap
    } else if (b.type === 'cta') {
      ctx.font = `600 ${b.size}px "PingFang SC","Microsoft YaHei",sans-serif`
      const label = c.cta
      const tw = ctx.measureText(label).width
      const padX = b.size * 0.9
      const bw = tw + padX * 2
      const bh = b.size * 2.1
      const bx = align === 'center' ? anchorX - bw / 2 : anchorX
      ctx.fillStyle = theme.accent
      roundRect(ctx, bx, y, bw, bh, bh / 2)
      ctx.fill()
      ctx.fillStyle = theme.tone === 'dark' ? '#1A1208' : '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.fillText(label, bx + bw / 2, y + bh * 0.62)
      ctx.textAlign = align === 'center' ? 'center' : 'left'
      y += bh + b.gap
    } else if (b.type === 'rule') {
      ctx.strokeStyle = theme.accent
      ctx.globalAlpha = 0.6
      ctx.lineWidth = Math.max(1, h * 0.004)
      const rw = Math.min(maxW * 0.22, 90)
      const rx = align === 'center' ? anchorX - rw / 2 : anchorX
      ctx.beginPath()
      ctx.moveTo(rx, y + b.gap)
      ctx.lineTo(rx + rw, y + b.gap)
      ctx.stroke()
      ctx.globalAlpha = 1
      y += b.gap * 2
    } else if (b.type === 'tagline') {
      ctx.font = `500 ${b.size}px "PingFang SC","Microsoft YaHei",sans-serif`
      ctx.fillStyle = theme.muted
      ctx.fillText(c.tagline || '', anchorX, y)
      y += b.size * 1.25 + b.gap
    }
  }

}

/* ---------- 主渲染 ---------- */

export async function drawBanner(canvas, state) {
  const w = Math.round(state.width)
  const h = Math.round(state.height)
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  const ctx = canvas.getContext('2d')
  const theme = themeByKey(state.theme)
  const { product: box, text, align } = layoutBoxes(state)

  ctx.save()
  ctx.clearRect(0, 0, w, h)
  paintBackground(ctx, w, h, theme)
  paintDecor(ctx, w, h, theme, state)

  if (state.aiBackground) {
    try {
      const bg = await loadImage(state.aiBackground)
      const cover = Math.max(w / bg.width, h / bg.height)
      ctx.globalAlpha = 0.55
      ctx.drawImage(bg, (w - bg.width * cover) / 2, (h - bg.height * cover) / 2, bg.width * cover, bg.height * cover)
      ctx.globalAlpha = 1
      ctx.fillStyle = theme.tone === 'dark' ? 'rgba(8,10,18,0.28)' : 'rgba(255,255,255,0.34)'
      ctx.fillRect(0, 0, w, h)
    } catch (e) {
      /* 忽略背景图加载失败 */
    }
  }

  let img = null
  if (state.product && state.product.src) {
    try {
      img = await prepareProduct(state.product.src)
    } catch (e) {
      img = null
    }
  }
  if (img) drawProduct(ctx, state, theme, box, img)
  const copyTheme =
    state.layout === 'full'
      ? { ...theme, ink: '#FFFFFF', muted: 'rgba(255,255,255,0.78)' }
      : theme
  drawCopyBlock(ctx, state, copyTheme, text, align)
  ctx.restore()
  return canvas
}

export async function exportDataUrl(state, type = 'image/png', quality = 0.92) {
  const c = makeCanvas(state.width, state.height)
  await drawBanner(c, state)
  return c.toDataURL(type, quality)
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
