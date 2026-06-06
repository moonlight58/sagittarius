<script setup>
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import ViewTopbar from '../components/ViewTopbar.vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import { useNotes } from '../composables/useNotes.js'

const {
  notes,
  activeNote,
  addNote,
  deleteNote,
  selectNote,
  updateNote,
  searchNotes,
} = useNotes()

const searchQuery = ref('')
const filteredNotes = computed(() => searchNotes(searchQuery.value))
const isPreview = ref(false)

// Configure marked with highlight.js
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

const renderedContent = computed(() => {
  if (!activeNote.value) return ''
  return marked.parse(activeNote.value.content || '')
})

function handleAddNote() {
  addNote('New Note', '')
  isPreview.value = false
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function exportToMarkdown() {
  if (!activeNote.value) return
  const content = `# ${activeNote.value.title}\n\n${activeNote.value.content}`
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${activeNote.value.title.replace(/\s+/g, '_').toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// Reset preview when switching notes
watch(activeNote, () => {
  // We might want to keep the current mode or reset it.
  // Let's keep it for now as it's more convenient if you're browsing previews.
})
</script>

<template>
  <div class="view-root">
    <ViewTopbar tab="notes" />

    <div class="notes-workspace">
      <!-- Sidebar: Note List -->
      <aside class="notes-sidebar">
        <header class="notes-header">
          <div class="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" placeholder="Search notes..." />
          </div>
          <button class="add-note-btn" @click="handleAddNote" title="New Note">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </header>

        <div class="notes-list">
          <div
            v-for="note in filteredNotes"
            :key="note.id"
            class="note-item"
            :class="{ active: activeNote?.id === note.id }"
            @click="selectNote(note.id)"
          >
            <div class="note-item-main">
              <span class="note-title">{{ note.title || 'Untitled Note' }}</span>
              <span class="note-preview">{{ note.content.slice(0, 60) || 'No content' }}</span>
            </div>
            <div class="note-item-meta">
              <span class="note-date">{{ formatDate(note.ts) }}</span>
              <button class="delete-btn" @click.stop="deleteNote(note.id)" title="Delete Note">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
          <p v-if="!filteredNotes.length" class="empty-hint">No notes found.</p>
        </div>
      </aside>

      <!-- Main: Note Editor -->
      <main class="note-editor">
        <template v-if="activeNote">
          <header class="editor-header">
            <div class="header-top">
              <input
                class="title-input"
                :value="activeNote.title"
                @input="(e) => updateNote(activeNote.id, { title: e.target.value })"
                placeholder="Note Title"
              />
              <div class="header-actions">
                <button
                  class="preview-toggle"
                  :class="{ active: isPreview }"
                  @click="isPreview = !isPreview"
                  title="Toggle Preview"
                >
                  <svg v-if="!isPreview" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  {{ isPreview ? 'Edit' : 'Preview' }}
                </button>
                <button class="export-btn" @click="exportToMarkdown" title="Export as Markdown">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export
                </button>
              </div>
            </div>
            <span class="last-saved">Last saved: {{ formatDate(activeNote.ts) }}</span>
          </header>
          <div class="editor-body" :class="{ 'preview-mode': isPreview }">
            <MarkdownEditor
              v-if="!isPreview"
              :model-value="activeNote.content"
              @update:model-value="(v) => updateNote(activeNote.id, { content: v })"
            />
            <div
              v-else
              class="markdown-body"
              v-html="renderedContent"
              @click="isPreview = false"
            ></div>
          </div>
        </template>
        <div v-else class="empty-editor">
          <div class="empty-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <p>Select a note or create a new one to start your knowledge base.</p>
          <button class="primary-btn" @click="handleAddNote">Create New Note</button>
        </div>
      </main>
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

.notes-workspace {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* Sidebar */
.notes-sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  background: var(--surface-1);
  border-right: 1px solid var(--sidebar-border);
  flex-shrink: 0;
}

.notes-header {
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid var(--sidebar-border);
}

.search-box {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--status-muted-color);
}

.search-box input {
  width: 100%;
  background: var(--modal-input-bg);
  border: 1px solid var(--modal-input-border);
  border-radius: 8px;
  padding: 8px 12px 8px 32px;
  color: var(--beige);
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
}

.search-box input:focus {
  border-color: var(--orange);
  outline: none;
}

.add-note-btn {
  width: 34px;
  height: 34px;
  background: var(--orange);
  border: none;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.add-note-btn svg {
  width: 18px;
  height: 18px;
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
}

.note-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-item:hover {
  background: var(--sidebar-tab-hover-bg);
}

.note-item.active {
  background: var(--sidebar-tab-active-bg);
  border-color: rgba(242, 122, 26, 0.2);
}

.note-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.note-title {
  font-family: var(--font-sans), sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--beige);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-preview {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-date {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--status-muted-color);
}

.delete-btn {
  background: transparent;
  border: none;
  color: var(--history-delete-color);
  opacity: 0;
  cursor: pointer;
  padding: 2px;
  transition: opacity 0.2s;
}

.note-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--status-error-color);
}

.delete-btn svg {
  width: 14px;
  height: 14px;
}

/* Editor */
.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  min-width: 0;
}

