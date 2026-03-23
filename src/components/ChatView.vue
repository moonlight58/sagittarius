<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import PromptBar from './PromptBar.vue'

const props = defineProps({
  chat: { type: Object, required: true },
})

const emit = defineEmits(['submit', 'stop', 'regenerate'])

const messagesRef = ref(null)

// ── Markdown setup ─────────────────────────────────────────────────────────
marked.setOptions({
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true,
})

function renderMarkdown(content) {
  if (!content) return ''
  return marked.parse(content)
}

// ── Copy buttons on code blocks ────────────────────────────────────────────
function attachCopyButtons(container) {
  if (!container) return
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.title = 'Copy code'
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? ''
      await navigator.clipboard.writeText(code)
      btn.classList.add('copied')
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
      }, 1800)
    })
    pre.appendChild(btn)
  })
}

// ── Scroll + copy button wiring ────────────────────────────────────────────
watch(
  () => props.chat?.messages?.length,
  () => {
    scrollToBottom()
    nextTick(() => attachCopyButtons(messagesRef.value))
  },
)

watch(
  () => {
    const msgs = props.chat?.messages
    if (!msgs?.length) return ''
    const last = msgs[msgs.length - 1]
    return last?.streaming ? last.content : ''
  },
  () => {
    scrollToBottom()
    nextTick(() => attachCopyButtons(messagesRef.value))
  },
)

async function scrollToBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// ── Computed ───────────────────────────────────────────────────────────────
const isStreaming = computed(() => {
  const msgs = props.chat?.messages
  return !!(msgs?.length && msgs[msgs.length - 1]?.streaming)
})

// Index of the last assistant message — used to show the re-roll button
const lastAssistantIdx = computed(() => {
  const msgs = props.chat?.messages ?? []
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'assistant') return i
  }
  return -1
})

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="chat-view">
    <!-- Header -->
    <div class="chat-header">
      <span class="chat-title">{{ chat.title }}</span>
      <div class="chat-header-right">
        <span v-if="isStreaming" class="streaming-badge">
          <span class="streaming-dot" />
          Generating
        </span>
        <span class="chat-model">{{ chat.model ?? 'no model' }}</span>
      </div>
    </div>

    <!-- Messages -->
    <div ref="messagesRef" class="chat-messages">
      <div v-for="(msg, i) in chat.messages" :key="i" class="message" :class="msg.role">
        <div class="message-bubble">
          <!-- User message -->
          <span v-if="msg.role === 'user'" class="message-content user-content">{{
            msg.content
          }}</span>

          <!-- Assistant message -->
          <div v-else class="message-content assistant-content">
            <div v-if="msg.error" class="msg-error">
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
              {{ msg.error }}
            </div>
            <div v-else class="markdown-body" v-html="renderMarkdown(msg.content)" />
            <span v-if="msg.streaming && !msg.error" class="cursor-blink" />
          </div>

          <!-- Message footer: timestamp + re-roll on last assistant msg -->
          <div
            class="message-footer"
            :class="{
              'has-reroll':
                msg.role === 'assistant' &&
                i === lastAssistantIdx &&
                !isStreaming &&
                !msg.error &&
                msg.content,
            }"
          >
            <span class="message-time">{{ formatTime(msg.ts) }}</span>
            <button
              v-if="
                msg.role === 'assistant' &&
                i === lastAssistantIdx &&
                !isStreaming &&
                !msg.error &&
                msg.content
              "
              class="reroll-btn"
              title="Regenerate response"
              @click="emit('regenerate')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="chat-input-area">
      <!-- Stop button — shown while streaming -->
      <Transition name="stop-fade">
        <button v-if="isStreaming" class="stop-btn" @click="emit('stop')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
          Stop generating
        </button>
      </Transition>

      <PromptBar
        :placeholder="`Message ${chat.model ?? 'assistant'}...`"
        :disabled="isStreaming"
        @submit="(val) => emit('submit', val)"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #2a0e0e;
  flex-shrink: 0;
}

.chat-title {
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--beige);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
}

.chat-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-model {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--orange);
  background: rgba(240, 118, 12, 0.08);
  border: 1px solid rgba(240, 118, 12, 0.2);
  border-radius: 20px;
  padding: 2px 10px;
  white-space: nowrap;
}

.streaming-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: #9a6040;
  letter-spacing: 0.08em;
}

.streaming-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--orange);
  animation: pulse-dot 1s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: #2a0a0a transparent;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: #2a0a0a;
  border-radius: 2px;
}

.message {
  display: flex;
}
.message.user {
  justify-content: flex-end;
}
.message.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 78%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.user .message-bubble {
  align-items: flex-end;
}

/* User bubble */
.user-content {
  display: block;
  padding: 10px 14px;
  border-radius: 10px;
  border-bottom-right-radius: 3px;
  background: #2a0808;
  border: 1px solid #4a1a1a;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Assistant bubble */
.assistant-content {
  position: relative;
  padding: 12px 16px;
  border-radius: 10px;
  border-bottom-left-radius: 3px;
  background: #160404;
  border: 1px solid #2e1010;
  color: #e0c8b0;
  font-family: var(--font-sans), sans-serif;
  font-size: 13.5px;
  line-height: 1.75;
  word-break: break-word;
}

/* Streaming cursor */
.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--orange);
  margin-left: 2px;
  vertical-align: middle;
  border-radius: 1px;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Error */
