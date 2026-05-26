import { ref, reactive, computed, watch } from 'vue'
import { ollamaHost, systemPrompts } from './useSettings.js'
import { useNotes } from './useNotes.js'

const { notes } = useNotes()

function getRelevantContext(content) {
  if (!content || !notes.value.length) return ''
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const relevant = notes.value.filter(n => {
    const text = (n.title + ' ' + n.content).toLowerCase()
    return words.some(w => text.includes(w))
  }).slice(0, 3)

  if (!relevant.length) return ''
  
  return `\n\nRelevant information from the user's personal knowledge base:\n${relevant.map(n => `--- NOTE: ${n.title} ---\n${n.content}`).join('\n\n')}`
}

// ── Shared model state ─────────────────────────────────────────────────────
const importedModels = ref([])
const activeModel = ref(null)
const modelsLoading = ref(false)
const modelsError = ref('')

function loadActiveModel() {
  try {
    const raw = localStorage.getItem('sagittarius:activeModel')
    if (raw) activeModel.value = raw
  } catch {}
}

function saveActiveModel() {
  if (activeModel.value) {
    localStorage.setItem('sagittarius:activeModel', activeModel.value)
  } else {
    localStorage.removeItem('sagittarius:activeModel')
  }
}

watch(activeModel, saveActiveModel)

async function fetchModels() {
  modelsLoading.value = true
  modelsError.value = ''
  try {
    const res = await fetch(`${ollamaHost.value}/api/tags`)
    if (!res.ok) throw new Error(`Ollama responded with ${res.status}`)
    const data = await res.json()
    importedModels.value = (data.models ?? []).map((m) => m.name)
    loadActiveModel()
    if (!activeModel.value || !importedModels.value.includes(activeModel.value)) {
      activeModel.value = importedModels.value[0] ?? null
    }
  } catch (err) {
    modelsError.value =
      err.message.includes('fetch') || err.message.includes('NetworkError')
        ? 'Cannot reach Ollama on localhost:11434'
        : err.message
    importedModels.value = []
  } finally {
    modelsLoading.value = false
  }
}

fetchModels()

// ── Per-tab state factory ──────────────────────────────────────────────────
function createTabState(tab) {
  const storageKey = `sagittarius:chats:${tab}`
  const chats = ref([])
  const activeChatId = ref(null)
  const activeAbortController = ref(null)

  function load() {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        chats.value = parsed.chats ?? []
        activeChatId.value = parsed.activeChatId ?? null
      }
    } catch {}
  }

  function save() {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ chats: chats.value, activeChatId: activeChatId.value }),
    )
  }

  load()
  watch([chats, activeChatId], save, { deep: true })

  return { chats, activeChatId, activeAbortController }
}

const tabStates = {
  code: createTabState('code'),
  mail: createTabState('mail'),
  calendar: createTabState('calendar'),
  notes: createTabState('notes'),
}

let nextId = Date.now()

// ── Ollama streaming chat ──────────────────────────────────────────────────
async function streamChat(model, messages, systemPrompt, signal, onChunk, onDone, onError) {
  try {
    const apiMessages = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ]
      : messages.map((m) => ({ role: m.role, content: m.content }))

    const res = await fetch(`${ollamaHost.value}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: apiMessages, stream: true }),
      signal,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Ollama error ${res.status}: ${text}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line)
          if (obj.message?.content) onChunk(obj.message.content)
          if (obj.done) onDone()
        } catch {}
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // User stopped — keep whatever partial content was received
      onDone()
      return
    }
    onError(
      err.message.includes('fetch') || err.message.includes('NetworkError')
        ? 'Cannot reach Ollama. Is it still running?'
        : err.message,
    )
  }
}

// ── Public composable ──────────────────────────────────────────────────────
export function useChat(tab) {
  const { chats, activeChatId, activeAbortController } = tabStates[tab]
  const systemPrompt = computed(() => systemPrompts.value[tab] ?? null)

  const activeChat = computed(
    () => chats.value.find((c) => c.id === activeChatId.value) ?? null,
  )

  function importModel() {
    return fetchModels()
  }

  function selectModel(name) {
    activeModel.value = name
  }

  function selectChat(id) {
    activeChatId.value = id
  }

  function newChat() {
    activeChatId.value = null
  }

  function deleteChat(id) {
    const idx = chats.value.findIndex((c) => c.id === id)
    if (idx !== -1) chats.value.splice(idx, 1)
    if (activeChatId.value === id) {
      activeChatId.value = chats.value[0]?.id ?? null
    }
  }

  function renameChat(id, newTitle) {
    const chat = chats.value.find((c) => c.id === id)
    if (chat && newTitle.trim()) chat.title = newTitle.trim()
  }

  function stopGeneration() {
    if (activeAbortController.value) {
      activeAbortController.value.abort()
      activeAbortController.value = null
    }
  }

  async function sendMessage(chat, content, skipUserMessage = false) {
    if (!skipUserMessage) {
      chat.messages.push({ role: 'user', content: content.trim(), ts: Date.now() })
    }

    const assistantMsg = reactive({
      role: 'assistant',
      content: '',
      ts: Date.now(),
      streaming: true,
      error: null,
    })
    chat.messages.push(assistantMsg)

    const controller = new AbortController()
    activeAbortController.value = controller

    const context = getRelevantContext(content)
    const effectiveSystemPrompt = systemPrompt.value ? (systemPrompt.value + context) : (context || null)

    await streamChat(
      chat.model,
      chat.messages.slice(0, -1),
      effectiveSystemPrompt,
      controller.signal,
      (token) => {
        assistantMsg.content += token
      },
      () => {
        assistantMsg.streaming = false
        activeAbortController.value = null
      },
      (err) => {
        assistantMsg.content = ''
        assistantMsg.error = err
        assistantMsg.streaming = false
        activeAbortController.value = null
      },
    )
  }

  async function regenerateLastMessage() {
    const chat = activeChat.value
    if (!chat || chat.messages.length < 2) return
    const msgs = chat.messages
    // Remove the last assistant message
    if (msgs[msgs.length - 1]?.role === 'assistant') {
      msgs.splice(msgs.length - 1, 1)
    }
    // Find the last user message for context — it stays in the array
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    // Re-stream without re-appending the user message
    await sendMessage(chat, lastUser.content, true)
  }

  async function submitPrompt(content) {
    let chat = activeChat.value
    if (!chat) {
      const id = nextId++
      chat = {
        id,
        title: content.trim().slice(0, 40) || 'New chat',
        model: activeModel.value,
        messages: [],
      }
      chats.value.unshift(chat)
      activeChatId.value = id
    }
    await sendMessage(chat, content)
  }

  return {
    chats,
    activeChat,
    activeChatId,
    importedModels,
    activeModel,
    modelsLoading,
    modelsError,
    refreshModels: fetchModels,
    importModel,
    selectModel,
    selectChat,
    newChat,
    deleteChat,
    renameChat,
    stopGeneration,
    regenerateLastMessage,
    submitPrompt,
  }
}
