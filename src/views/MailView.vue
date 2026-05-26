<script setup>
import { computed, reactive, ref, watch } from 'vue'
import ViewTopbar from '../components/ViewTopbar.vue'
import PromptBar from '../components/PromptBar.vue'
import ChatView from '../components/ChatView.vue'
import { useChat } from '../composables/useChat.js'

const {
  activeChat,
  activeModel,
  submitPrompt,
  stopGeneration,
  regenerateLastMessage,
} = useChat('mail')

const hasActiveChat = computed(() => !!activeChat.value)
const canSubmit = computed(() => !!activeModel.value)

// ── Drafting State ────────────────────────────────────────────────────────
const draft = reactive({
  recipient: '',
  subject: '',
  tone: 'professional',
  body: '',
})

const tones = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'urgent', label: 'Urgent' },
]

// Auto-extract draft content from assistant messages
watch(() => activeChat.value?.messages?.length, () => {
  const lastMsg = activeChat.value?.messages?.[activeChat.value.messages.length - 1]
  if (lastMsg?.role === 'assistant' && !lastMsg.streaming && lastMsg.content) {
    // Try to find content in the last message
    // A simple heuristic: if it looks like a full email, try to extract body
    // For now, we'll let the user click "Use this draft" or auto-sync the latest block
    const blocks = lastMsg.content.match(/([\s\S]*)/)
    if (blocks && blocks[0]) {
      // Basic cleanup of markdown fences if any
      draft.body = blocks[0].replace(/^```\w*\n|```$/g, '').trim()
    }
  }
})

async function applyMagicAction(action) {
  let prompt = ''
  switch (action) {
    case 'formalize': prompt = 'Formalize this draft and improve professional tone.'; break
    case 'shorten': prompt = 'Shorten this draft, keep it concise and direct.'; break
    case 'polish': prompt = 'Polish this draft, improve flow and grammar.'; break
    case 'reply': prompt = 'Draft a polite and helpful reply based on this context.'; break
  }
  
  const contextPrompt = `Draft context:
Recipient: ${draft.recipient}
Subject: ${draft.subject}
Tone: ${draft.tone}
Current Body:
${draft.body}

Instruction: ${prompt}`

  await submitPrompt(contextPrompt)
}

