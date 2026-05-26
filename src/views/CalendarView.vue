<script setup>
import { computed, reactive, ref, watch } from 'vue'
import ViewTopbar from '../components/ViewTopbar.vue'
import { useCalendar } from '../composables/useCalendar.js'
import { useChat } from '../composables/useChat.js'

const { activeModel } = useChat('calendar')
const calendar = useCalendar()

const selectedDate = ref(calendar.todayKey())
const viewMode = ref('week')
const assistantPrompt = ref('')
const assistantMessage = ref('')
const editingId = ref(null)

const eventForm = reactive({
  title: '',
  date: selectedDate.value,
  endDate: selectedDate.value,
  start: '09:00',
  end: '10:00',
  type: 'event',
  notes: '',
})

const goalForm = reactive({
  title: '',
  minutes: 60,
  priority: 'medium',
})

const typeLabels = {
  event: 'Event',
  focus: 'Focus',
  goal: 'Goal',
}

const selectedEvents = computed(() => calendar.eventsForDate(selectedDate.value))
const selectedConflicts = computed(() => calendar.findConflicts(selectedDate.value))
const suggestedSlots = computed(() => calendar.freeSlots(selectedDate.value, 45).slice(0, 5))
const daySummary = computed(() => calendar.summarizeDay(selectedDate.value))
const weekDays = computed(() => calendar.weekDates(selectedDate.value))
const monthDays = computed(() => calendar.monthDates(selectedDate.value))

watch(selectedDate, (date) => {
  if (!editingId.value) {
    eventForm.date = date
    eventForm.endDate = date
  }
})

function formatDay(dateKey, options = { weekday: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(`${dateKey}T12:00:00`))
}

function formatMonth(dateKey) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(`${dateKey}T12:00:00`),
  )
}

function eventTop(event) {
  return `${Math.max(0, (calendar.timeToMinutes(event.start) - 8 * 60) / 10)}px`
}

function eventHeight(event) {
  const minutes = Math.max(30, calendar.timeToMinutes(event.end) - calendar.timeToMinutes(event.start))
  return `${Math.max(34, minutes / 10)}px`
}

function eventDateLabel(event) {
  return event.endDate && event.endDate !== event.date
    ? `${formatDay(event.date, { month: 'short', day: 'numeric' })}-${formatDay(event.endDate, { month: 'short', day: 'numeric' })}`
    : formatDay(event.date, { month: 'short', day: 'numeric' })
}

function eventTimeLabel(event) {
  return `${event.start}-${event.end}`
}

function resetEventForm() {
  editingId.value = null
  Object.assign(eventForm, {
    title: '',
    date: selectedDate.value,
    endDate: selectedDate.value,
    start: '09:00',
    end: '10:00',
    type: 'event',
    notes: '',
  })
}

function submitEvent() {
  if (!eventForm.title.trim()) return
  if (!eventForm.endDate || eventForm.endDate < eventForm.date) {
    eventForm.endDate = eventForm.date
  }
  if (editingId.value) {
    calendar.updateEvent(editingId.value, eventForm)
  } else {
    calendar.addEvent(eventForm)
  }
  selectedDate.value = eventForm.date
  resetEventForm()
}

function editEvent(event) {
  editingId.value = event.id
  Object.assign(eventForm, { ...event, endDate: event.endDate || event.date })
}

function removeEvent(id) {
  calendar.deleteEvent(id)
  if (editingId.value === id) resetEventForm()
}

function removeEditingEvent() {
  if (!editingId.value) return
  removeEvent(editingId.value)
}

function submitGoal() {
  calendar.addGoal(goalForm.title, goalForm.minutes, goalForm.priority)
  Object.assign(goalForm, { title: '', minutes: 60, priority: 'medium' })
}

async function askAssistant() {
  if (!assistantPrompt.value.trim()) return
  const prompt = assistantPrompt.value
  assistantPrompt.value = ''
  assistantMessage.value = await calendar.runAssistant(prompt, selectedDate.value, activeModel.value)
}

function useSlot(slot) {
  Object.assign(eventForm, {
    date: selectedDate.value,
    endDate: selectedDate.value,
    start: slot.start,
    end: slot.end,
    type: 'focus',
  })
}
</script>

