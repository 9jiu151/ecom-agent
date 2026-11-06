const base = ''

async function request(url, options = {}) {
  const resp = await fetch(base + url, options)
  let json
  try {
    json = await resp.json()
  } catch (e) {
    throw new Error('服务返回异常')
  }
  if (!json.ok) throw new Error(json.error || '请求失败')
  return json.data
}

export const api = {
  catalog: () => request('/api/catalog'),
  products: () => request('/api/products'),
  history: () => request('/api/history'),
  settings: () => request('/api/settings'),
  aiStatus: () => request('/api/ai/status'),
  saveSettings: (payload) =>
    request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  testAI: () =>
    request('/api/ai/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
  aiText: (task, product) =>
    request('/api/ai/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, product })
    }),
  aiImage: (prompt) =>
    request('/api/ai/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    }),
  upload: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('/api/upload', { method: 'POST', body: fd })
  },
  saveHistory: (dataUrl, meta) =>
    request('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, meta })
    }),
  deleteHistory: (id) => request(`/api/history/${id}`, { method: 'DELETE' })
}
