import { reactive } from 'vue'

export const toasts = reactive([])

let seed = 0

export function toast(message, type = 'info', duration = 2600) {
  const id = ++seed
  toasts.push({ id, message, type })
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx > -1) toasts.splice(idx, 1)
  }, duration)
}

export function toastError(err) {
  toast(err?.message || String(err), 'err', 3600)
}
