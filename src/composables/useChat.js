import { ref, computed, watch } from 'vue'

// Shared models across tabs
const importedModels = ref([])
const activeModel = ref(null)

function loadModels() {
  try {
    const raw = localStorage.getItem('sagittarius:models')
    if (raw) {
      const parsed = JSON.parse(raw)
      importedModels.value = parsed.models ?? []
      activeModel.value = parsed.activeModel ?? null
    }
  } catch {}
}

function saveModels() {
  localStorage.setItem(
    'sagittarius:models',
    JSON.stringify({ models: importedModels.value, activeModel: activeModel.value }),
  )
}

loadModels()
watch([importedModels, activeModel], saveModels, { deep: true })

// Per-tab state factory
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

export function useChat(tab) {
  const { chats, activeChatId } = tabStates[tab]

  const activeChat = computed(
    () => chats.value.find((c) => c.id === activeChatId.value) ?? null,
  )

  function importModel(name) {
    if (!importedModels.value.includes(name)) {
      importedModels.value.push(name)
      if (!activeModel.value) activeModel.value = name
    }
    saveModels()
  }

  function selectModel(name) {
    activeModel.value = name
    saveModels()
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

  function sendMessage(content) {
    const chat = activeChat.value
    if (!chat || !content.trim()) return
    chat.messages.push({ role: 'user', content: content.trim(), ts: Date.now() })
    setTimeout(() => {
      chat.messages.push({
        role: 'assistant',
        content: `[${chat.model ?? 'no model'}] Response to: "${content.trim().slice(0, 60)}..."`,
        ts: Date.now(),
      })
    }, 600)
  }

  function submitPrompt(content) {
    if (!activeChat.value) {
      const id = nextId++
      const chat = {
        id,
        title: content.trim().slice(0, 40) || 'New chat',
        model: activeModel.value,
        messages: [],
      }
      chats.value.unshift(chat)
      activeChatId.value = id
      sendMessage(content)
    } else {
      sendMessage(content)
    }
  }

  return {
    chats,
    activeChat,
    activeChatId,
    importedModels,
    activeModel,
    importModel,
    selectModel,
    selectChat,
    newChat,
    deleteChat,
    submitPrompt,
  }
}