<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toasts } from './lib/toast'
import { appState, refreshAiStatus } from './lib/state'

const route = useRoute()
const router = useRouter()

onMounted(refreshAiStatus)

const links = [
  { name: 'home', label: '首页' },
  { name: 'pipeline', label: '全流程' },
  { name: 'banner', label: 'Banner' },
  { name: 'plan', label: '策划' },
  { name: 'content', label: '内容' },
  { name: 'data', label: '数据' },
  { name: 'studio', label: '能力中心' }
]

function go(name) {
  router.push({ name })
}
</script>

<template>
  <header class="app-nav">
    <div class="app-nav-inner">
      <router-link class="logo" to="/">
        <span class="logo-mark">AI</span>
        <span class="logo-text">
          电商全流程智能体
          <small>E-COMMERCE AGENT</small>
        </span>
      </router-link>

      <nav class="nav-links">
        <router-link
          v-for="l in links"
          :key="l.name"
          class="nav-link"
          :class="{ 'router-link-active': route.name === l.name }"
          :to="{ name: l.name }"
        >
          {{ l.label }}
        </router-link>
      </nav>

      <div class="nav-right">
        <button class="mode-pill" :class="{ 'ai-on': appState.llm }" @click="go('settings')">
          <span class="dot"></span>
          {{ appState.llm ? 'AI 已接入' : '规则模式' }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="go('history')">历史</button>
        <button class="btn btn-primary btn-sm" @click="go('pipeline')">开始全流程</button>
      </div>
    </div>
  </header>

  <router-view />

  <div class="toast-host">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="{ err: t.type === 'err' }">
      {{ t.message }}
    </div>
  </div>
</template>
