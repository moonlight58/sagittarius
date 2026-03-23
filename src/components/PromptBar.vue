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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
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
  background: var(--promptbar-bg);
  border: 1px solid var(--promptbar-border);
  border-radius: 10px;
  padding: 4px 4px 4px 16px;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.promptbar:focus-within {
  border-color: var(--promptbar-focus-border);
  box-shadow:
    0 0 0 1px rgba(240, 118, 12, 0.12),
    0 4px 24px rgba(0, 0, 0, 0.1);
}

.promptbar.focused {
  border-color: var(--promptbar-focus-border);
}

.promptbar-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--promptbar-input-color);
  font-family: var(--font-mono), monospace;
  font-size: 13.5px;
  line-height: 1.6;
  resize: none;
  padding: 10px 0;
  min-height: 44px;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--promptbar-border) transparent;
  transition: color 0.25s ease;
}

.promptbar-input::placeholder {
  color: var(--promptbar-placeholder);
}

.promptbar-input::-webkit-scrollbar { width: 4px; }
.promptbar-input::-webkit-scrollbar-thumb {
  background: var(--promptbar-border);
  border-radius: 2px;
}

.promptbar-send {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin: 4px;
  background: var(--promptbar-send-bg);
  border: 1px solid var(--promptbar-send-border);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--promptbar-send-color);
  transition:
    background 0.25s,
    border-color 0.25s,
    color 0.25s,
    box-shadow 0.25s;
  align-self: flex-end;
}

.promptbar-send svg { width: 15px; height: 15px; }

.promptbar-send.active {
  background: #c84a30;
  border-color: #a83a20;
  color: #f5f0e8;
  box-shadow: 0 0 12px rgba(200, 74, 48, 0.25);
}

.promptbar-send.active:hover {
  background: #b84020;
  box-shadow: 0 0 18px rgba(200, 74, 48, 0.35);
}

.promptbar-send:disabled:not(.active) { cursor: default; }

.promptbar-hint {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--promptbar-hint-color);
  letter-spacing: 0.04em;
  transition: color 0.25s ease;
}
</style>