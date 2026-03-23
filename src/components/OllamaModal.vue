<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'import'])

const modelInput = ref('')
const pulling = ref(false)
const pullError = ref('')
const layers = ref([])
const overallStatus = ref('')
const done = ref(false)

const totalCompleted = computed(() => layers.value.reduce((s, l) => s + (l.completed ?? 0), 0))
const totalSize = computed(() => layers.value.reduce((s, l) => s + (l.total ?? 0), 0))
const overallPct = computed(() =>
  totalSize.value > 0 ? Math.round((totalCompleted.value / totalSize.value) * 100) : 0,
)

function fmt(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB'
  return (bytes / 1024 ** 3).toFixed(2) + ' GB'
}

function layerLabel(id) {
  return id?.slice(7, 19) ?? '...'
}

async function pull() {
  const name = modelInput.value.trim()
  if (!name || pulling.value) return

  pulling.value = true
  pullError.value = ''
  layers.value = []
  overallStatus.value = ''
  done.value = false

  try {
    const res = await fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream: true }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Ollama error ${res.status}: ${text}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done: streamDone } = await reader.read()
      if (streamDone) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line)
          handleChunk(obj)
        } catch {}
      }
    }
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      pullError.value = 'Cannot reach Ollama. Make sure it is running on localhost:11434.'
    } else {
      pullError.value = err.message
    }
    pulling.value = false
    return
  }

  pulling.value = false
  done.value = true
  emit('import', modelInput.value.trim())
}

function handleChunk(obj) {
  overallStatus.value = obj.status ?? ''

  if (obj.digest) {
    const id = obj.digest
    const existing = layers.value.find((l) => l.id === id)
    if (existing) {
      if (obj.completed !== undefined) existing.completed = obj.completed
      if (obj.total !== undefined) existing.total = obj.total
      existing.status = obj.status
    } else {
      layers.value.push({
        id,
        status: obj.status,
        completed: obj.completed ?? 0,
        total: obj.total ?? 0,
      })
    }
  }
}

function close() {
  if (pulling.value) return
  modelInput.value = ''
  pulling.value = false
  pullError.value = ''
  layers.value = []
  overallStatus.value = ''
  done.value = false
  emit('update:modelValue', false)
}

function reset() {
  modelInput.value = ''
  layers.value = []
  overallStatus.value = ''
  pullError.value = ''
  done.value = false
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Pull Ollama Model</h3>
          <button v-if="!pulling" class="modal-close" @click="close" aria-label="Close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div v-if="!pulling && !done" class="input-row">
          <input
            v-model="modelInput"
            class="modal-input"
            placeholder="model:tag  (e.g. llama3, mistral:7b)"
            @keyup.enter="pull"
            autofocus
          />
          <button class="pull-btn" :disabled="!modelInput.trim()" @click="pull">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Pull
          </button>
        </div>

        <p v-if="!pulling && !done" class="modal-sub">
          Browse models at
          <a href="https://ollama.com/library" target="_blank" class="modal-link"
            >ollama.com/library</a
          >
        </p>

        <div v-if="pullError" class="pull-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ pullError }}
        </div>

        <div v-if="pulling || (done && layers.length)" class="progress-wrap">
          <div class="progress-model-name">{{ modelInput.trim() }}</div>
          <div class="overall-row">
            <div class="overall-bar-track">
              <div
                class="overall-bar-fill"
                :class="{ done }"
                :style="{ width: done ? '100%' : overallPct + '%' }"
              />
            </div>
            <span class="overall-pct">{{ done ? '100' : overallPct }}%</span>
          </div>
          <p class="status-text" :class="{ done }">
            <span v-if="done">✓ Model ready</span>
            <span v-else>{{ overallStatus }}</span>
          </p>
          <div v-if="layers.length && !done" class="layers">
            <div v-for="layer in layers" :key="layer.id" class="layer-row">
              <span class="layer-id">{{ layerLabel(layer.id) }}</span>
              <div class="layer-bar-track">
                <div
                  class="layer-bar-fill"
                  :style="{
                    width: layer.total > 0 ? (layer.completed / layer.total) * 100 + '%' : '100%',
                  }"
                />
              </div>
              <span class="layer-size">
                {{
                  layer.total > 0 ? fmt(layer.completed) + ' / ' + fmt(layer.total) : layer.status
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <template v-if="done">
            <button class="btn-secondary" @click="reset">Pull another</button>
            <button class="btn-primary" @click="close">Done</button>
          </template>
          <template v-else-if="!pulling">
            <button class="btn-secondary" @click="close">Cancel</button>
          </template>
          <template v-else>
            <span class="pulling-note">Download in progress — do not close</span>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--modal-bg);
  border: 1px solid var(--modal-border);
  border-radius: 10px;
  padding: 24px;
  width: 420px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition:
    background 0.25s ease,
    border-color 0.25s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-family: var(--font-sans), sans-serif;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--beige);
  margin: 0;
  transition: color 0.25s ease;
}

