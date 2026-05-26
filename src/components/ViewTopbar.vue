<script setup>
import { ref } from 'vue'
import OllamaModal from './OllamaModal.vue'
import SettingsModal from './SettingsModal.vue'
import { useChat } from '../composables/useChat.js'

const props = defineProps({
  tab: { type: String, required: true },
})

const {
  importedModels,
  activeModel,
  modelsLoading,
  modelsError,
  refreshModels,
  importModel,
  selectModel,
} = useChat(props.tab)

const showModal = ref(false)
const showModelDropdown = ref(false)
const showSettings = ref(false)

function onImport(name) {
  importModel(name)
  showModal.value = false
}

function onSettingsSaved() {
  refreshModels()
}

function pickModel(name) {
  selectModel(name)
  showModelDropdown.value = false
}
</script>

<template>
  <header class="topbar">
    <!-- Loading state -->
    <div v-if="modelsLoading" class="status-pill loading">
      <span class="spinner" />
      <span>Connecting to Ollama…</span>
    </div>

    <!-- Error state -->
    <div v-else-if="modelsError" class="status-pill error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{{ modelsError }}</span>
      <button class="retry-btn" @click="refreshModels">Retry</button>
      <button class="retry-btn" @click="showSettings = true">Configure</button>
    </div>

    <!-- Model selector -->
    <div
      v-else-if="importedModels.length"
      class="model-selector"
      v-click-outside="() => (showModelDropdown = false)"
    >
      <button class="model-current" @click="showModelDropdown = !showModelDropdown">
        <span class="model-dot active" />
        <span>{{ activeModel ?? 'Select model' }}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="chevron"
          :class="{ open: showModelDropdown }"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <Transition name="dropdown-fade">
        <div v-if="showModelDropdown" class="model-dropdown">
          <button
            v-for="m in importedModels"
            :key="m"
            class="model-option"
            :class="{ active: m === activeModel }"
            @click="pickModel(m)"
          >
            <span class="model-dot" :class="{ active: m === activeModel }" />
            {{ m }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- No models yet -->
    <div v-else class="status-pill muted">
      <span>No models found — pull one to get started</span>
    </div>

    <!-- Refresh button -->
    <button
      class="icon-btn"
      @click="refreshModels"
      title="Refresh model list"
      :disabled="modelsLoading"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="{ spinning: modelsLoading }"
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    </button>

    <!-- Pull model button -->
    <button class="ollama-btn" @click="showModal = true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span>Pull Model</span>
    </button>

    <!-- Settings button -->
    <button class="icon-btn" @click="showSettings = true" title="Connection settings">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07" />
      </svg>
    </button>

    <OllamaModal v-model="showModal" @import="onImport" />
    <SettingsModal v-model="showSettings" @saved="onSettingsSaved" />
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--topbar-border);
  flex-shrink: 0;
  flex-wrap: wrap;
  background: var(--color-bg);
  transition:
    border-color 0.25s ease,
    background 0.25s ease;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: 8px;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
}

.status-pill.loading {
  color: var(--status-loading-color);
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
}

.status-pill.error {
  color: var(--status-error-color);
  background: rgba(176, 64, 48, 0.05);
  border: 1px solid var(--model-selector-border);
}

.status-pill.error svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.status-pill.muted {
  color: var(--status-muted-color);
  background: transparent;
  border: 1px dashed var(--status-muted-border);
}

.retry-btn {
  background: transparent;
  border: 1px solid var(--model-selector-border);
  border-radius: 6px;
  color: var(--status-error-color);
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.retry-btn:hover {
  background: rgba(176, 64, 48, 0.08);
  border-color: var(--status-error-color);
}

.spinner {
  width: 11px;
  height: 11px;
  border: 1.5px solid var(--model-selector-border);
  border-top-color: var(--orange);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spinning {
  animation: spin 0.7s linear infinite;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--icon-btn-border);
  border-radius: 8px;
  color: var(--icon-btn-color);
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
  padding: 0;
}
.icon-btn svg {
  width: 13px;
  height: 13px;
}
.icon-btn:hover:not(:disabled) {
  color: var(--orange);
  border-color: var(--orange);
  background: var(--model-selector-bg);
}
.icon-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.model-selector {
  position: relative;
}

.model-current {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
  border-radius: 8px;
  color: var(--beige);
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.25s ease;
  white-space: nowrap;
}
.model-current:hover {
  border-color: var(--orange);
}

.model-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--model-dot-inactive);
  flex-shrink: 0;
  transition: background 0.25s ease;
}
.model-dot.active {
  background: var(--orange);
}

.chevron {
  width: 12px;
  height: 12px;
  color: var(--icon-btn-color);
  transition:
    transform 0.2s ease,
    color 0.25s ease;
}
.chevron.open {
  transform: rotate(180deg);
}

.model-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  background: var(--model-dropdown-bg);
  border: 1px solid var(--model-selector-border);
  border-radius: 10px;
  overflow: hidden;
  z-index: 50;
  transition: background 0.25s ease;
}

.model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  background: transparent;
  border: none;
  color: var(--sidebar-tab-color);
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.12s,
    color 0.12s;
  white-space: nowrap;
}
.model-option:hover {
  background: var(--sidebar-tab-hover-bg);
  color: var(--beige);
}
.model-option.active {
  color: var(--orange);
}

.ollama-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 13px;
  background: var(--model-selector-bg);
  border: 1px solid var(--modal-border);
  border-radius: 8px;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.25s ease;
}
.ollama-btn svg {
  width: 14px;
  height: 14px;
  color: var(--orange);
}
.ollama-btn:hover {
  background: var(--sidebar-tab-hover-bg);
  border-color: var(--orange);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
