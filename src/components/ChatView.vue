<script setup>
import { ref, watch, nextTick } from 'vue'
import PromptBar from './PromptBar.vue'

const props = defineProps({
  chat: { type: Object, required: true },
})

const emit = defineEmits(['submit'])

const messagesRef = ref(null)

watch(
  () => props.chat?.messages?.length,
  async () => {
    await nextTick()
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  },
)

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="chat-view">
    <!-- Header -->
    <div class="chat-header">
      <span class="chat-title">{{ chat.title }}</span>
      <span class="chat-model">{{ chat.model ?? 'no model' }}</span>
    </div>

    <!-- Messages -->
    <div ref="messagesRef" class="chat-messages">
      <div
        v-for="(msg, i) in chat.messages"
        :key="i"
        class="message"
        :class="msg.role"
      >
        <div class="message-bubble">
          <span class="message-content">{{ msg.content }}</span>
          <span class="message-time">{{ formatTime(msg.ts) }}</span>
        </div>
      </div>
    </div>

    <!-- Prompt bar pinned to bottom -->
    <div class="chat-input-area">
      <PromptBar
        :placeholder="`Message ${chat.model ?? 'assistant'}...`"
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
  max-width: 60%;
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

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  max-width: 72%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.user .message-bubble {
  align-items: flex-end;
}

.message-content {
  display: block;
  padding: 10px 14px;
  border-radius: 10px;
  font-family: var(--font-mono), monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .message-content {
  background: #2a0808;
  border: 1px solid #4a1a1a;
  color: var(--beige);
  border-bottom-right-radius: 3px;
}

.message.assistant .message-content {
  background: #160404;
  border: 1px solid #2e1010;
  color: #e0c8b0;
  border-bottom-left-radius: 3px;
}

.message-time {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: #4a2020;
  padding: 0 2px;
}

/* Input area */
.chat-input-area {
  flex-shrink: 0;
  padding: 16px 24px 20px;
  border-top: 1px solid #1e0808;
  display: flex;
  justify-content: center;
}
</style>