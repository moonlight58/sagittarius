import { computed, ref, watch } from 'vue'
import { ollamaHost } from './useSettings.js'

const STORAGE_KEY = 'sagittarius:calendar'
const DAY_START = 8 * 60
const DAY_END = 18 * 60
const SLOT_MINUTES = 30

const events = ref([])
const goals = ref([])
const assistantLog = ref([])
const assistantLoading = ref(false)
const assistantError = ref('')

let nextId = Date.now()

function todayKey() {
  return toDateKey(new Date())
}

function toDateKey(date) {
  const copy = new Date(date)
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset())
  return copy.toISOString().slice(0, 10)
}

function fromDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`)
}

function addDays(dateKey, amount) {
  const date = fromDateKey(dateKey)
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

function monthKey(dateKey) {
  return dateKey.slice(0, 7)
}

function parseTime(value, fallback = '09:00') {
  const match = String(value ?? '').match(/^(\d{1,2}):?(\d{2})?/)
  if (!match) return fallback
  const hour = Math.min(23, Math.max(0, Number(match[1])))
  const minute = Math.min(59, Math.max(0, Number(match[2] ?? 0)))
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function timeToMinutes(time) {
  const [hours, minutes] = parseTime(time).split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes) {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, minutes))
  const hours = Math.floor(bounded / 60)
  const mins = bounded % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function eventDuration(event) {
  return Math.max(SLOT_MINUTES, timeToMinutes(event.end) - timeToMinutes(event.start))
}

function dateRangeContains(event, dateKey) {
  const endDate = event.endDate || event.date
  return event.date <= dateKey && dateKey <= endDate
}

function sortEvents(list) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if ((a.endDate || a.date) !== (b.endDate || b.date)) {
      return (a.endDate || a.date).localeCompare(b.endDate || b.date)
    }
    return timeToMinutes(a.start) - timeToMinutes(b.start)
  })
}

function normalizeEvent(input) {
  const date = input.date || todayKey()
  const endDate = input.endDate && input.endDate >= date ? input.endDate : date
  let start = parseTime(input.start, '09:00')
  let end = parseTime(input.end, minutesToTime(timeToMinutes(start) + 60))
  if (endDate === date && timeToMinutes(end) <= timeToMinutes(start)) {
    end = minutesToTime(timeToMinutes(start) + 60)
  }

  return {
    id: input.id || nextId++,
    title: String(input.title || 'Untitled event').trim(),
    date,
    endDate,
    start,
    end,
    type: input.type || 'event',
    notes: String(input.notes || '').trim(),
  }
}

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    events.value = sortEvents((parsed.events ?? []).map(normalizeEvent))
    goals.value = (parsed.goals ?? []).map((goal) => ({
      id: goal.id || nextId++,
      title: String(goal.title || '').trim(),
      minutes: Number(goal.minutes || 60),
      priority: goal.priority || 'medium',
    })).filter((goal) => goal.title)
    assistantLog.value = parsed.assistantLog ?? []
  } catch {}
}

function safeSave() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        events: events.value,
        goals: goals.value,
        assistantLog: assistantLog.value.slice(-20),
      }),
    )
  } catch {}
}

safeLoad()
watch([events, goals, assistantLog], safeSave, { deep: true })

function eventsForDate(dateKey) {
  return sortEvents(events.value.filter((event) => dateRangeContains(event, dateKey)))
}

function weekDates(anchorDateKey) {
  const date = fromDateKey(anchorDateKey)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const copy = new Date(date)
    copy.setDate(date.getDate() + index)
    return toDateKey(copy)
  })
}

function monthDates(anchorDateKey) {
  const date = fromDateKey(`${monthKey(anchorDateKey)}-01`)
  const firstDay = date.getDay()
  const startOffset = firstDay === 0 ? -6 : 1 - firstDay
  date.setDate(date.getDate() + startOffset)
  return Array.from({ length: 42 }, (_, index) => {
    const copy = new Date(date)
    copy.setDate(date.getDate() + index)
    return toDateKey(copy)
  })
}

function findConflicts(dateKey) {
  const dayEvents = eventsForDate(dateKey)
  const conflicts = []
  for (let i = 0; i < dayEvents.length; i += 1) {
    for (let j = i + 1; j < dayEvents.length; j += 1) {
      const first = dayEvents[i]
      const second = dayEvents[j]
      if (timeToMinutes(first.end) > timeToMinutes(second.start)) {
        conflicts.push([first, second])
      }
    }
  }
  return conflicts
}

function freeSlots(dateKey, minimumMinutes = SLOT_MINUTES) {
  const busy = eventsForDate(dateKey)
    .map((event) => ({
      start: Math.max(DAY_START, timeToMinutes(event.start)),
      end: Math.min(DAY_END, timeToMinutes(event.end)),
    }))
    .sort((a, b) => a.start - b.start)

  const slots = []
  let cursor = DAY_START
  for (const block of busy) {
    if (block.start - cursor >= minimumMinutes) {
      slots.push({ start: minutesToTime(cursor), end: minutesToTime(block.start) })
    }
    cursor = Math.max(cursor, block.end)
  }
  if (DAY_END - cursor >= minimumMinutes) {
    slots.push({ start: minutesToTime(cursor), end: minutesToTime(DAY_END) })
  }
  return slots
}

function summarizeDay(dateKey) {
  const dayEvents = eventsForDate(dateKey)
  const conflicts = findConflicts(dateKey)
  if (!dayEvents.length) return 'No events scheduled. The day is open for planning.'
  const focusMinutes = dayEvents
    .filter((event) => event.type === 'focus' || event.type === 'goal')
    .reduce((sum, event) => sum + eventDuration(event), 0)
  const first = dayEvents[0]
  const last = dayEvents[dayEvents.length - 1]
  const conflictText = conflicts.length ? `${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'} need attention.` : 'No conflicts.'
  return `${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'} from ${first.start} to ${last.end}. ${Math.round(focusMinutes / 60 * 10) / 10}h protected focus. ${conflictText}`
}