.modal-close {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--model-selector-border);
  border-radius: 5px;
  color: var(--icon-btn-color);
  cursor: pointer;
  transition:
    color 0.25s ease,
    border-color 0.25s ease;
  padding: 0;
}
.modal-close svg {
  width: 13px;
  height: 13px;
}
.modal-close:hover {
  color: var(--beige);
  border-color: var(--orange);
}

.input-row {
  display: flex;
  gap: 8px;
}

.modal-input {
  flex: 1;
  background: var(--modal-input-bg);
  border: 1px solid var(--modal-input-border);
  border-radius: 6px;
  padding: 9px 12px;
  color: var(--beige);
  font-family: var(--font-mono), monospace;
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.25s ease,
    background 0.25s ease,
    color 0.25s ease;
}
.modal-input:focus {
  border-color: var(--orange);
}
.modal-input::placeholder {
  color: var(--status-muted-color);
}

.pull-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: var(--formula-red);
  border: 1px solid var(--dark-red);
  border-radius: 6px;
  color: #fbf5d7;
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.25s ease,
    box-shadow 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.pull-btn svg {
  width: 14px;
  height: 14px;
}
.pull-btn:hover:not(:disabled) {
  background: var(--dark-red);
  box-shadow: 0 0 16px rgba(135, 4, 0, 0.4);
}
.pull-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.modal-sub {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--status-muted-color);
  margin: -4px 0 0;
}
.modal-link {
  color: var(--orange);
  text-decoration: none;
  border-bottom: 1px solid rgba(240, 118, 12, 0.3);
  transition: border-color 0.25s ease;
}
.modal-link:hover {
  border-color: var(--orange);
}

.pull-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(180, 30, 10, 0.08);
  border: 1px solid var(--model-selector-border);
  border-radius: 6px;
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  color: var(--status-error-color);
  line-height: 1.5;
}
.pull-error svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-top: 1px;
}

.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-model-name {
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  color: var(--orange);
  letter-spacing: 0.04em;
}

.overall-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.overall-bar-track {
  flex: 1;
  height: 6px;
  background: var(--model-selector-bg);
  border-radius: 3px;
  overflow: hidden;
}

.overall-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--dark-red), var(--orange));
  border-radius: 3px;
  transition: width 0.3s ease;
}
.overall-bar-fill.done {
  background: linear-gradient(90deg, #2a7a30, #4aaa50);
}

.overall-pct {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--sidebar-tab-color);
  width: 34px;
  text-align: right;
  flex-shrink: 0;
}

.status-text {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--status-muted-color);
  margin: 0;
}
.status-text.done {
  color: #4aaa50;
}

.layers {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 160px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--model-selector-border) transparent;
  padding-right: 2px;
}
.layers::-webkit-scrollbar {
  width: 3px;
}
.layers::-webkit-scrollbar-thumb {
  background: var(--model-selector-border);
  border-radius: 2px;
}

.layer-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-id {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--status-muted-color);
  width: 78px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-bar-track {
  flex: 1;
  height: 3px;
  background: var(--model-selector-bg);
  border-radius: 2px;
  overflow: hidden;
}

.layer-bar-fill {
  height: 100%;
  background: var(--dark-red);
  border-radius: 2px;
  transition: width 0.2s ease;
}

.layer-size {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--status-muted-color);
  width: 100px;
  flex-shrink: 0;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}

.btn-primary {
  padding: 7px 18px;
  background: var(--formula-red);
  border: 1px solid var(--dark-red);
  border-radius: 5px;
  color: #fbf5d7;
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.25s ease,
    box-shadow 0.25s ease;
}
.btn-primary:hover {
  background: var(--dark-red);
  box-shadow: 0 0 14px rgba(135, 4, 0, 0.3);
}

.btn-secondary {
  padding: 7px 16px;
  background: transparent;
  border: 1px solid var(--model-selector-border);
  border-radius: 5px;
  color: var(--sidebar-tab-color);
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 0.25s ease,
    color 0.25s ease;
}
.btn-secondary:hover {
  border-color: var(--orange);
  color: var(--beige);
}

.pulling-note {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--status-muted-color);
  font-style: italic;
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
