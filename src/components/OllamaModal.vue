<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'import'])

const modelInput = ref('')

function submit() {
  const name = modelInput.value.trim()
  if (name) emit('import', name)
  modelInput.value = ''
  emit('update:modelValue', false)
}

function close() {
  modelInput.value = ''
  emit('update:modelValue', false)
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal">
        <h3 class="modal-title">Import Ollama Model</h3>
        <p class="modal-sub">
          Enter the model name (e.g. <code>llama3</code>, <code>mistral</code>)
        </p>
        <p class="modal-sub">
          Browse all models at
          <a href="https://ollama.com/library" target="_blank" class="modal-link">ollama.com/library</a>
        </p>
        <input
          v-model="modelInput"
          class="modal-input"
          placeholder="model:tag"
          @keyup.enter="submit"
          autofocus
        />
        <div class="modal-actions">
          <button class="modal-cancel" @click="close">Cancel</button>
          <button class="modal-confirm" @click="submit">Import</button>
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
  border-radius: 8px;
  padding: 28px;
  width: 380px;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6), 0 0 30px rgba(100, 20, 20, 0.2);
}

.modal-title {
  font-family: var(--font-sans), sans-serif;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--beige);
  margin: 0 0 10px;
}

.modal-sub {
  font-size: 12px;
  color: #c9856a;
  margin: 0 0 8px;
  font-family: var(--font-mono), monospace;
  line-height: 1.5;
}

.modal-sub:last-of-type {
  margin-bottom: 18px;
}

.modal-sub code {
  color: var(--orange);
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

.modal-input {
  width: 100%;
  background: #0e0000;
  border: 1px solid #5a2a1a;
  border-radius: 5px;
  padding: 9px 12px;
  color: var(--beige);
  font-family: var(--font-mono), monospace;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.modal-input:focus {
  border-color: var(--orange);
}

.modal-input::placeholder {
  color: #6b3a2a;
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
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.modal-confirm:hover {
  background: var(--dark-red);
  box-shadow: 0 0 16px rgba(135, 4, 0, 0.5);
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>