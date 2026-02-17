import { ref, computed } from 'vue'

// Shared models across all tabs
const importedModels = ref([])
const activeModel = ref(null)

// Per-tab isolated state
const tabStates = {
  code: {
    chats: ref([]),
    activeChatId: ref(null),
  },
  mail: {
    chats: ref([]),
    activeChatId: ref(null),
  },
}

let nextId = 1

export function useChat(tab) {
  const state = tabStates[tab]
  const { chats, activeChatId } = state

  const activeChat = computed(
    () => chats.value.find((c) => c.id === activeChatId.value) ?? null,
  )

  function importModel(name) {
    if (!importedModels.value.includes(name)) {
      importedModels.value.push(name)
      if (!activeModel.value) activeModel.value = name
    }
  }

  function selectModel(name) {
    activeModel.value = name
  }

  function selectChat(id) {
    activeChatId.value = id
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

    // Placeholder — real Ollama call comes later
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
      // Create new chat
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
    deleteChat,
    submitPrompt,
  }
}