<template>
  <div class="calendar-root">
    <ViewTopbar tab="calendar" />

    <main class="calendar-workspace">
      <section class="planner-main">
        <header class="calendar-toolbar">
          <div>
            <p class="kicker">Calendar</p>
            <h1>{{ formatMonth(selectedDate) }}</h1>
          </div>
          <div class="toolbar-actions">
            <button class="nav-btn" title="Previous" @click="selectedDate = calendar.addDays(selectedDate, viewMode === 'month' ? -28 : -7)">‹</button>
            <button class="nav-btn today" @click="selectedDate = calendar.todayKey()">Today</button>
            <button class="nav-btn" title="Next" @click="selectedDate = calendar.addDays(selectedDate, viewMode === 'month' ? 28 : 7)">›</button>
            <div class="segmented" aria-label="Calendar view">
              <button :class="{ active: viewMode === 'month' }" @click="viewMode = 'month'">Month</button>
              <button :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'">Week</button>
              <button :class="{ active: viewMode === 'day' }" @click="viewMode = 'day'">Day</button>
            </div>
          </div>
        </header>

        <div class="summary-strip">
          <div>
            <span class="strip-label">Day brief</span>
            <p>{{ daySummary }}</p>
          </div>
          <button class="quiet-btn" @click="assistantPrompt = `Summarize ${selectedDate}`">Summarize</button>
        </div>

        <section v-if="viewMode === 'month'" class="month-grid">
          <div v-for="label in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="label" class="weekday">
            {{ label }}
          </div>
          <div
            v-for="day in monthDays"
            :key="day"
            class="month-cell"
            :class="{ selected: day === selectedDate, outside: day.slice(0, 7) !== selectedDate.slice(0, 7) }"
            role="button"
            tabindex="0"
            @click="selectedDate = day"
            @keydown.enter="selectedDate = day"
          >
            <span>{{ formatDay(day, { day: 'numeric' }) }}</span>
            <div class="month-events">
              <button
                v-for="event in calendar.eventsForDate(day).slice(0, 3)"
                :key="event.id"
                class="month-event"
                :class="event.type"
                @click.stop="editEvent(event)"
              >
                {{ event.start }} {{ event.title }}
              </button>
            </div>
          </div>
        </section>

        <section v-else-if="viewMode === 'week'" class="week-grid">
          <div
            v-for="day in weekDays"
            :key="day"
            class="week-day"
            :class="{ selected: day === selectedDate }"
            role="button"
            tabindex="0"
            @click="selectedDate = day"
            @keydown.enter="selectedDate = day"
          >
            <header>
              <span>{{ formatDay(day) }}</span>
              <strong>{{ calendar.eventsForDate(day).length }}</strong>
            </header>
            <div class="day-lane">
              <article
                v-for="event in calendar.eventsForDate(day)"
                :key="event.id"
                class="event-block"
                :class="event.type"
                :style="{ top: eventTop(event), height: eventHeight(event) }"
              >
                <button class="event-main" @click.stop="editEvent(event)">
                  <span>{{ eventTimeLabel(event) }}</span>
                  {{ event.title }}
                </button>
                <button class="event-remove" title="Delete event" @click.stop="removeEvent(event.id)">×</button>
              </article>
            </div>
          </div>
        </section>

        <section v-else class="day-view">
          <div class="day-heading">
            <h2>{{ formatDay(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' }) }}</h2>
            <span>{{ selectedEvents.length }} scheduled</span>
          </div>
          <div class="agenda">
            <article v-for="event in selectedEvents" :key="event.id" class="agenda-event" :class="event.type">
              <time>{{ eventTimeLabel(event) }}</time>
              <div>
                <h3>{{ event.title }}</h3>
                <p v-if="event.notes">{{ event.notes }}</p>
                <span>{{ typeLabels[event.type] }} · {{ eventDateLabel(event) }}</span>
              </div>
              <button class="icon-action" title="Edit" @click="editEvent(event)">✎</button>
              <button class="icon-action" title="Delete" @click="removeEvent(event.id)">×</button>
            </article>
            <p v-if="!selectedEvents.length" class="empty-copy">No events on this date.</p>
          </div>
        </section>
      </section>

      <aside class="planner-side">
        <section class="panel assistant-panel">
          <div class="panel-head">
            <h2>Assistant</h2>
            <span>{{ activeModel || 'local rules' }}</span>
          </div>
          <form class="assistant-form" @submit.prevent="askAssistant">
            <textarea
              v-model="assistantPrompt"
              rows="3"
              :placeholder="activeModel ? 'Ask to create, move, summarize, or plan...' : 'No model selected. Try: summarize, resolve conflicts, plan goals.'"
            />
            <button :disabled="calendar.assistantLoading.value">
              {{ calendar.assistantLoading.value ? 'Thinking...' : 'Ask' }}
            </button>
          </form>
          <p v-if="assistantMessage" class="assistant-message">{{ assistantMessage }}</p>
          <p v-if="calendar.assistantError.value" class="assistant-error">{{ calendar.assistantError.value }}</p>
          <div class="quick-actions">
            <button @click="calendar.resolveConflicts(selectedDate)">Resolve conflicts</button>
            <button @click="calendar.scheduleAllGoals(selectedDate)">Plan goals</button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>{{ editingId ? 'Edit Event' : 'New Event' }}</h2>
            <button v-if="editingId" class="text-btn" @click="resetEventForm">Cancel</button>
          </div>
          <form class="stack-form" @submit.prevent="submitEvent">
            <input v-model="eventForm.title" placeholder="Title" />
            <div class="two-col">
              <input v-model="eventForm.date" type="date" />
              <input v-model="eventForm.endDate" type="date" />
            </div>
            <div class="two-col">
              <select v-model="eventForm.type">
                <option value="event">Event</option>
                <option value="focus">Focus</option>
                <option value="goal">Goal</option>
              </select>
            </div>
            <div class="two-col">
              <input v-model="eventForm.start" type="time" />
              <input v-model="eventForm.end" type="time" />
            </div>
            <textarea v-model="eventForm.notes" rows="2" placeholder="Notes" />
            <div class="form-actions">
              <button>{{ editingId ? 'Save event' : 'Add event' }}</button>
              <button v-if="editingId" type="button" class="danger-btn" @click="removeEditingEvent">
                Delete
              </button>
            </div>
          </form>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Suggested Blocks</h2>
            <span>{{ selectedConflicts.length }} conflicts</span>
          </div>
          <div class="slot-list">
            <button v-for="slot in suggestedSlots" :key="`${slot.start}-${slot.end}`" @click="useSlot(slot)">
              {{ slot.start }}-{{ slot.end }}
            </button>
            <p v-if="!suggestedSlots.length" class="empty-copy">No open block found.</p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Goals</h2>
            <span>{{ calendar.goals.value.length }}</span>
          </div>
          <form class="goal-form" @submit.prevent="submitGoal">
            <input v-model="goalForm.title" placeholder="Goal or task" />
            <input v-model.number="goalForm.minutes" type="number" min="15" step="15" />
            <select v-model="goalForm.priority">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button>Add</button>
          </form>
          <div class="goal-list">
            <article v-for="goal in calendar.goals.value" :key="goal.id">
              <div>
                <strong>{{ goal.title }}</strong>
                <span>{{ goal.minutes }}m · {{ goal.priority }}</span>
              </div>
              <button title="Schedule" @click="calendar.scheduleGoal(goal, selectedDate)">+</button>
              <button title="Delete" @click="calendar.deleteGoal(goal.id)">×</button>
            </article>
          </div>
        </section>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.calendar-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
  overflow: hidden;
}

.calendar-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  height: 100%;
  overflow: hidden;
  padding: 18px;
}

.planner-main,
.planner-side {
  min-height: 0;
  overflow: auto;
}

.planner-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.planner-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.calendar-toolbar,
.summary-strip,
.panel,
.month-cell,
.week-day,
.agenda-event {
  border: 1px solid var(--assistant-bubble-border);
  background: var(--assistant-bubble-bg);
}

.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
}

