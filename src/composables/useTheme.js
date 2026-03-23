import { ref, watch } from 'vue'

const STORAGE_KEY = 'sagittarius:theme'

const theme = ref(localStorage.getItem(STORAGE_KEY) ?? 'dark')

function applyTheme(val) {
  document.documentElement.setAttribute('data-theme', val)
}

applyTheme(theme.value)

watch(theme, (val) => {
  applyTheme(val)
  localStorage.setItem(STORAGE_KEY, val)
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
}