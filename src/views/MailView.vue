<script setup>
import { ref } from 'vue'

const showOllamaModal = ref(false)
const modelInput = ref('')
const importedModels = ref([])

function importModel() {
  const name = modelInput.value.trim()
  if (name && !importedModels.value.includes(name)) {
    importedModels.value.push(name)
  }
  modelInput.value = ''
  showOllamaModal.value = false
}
</script>

<template>
  <div class="view-root">
    <header class="view-topbar">
      <button class="ollama-btn" @click="showOllamaModal = true">
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
        <span>Import Ollama Model</span>
      </button>

      <div v-if="importedModels.length" class="model-chips">
        <span v-for="m in importedModels" :key="m" class="model-chip">{{ m }}</span>
      </div>
    </header>

    <div class="view-body">
      <p class="placeholder-text">Mail workspace</p>
    </div>

    <Transition name="modal-fade">
      <div v-if="showOllamaModal" class="modal-overlay" @click.self="showOllamaModal = false">
        <div class="modal">
          <h3 class="modal-title">Import Ollama Model</h3>
          <p class="modal-sub">
            Enter the model name (e.g. <code>llama3</code>, <code>mistral</code>)
          </p>
          <input
            v-model="modelInput"
            class="modal-input"
            placeholder="model:tag"
            @keyup.enter="importModel"
            autofocus
          />
          <div class="modal-actions">
            <button class="modal-cancel" @click="showOllamaModal = false">Cancel</button>
            <button class="modal-confirm" @click="importModel">Import</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=JetBrains+Mono:wght@300;400&display=swap');

.view-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
}

.view-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #1f0000;
  flex-wrap: wrap;
}

.ollama-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  background: transparent;
  border: 1px solid var(--formula-red);
  border-radius: 5px;
  color: var(--beige);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
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
  width: 15px;
  height: 15px;
  color: var(--orange);
}

.ollama-btn:hover {
  background: rgba(80, 0, 1, 0.3);
  border-color: var(--orange);
  box-shadow: 0 0 12px rgba(240, 118, 12, 0.2);
}

.model-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.model-chip {
  padding: 3px 10px;
  background: rgba(135, 4, 0, 0.2);
  border: 1px solid var(--formula-red);
  border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--orange);
}

.view-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #2e0000;
  letter-spacing: 0.05em;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.modal {
  background: #160000;
  border: 1px solid #3a0000;
  border-radius: 8px;
  padding: 28px;
  width: 360px;
  box-shadow: 0 0 40px rgba(135, 4, 0, 0.3);
}

.modal-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--beige);
  margin: 0 0 6px;
}

.modal-sub {
  font-size: 13px;
  color: #7a3030;
  margin: 0 0 18px;
  font-family: 'JetBrains Mono', monospace;
}

.modal-sub code {
  color: var(--orange);
}

.modal-input {
  width: 100%;
  background: var(--color-bg);
  border: 1px solid #3a0000;
  border-radius: 5px;
  padding: 9px 12px;
  color: var(--beige);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.modal-input:focus {
  border-color: var(--orange);
}

.modal-input::placeholder {
  color: #3a0000;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.modal-cancel {
  padding: 7px 16px;
  background: transparent;
  border: 1px solid #2e0000;
  border-radius: 5px;
  color: #7a3030;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}

.modal-cancel:hover {
  border-color: var(--formula-red);
  color: var(--beige);
}

.modal-confirm {
  padding: 7px 16px;
  background: var(--formula-red);
  border: 1px solid var(--dark-red);
  border-radius: 5px;
  color: var(--beige);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
}

.modal-confirm:hover {
  background: var(--dark-red);
  box-shadow: 0 0 12px rgba(135, 4, 0, 0.5);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