.editor-header {
  padding: 20px 40px;
  border-bottom: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.title-input {
  background: transparent;
  border: none;
  font-family: var(--font-serif), serif;
  font-size: 32px;
  font-weight: 800;
  color: var(--beige);
  outline: none;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.preview-toggle, .export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
  color: var(--beige);
  padding: 6px 12px;
  border-radius: 6px;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-toggle:hover, .export-btn:hover {
  border-color: var(--orange);
  background: var(--sidebar-tab-hover-bg);
}

.preview-toggle.active {
  background: var(--sidebar-tab-active-bg);
  border-color: var(--orange);
  color: var(--orange);
}

.preview-toggle svg, .export-btn svg {
  width: 14px;
  height: 14px;
}

.preview-toggle svg {
  color: inherit;
}

.export-btn svg {
  color: var(--orange);
}

.last-saved {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--status-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.editor-body {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.editor-body.preview-mode {
  cursor: pointer;
}

.content-textarea {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  font-family: var(--font-sans), sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: var(--markdown-color);
  resize: none;
  outline: none;
}

.empty-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  gap: 20px;
}

.empty-logo svg {
  width: 80px;
  height: 80px;
  color: var(--placeholder-color);
  opacity: 0.5;
}

.empty-editor p {
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
  color: var(--text-muted);
  max-width: 320px;
}

.primary-btn {
  background: var(--orange);
  border: none;
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.primary-btn:hover {
  transform: translateY(-2px);
}

.empty-hint {
  text-align: center;
  padding: 40px;
  color: var(--status-muted-color);
  font-style: italic;
  font-size: 13px;
}

@media (max-width: 768px) {
  .notes-sidebar {
    width: 100%;
  }
  .note-editor {
    display: none;
  }
}
</style>

<style>
/* Unscoped markdown styles */
.markdown-body {
  color: var(--markdown-color);
  font-family: var(--font-sans), sans-serif;
  font-size: 16px;
  line-height: 1.7;
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
  line-height: 1.3;
}
.markdown-body h1 { font-size: 1.8em; border-bottom: 1px solid var(--markdown-hr-color); padding-bottom: 8px; }
.markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid var(--markdown-hr-color); padding-bottom: 4px; }
.markdown-body h3 { font-size: 1.25em; }

.markdown-body strong { color: var(--markdown-h-color); font-weight: 700; }
.markdown-body em { color: var(--markdown-em-color); font-style: italic; }

.markdown-body ul,
.markdown-body ol { padding-left: 24px; margin: 8px 0 16px; }
.markdown-body li { margin: 4px 0; }

.markdown-body a {
  color: var(--markdown-link-color);
  text-decoration: none;
  border-bottom: 1px solid rgba(240, 118, 12, 0.3);
}
.markdown-body a:hover { border-color: var(--orange); }

.markdown-body blockquote {
  border-left: 4px solid var(--markdown-blockquote-border);
  margin: 16px 0;
  padding: 8px 20px;
  color: var(--markdown-blockquote-color);
  background: rgba(255, 255, 255, 0.02);
  font-style: italic;
}

.markdown-body hr {
  border: none;
  border-top: 2px solid var(--markdown-hr-color);
  margin: 24px 0;
}

/* Inline code */
.markdown-body code:not(pre code) {
  font-family: var(--font-mono), monospace;
  font-size: 0.9em;
  background: var(--markdown-code-bg);
  border: 1px solid var(--markdown-code-border);
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--markdown-code-color);
}

/* Code blocks */
.markdown-body pre {
  background: var(--markdown-pre-bg);
  border: 1px solid var(--markdown-pre-border);
  border-radius: 8px;
  padding: 16px 20px;
  overflow-x: auto;
  margin: 16px 0;
}

.markdown-body pre code {
  font-family: var(--font-mono), monospace;
  font-size: 14px;
  line-height: 1.6;
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
</style>
