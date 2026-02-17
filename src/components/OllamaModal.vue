<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'import'])

// ── state ──────────────────────────────────────────────────────────────────
const modelInput = ref('')
const pulling = ref(false)
const pullError = ref('')
const layers = ref([]) // [{ id, status, completed, total }]
const overallStatus = ref('')
const done = ref(false)

// ── computed ───────────────────────────────────────────────────────────────
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
  return id?.slice(7, 19) ?? '...' // sha256:xxxx → short id
}

// ── pull logic ─────────────────────────────────────────────────────────────
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
      buffer = lines.pop() // keep incomplete line

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
  if (pulling.value) return // don't close mid-pull
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
        <!-- Header -->
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

        <!-- Input row -->
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

        <!-- Library link -->
        <p v-if="!pulling && !done" class="modal-sub">
          Browse models at
          <a href="https://ollama.com/library" target="_blank" class="modal-link"
            >ollama.com/library</a
          >
        </p>

        <!-- Error -->
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

        <!-- Progress UI -->
        <div v-if="pulling || (done && layers.length)" class="progress-wrap">
          <!-- Model name pill -->
          <div class="progress-model-name">{{ modelInput.trim() }}</div>

          <!-- Overall bar -->
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

          <!-- Status text -->
          <p class="status-text" :class="{ done }">
            <span v-if="done">✓ Model ready</span>
            <span v-else>{{ overallStatus }}</span>
          </p>

          <!-- Layer breakdown -->
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

        <!-- Actions -->
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
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.modal {
  background: #1a0505;
  border: 1px solid #5a2020;
  border-radius: 10px;
  padding: 24px;
  width: 420px;
  max-width: calc(100vw - 32px);
  box-shadow:
    0 8px 48px rgba(0, 0, 0, 0.6),
    0 0 30px rgba(100, 20, 20, 0.2);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Header */
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
}

.modal-close {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #3a1a1a;
  border-radius: 5px;
  color: #7a4030;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
  padding: 0;
}
.modal-close svg {
  width: 13px;
  height: 13px;
}
.modal-close:hover {
  color: var(--beige);
  border-color: #6a2a2a;
}

/* Input row */
.input-row {
  display: flex;
  gap: 8px;
}

.modal-input {
  flex: 1;
  background: #0e0000;
  border: 1px solid #5a2a1a;
  border-radius: 6px;
  padding: 9px 12px;
  color: var(--beige);
  font-family: var(--font-mono), monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.modal-input:focus {
  border-color: var(--orange);
}
.modal-input::placeholder {
  color: #6b3a2a;
}

.pull-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: var(--formula-red);
  border: 1px solid var(--dark-red);
  border-radius: 6px;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.pull-btn svg {
  width: 14px;
  height: 14px;
}
.pull-btn:hover:not(:disabled) {
  background: var(--dark-red);
  box-shadow: 0 0 16px rgba(135, 4, 0, 0.5);
}
.pull-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* Sub text */
.modal-sub {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: #7a4030;
  margin: -4px 0 0;
}
.modal-link {
  color: var(--orange);
  text-decoration: none;
  border-bottom: 1px solid rgba(240, 118, 12, 0.3);
  transition: border-color 0.15s;
}
.modal-link:hover {
  border-color: var(--orange);
}

/* Error */
.pull-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(180, 30, 10, 0.12);
  border: 1px solid #6a2010;
  border-radius: 6px;
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  color: #e07060;
  line-height: 1.5;
}
.pull-error svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Progress */
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
  background: #2a0808;
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
  color: #c9856a;
  width: 34px;
  text-align: right;
  flex-shrink: 0;
}

.status-text {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: #7a4030;
  margin: 0;
}
.status-text.done {
  color: #4aaa50;
}

/* Layers */
.layers {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 160px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #2a0808 transparent;
  padding-right: 2px;
}
.layers::-webkit-scrollbar {
  width: 3px;
}
.layers::-webkit-scrollbar-thumb {
  background: #2a0808;
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
  color: #5a2a20;
  width: 78px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-bar-track {
  flex: 1;
  height: 3px;
  background: #2a0808;
  border-radius: 2px;
  overflow: hidden;
}

.layer-bar-fill {
  height: 100%;
  background: #7a2a20;
  border-radius: 2px;
  transition: width 0.2s ease;
}

.layer-size {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: #5a3025;
  width: 100px;
  flex-shrink: 0;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Actions */
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
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
}
.btn-primary:hover {
  background: var(--dark-red);
  box-shadow: 0 0 14px rgba(135, 4, 0, 0.4);
}

.btn-secondary {
  padding: 7px 16px;
  background: transparent;
  border: 1px solid #4a2020;
  border-radius: 5px;
  color: #a06050;
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}
.btn-secondary:hover {
  border-color: var(--formula-red);
  color: var(--beige);
}

.pulling-note {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: #5a3025;
  font-style: italic;
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
