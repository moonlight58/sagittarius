<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Send a message...' },
})

const emit = defineEmits(['submit'])

const text = ref('')
const textareaRef = ref(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 240) + 'px'
}

async function handleInput() {
  await nextTick()
  autoResize()
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function submit() {
  const val = text.value.trim()
  if (!val || props.disabled) return
  emit('submit', val)
  text.value = ''
  nextTick(() => {
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  })
}
</script>

<template>
  <div class="promptbar-wrap">
    <div class="promptbar" :class="{ focused: text.length > 0 }">
      <textarea
        ref="textareaRef"
        v-model="text"
        class="promptbar-input"
        :placeholder="placeholder"
        :disabled="disabled"
        rows="1"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <button
        class="promptbar-send"
        :class="{ active: text.trim().length > 0 }"
        :disabled="!text.trim() || disabled"
        @click="submit"
        aria-label="Send"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
    <p class="promptbar-hint">Shift + Enter for new line</p>
  </div>
</template>

<style scoped>
.promptbar-wrap {
  width: 100%;
  max-width: 680px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.promptbar {
  width: 100%;
  display: flex;
  align-items: flex-end;
  gap: 0;
  background: #170505;
  border: 1px solid #4a1a1a;
  border-radius: 10px;
  padding: 4px 4px 4px 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.promptbar:focus-within {
  border-color: #7a3020;
  box-shadow:
    0 0 0 1px rgba(135, 4, 0, 0.2),
    0 4px 24px rgba(0, 0, 0, 0.4);
}

.promptbar.focused {
  border-color: #6a2515;
}

.promptbar-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--beige);
  font-family: var(--font-mono), monospace;
  font-size: 13.5px;
  line-height: 1.6;
  resize: none;
  padding: 10px 0;
  min-height: 44px;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #3a1010 transparent;
}

.promptbar-input::placeholder {
  color: #5a2a20;
}

.promptbar-input::-webkit-scrollbar {
  width: 4px;
}
.promptbar-input::-webkit-scrollbar-thumb {
  background: #3a1010;
  border-radius: 2px;
}

.promptbar-send {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin: 4px;
  background: #2a0a0a;
  border: 1px solid #3a1010;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #5a2a20;
  transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
  align-self: flex-end;
}

.promptbar-send svg {
  width: 15px;
  height: 15px;
}

.promptbar-send.active {
  background: var(--formula-red);
  border-color: var(--dark-red);
  color: var(--beige);
  box-shadow: 0 0 12px rgba(135, 4, 0, 0.4);
}

.promptbar-send.active:hover {
  background: var(--dark-red);
  box-shadow: 0 0 18px rgba(135, 4, 0, 0.6);
}

.promptbar-send:disabled:not(.active) {
  cursor: default;
}

.promptbar-hint {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: #3a1a1a;
  letter-spacing: 0.04em;
}
</style>