<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
import { toast, toastError } from '../lib/toast'

const router = useRouter()
const items = ref([])
const loading = ref(true)
const pendingDelete = ref(null)

async function load() {
  loading.value = true
  try {
    items.value = await api.history()
  } catch (e) {
    toastError(e)
  } finally {
    loading.value = false
  }
}

async function remove(id) {
  try {
    await api.deleteHistory(id)
    items.value = items.value.filter((i) => i.id !== id)
    pendingDelete.value = null
    toast('已删除')
  } catch (e) {
    toastError(e)
  }
}

onMounted(load)

function fmt(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Archive</span>
        <h1 class="page-title">生成历史</h1>
        <p class="page-sub">保留最近 200 条导出记录，可预览、下载或删除。</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="router.push('/banner')">继续创作</button>
    </div>

    <div v-if="loading" class="card empty">加载中…</div>
    <div v-else-if="!items.length" class="card empty">
      <div class="empty-icon">▦</div>
      还没有生成记录，去 Banner 生成器导出第一张吧。
      <div style="margin-top: 16px">
        <button class="btn btn-primary btn-sm" @click="router.push('/banner')">打开 Banner 生成器</button>
      </div>
    </div>

    <div v-else class="grid">
      <article v-for="item in items" :key="item.id" class="item card">
        <div class="thumb">
          <img :src="item.url" :alt="item.title" loading="lazy" />
        </div>
        <div class="body">
          <h3>{{ item.title }}</h3>
          <div class="meta">
            <span class="tag tag-brand">{{ item.width }} × {{ item.height }}</span>
            <span class="tag">{{ item.themeLabel }}</span>
            <span class="tag">{{ item.mode === 'promo' ? '促销' : '品牌' }}</span>
          </div>
          <span class="time">{{ fmt(item.createdAt) }}</span>
          <div class="actions">
            <a class="btn btn-ghost btn-sm" :href="item.url" download>下载</a>
            <a class="btn btn-ghost btn-sm" :href="item.url" target="_blank">查看原图</a>
            <button class="btn btn-ghost btn-sm danger" @click="pendingDelete = item">删除</button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="pendingDelete" class="modal-mask" @click.self="pendingDelete = null">
      <div class="modal">
        <h3>删除这条记录？</h3>
        <p class="muted">删除后图片文件也会一并移除，无法恢复。</p>
        <div class="modal-actions">
          <button class="btn btn-ghost btn-sm" @click="pendingDelete = null">取消</button>
          <button class="btn btn-primary btn-sm" @click="remove(pendingDelete.id)">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.item {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.thumb {
  background: #f2f4f7;
  display: grid;
  place-items: center;
  padding: 12px;
}

.thumb img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  background: #fff;
}

.body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.body h3 {
  font-size: 14px;
  font-weight: 600;
}

.meta {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.time {
  font-size: 11.5px;
  color: var(--muted);
}

.actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 6px;
}

.danger:hover {
  border-color: var(--red);
  color: var(--red);
}

@media (max-width: 1080px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
