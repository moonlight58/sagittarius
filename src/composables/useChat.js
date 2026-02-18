import { ref, reactive, computed, watch } from 'vue'

const OLLAMA_HOST = 'http://localhost:11434'

// ── Shared model state ────────────────────────────────────────────────────
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
    const res = await fetch(`${OLLAMA_HOST}/api/tags`)
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

// ── Per-tab state factory ─────────────────────────────────────────────────
function createTabState(tab) {
  const storageKey = `sagittarius:chats:${tab}`
  const chats = ref([])
  const activeChatId = ref(null)

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

  return { chats, activeChatId }
}

const tabStates = {
  code: createTabState('code'),
  mail: createTabState('mail'),
}

let nextId = Date.now()

// ── Ollama streaming chat ─────────────────────────────────────────────────
async function streamChat(model, messages, onChunk, onDone, onError) {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
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
    onError(
      err.message.includes('fetch') || err.message.includes('NetworkError')
        ? 'Cannot reach Ollama. Is it still running?'
        : err.message,
    )
  }
}

// ── Public composable ─────────────────────────────────────────────────────
export function useChat(tab) {
  const { chats, activeChatId } = tabStates[tab]

  const activeChat = computed(() => chats.value.find((c) => c.id === activeChatId.value) ?? null)

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

  async function sendMessage(chat, content) {
    chat.messages.push({ role: 'user', content: content.trim(), ts: Date.now() })

    const assistantMsg = reactive({
      role: 'assistant',
      content: '',
      ts: Date.now(),
      streaming: true,
      error: null,
    })
    chat.messages.push(assistantMsg)

    await streamChat(
      chat.model,
      chat.messages.slice(0, -1),
      (token) => {
        assistantMsg.content += token
      },
      () => {
        assistantMsg.streaming = false
      },
      (err) => {
        assistantMsg.content = ''
        assistantMsg.error = err
        assistantMsg.streaming = false
      },
    )
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
    submitPrompt,
  }
}