function exportMail() {
  const mailto = `mailto:${draft.recipient}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
  window.open(mailto, '_blank')
}

function copyBody() {
  navigator.clipboard.writeText(draft.body)
}
</script>

<template>
  <div class="view-root">
    <ViewTopbar tab="mail" />
    
    <div class="mail-workspace">
      <Transition name="view-switch" mode="out-in">
        <div v-if="!hasActiveChat" key="empty" class="empty-state">
          <div class="empty-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" class="logo-svg">
              <g transform="matrix(0.058485, 0, 0, -0.058485, 97.288071, 391.514526)" fill="currentColor" stroke="none">
                <path d="M201 4968 c-19 -7 -54 -30 -77 -52 -118 -114 -92 -323 85 -676 500 -994 2257 -2848 3571 -3767 392 -274 754 -453 952 -469 130 -11 223 30 271 120 19 35 22 56 22 146 -1 92 -5 117 -34 200 -80 234 -241 515 -508 887 l-125 175 50 112 c133 298 191 596 179 925 -11 318 -87 603 -232 878 -321 607 -907 1005 -1595 1084 -146 16 -433 6 -576 -20 -185 -34 -345 -85 -516 -164 l-87 -39 -108 79 c-369 272 -712 473 -942 550 -86 29 -124 37 -201 39 -55 2 -110 -2 -129 -8z m2654 -986 c459 -104 834 -392 1041 -798 57 -114 111 -266 140 -404 27 -122 27 -458 0 -580 -43 -200 -116 -381 -216 -535 -99 -153 -172 -205 -286 -205 -91 0 -136 21 -279 130 -608 462 -1192 1049 -1643 1650 -88 118 -102 151 -102 237 0 142 78 231 310 356 145 78 299 130 480 163 115 20 439 12 555 -14z"/>
                <path d="M 774.177 2970.64 C 751.924 2950.76 731.45 2892.86 702.965 2770.99 C 664.687 2609.37 652.225 2379.45 671.808 2204.86 C 708.305 1873.84 858.743 1528.11 1078.62 1267.1 C 1148.95 1184.12 1309.17 1034.6 1392.85 974.114 C 1755.14 711.357 2210.9 587.762 2656.88 630.113 C 2812.66 645.67 3025.41 691.478 3069.92 720 C 3092.17 734.693 3105.52 775.316 3096.62 802.974 C 3091.28 818.531 2818 1046.7 2760.14 1083 C 2739.67 1096.83 2728.99 1096.83 2650.65 1087.32 C 2534.04 1073.5 2321.29 1082.14 2210.9 1105.49 C 2085.4 1131.4 2023.09 1153.02 1894.9 1214.37 C 1626.07 1342.29 1418.66 1538.49 1286.02 1787.4 C 1183.66 1982.74 1144.49 2127.07 1136.48 2339.7 C 1132.91 2430.45 1135.59 2507.37 1142.71 2557.49 C 1152.5 2627.51 1151.61 2637.87 1138.26 2658.62 C 1116.89 2689.74 921.946 2917.91 883.669 2956.82 C 844.501 2995.7 808.894 3000.03 774.177 2970.64 Z" transform="matrix(0.999997, -0.002458, 0.002458, 0.999997, -0.000001, 0)"/>
              </g>
            </svg>
            <span v-if="!canSubmit" class="empty-hint">Import an Ollama model to start</span>
          </div>
          <PromptBar
            :disabled="!canSubmit"
            :placeholder="canSubmit ? 'Compose a new mail...' : 'No model selected'"
            @submit="submitPrompt"
          />
        </div>

        <div v-else key="chat-active" class="active-layout">
          <aside class="drafting-pane">
            <header class="pane-header">
              <span class="pane-label">Mail Draft</span>
              <div class="header-actions">
                <button class="icon-btn" @click="copyBody" title="Copy Body">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                <button class="primary-btn" @click="exportMail">Export to Mail</button>
              </div>
            </header>

            <div class="draft-fields">
              <div class="field-row">
                <label>To</label>
                <input v-model="draft.recipient" placeholder="recipient@example.com" />
              </div>
              <div class="field-row">
                <label>Subject</label>
                <input v-model="draft.subject" placeholder="Enter subject..." />
              </div>
              <div class="field-row">
                <label>Tone</label>
                <select v-model="draft.tone">
                  <option v-for="t in tones" :key="t.id" :value="t.id">{{ t.label }}</option>
                </select>
              </div>
            </div>

            <div class="magic-toolbar">
              <button @click="applyMagicAction('formalize')"> Formalize</button>
              <button @click="applyMagicAction('shorten')"> Shorten</button>
              <button @click="applyMagicAction('polish')">󰇈 Polish</button>
              <button @click="applyMagicAction('reply')">↩ Reply</button>
            </div>

            <div class="draft-editor">
              <textarea v-model="draft.body" placeholder="Write your mail here or ask the assistant..."></textarea>
            </div>
          </aside>

          <div class="chat-pane">
            <ChatView
              :chat="activeChat"
              @submit="submitPrompt"
              @stop="stopGeneration"
              @regenerate="regenerateLastMessage"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.view-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
  overflow: hidden;
}

.mail-workspace {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.active-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* Drafting Pane */
.drafting-pane {
  width: 520px;
  display: flex;
  flex-direction: column;
  background: var(--surface-1);
  border-right: 1px solid var(--topbar-border);
  flex-shrink: 0;
}

.pane-header {
  padding: 13px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--sidebar-border);
  background: var(--surface-2);
}

.pane-label {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--status-muted-color);
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.primary-btn {
  background: var(--orange);
  border: none;
  color: white;
  padding: 5px 12px;
  border-radius: 6px;
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.primary-btn:hover {
  opacity: 0.9;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--icon-btn-color);
  cursor: pointer;
  padding: 4px;
}

.icon-btn:hover {
  color: var(--orange);
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

.draft-fields {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid var(--sidebar-border);
}

.field-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 12px;
}

.field-row label {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--text-muted);
}

.field-row input, .field-row select {
  width: 100%;
  background: var(--modal-input-bg);
  border: 1px solid var(--modal-input-border);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
}

.field-row input:focus, .field-row select:focus {
  border-color: var(--orange);
  outline: none;
}

.magic-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--sidebar-border);
  overflow-x: auto;
}

.magic-toolbar button {
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
  color: var(--beige);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.magic-toolbar button:hover {
  border-color: var(--orange);
  background: var(--sidebar-tab-hover-bg);
}

.draft-editor {
  flex: 1;
  padding: 20px;
  background: var(--color-bg);
}

.draft-editor textarea {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

/* Chat Pane */
.chat-pane {
  flex: 1;
  min-width: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 10vh;
  gap: 32px;
}

.empty-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.logo-svg {
  width: 110px;
  height: 110px;
  color: #5a1a10;
  filter: drop-shadow(0 0 24px rgba(135, 4, 0, 0.25));
  animation: logo-pulse 4s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 24px rgba(135, 4, 0, 0.2)); }
  50% { opacity: 1; filter: drop-shadow(0 0 36px rgba(240, 118, 12, 0.25)); }
}

.empty-hint {
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  color: var(--orange);
  letter-spacing: 0.05em;
}

.view-switch-enter-active, .view-switch-leave-active { transition: opacity 0.2s ease; }
.view-switch-enter-from, .view-switch-leave-to { opacity: 0; }

@media (max-width: 1100px) {
  .drafting-pane {
    width: 400px;
  }
}

@media (max-width: 900px) {
  .drafting-pane {
    display: none;
  }
}
</style>
