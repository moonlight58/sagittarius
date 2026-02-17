<script setup>
import { ref } from 'vue'
import OllamaModal from './OllamaModal.vue'
import { useChat } from '../composables/useChat.js'

const props = defineProps({
  tab: { type: String, required: true },
})

const { importedModels, activeModel, importModel, selectModel } = useChat(props.tab)

const showModal = ref(false)
const showModelDropdown = ref(false)

function onImport(name) {
  importModel(name)
  showModal.value = false
}

function pickModel(name) {
  selectModel(name)
  showModelDropdown.value = false
}
</script>

<template>
  <header class="topbar">
    <!-- Model selector -->
    <div
      v-if="importedModels.length"
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

    <!-- Import button -->
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
