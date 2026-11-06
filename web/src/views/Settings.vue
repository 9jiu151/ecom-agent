<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../lib/api'
import { toast, toastError } from '../lib/toast'
import { refreshAiStatus, appState } from '../lib/state'

const info = ref(null)
const testing = ref(false)
const saving = ref(false)

const form = reactive({
  llm: { baseUrl: '', model: '', apiKey: '', clearKey: false },
  image: { baseUrl: '', model: '', apiKey: '', clearKey: false }
})

async function load() {
  try {
    info.value = await api.settings()
    form.llm.baseUrl = info.value.llm.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    form.llm.model = info.value.llm.model || 'qwen-plus'
    form.image.baseUrl = info.value.image.baseUrl || ''
    form.image.model = info.value.image.model || ''
  } catch (e) {
    toastError(e)
  }
}

async function save() {
  saving.value = true
  try {
    const payload = {
      llm: { ...form.llm },
      image: { ...form.image }
    }
    info.value = await api.saveSettings(payload)
    form.llm.apiKey = ''
    form.image.apiKey = ''
    form.llm.clearKey = false
    form.image.clearKey = false
    await refreshAiStatus()
    toast('配置已保存')
  } catch (e) {
    toastError(e)
  } finally {
    saving.value = false
  }
}

async function test() {
  testing.value = true
  try {
    await api.testAI()
    toast('连接成功，模型可用')
  } catch (e) {
    toastError(e)
  } finally {
    testing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Configuration</span>
        <h1 class="page-title">AI 配置</h1>
        <p class="page-sub">接入文案大模型后，策划、文案与脚本将由 AI 生成；不配置也可使用完整规则模式。</p>
      </div>
      <span class="tag" :class="appState.llm ? 'tag-green' : 'tag-amber'">
        <i class="dot"></i>{{ appState.llm ? 'AI 已接入' : '当前为规则模式' }}
      </span>
    </div>

    <div class="grid">
      <section class="card card-pad">
        <div class="sec-head">
          <h3>文案大模型</h3>
          <span class="tag" :class="info?.llm.configured ? 'tag-green' : ''">
            {{ info?.llm.configured ? '已配置 ' + info.llm.keyMasked : '未配置' }}
          </span>
        </div>
        <p class="desc">
          兼容 OpenAI 协议即可，例如通义千问、豆包、DeepSeek。用于卖点提炼、标题、短文案与短视频脚本。
        </p>

        <div class="field">
          <label>Base URL</label>
          <input v-model="form.llm.baseUrl" class="input" placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1" />
          <p class="hint">不带 /chat/completions，系统会自动拼接。</p>
        </div>
        <div class="field">
          <label>模型名称</label>
          <input v-model="form.llm.model" class="input" placeholder="qwen-plus" />
        </div>
        <div class="field">
          <label>API Key</label>
          <div class="input-row">
            <input v-model="form.llm.apiKey" class="input" type="password" placeholder="粘贴 Key，保存后不回显" />
            <button class="btn btn-ghost btn-sm" @click="test" :disabled="testing || !info?.llm.configured">
              {{ testing ? '测试中' : '测试连接' }}
            </button>
          </div>
          <p class="hint">Key 仅保存在服务端 data/settings.json，前端只显示掩码。</p>
        </div>
        <label class="clear-row">
          <input v-model="form.llm.clearKey" type="checkbox" />
          清除已保存的 Key
        </label>
      </section>

      <section class="card card-pad">
        <div class="sec-head">
          <h3>图像生成模型</h3>
          <span class="tag" :class="info?.image.configured ? 'tag-green' : ''">
            {{ info?.image.configured ? '已配置 ' + info.image.keyMasked : '未配置' }}
          </span>
        </div>
        <p class="desc">
          用于生成主题背景图，属于可选增强能力。未配置或调用失败时自动降级为内置渐变背景，不影响出图。
        </p>

        <div class="field">
          <label>Base URL</label>
          <input v-model="form.image.baseUrl" class="input" placeholder="图像服务地址" />
        </div>
        <div class="field">
          <label>模型名称</label>
          <input v-model="form.image.model" class="input" placeholder="wanx-v1" />
        </div>
        <div class="field">
          <label>API Key</label>
          <input v-model="form.image.apiKey" class="input" type="password" placeholder="粘贴 Key，保存后不回显" />
        </div>
        <label class="clear-row">
          <input v-model="form.image.clearKey" type="checkbox" />
          清除已保存的 Key
        </label>

        <div class="notice">
          已接入豆包 Seedream（火山方舟），可在 Banner 页「AI 背景」生成氛围底图。Key 仅保存在服务端。
        </div>
      </section>
    </div>

    <div class="save-bar">
      <span class="muted">保存后立即生效，无需重启服务。</span>
      <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存配置' }}</button>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

h3 {
  font-size: 15px;
}

.desc {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.7;
  margin-bottom: 16px;
  min-height: 44px;
}

.clear-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--ink-2);
}

.notice {
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  background: var(--amber-soft);
  border: 1px solid #f8ddb0;
  color: #b54708;
  font-size: 12px;
  line-height: 1.7;
}

.save-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding: 14px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
