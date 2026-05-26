<script setup>
import { computed, ref, watch } from 'vue'
import ViewTopbar from '../components/ViewTopbar.vue'
import PromptBar from '../components/PromptBar.vue'
import ChatView from '../components/ChatView.vue'
import { useChat } from '../composables/useChat.js'
import hljs from 'highlight.js'

const {
  activeChat,
  activeModel,
  submitPrompt,
  stopGeneration,
  regenerateLastMessage,
} = useChat('code')

const hasActiveChat = computed(() => !!activeChat.value)
const canSubmit = computed(() => !!activeModel.value)

// ── Artifact Extraction ──────────────────────────────────────────────────
const selectedArtifactIndex = ref(null)
const previewMode = ref(false)

const artifacts = computed(() => {
  if (!activeChat.value) return []
  const blocks = []
  activeChat.value.messages.forEach((msg, msgIdx) => {
    if (msg.role !== 'assistant') return
    
    // Regex to find fenced code blocks: ```lang\ncode\n```
    const regex = /```(\w+)?\n([\s\S]*?)```/g
    let match
    let blockIdx = 0
    while ((match = regex.exec(msg.content)) !== null) {
      blocks.push({
        id: `${msgIdx}-${blockIdx}`,
        lang: match[1] || 'text',
        code: match[2].trim(),
        title: extractTitle(match[2].trim()) || `Snippet ${blocks.length + 1}`,
        msgIdx,
      })
      blockIdx++
    }
  })
  return blocks
})

function extractTitle(code) {
  // Try to find a comment on the first line to use as title
  const firstLine = code.split('\n')[0].trim()
  const commentMatch = firstLine.match(/^(?:\/\/|#|--|\/\*)\s*(.*?)(\*\/)?$/)
  if (commentMatch && commentMatch[1]) return commentMatch[1].trim().slice(0, 30)
  return null
}

const activeArtifact = computed(() => {
  if (selectedArtifactIndex.value === null) return artifacts.value[artifacts.value.length - 1]
  return artifacts.value[selectedArtifactIndex.value] ?? artifacts.value[artifacts.value.length - 1]
})

function selectArtifact(index) {
  selectedArtifactIndex.value = index
  previewMode.value = false
}

const renderedCode = computed(() => {
  if (!activeArtifact.value) return ''
  const { code, lang } = activeArtifact.value
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang }).value
  }
  return hljs.highlightAuto(code).value
})

function copyCode() {
  if (!activeArtifact.value) return
  navigator.clipboard.writeText(activeArtifact.value.code)
}

const canPreview = computed(() => {
  if (!activeArtifact.value) return false
  const lang = activeArtifact.value.lang.toLowerCase()
  return ['html', 'javascript', 'js', 'css', 'svg'].includes(lang)
})

const previewUrl = computed(() => {
  if (!activeArtifact.value || !previewMode.value) return null
  const { code, lang } = activeArtifact.value
  let content = code
  
  if (['javascript', 'js'].includes(lang)) {
    content = `<html><body><script>${code}<\/script></body></html>`
  } else if (lang === 'css') {
    content = `<html><head><style>${code}</style></head><body><p>CSS Preview</p></body></html>`
  } else if (lang === 'svg') {
    content = `<html><body>${code}</body></html>`
  } else if (lang === 'html') {
    // If it's HTML, we use it as is
  }

  const blob = new Blob([content], { type: 'text/html' })
  return URL.createObjectURL(blob)
})

function handlePromptSubmit(payload) {
  submitPrompt(payload)
}
</script>

