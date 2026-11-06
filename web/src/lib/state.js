import { reactive } from 'vue'
import { api } from './api'

export const appState = reactive({
  aiMode: 'rule',
  llm: false,
  image: false
})

export async function refreshAiStatus() {
  try {
    const s = await api.aiStatus()
    appState.aiMode = s.mode
    appState.llm = s.llm
    appState.image = s.image
  } catch (e) {
    appState.aiMode = 'rule'
  }
}
