<script setup>
import { ref, watch } from 'vue'
import { useSettings } from '../composables/useSettings.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { ollamaHost, setHost, resetHost } = useSettings()

const inputVal = ref(ollamaHost.value)
const testing = ref(false)
const testResult = ref(null)
const testError = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    inputVal.value = ollamaHost.value
    testResult.value = null
    testError.value = ''
  }
})

async function testConnection() {
  testing.value = true
  testResult.value = null
  testError.value = ''

  const url = inputVal.value.trim().replace(/\/$/, '')

  try {
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`Server responded with ${res.status}`)
    const data = await res.json()
    const count = data.models?.length ?? 0
    testResult.value = 'ok'
    testError.value = `Connected — ${count} model${count !== 1 ? 's' : ''} found`
  } catch (err) {
    testResult.value = 'error'
    testError.value = err.message.includes('fetch') || err.message.includes('NetworkError') || err.name === 'TimeoutError'
      ? 'Could not connect. Check the URL and that Ollama is running.'
      : err.message
  } finally {
    testing.value = false
  }
}

function save() {
  setHost(inputVal.value)
  emit('saved')
  emit('update:modelValue', false)
}

function reset() {
  resetHost()
  inputVal.value = ollamaHost.value
  testResult.value = null
  testError.value = ''
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal">

        <div class="modal-header">
          <div class="modal-title-row">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="title-icon">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
            </svg>
            <h3 class="modal-title">Ollama Connection</h3>
          </div>
          <button class="modal-close" @click="close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p class="modal-desc">
          Point Sagittarius at your Ollama instance. This can be a local address, a VPN IP, or a public URL if your Ollama is exposed remotely.
        </p>

        <div class="field">
          <label class="field-label">Ollama Host URL</label>
          <div class="input-row">
            <input
              v-model="inputVal"
              class="modal-input"
              placeholder="http://localhost:11434"
              spellcheck="false"
              @keyup.enter="testConnection"
            />
            <button class="test-btn" :disabled="!inputVal.trim() || testing" @click="testConnection">
              <span v-if="testing" class="spinner" />
              <span v-else>Test</span>
            </button>
          </div>
        </div>

        <Transition name="result-fade">
          <div v-if="testResult" class="test-result" :class="testResult">
            <svg v-if="testResult === 'ok'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ testError }}
          </div>
        </Transition>

        <div class="examples">
          <span class="examples-label">Examples</span>
          <div class="example-pills">
            <button class="example-pill" @click="inputVal = 'http://localhost:11434'">localhost:11434</button>
            <button class="example-pill" @click="inputVal = 'http://192.168.1.100:11434'">LAN IP</button>
            <button class="example-pill" @click="inputVal = 'https://ollama.yourdomain.com'">Custom domain</button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-ghost" @click="reset" title="Reset to default">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
            Reset
          </button>
          <div class="actions-right">
            <button class="btn-secondary" @click="close">Cancel</button>
            <button class="btn-primary" :disabled="!inputVal.trim()" @click="save">Save</button>
          </div>
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
  width: 440px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.title-icon {
  width: 16px;
  height: 16px;
  color: var(--orange);
  flex-shrink: 0;
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
  transition: color 0.15s, border-color 0.15s;
  padding: 0;
}
.modal-close svg { width: 13px; height: 13px; }
.modal-close:hover { color: var(--beige); border-color: var(--orange); }

.modal-desc {
  font-family: var(--font-sans), sans-serif;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--sidebar-tab-color);
  margin: 0;
  transition: color 0.25s ease;
}

.field { display: flex; flex-direction: column; gap: 7px; }

.field-label {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--status-muted-color);
  transition: color 0.25s ease;
}

.input-row { display: flex; gap: 8px; }

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
  transition: border-color 0.15s, background 0.25s ease, color 0.25s ease;
}
.modal-input:focus { border-color: var(--orange); }
.modal-input::placeholder { color: var(--status-muted-color); }

.test-btn {
  padding: 9px 16px;
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
  border-radius: 6px;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 60px;
  justify-content: center;
}
.test-btn:hover:not(:disabled) {
  border-color: var(--orange);
}
.test-btn:disabled { opacity: 0.4; cursor: default; }

.spinner {
  width: 11px;
  height: 11px;
  border: 1.5px solid var(--model-selector-border);
  border-top-color: var(--orange);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 6px;
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  line-height: 1.4;
}
.test-result svg { width: 14px; height: 14px; flex-shrink: 0; }
.test-result.ok    { background: rgba(40, 120, 50, 0.1); border: 1px solid #2a5a30; color: #4aaa55; }
.test-result.error { background: rgba(180, 30, 10, 0.08); border: 1px solid var(--model-selector-border); color: var(--status-error-color); }

.examples { display: flex; flex-direction: column; gap: 7px; }

.examples-label {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--status-muted-color);
}

.example-pills { display: flex; flex-wrap: wrap; gap: 6px; }

.example-pill {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--model-selector-border);
  border-radius: 20px;
  color: var(--sidebar-tab-color);
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.example-pill:hover {
  border-color: var(--orange);
  color: var(--beige);
  background: var(--model-selector-bg);
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
  padding-top: 14px;
  border-top: 1px solid var(--topbar-border);
  transition: border-color 0.25s ease;
}

.actions-right { display: flex; gap: 8px; }

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: transparent;
  border: none;
  color: var(--status-muted-color);
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s;
  border-radius: 5px;
}
.btn-ghost svg { width: 12px; height: 12px; }
.btn-ghost:hover { color: var(--orange); }

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
  transition: background 0.15s, box-shadow 0.15s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--dark-red);
  box-shadow: 0 0 14px rgba(135, 4, 0, 0.3);
}
.btn-primary:disabled { opacity: 0.4; cursor: default; }

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
  transition: border-color 0.15s, color 0.15s;
}
.btn-secondary:hover { border-color: var(--orange); color: var(--beige); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.result-fade-enter-active, .result-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.result-fade-enter-from, .result-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>