.kicker,
.strip-label,
.panel-head span {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--status-muted-color);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  font-family: var(--font-serif), serif;
  color: var(--beige);
  letter-spacing: -0.01em;
}

h1 {
  font-size: 32px;
  line-height: 1.1;
}

h2 {
  font-size: 20px;
  line-height: 1.2;
}

h3 {
  font-size: 16px;
  line-height: 1.3;
}

.toolbar-actions,
.segmented,
.quick-actions,
.two-col,
.goal-form,
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.nav-btn,
.segmented button,
.quiet-btn,
.text-btn,
.quick-actions button,
.slot-list button,
.icon-action,
.goal-list button,
form button {
  border: 1px solid var(--icon-btn-border);
  background: var(--surface-2);
  color: var(--beige);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-btn:hover,
.segmented button:hover,
.quiet-btn:hover,
.quick-actions button:hover,
.slot-list button:hover,
form button:hover {
  background: var(--surface-3);
  border-color: var(--orange);
}

.nav-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
}

.today {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
}

.segmented {
  padding: 3px;
  border: 1px solid var(--model-selector-border);
  border-radius: 10px;
  background: var(--color-bg);
}

.segmented button {
  height: 28px;
  padding: 0 10px;
  color: var(--status-muted-color);
  border-color: transparent;
  background: transparent;
}