function addEvent(input) {
  const event = normalizeEvent(input)
  events.value = sortEvents([...events.value, event])
  return event
}

function updateEvent(id, patch) {
  const index = events.value.findIndex((event) => event.id === id)
  if (index === -1) return null
  const updated = normalizeEvent({ ...events.value[index], ...patch, id })
  events.value.splice(index, 1, updated)
  events.value = sortEvents(events.value)
  return updated
}

function deleteEvent(id) {
  events.value = events.value.filter((event) => event.id !== id)
}

function addGoal(title, minutes = 60, priority = 'medium') {
  const goal = { id: nextId++, title: title.trim(), minutes: Number(minutes), priority }
  if (goal.title) goals.value.push(goal)
  return goal
}

function deleteGoal(id) {
  goals.value = goals.value.filter((goal) => goal.id !== id)
}

function scheduleGoal(goal, dateKey) {
  const slots = freeSlots(dateKey, goal.minutes)
  if (!slots.length) return null
  const slot = slots[0]
  const event = addEvent({
    title: goal.title,
    date: dateKey,
    start: slot.start,
    end: minutesToTime(timeToMinutes(slot.start) + goal.minutes),
    type: 'goal',
    notes: `Planned from ${goal.priority} priority goal.`,
  })
  deleteGoal(goal.id)
  return event
}

function scheduleAllGoals(dateKey) {
  const scheduled = []
  const ordered = [...goals.value].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 }
    return rank[a.priority] - rank[b.priority]
  })
  for (const goal of ordered) {
    const event = scheduleGoal(goal, dateKey)
    if (event) scheduled.push(event)
  }
  return scheduled
}

function resolveConflicts(dateKey) {
  const dayEvents = eventsForDate(dateKey)
  let cursor = DAY_START
  const updates = []
  for (const event of dayEvents) {
    const start = timeToMinutes(event.start)
    const duration = eventDuration(event)
    const nextStart = Math.max(start, cursor)
    const nextEnd = nextStart + duration
    if (nextEnd > DAY_END) continue
    if (nextStart !== start) {
      updates.push(updateEvent(event.id, {
        start: minutesToTime(nextStart),
        end: minutesToTime(nextEnd),
      }))
    }
    cursor = nextEnd
  }
  return updates.filter(Boolean)
}

