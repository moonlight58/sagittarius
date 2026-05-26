<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import PromptBar from './PromptBar.vue'

const props = defineProps({
  chat: { type: Object, required: true },
})

const emit = defineEmits(['submit'])

const messagesRef = ref(null)

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

watch(
  () => props.chat?.messages?.length,
  () => scrollToBottom(),
)

watch(
  () => {
    const msgs = props.chat?.messages
    if (!msgs?.length) return ''
    const last = msgs[msgs.length - 1]
    return last?.streaming ? last.content : ''
  },
  () => scrollToBottom(),
)

async function scrollToBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const isStreaming = computed(() => {
  const msgs = props.chat?.messages
  return msgs?.length && msgs[msgs.length - 1]?.streaming
})
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
          <span v-if="msg.role === 'user'" class="message-content user-content">{{
            msg.content
          }}</span>

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

          <span class="message-time">{{ formatTime(msg.ts) }}</span>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="chat-input-area">
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

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-bottom: 1px solid var(--chat-header-border);
  background: var(--color-bg);
  flex-shrink: 0;
  transition: border-color 0.25s ease;
}

.chat-title {
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--beige);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
  transition: color 0.25s ease;
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
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
}

.streaming-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--sidebar-tab-color);
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
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--sidebar-border) transparent;
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb {
  background: var(--sidebar-border);
  border-radius: 2px;
}

.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }

.message-bubble {
  max-width: min(82%, 880px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.user .message-bubble { align-items: flex-end; }

/* User bubble */
.user-content {
  display: block;
  padding: 12px 16px;
  border-radius: 12px;
  border-bottom-right-radius: 4px;
  background: var(--user-bubble-bg);
  border: 1px solid var(--user-bubble-border);
  color: var(--user-bubble-color);
  font-family: var(--font-sans), sans-serif;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
}

/* Assistant bubble */
.assistant-content {
  position: relative;
  padding: 4px 0;
  background: transparent;
  color: var(--assistant-bubble-color);
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
  line-height: 1.75;
  word-break: break-word;
  transition: color 0.25s ease;
}

/* Streaming cursor */
.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 15px;
  background: var(--orange);
  margin-left: 2px;
  vertical-align: middle;
  border-radius: 1px;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Error */
.msg-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--status-error-color);
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  line-height: 1.5;
  background: rgba(176, 64, 48, 0.05);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(176, 64, 48, 0.1);
}
.msg-error svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }

/* Timestamp */
.message-time {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--status-muted-color);
  padding: 0 2px;
  opacity: 0.6;
}

/* Input area */
.chat-input-area {
  flex-shrink: 0;
  padding: 24px 28px 32px;
  background: var(--color-bg);
  display: flex;
  justify-content: center;
  transition: background 0.25s ease;
}
</style>

<!-- Markdown styles (unscoped) -->
<style>
.markdown-body {
  color: var(--markdown-color);
}

.markdown-body p { margin: 0 0 16px; }
.markdown-body p:last-child { margin-bottom: 0; }

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  font-family: var(--font-serif), serif;
  color: var(--markdown-h-color);
  margin: 24px 0 12px;
  line-height: 1.4;
}
.markdown-body h1 { font-size: 1.5em; }
.markdown-body h2 { font-size: 1.3em; }
.markdown-body h3 { font-size: 1.15em; }

.markdown-body strong { color: var(--markdown-h-color); font-weight: 700; }
.markdown-body em { color: var(--markdown-em-color); font-style: italic; }

.markdown-body ul,
.markdown-body ol { padding-left: 24px; margin: 8px 0 16px; }
.markdown-body li { margin: 6px 0; }

.markdown-body a {
  color: var(--markdown-link-color);
  text-decoration: none;
  border-bottom: 1px solid rgba(201, 106, 42, 0.2);
}
.markdown-body a:hover { border-color: var(--orange); }

.markdown-body blockquote {
  border-left: 3px solid var(--markdown-blockquote-border);
  margin: 16px 0;
  padding: 8px 18px;
  color: var(--markdown-blockquote-color);
  font-style: italic;
}

.markdown-body hr {
  border: none;
  border-top: 1px solid var(--markdown-hr-color);
  margin: 20px 0;
}

/* Inline code */
.markdown-body code:not(pre code) {
  font-family: var(--font-mono), monospace;
  font-size: 12.5px;
  background: var(--markdown-code-bg);
  border: 1px solid var(--markdown-code-border);
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--markdown-code-color);
}

/* Code blocks */
.markdown-body pre {
  background: var(--markdown-pre-bg);
  border: 1px solid var(--markdown-pre-border);
  border-radius: 8px;
  padding: 16px 18px;
  overflow-x: auto;
  margin: 16px 0;
  position: relative;
}

.markdown-body pre code {
  font-family: var(--font-mono), monospace;
  font-size: 13px;
  line-height: 1.65;
  color: var(--markdown-pre-color);
  background: transparent;
  border: none;
  padding: 0;
}

/* highlight.js tokens */
.markdown-body .hljs-keyword { color: #e05a3a; }
.markdown-body .hljs-string { color: #a8c070; }
.markdown-body .hljs-comment { color: #8a7060; font-style: italic; }
.markdown-body .hljs-number { color: #c8a050; }
.markdown-body .hljs-function { color: #d4a070; }
.markdown-body .hljs-title { color: #f0a060; }
.markdown-body .hljs-params { color: #c0a080; }
.markdown-body .hljs-built_in { color: #d08050; }
.markdown-body .hljs-type { color: #b07050; }
.markdown-body .hljs-attr { color: #c8a050; }
.markdown-body .hljs-variable { color: var(--markdown-pre-color); }
</style>