.segmented button.active {
  color: var(--beige);
  background: var(--sidebar-tab-active-bg);
  border-color: var(--orange);
}

.summary-strip {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 14px 20px;
  border-radius: 12px;
}

.summary-strip p,
.assistant-message,
.assistant-error,
.empty-copy,
.agenda-event p {
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
  color: var(--assistant-bubble-color);
  line-height: 1.45;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.weekday {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--status-muted-color);
  padding: 0 6px;
}

.month-cell {
  min-height: 112px;
  border-radius: 8px;
  padding: 9px;
  color: var(--beige);
  text-align: left;
  overflow: hidden;
  cursor: pointer;
}

.month-cell.selected,
.week-day.selected {
  border-color: var(--orange);
}

.month-cell.outside {
  opacity: 0.48;
}

.month-events {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.month-event,
.event-block {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-left: 3px solid var(--orange);
  background: rgba(240, 118, 12, 0.1);
  color: var(--assistant-bubble-color);
  border-radius: 5px;
  padding: 4px 6px;
  font-size: 11px;
}

.month-event {
  width: 100%;
  border-top: 0;
  border-right: 0;
  border-bottom: 0;
  text-align: left;
}

.month-events .focus,
.event-block.focus,
.agenda-event.focus {
  border-left-color: #4ea3ff;
}

.month-events .goal,
.event-block.goal,
.agenda-event.goal {
  border-left-color: #54c47c;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(112px, 1fr));
  gap: 8px;
  min-height: 690px;
}

.week-day {
  position: relative;
  border-radius: 8px;
  padding: 10px;
  text-align: left;
  color: var(--beige);
}

.week-day header {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--status-muted-color);
}

.day-lane {
  position: relative;
  height: 620px;
  margin-top: 10px;
  background:
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 29px,
      var(--chat-input-border) 30px
    );
}

.event-block {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22px;
  gap: 4px;
  position: absolute;
  left: 0;
  right: 0;
  border-top: 0;
  border-right: 0;
  border-bottom: 0;
  text-align: left;
  white-space: normal;
  padding: 3px;
}

.event-main {
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0 3px;
  text-align: left;
}

.event-main span {
  display: block;
  color: var(--status-muted-color);
}

.event-remove {
  width: 20px;
  height: 20px;
  border: 0;
  background: transparent;
  color: var(--status-muted-color);
  border-radius: 4px;
  padding: 0;
}

.event-remove:hover,
.danger-btn:hover {
  color: var(--status-error-color);
  border-color: var(--status-error-color);
}

.day-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.day-heading span {
  color: var(--status-muted-color);
}

.agenda {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agenda-event {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 30px 30px;
  gap: 12px;
  align-items: center;
  border-left: 4px solid var(--orange);
  border-radius: 12px;
  padding: 16px;
}

.agenda-event time,
.agenda-event span {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--status-muted-color);
}

.panel {
  border-radius: 8px;
  padding: 12px;
}

.panel-head {
  justify-content: space-between;
  margin-bottom: 10px;
}

.stack-form,
.assistant-form,
.slot-list,
.goal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.danger-btn {
  color: var(--status-error-color);
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--modal-input-border);
  background: var(--modal-input-bg);
  color: var(--beige);
  border-radius: 8px;
  padding: 10px 12px;
  min-width: 0;
  transition: border-color 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--orange);
}

textarea {
  resize: vertical;
}

form button,
.assistant-form button {
  min-height: 34px;
  padding: 0 12px;
}

.quick-actions button,
.slot-list button {
  padding: 8px 10px;
  text-align: left;
}

.assistant-error {
  color: var(--status-error-color);
}

.goal-form {
  align-items: stretch;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 74px 92px 54px;
}

.goal-list article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px 28px;
  gap: 6px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--chat-input-border);
}

.goal-list strong,
.goal-list span {
  display: block;
}

.goal-list strong {
  color: var(--beige);
  font-size: 13px;
}

.goal-list span {
  color: var(--status-muted-color);
  font-size: 11px;
}

.icon-action,
.goal-list button {
  width: 28px;
  height: 28px;
}

@media (max-width: 1100px) {
  .calendar-workspace {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .planner-main,
  .planner-side {
    overflow: visible;
  }

  .week-grid {
    overflow-x: auto;
  }
}

@media (max-width: 720px) {
  .calendar-workspace {
    padding: 12px;
  }

  .calendar-toolbar,
  .summary-strip {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }

  .month-grid {
    gap: 5px;
  }

  .month-cell {
    min-height: 86px;
    padding: 7px;
  }

  .goal-form {
    grid-template-columns: 1fr;
  }
}
</style>
