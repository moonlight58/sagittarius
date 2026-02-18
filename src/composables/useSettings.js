import { ref, watch } from 'vue'

const STORAGE_KEY = 'sagittarius:settings'

const DEFAULT_HOST = 'http://localhost:11434'

export const ollamaHost = ref(DEFAULT_HOST)

// Load from localStorage on init
try {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed.ollamaHost) ollamaHost.value = parsed.ollamaHost
  }
} catch {}

// Persist on change
watch(ollamaHost, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ollamaHost: val }))
})

export function useSettings() {
  function setHost(url) {
    // Trim trailing slash
    ollamaHost.value = url.trim().replace(/\/$/, '') || DEFAULT_HOST
  }

  function resetHost() {
    ollamaHost.value = DEFAULT_HOST
  }

  return {
    ollamaHost,
    setHost,
    resetHost,
  }
}