.msg-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #e07060;
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  line-height: 1.5;
}
.msg-error svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Message footer (time + re-roll) */
.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 18px;
}

.message.user .message-footer {
  justify-content: flex-end;
}

.message-time {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: #4a2020;
  padding: 0 2px;
}

/* Re-roll button */
.reroll-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: none;
  padding: 2px 6px;
  border-radius: 4px;
  color: #5a3020;
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s,
    color 0.15s,
    background 0.15s;
}
.reroll-btn svg {
  width: 11px;
  height: 11px;
}

.message-footer.has-reroll:hover .reroll-btn,
.message.assistant:hover .reroll-btn {
  opacity: 1;
}
.reroll-btn:hover {
  color: var(--orange);
  background: rgba(240, 118, 12, 0.08);
}

/* Input area */
.chat-input-area {
  flex-shrink: 0;
  padding: 12px 24px 20px;
  border-top: 1px solid #1e0808;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* Stop button */
.stop-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 18px;
  background: #1a0404;
  border: 1px solid #6a2010;
  border-radius: 20px;
  color: #e08060;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}
.stop-btn svg {
  width: 11px;
  height: 11px;
  color: #e05030;
  flex-shrink: 0;
}
.stop-btn:hover {
  background: #2a0808;
  border-color: #e05030;
  color: var(--beige);
  box-shadow: 0 0 14px rgba(200, 60, 30, 0.2);
}

.stop-fade-enter-active,
.stop-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.stop-fade-enter-from,
.stop-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>

<!-- Markdown styles (unscoped — applied inside v-html) -->
<style>
.markdown-body {
  color: #e0c8b0;
  font-family: var(--font-sans), sans-serif;
}

.markdown-body p {
  margin: 0 0 10px;
}
.markdown-body p:last-child {
  margin-bottom: 0;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  font-family: var(--font-serif), serif;
  color: var(--beige);
  margin: 18px 0 8px;
  line-height: 1.3;
}
.markdown-body h1 {
  font-size: 1.3em;
}
.markdown-body h2 {
  font-size: 1.15em;
}
.markdown-body h3 {
  font-size: 1.05em;
}

.markdown-body strong {
  color: var(--beige);
  font-weight: 700;
}
.markdown-body em {
  color: #c9a88a;
  font-style: italic;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
  margin: 6px 0 10px;
}
.markdown-body li {
  margin: 3px 0;
}

.markdown-body a {
  color: var(--orange);
  text-decoration: none;
  border-bottom: 1px solid rgba(240, 118, 12, 0.3);
}
.markdown-body a:hover {
  border-color: var(--orange);
}

.markdown-body blockquote {
  border-left: 3px solid #4a1a1a;
  margin: 10px 0;
  padding: 6px 14px;
  color: #9a7060;
  font-style: italic;
}

.markdown-body hr {
  border: none;
  border-top: 1px solid #2a1010;
  margin: 14px 0;
}

/* Inline code — mono font only here */
.markdown-body code:not(pre code) {
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  background: #2a0a0a;
  border: 1px solid #3a1a1a;
  border-radius: 4px;
  padding: 1px 6px;
  color: #f0a070;
}

/* Code blocks — mono font only here */
.markdown-body pre {
  background: #0e0000;
  border: 1px solid #2e1010;
  border-radius: 7px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 10px 0;
  position: relative;
}

.markdown-body pre code {
  font-family: var(--font-mono), monospace;
  font-size: 12.5px;
  line-height: 1.65;
  color: #d4b896;
  background: transparent;
  border: none;
  padding: 0;
}

/* Copy button */
.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e0808;
  border: 1px solid #3a1a1a;
  border-radius: 5px;
  color: #6a4030;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s,
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
  padding: 0;
}
.copy-btn svg {
  width: 12px;
  height: 12px;
}
.markdown-body pre:hover .copy-btn {
  opacity: 1;
}
.copy-btn:hover {
  color: var(--beige);
  border-color: #6a2a2a;
  background: #2a0a0a;
}
.copy-btn.copied {
  opacity: 1;
  color: #4aaa55;
  border-color: #2a5a30;
}

/* highlight.js tokens */
.markdown-body .hljs-keyword {
  color: #e05a3a;
}
.markdown-body .hljs-string {
  color: #a8c070;
}
.markdown-body .hljs-comment {
  color: #5a3a2a;
  font-style: italic;
}
.markdown-body .hljs-number {
  color: #c8a050;
}
.markdown-body .hljs-function {
  color: #d4a070;
}
.markdown-body .hljs-title {
  color: #f0a060;
}
.markdown-body .hljs-params {
  color: #c0a080;
}
.markdown-body .hljs-built_in {
  color: #d08050;
}
.markdown-body .hljs-type {
  color: #b07050;
}
.markdown-body .hljs-attr {
  color: #c8a050;
}
.markdown-body .hljs-variable {
  color: #d4b896;
}
</style>
