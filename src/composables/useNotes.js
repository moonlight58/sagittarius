import { ref, watch, computed } from 'vue'

const STORAGE_KEY = 'sagittarius:notes'

const notes = ref([])
const activeNoteId = ref(null)

let nextId = Date.now()

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      notes.value = parsed.notes ?? []
      activeNoteId.value = parsed.activeNoteId ?? null
    }
  } catch {}
}

function save() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ notes: notes.value, activeNoteId: activeNoteId.value }),
  )
}

load()
watch([notes, activeNoteId], save, { deep: true })

export function useNotes() {
  const activeNote = computed(
    () => notes.value.find((n) => n.id === activeNoteId.value) ?? null,
  )

  function addNote(title = 'Untitled Note', content = '') {
    const id = nextId++
    const newNote = {
      id,
      title,
      content,
      ts: Date.now(),
    }
    notes.value.unshift(newNote)
    activeNoteId.value = id
    return newNote
  }

  function deleteNote(id) {
    const idx = notes.value.findIndex((n) => n.id === id)
    if (idx !== -1) {
      notes.value.splice(idx, 1)
      if (activeNoteId.value === id) {
        activeNoteId.value = notes.value[0]?.id ?? null
      }
    }
  }

  function selectNote(id) {
    activeNoteId.value = id
  }

  function updateNote(id, patch) {
    const note = notes.value.find((n) => n.id === id)
    if (note) {
      Object.assign(note, { ...patch, ts: Date.now() })
    }
  }

  const searchNotes = (query) => {
    if (!query.trim()) return notes.value
    const q = query.toLowerCase()
    return notes.value.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    )
  }

  return {
    notes,
    activeNote,
    activeNoteId,
    addNote,
    deleteNote,
    selectNote,
    updateNote,
    searchNotes,
  }
}