<template>
  <div class="view-root">
    <ViewTopbar tab="code" />
    
    <div class="code-workspace">
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
            :placeholder="canSubmit ? 'Start a new conversation...' : 'No model selected'"
            @submit="handlePromptSubmit"
          />
        </div>

        <div v-else key="chat-active" class="active-layout">
          <div class="chat-container">
            <ChatView
              :chat="activeChat"
              @submit="handlePromptSubmit"
              @stop="stopGeneration"
              @regenerate="regenerateLastMessage"
            />
          </div>

          <aside class="artifact-sidebar" v-if="artifacts.length">
            <header class="artifact-header">
              <span class="artifact-label">Artifacts</span>
              <span class="artifact-count">{{ artifacts.length }} found</span>
            </header>

            <div class="artifact-list">
              <button
                v-for="(art, i) in artifacts"
                :key="art.id"
                class="artifact-item"
                :class="{ active: activeArtifact?.id === art.id }"
                @click="selectArtifact(i)"
              >
                <span class="art-lang">{{ art.lang }}</span>
                <span class="art-title">{{ art.title }}</span>
              </button>
            </div>

            <div class="artifact-viewer" v-if="activeArtifact">
              <div class="viewer-head">
                <div class="viewer-tabs">
                  <button :class="{ active: !previewMode }" @click="previewMode = false">Code</button>
                  <button v-if="canPreview" :class="{ active: previewMode }" @click="previewMode = true">Preview</button>
                </div>
                <div class="viewer-actions">
                  <button class="copy-btn" @click="copyCode" title="Copy code">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
              </div>
              
              <div class="viewer-content">
                <div class="code-preview" v-if="!previewMode">
                  <pre><code class="hljs" v-html="renderedCode"></code></pre>
                </div>
                <div class="live-preview" v-else>
                  <iframe :src="previewUrl" frameborder="0"></iframe>
                </div>
              </div>
            </div>
          </aside>
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

.code-workspace {
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

.chat-container {
  flex: 1;
  min-width: 0;
  border-right: 1px solid var(--topbar-border);
}

.artifact-sidebar {
  width: 440px;
  display: flex;
  flex-direction: column;
  background: var(--surface-1);
  flex-shrink: 0;
}

.artifact-header {
  padding: 13px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--sidebar-border);
}

.artifact-label {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--status-muted-color);
}

.artifact-count {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
}

.artifact-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
  border-bottom: 1px solid var(--sidebar-border);
  scrollbar-width: thin;
}

.artifact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.artifact-item:hover {
  background: var(--sidebar-tab-hover-bg);
}

.artifact-item.active {
  background: var(--sidebar-tab-active-bg);
  border-color: rgba(242, 122, 26, 0.2);
}

.art-lang {
  font-family: var(--font-mono), monospace;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--markdown-code-bg);
  color: var(--orange);
  text-transform: uppercase;
}

.art-title {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--beige);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artifact-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.viewer-head {
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-2);
  height: 44px;
  border-bottom: 1px solid var(--sidebar-border);
}

.viewer-tabs {
  display: flex;
  height: 100%;
}

.viewer-tabs button {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  padding: 0 16px;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.viewer-tabs button.active {
  color: var(--orange);
  border-bottom-color: var(--orange);
}

.viewer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-btn {
  background: transparent;
  border: none;
  color: var(--icon-btn-color);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.copy-btn:hover {
  color: var(--orange);
}

.copy-btn svg {
  width: 14px;
  height: 14px;
}

.viewer-content {
  flex: 1;
  min-height: 0;
}

.code-preview {
  height: 100%;
  overflow: auto;
  padding: 20px;
  background: var(--markdown-pre-bg);
}

.code-preview pre {
  margin: 0;
}

.code-preview code {
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  line-height: 1.6;
}

.live-preview {
  height: 100%;
  background: white;
}

.live-preview iframe {
  width: 100%;
  height: 100%;
  background: white;
}

/* highlight.js tokens - reusing from ChatView but scoped here */
.hljs-keyword { color: #e05a3a; }
.hljs-string { color: #a8c070; }
.hljs-comment { color: #8a7060; font-style: italic; }
.hljs-number { color: #c8a050; }
.hljs-function { color: #d4a070; }
.hljs-title { color: #f0a060; }
.hljs-params { color: #c0a080; }
.hljs-built_in { color: #d08050; }
.hljs-type { color: #b07050; }
.hljs-attr { color: #c8a050; }

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

.view-switch-enter-active, .view-switch-leave-active { transition: opacity 0.25s ease; }
.view-switch-enter-from, .view-switch-leave-to { opacity: 0; }

@media (max-width: 1000px) {
  .artifact-sidebar {
    display: none;
  }
}
</style>
