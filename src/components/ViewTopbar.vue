<script setup>
import { ref } from 'vue'
import OllamaModal from './OllamaModal.vue'
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

function onImport(name) {
  importModel(name) // refreshes model list from Ollama
  showModal.value = false
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

    <OllamaModal v-model="showModal" @import="onImport" />
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-bottom: 1px solid #2a0e0e;
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* Status pills */
.status-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 5px;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
}

.status-pill.loading {
  color: #9a6040;
  background: rgba(135, 4, 0, 0.06);
  border: 1px solid #2a1010;
}

.status-pill.error {
  color: #e07060;
  background: rgba(180, 30, 10, 0.1);
  border: 1px solid #5a2010;
}

.status-pill.error svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.status-pill.muted {
  color: #5a3020;
  background: transparent;
  border: 1px dashed #2a1010;
}

.retry-btn {
  background: transparent;
  border: 1px solid #5a2010;
  border-radius: 4px;
  color: #e07060;
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
  background: rgba(180, 30, 10, 0.15);
  border-color: #e07060;
}

/* Spinner */
.spinner {
  width: 11px;
  height: 11px;
  border: 1.5px solid #3a1a10;
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

/* Icon button (refresh) */
.icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #2a1010;
  border-radius: 5px;
  color: #5a3020;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
  padding: 0;
}

.icon-btn svg {
  width: 13px;
  height: 13px;
}

.icon-btn:hover:not(:disabled) {
  color: var(--orange);
  border-color: #5a2010;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* Model selector */
.model-selector {
  position: relative;
}

.model-current {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  background: rgba(135, 4, 0, 0.1);
  border: 1px solid #4a1a1a;
  border-radius: 5px;
  color: var(--beige);
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  white-space: nowrap;
}

.model-current:hover {
  border-color: #7a2a2a;
  background: rgba(135, 4, 0, 0.18);
}

.model-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4a2020;
  flex-shrink: 0;
}

.model-dot.active {
  background: var(--orange);
  box-shadow: 0 0 6px rgba(240, 118, 12, 0.5);
}

.chevron {
  width: 12px;
  height: 12px;
  color: #7a3030;
  transition: transform 0.2s ease;
}
.chevron.open {
  transform: rotate(180deg);
}

.model-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  background: #1a0505;
  border: 1px solid #4a1a1a;
  border-radius: 6px;
  overflow: hidden;
  z-index: 50;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  background: transparent;
  border: none;
  color: #c9856a;
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
  background: rgba(135, 4, 0, 0.15);
  color: var(--beige);
}
.model-option.active {
  color: var(--orange);
}

/* Pull button */
.ollama-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 13px;
  background: transparent;
  border: 1px solid var(--formula-red);
  border-radius: 5px;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}

.ollama-btn svg {
  width: 14px;
  height: 14px;
  color: var(--orange);
}

.ollama-btn:hover {
  background: rgba(80, 0, 1, 0.3);
  border-color: var(--orange);
  box-shadow: 0 0 12px rgba(240, 118, 12, 0.15);
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
