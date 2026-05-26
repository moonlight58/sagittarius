<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Send a message...' },
})

const emit = defineEmits(['submit'])

const text = ref('')
const textareaRef = ref(null)
const fileInput = ref(null)
const attachedFiles = ref([])

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

function triggerFileSelect() {
  fileInput.value.click()
}

function handleFileChange(event) {
  const files = Array.from(event.target.files)
  attachedFiles.value = [...attachedFiles.value, ...files]
  event.target.value = '' // Clear input
}

function removeFile(index) {
  attachedFiles.value.splice(index, 1)
}

function submit() {
  const val = text.value.trim()
  if ((!val && attachedFiles.value.length === 0) || props.disabled) return
  
  emit('submit', { text: val, files: attachedFiles.value })
  
  text.value = ''
  attachedFiles.value = []
  nextTick(() => {
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  })
}
</script>

<template>
  <div class="promptbar-wrap">
    <div v-if="attachedFiles.length" class="file-list">
      <div v-for="(file, index) in attachedFiles" :key="index" class="file-item">
        <span class="file-name">{{ file.name }}</span>
        <button @click="removeFile(index)" class="remove-file">×</button>
      </div>
    </div>
    <div class="promptbar" :class="{ focused: text.length > 0 }">
      <button class="attach-btn" @click="triggerFileSelect" title="Attach files">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
      </button>
      <input type="file" ref="fileInput" @change="handleFileChange" multiple style="display: none" />
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
        :class="{ active: text.trim().length > 0 || attachedFiles.length > 0 }"
        :disabled="(!text.trim() && attachedFiles.length === 0) || disabled"
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
  max-width: 760px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.file-list {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  width: 100%;
  flex-wrap: wrap;
}
.file-item {
  background: var(--surface-2);
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}
.remove-file { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 14px; line-height: 1; }
.remove-file:hover { color: var(--red); }

.attach-btn {
  background: none; border: none; cursor: pointer; padding: 12px; color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
}
.attach-btn:hover { color: var(--orange); }

.promptbar {
  width: 100%;
  display: flex;
  gap: 0;
  background: var(--promptbar-bg);
  border: 1px solid var(--promptbar-border);
  border-radius: 12px;
  padding: 5px 5px 5px 16px;
  transition:
    border-color 0.25s ease,
    background 0.25s ease;
}

.promptbar:focus-within {
  border-color: var(--promptbar-focus-border);
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
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
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
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--promptbar-send-color);
  transition:
    background 0.25s,
    border-color 0.25s,
    color 0.25s;
  align-self: flex-end;
}

.promptbar-send svg { width: 15px; height: 15px; }

.promptbar-send.active {
  background: var(--orange);
  border-color: var(--orange);
  color: #ffffff;
}

.promptbar-send.active:hover {
  background: #b05a20;
  border-color: #b05a20;
}

.promptbar-send:disabled:not(.active) { cursor: default; }

.promptbar-hint {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--promptbar-hint-color);
  letter-spacing: 0.02em;
  transition: color 0.25s ease;
}
</style>
