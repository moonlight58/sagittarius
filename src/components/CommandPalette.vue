<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useChat } from '../composables/useChat.js'
import { useNotes } from '../composables/useNotes.js'
import { useTheme } from '../composables/useTheme.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const route = useRoute()
const { toggle: toggleTheme } = useTheme()
const { newChat, refreshModels } = useChat('code') // Shared chat actions
const { addNote } = useNotes()

const search = ref('')
const selectedIndex = ref(0)
const inputRef = ref(null)

const commands = [
  // Navigation
  { id: 'nav-home', label: 'Go to Home', icon: '', action: () => router.push('/') },
  { id: 'nav-code', label: 'Go to Code', icon: '󰌢', action: () => router.push('/code') },
  { id: 'nav-mail', label: 'Go to Mail', icon: '', action: () => router.push('/mail') },
  { id: 'nav-cal', label: 'Go to Calendar', icon: '󰃭', action: () => router.push('/calendar') },
  { id: 'nav-notes', label: 'Go to Notes', icon: '󰎚', action: () => router.push('/notes') },
  
  // Actions
  { id: 'act-new-chat', label: 'New Chat', icon: '', action: () => {
    if (route.path === '/code') useChat('code').newChat()
    else if (route.path === '/mail') useChat('mail').newChat()
    else router.push('/code').then(() => useChat('code').newChat())
  }},
  { id: 'act-new-note', label: 'Create New Note', icon: '󰎝', action: () => {
    addNote()
    router.push('/notes')
  }},
  { id: 'act-theme', label: 'Toggle Light/Dark Theme', icon: '', action: toggleTheme },
  { id: 'act-refresh', label: 'Refresh Ollama Models', icon: '', action: refreshModels },
]

const filteredCommands = computed(() => {
  if (!search.value.trim()) return commands
  const q = search.value.toLowerCase()
  return commands.filter(c => c.label.toLowerCase().includes(q))
})

watch(() => search.value, () => {
  selectedIndex.value = 0
})

function close() {
  emit('update:modelValue', false)
  search.value = ''
}

function executeCommand() {
  const cmd = filteredCommands.value[selectedIndex.value]
  if (cmd) {
    cmd.action()
    close()
  }
}

function handleKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
  } else if (e.key === 'Enter') {
    executeCommand()
  } else if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  if (props.modelValue) inputRef.value?.focus()
})

watch(() => props.modelValue, (val) => {
  if (val) {
    setTimeout(() => inputRef.value?.focus(), 10)
  }
})
</script>

<template>
  <Transition name="fade">
    <div v-if="modelValue" class="command-overlay" @click.self="close">
      <div class="command-palette">
        <div class="palette-input">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref="inputRef"
            v-model="search"
            placeholder="Type a command or search..."
            @keydown="handleKeydown"
          />
          <span class="esc-hint">ESC</span>
        </div>

        <div class="palette-results" v-if="filteredCommands.length">
          <div
            v-for="(cmd, i) in filteredCommands"
            :key="cmd.id"
            class="command-item"
            :class="{ selected: i === selectedIndex }"
            @click="selectedIndex = i; executeCommand()"
          >
            <span class="command-icon">{{ cmd.icon }}</span>
            <span class="command-label">{{ cmd.label }}</span>
            <span class="enter-hint" v-if="i === selectedIndex">ENTER</span>
          </div>
        </div>
        <div v-else class="palette-empty">
          No commands found for "{{ search }}"
        </div>

        <footer class="palette-footer">
          <div class="footer-tip">
            <span>↑↓</span> to navigate
            <span>↵</span> to select
          </div>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.command-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding-top: 15vh;
}

.command-palette {
  width: 100%;
  max-width: 600px;
  background: var(--modal-bg);
  border: 1px solid var(--modal-border);
  border-radius: 12px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: fit-content;
  max-height: 60vh;
}

.palette-input {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sidebar-border);
}

.search-icon {
  width: 18px;
  height: 18px;
  color: var(--orange);
  opacity: 0.8;
}

.palette-input input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 16px;
  outline: none;
}

.esc-hint {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
  background: var(--model-selector-bg);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--model-selector-border);
}

.palette-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.command-item.selected {
  background: var(--history-item-active-bg);
  color: var(--beige);
}

.command-icon {
  font-size: 16px;
  font-family: var(--font-mono), monospace;
  color: var(--beige);
  width: 24px;
  text-align: center;
}

.command-label {
  flex: 1;
  font-size: 14px;
}

.enter-hint {
  font-family: var(--font-mono), monospace;
  font-size: 9px;
  color: var(--orange);
  opacity: 0.8;
  letter-spacing: 0.05em;
}

.palette-empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  font-style: italic;
}

.palette-footer {
  padding: 10px 20px;
  background: var(--surface-1);
  border-top: 1px solid var(--sidebar-border);
}

.footer-tip {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
}

.footer-tip span {
  color: var(--orange);
  font-weight: 700;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
