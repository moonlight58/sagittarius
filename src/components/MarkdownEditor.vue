<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Start writing in Markdown...' },
})
const emit = defineEmits(['update:modelValue'])

const editorEl = ref(null)
let rawLines = ['']
let activeLineIdx = -1
let isComposing = false

// ── Rendering ────────────────────────────────────────────────────────────────

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderInline(text) {
  let s = esc(text)
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>')
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  return s
}

function renderLineMd(raw) {
  if (!raw.trim()) return ''
  const m6 = raw.match(/^#{6} (.*)$/); if (m6) return `<span class="mde-h mde-h6">${renderInline(m6[1])}</span>`
  const m5 = raw.match(/^#{5} (.*)$/); if (m5) return `<span class="mde-h mde-h5">${renderInline(m5[1])}</span>`
  const m4 = raw.match(/^#{4} (.*)$/); if (m4) return `<span class="mde-h mde-h4">${renderInline(m4[1])}</span>`
  const m3 = raw.match(/^#{3} (.*)$/); if (m3) return `<span class="mde-h mde-h3">${renderInline(m3[1])}</span>`
  const m2 = raw.match(/^#{2} (.*)$/); if (m2) return `<span class="mde-h mde-h2">${renderInline(m2[1])}</span>`
  const m1 = raw.match(/^# (.*)$/);   if (m1) return `<span class="mde-h mde-h1">${renderInline(m1[1])}</span>`
  const bq = raw.match(/^> ?(.*)$/);  if (bq) return `<span class="mde-blockquote">${renderInline(bq[1])}</span>`
  const ul = raw.match(/^[-*+] (.*)$/); if (ul) return `<span class="mde-li">• ${renderInline(ul[1])}</span>`
  const ol = raw.match(/^(\d+)\. (.*)$/); if (ol) return `<span class="mde-li">${ol[1]}. ${renderInline(ol[2])}</span>`
  if (/^([-*_] ?){3,}$/.test(raw.trim())) return `<span class="mde-hr"></span>`
  return renderInline(raw)
}

// Returns the length of the block-level prefix hidden in rendered view (e.g. "# " = 2)
function hiddenPrefixLen(raw) {
  if (/^#{6} /.test(raw)) return 7
  if (/^#{5} /.test(raw)) return 6
  if (/^#{4} /.test(raw)) return 5
  if (/^#{3} /.test(raw)) return 4
  if (/^#{2} /.test(raw)) return 3
  if (/^# /.test(raw)) return 2
  if (/^> /.test(raw)) return 2
  if (/^[-*+] /.test(raw)) return 2
  return 0
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

function buildDiv(text, active) {
  const div = document.createElement('div')
  if (active) {
    div.classList.add('mde-active')
    if (text === '') div.innerHTML = '<br>'
    else div.textContent = text
  } else {
    div.classList.add('mde-rendered')
    const html = renderLineMd(text)
    div.innerHTML = html === '' ? '<br>' : html
  }
  return div
}

function lineDivs() {
  return editorEl.value ? Array.from(editorEl.value.children) : []
}

// ── Caret helpers ────────────────────────────────────────────────────────────

function getCaretPos() {
  const sel = window.getSelection()
  if (!sel?.rangeCount || !editorEl.value) return null
  const range = sel.getRangeAt(0)
  const divs = lineDivs()

  // Cursor is in the editor div itself (between child divs)
  if (range.startContainer === editorEl.value) {
    return { line: Math.min(range.startOffset, divs.length - 1), col: 0 }
  }

  for (let i = 0; i < divs.length; i++) {
    if (divs[i] === range.startContainer || divs[i].contains(range.startContainer)) {
      const r = document.createRange()
      r.selectNodeContents(divs[i])
      r.setEnd(range.startContainer, range.startOffset)
      return { line: i, col: r.toString().length }
    }
  }
  return null
}

function setCaretPos(line, col) {
  const divs = lineDivs()
  if (line < 0 || line >= divs.length) return
  const lineEl = divs[line]

  // Empty line — place at the div itself
  if (!lineEl.textContent) {
    try {
      const range = document.createRange()
      range.setStart(lineEl, 0)
      range.collapse(true)
      window.getSelection().removeAllRanges()
      window.getSelection().addRange(range)
    } catch {}
    return
  }

  const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT)
  let off = 0, node
  while ((node = walker.nextNode())) {
    const len = node.textContent.length
    if (off + len >= col) {
      try {
        const range = document.createRange()
        range.setStart(node, col - off)
        range.collapse(true)
        window.getSelection().removeAllRanges()
        window.getSelection().addRange(range)
      } catch {}
      return
    }
    off += len
  }

  // col is past end — place at end of line
  try {
    const range = document.createRange()
    range.selectNodeContents(lineEl)
    range.collapse(false)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  } catch {}
}

// ── Core logic ───────────────────────────────────────────────────────────────

function fullRender() {
  if (!editorEl.value) return
  editorEl.value.innerHTML = ''
  const lines = rawLines.length ? rawLines : ['']
  lines.forEach((text, i) => editorEl.value.appendChild(buildDiv(text, i === activeLineIdx)))
}

function activateLine(newIdx) {
  if (newIdx === activeLineIdx) return
  let divs = lineDivs()

  if (activeLineIdx >= 0 && activeLineIdx < divs.length) {
    rawLines[activeLineIdx] = divs[activeLineIdx].textContent
    divs[activeLineIdx].replaceWith(buildDiv(rawLines[activeLineIdx], false))
  }

  activeLineIdx = newIdx
  divs = lineDivs()

  if (newIdx >= 0 && newIdx < divs.length) {
    divs[newIdx].replaceWith(buildDiv(rawLines[newIdx] ?? '', true))
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

function onInput() {
  if (isComposing) return
  const divs = lineDivs()

  // Sanity: if browser created/removed divs, resync everything
  if (divs.length !== rawLines.length) {
    rawLines = divs.map(d => d.textContent || '')
    emit('update:modelValue', rawLines.join('\n'))
    return
  }

  if (activeLineIdx >= 0 && activeLineIdx < divs.length) {
    rawLines[activeLineIdx] = divs[activeLineIdx].textContent || ''
  }
  emit('update:modelValue', rawLines.join('\n'))
}

function onSelectionChange() {
  if (!editorEl.value) return
  const sel = window.getSelection()
  if (!sel?.rangeCount) return
  if (!editorEl.value.contains(sel.anchorNode) && sel.anchorNode !== editorEl.value) return

  const pos = getCaretPos()
  if (!pos || pos.line === activeLineIdx) return

  const renderedCol = pos.col
  activateLine(pos.line)

  nextTick(() => {
    const raw = rawLines[pos.line] ?? ''
    setCaretPos(pos.line, Math.min(renderedCol + hiddenPrefixLen(raw), raw.length))
  })
}

function onBlur() {
  if (activeLineIdx < 0) return
  const divs = lineDivs()
  if (activeLineIdx < divs.length) {
    rawLines[activeLineIdx] = divs[activeLineIdx].textContent || ''
    divs[activeLineIdx].replaceWith(buildDiv(rawLines[activeLineIdx], false))
  }
  activeLineIdx = -1
}

function onKeydown(e) {
  if (isComposing) return
  if (e.key === 'Enter') {
    e.preventDefault()
    doEnter()
  } else if (e.key === 'Backspace') {
    const pos = getCaretPos()
    if (pos?.col === 0 && pos.line > 0) {
      e.preventDefault()
      doBackspaceAtStart(pos.line)
    }
  } else if (e.key === 'Delete') {
    const pos = getCaretPos()
    if (pos && pos.col === (rawLines[pos.line] ?? '').length && pos.line < rawLines.length - 1) {
      e.preventDefault()
      doDeleteAtEnd(pos.line)
    }
  } else if (e.key === 'Tab') {
    e.preventDefault()
    insertAt('  ')
  }
}

function doEnter() {
  const pos = getCaretPos()
  if (!pos) return

  const divs = lineDivs()
  if (pos.line < divs.length) rawLines[pos.line] = divs[pos.line].textContent || ''

  const curr = rawLines[pos.line] ?? ''
  const before = curr.slice(0, pos.col)
  const after = curr.slice(pos.col)

  rawLines[pos.line] = before
  rawLines.splice(pos.line + 1, 0, after)

  lineDivs()[pos.line].replaceWith(buildDiv(before, false))
  const newDiv = buildDiv(after, true)
  lineDivs()[pos.line].after(newDiv)
  activeLineIdx = pos.line + 1

  nextTick(() => setCaretPos(pos.line + 1, 0))
  emit('update:modelValue', rawLines.join('\n'))
}

function doBackspaceAtStart(lineIdx) {
  const prev = rawLines[lineIdx - 1] ?? ''
  const curr = rawLines[lineIdx] ?? ''
  const mergeCol = prev.length

  rawLines[lineIdx - 1] = prev + curr
  rawLines.splice(lineIdx, 1)

  const divs = lineDivs()
  divs[lineIdx].remove()
  lineDivs()[lineIdx - 1].replaceWith(buildDiv(rawLines[lineIdx - 1], true))
  activeLineIdx = lineIdx - 1

  nextTick(() => setCaretPos(lineIdx - 1, mergeCol))
  emit('update:modelValue', rawLines.join('\n'))
}

function doDeleteAtEnd(lineIdx) {
  const curr = rawLines[lineIdx] ?? ''
  const next = rawLines[lineIdx + 1] ?? ''

  rawLines[lineIdx] = curr + next
  rawLines.splice(lineIdx + 1, 1)

  const divs = lineDivs()
  divs[lineIdx + 1].remove()
  lineDivs()[lineIdx].replaceWith(buildDiv(rawLines[lineIdx], true))

  nextTick(() => setCaretPos(lineIdx, curr.length))
  emit('update:modelValue', rawLines.join('\n'))
}

function insertAt(text) {
  const pos = getCaretPos()
  if (!pos) return
  const curr = rawLines[pos.line] ?? ''
  rawLines[pos.line] = curr.slice(0, pos.col) + text + curr.slice(pos.col)
  lineDivs()[pos.line].textContent = rawLines[pos.line]
  nextTick(() => setCaretPos(pos.line, pos.col + text.length))
  emit('update:modelValue', rawLines.join('\n'))
}

function onPaste(e) {
  e.preventDefault()
  const text = e.clipboardData.getData('text/plain')
  const pasted = text.split('\n')
  const pos = getCaretPos()
  if (!pos) return

  const divs = lineDivs()
  if (pos.line < divs.length) rawLines[pos.line] = divs[pos.line].textContent || ''

  const curr = rawLines[pos.line] ?? ''
  const before = curr.slice(0, pos.col)
  const after = curr.slice(pos.col)

  const newLines = [...pasted]
  newLines[0] = before + newLines[0]
  newLines[newLines.length - 1] = newLines[newLines.length - 1] + after

  rawLines.splice(pos.line, 1, ...newLines)

  const newActive = pos.line + pasted.length - 1
  const newCol = newLines[newLines.length - 1].length - after.length

  activeLineIdx = -1
  fullRender()
  activeLineIdx = newActive
  lineDivs()[newActive]?.replaceWith(buildDiv(rawLines[newActive], true))

  nextTick(() => setCaretPos(newActive, newCol))
  emit('update:modelValue', rawLines.join('\n'))
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  rawLines = (props.modelValue || '').split('\n')
  if (!rawLines.length) rawLines = ['']
  fullRender()
  document.addEventListener('selectionchange', onSelectionChange)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
})

watch(
  () => props.modelValue,
  (newVal) => {
    if ((newVal ?? '') === rawLines.join('\n')) return
    rawLines = (newVal || '').split('\n')
    if (!rawLines.length) rawLines = ['']
    activeLineIdx = -1
    fullRender()
  },
)
</script>

<template>
  <div
    ref="editorEl"
    class="mde-editor"
    contenteditable="true"
    spellcheck="true"
    :data-placeholder="placeholder"
    @input="onInput"
    @keydown="onKeydown"
    @blur="onBlur"
    @paste="onPaste"
    @compositionstart="isComposing = true"
    @compositionend="isComposing = false"
  ></div>
</template>

<style scoped>
.mde-editor {
  width: 100%;
  height: 100%;
  outline: none;
  font-family: var(--font-sans), sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: var(--markdown-color);
  caret-color: var(--beige);
  word-wrap: break-word;
  overflow-wrap: break-word;
  position: relative;
}

.mde-editor:empty::before {
  content: attr(data-placeholder);
  color: var(--placeholder-color, #888);
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
}

/* Every line is a block */
.mde-editor :deep(> div) {
  min-height: 1.7em;
}

/* Active (raw) line */
.mde-editor :deep(> .mde-active) {
  white-space: pre-wrap;
}

/* Rendered heading base */
.mde-editor :deep(.mde-h) {
  font-family: var(--font-serif), serif;
  color: var(--markdown-h-color);
  line-height: 1.3;
  display: block;
}
.mde-editor :deep(.mde-h1) {
  font-size: 1.8em;
  font-weight: 800;
  border-bottom: 1px solid var(--markdown-hr-color);
  padding-bottom: 6px;
  margin: 4px 0 2px;
}
.mde-editor :deep(.mde-h2) {
  font-size: 1.5em;
  font-weight: 700;
  border-bottom: 1px solid var(--markdown-hr-color);
  padding-bottom: 4px;
  margin: 4px 0 2px;
}
.mde-editor :deep(.mde-h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 4px 0 2px;
}
.mde-editor :deep(.mde-h4) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 2px 0;
}
.mde-editor :deep(.mde-h5),
.mde-editor :deep(.mde-h6) {
  font-size: 1em;
  font-weight: 600;
  margin: 2px 0;
  opacity: 0.85;
}

/* Inline elements */
.mde-editor :deep(strong) { color: var(--markdown-h-color); font-weight: 700; }
.mde-editor :deep(em) { color: var(--markdown-em-color); font-style: italic; }
.mde-editor :deep(del) { opacity: 0.6; text-decoration: line-through; }
.mde-editor :deep(code) {
  font-family: var(--font-mono), monospace;
  font-size: 0.88em;
  background: var(--markdown-code-bg);
  border: 1px solid var(--markdown-code-border);
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--markdown-code-color);
}

/* Block elements */
.mde-editor :deep(.mde-blockquote) {
  display: block;
  border-left: 3px solid var(--markdown-blockquote-border);
  padding-left: 12px;
  color: var(--markdown-blockquote-color);
  font-style: italic;
}
.mde-editor :deep(.mde-li) {
  display: block;
  padding-left: 16px;
}
.mde-editor :deep(.mde-hr) {
  display: block;
  border-top: 2px solid var(--markdown-hr-color);
  margin: 4px 0;
}
</style>
