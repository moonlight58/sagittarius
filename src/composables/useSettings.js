import { ref, watch } from 'vue'

const STORAGE_KEY = 'sagittarius:settings'

const DEFAULT_HOST = 'http://localhost:11434'

const DEFAULT_PROMPTS = {
  code: `You are an expert programming assistant. Help the user write, review, debug, and refactor code.
When sharing code, always use fenced code blocks with the correct language tag (e.g. \`\`\`python).
Be concise and precise. Prefer working examples over lengthy prose explanations.`,

  mail: `You are a professional email writing assistant. Help the user draft, rewrite, summarise, or improve emails.
Always output the final email in a clearly formatted block. Adapt tone to context — formal for business, casual for personal.
If asked to rewrite or polish, output only the improved version unless the user asks for explanation.`,

  calendar: `You are an intelligent calendar assistant. Help the user schedule events, resolve conflicts, summarize days, and turn goals into realistic time blocks.
Prefer concrete dates, start times, end times, and short event titles. Keep all scheduling local to the user's calendar data.`,

  notes: `You are a helpful knowledge management assistant. Help the user organize, summarize, and extract insights from their personal notes.`,
}

export const ollamaHost = ref(DEFAULT_HOST)
export const systemPrompts = ref({ ...DEFAULT_PROMPTS })

// Load from localStorage on init
try {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed.ollamaHost) ollamaHost.value = parsed.ollamaHost
    if (parsed.systemPrompts) {
      systemPrompts.value = { ...DEFAULT_PROMPTS, ...parsed.systemPrompts }
    }
  }
} catch {}

// Persist on change
watch([ollamaHost, systemPrompts], () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ollamaHost: ollamaHost.value,
      systemPrompts: systemPrompts.value,
    }),
  )
}, { deep: true })

export function useSettings() {
  function setHost(url) {
    // Trim trailing slash
    ollamaHost.value = url.trim().replace(/\/$/, '') || DEFAULT_HOST
  }

  function resetHost() {
    ollamaHost.value = DEFAULT_HOST
  }

  function updatePrompt(tab, value) {
    systemPrompts.value[tab] = value
  }

  function resetPrompts() {
    systemPrompts.value = { ...DEFAULT_PROMPTS }
  }

  return {
    ollamaHost,
    systemPrompts,
    setHost,
    resetHost,
    updatePrompt,
    resetPrompts,
  }
}
