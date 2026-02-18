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
const testResult = ref(null) // null | 'ok' | 'error'
const testError = ref('')

// Sync input when modal opens
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

        <!-- Header -->
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

        <!-- Description -->
        <p class="modal-desc">
          Point Sagittarius at your Ollama instance. This can be a local address, a VPN IP, or a public URL if your Ollama is exposed remotely.
        </p>

        <!-- Input -->
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

        <!-- Test result -->
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

        <!-- Examples -->
        <div class="examples">
          <span class="examples-label">Examples</span>
          <div class="example-pills">
            <button class="example-pill" @click="inputVal = 'http://localhost:11434'">localhost:11434</button>
            <button class="example-pill" @click="inputVal = 'http://192.168.1.100:11434'">LAN IP</button>
            <button class="example-pill" @click="inputVal = 'https://ollama.yourdomain.com'">Custom domain</button>
          </div>
        </div>

        <!-- Actions -->
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
  background: rgba(0,0,0,0.65);
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
  width: 440px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 8px 48px rgba(0,0,0,0.6), 0 0 30px rgba(100,20,20,0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Header */
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
  transition: color 0.15s, border-color 0.15s;
  padding: 0;
}
.modal-close svg { width: 13px; height: 13px; }
.modal-close:hover { color: var(--beige); border-color: #6a2a2a; }

/* Description */
.modal-desc {
  font-family: var(--font-sans), sans-serif;
  font-size: 12.5px;
  line-height: 1.65;
  color: #7a5040;
  margin: 0;
}

/* Field */
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-label {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6a3a28;
}

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
.modal-input:focus { border-color: var(--orange); }
.modal-input::placeholder { color: #5a3020; }

.test-btn {
  padding: 9px 16px;
  background: rgba(135, 4, 0, 0.2);
  border: 1px solid #5a2010;
  border-radius: 6px;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 60px;
  justify-content: center;
}
.test-btn:hover:not(:disabled) {
  background: rgba(135, 4, 0, 0.35);
  border-color: var(--orange);
}
.test-btn:disabled { opacity: 0.4; cursor: default; }

/* Spinner */
.spinner {
  width: 11px;
  height: 11px;
  border: 1.5px solid #3a1a10;
  border-top-color: var(--orange);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Test result */
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
.test-result.ok    { background: rgba(40, 120, 50, 0.12); border: 1px solid #2a5a30; color: #4aaa55; }
.test-result.error { background: rgba(180, 30, 10, 0.12); border: 1px solid #6a2010; color: #e07060; }

/* Examples */
.examples {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.examples-label {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #5a3020;
}

.example-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.example-pill {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid #2a1010;
  border-radius: 20px;
  color: #7a4030;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.example-pill:hover {
  border-color: #6a2a1a;
  color: var(--beige);
  background: rgba(135, 4, 0, 0.1);
}

/* Actions */
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
  padding-top: 14px;
  border-top: 1px solid #1e0808;
}

.actions-right {
  display: flex;
  gap: 8px;
}

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: transparent;
  border: none;
  color: #5a3020;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s;
  border-radius: 5px;
}
.btn-ghost svg { width: 12px; height: 12px; }
.btn-ghost:hover { color: #c9856a; }

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
  transition: background 0.15s, box-shadow 0.15s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--dark-red);
  box-shadow: 0 0 14px rgba(135, 4, 0, 0.4);
}
.btn-primary:disabled { opacity: 0.4; cursor: default; }

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
  transition: border-color 0.15s, color 0.15s;
}
.btn-secondary:hover { border-color: var(--formula-red); color: var(--beige); }

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.result-fade-enter-active, .result-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.result-fade-enter-from, .result-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