function fallbackAssistant(prompt, selectedDate) {
  const lower = prompt.toLowerCase()
  if (lower.includes('summar')) {
    return { message: summarizeDay(selectedDate), actions: [] }
  }
  if (lower.includes('conflict') || lower.includes('resolve')) {
    const moved = resolveConflicts(selectedDate)
    return { message: moved.length ? `Moved ${moved.length} event${moved.length === 1 ? '' : 's'} to remove overlaps.` : 'No conflicts found.', actions: [] }
  }
  if (lower.includes('plan') || lower.includes('goal')) {
    const scheduled = scheduleAllGoals(selectedDate)
    return { message: scheduled.length ? `Scheduled ${scheduled.length} goal block${scheduled.length === 1 ? '' : 's'}.` : 'No open slot was large enough for the current goals.', actions: [] }
  }
  return { message: 'I can summarize the day, resolve conflicts, or plan your goals into open blocks.', actions: [] }
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
  const body = fenced?.[1] || text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  return JSON.parse(body)
}

async function runAssistant(prompt, selectedDate, model) {
  assistantLoading.value = true
  assistantError.value = ''
  try {
    if (!model) {
      const result = fallbackAssistant(prompt, selectedDate)
      assistantLog.value.push({ role: 'assistant', content: result.message, ts: Date.now() })
      return result.message
    }

    const context = {
      selectedDate,
      events: eventsForDate(selectedDate),
      goals: goals.value,
      freeSlots: freeSlots(selectedDate),
      conflicts: findConflicts(selectedDate).map(([a, b]) => [a.title, b.title]),
    }
    const res = await fetch(`${ollamaHost.value}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: 'system',
            content: `You operate a local calendar. Return compact JSON only:
{"message":"short user-facing answer","actions":[{"type":"create_event","title":"...","date":"YYYY-MM-DD","endDate":"YYYY-MM-DD","start":"HH:MM","end":"HH:MM","eventType":"event|focus|goal","notes":"..."},{"type":"update_event","id":123,"date":"YYYY-MM-DD","endDate":"YYYY-MM-DD","start":"HH:MM","end":"HH:MM","title":"..."},{"type":"delete_event","id":123},{"type":"schedule_goals"},{"type":"resolve_conflicts"}]}
Use existing event ids for updates. Never invent unsupported action types.`,
          },
          { role: 'user', content: `Calendar context:\n${JSON.stringify(context)}\n\nRequest: ${prompt}` },
        ],
      }),
    })
    if (!res.ok) throw new Error(`Ollama responded with ${res.status}`)
    const data = await res.json()
    const parsed = extractJson(data.message?.content || '{}')

    for (const action of parsed.actions ?? []) {
      if (action.type === 'create_event') {
        addEvent({
          title: action.title,
          date: action.date || selectedDate,
          endDate: action.endDate || action.date || selectedDate,
          start: action.start,
          end: action.end,
          type: action.eventType || 'event',
          notes: action.notes,
        })
      } else if (action.type === 'update_event') {
        updateEvent(action.id, action)
      } else if (action.type === 'delete_event') {
        deleteEvent(action.id)
      } else if (action.type === 'schedule_goals') {
        scheduleAllGoals(selectedDate)
      } else if (action.type === 'resolve_conflicts') {
        resolveConflicts(selectedDate)
      }
    }

    const message = parsed.message || 'Calendar updated.'
    assistantLog.value.push({ role: 'user', content: prompt, ts: Date.now() })
    assistantLog.value.push({ role: 'assistant', content: message, ts: Date.now() })
    return message
  } catch (err) {
    assistantError.value =
      err.message.includes('fetch') || err.message.includes('NetworkError')
        ? 'Cannot reach Ollama. Local calendar actions still work.'
        : err.message
    const result = fallbackAssistant(prompt, selectedDate)
    assistantLog.value.push({ role: 'assistant', content: result.message, ts: Date.now() })
    return result.message
  } finally {
    assistantLoading.value = false
  }
}

export function useCalendar() {
  const sortedEvents = computed(() => sortEvents(events.value))

  return {
    events,
    sortedEvents,
    goals,
    assistantLog,
    assistantLoading,
    assistantError,
    addDays,
    addEvent,
    updateEvent,
    deleteEvent,
    addGoal,
    deleteGoal,
    scheduleGoal,
    scheduleAllGoals,
    eventsForDate,
    findConflicts,
    freeSlots,
    monthDates,
    summarizeDay,
    resolveConflicts,
    todayKey,
    weekDates,
    runAssistant,
    timeToMinutes,
  }
}
