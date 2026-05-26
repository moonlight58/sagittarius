<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCalendar } from '../composables/useCalendar.js'
import { useChat } from '../composables/useChat.js'

import { useNotes } from '../composables/useNotes.js'

const router = useRouter()
const visible = ref(false)
const calendar = useCalendar()
const notesStore = useNotes()
const codeChat = useChat('code')
const mailChat = useChat('mail')

onMounted(() => {
  setTimeout(() => {
    visible.value = true
  }, 100)
})

const todayEvents = computed(() => calendar.eventsForDate(calendar.todayKey()).slice(0, 4))
const pendingGoals = computed(() => calendar.goals.value.slice(0, 4))
const recentNotes = computed(() => notesStore.notes.value.slice(0, 3))
const recentChats = computed(() => {
  const all = [
    ...codeChat.chats.value.map((c) => ({ ...c, tab: 'code', accent: '#f0760c' })),
    ...mailChat.chats.value.map((c) => ({ ...c, tab: 'mail', accent: '#c84a30' })),
  ]
  return all.sort((a, b) => b.id - a.id).slice(0, 3)
})

const ollamaStatus = computed(() => ({
  active: !!codeChat.activeModel.value,
  model: codeChat.activeModel.value,
  loading: codeChat.modelsLoading.value,
  error: codeChat.modelsError.value,
}))

function formatDate(ts) {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const features = [
  {
    id: 'code',
    path: '/code',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    label: 'Code',
    tagline: 'Write. Refactor. Ship.',
    description:
      'AI-powered coding assistant. Explain code, generate functions, debug errors — all in a persistent session.',
    accent: '#f0760c',
  },
  {
    id: 'mail',
    path: '/mail',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    label: 'Mail',
    tagline: 'Draft. Polish. Send.',
    description:
      'Compose professional emails in seconds. Rewrite, summarise, or translate — your model, your voice.',
    accent: '#c84a30',
  },
  {
    id: 'calendar',
    path: '/calendar',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    label: 'Calendar',
    tagline: 'Plan. Schedule. Focus.',
    description:
      'intelligent scheduling that understands context and helps you protect deep-work time.',
    accent: '#5aa7ff',
  },
  {
    id: 'notes',
    path: '/notes',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    label: 'Notes',
    tagline: 'Store. Search. Connect.',
    description:
      'Your personal knowledge base. Store snippets, thoughts, and documents for the AI to reference.',
    accent: '#58c98b',
  },
]
</script>

<template>
  <div class="home" :class="{ visible }">
    <!-- Ambient background layers -->
    <div class="bg-glow bg-glow-1" />
    <div class="bg-glow bg-glow-2" />
    <div class="bg-noise" />

    <!-- Hero -->
    <section class="hero">
      <div class="hero-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" class="hero-svg">
          <g
            transform="matrix(0.058485, 0, 0, -0.058485, 97.288071, 391.514526)"
            fill="currentColor"
            stroke="none"
          >
            <path
              d="M201 4968 c-19 -7 -54 -30 -77 -52 -118 -114 -92 -323 85 -676 500 -994 2257 -2848 3571 -3767 392 -274 754 -453 952 -469 130 -11 223 30 271 120 19 35 22 56 22 146 -1 92 -5 117 -34 200 -80 234 -241 515 -508 887 l-125 175 50 112 c133 298 191 596 179 925 -11 318 -87 603 -232 878 -321 607 -907 1005 -1595 1084 -146 16 -433 6 -576 -20 -185 -34 -345 -85 -516 -164 l-87 -39 -108 79 c-369 272 -712 473 -942 550 -86 29 -124 37 -201 39 -55 2 -110 -2 -129 -8z m2654 -986 c459 -104 834 -392 1041 -798 57 -114 111 -266 140 -404 27 -122 27 -458 0 -580 -43 -200 -116 -381 -216 -535 -99 -153 -172 -205 -286 -205 -91 0 -136 21 -279 130 -608 462 -1192 1049 -1643 1650 -88 118 -102 151 -102 237 0 142 78 231 310 356 145 78 299 130 480 163 115 20 439 12 555 -14z"
            />
            <path
              d="M 774.177 2970.64 C 751.924 2950.76 731.45 2892.86 702.965 2770.99 C 664.687 2609.37 652.225 2379.45 671.808 2204.86 C 708.305 1873.84 858.743 1528.11 1078.62 1267.1 C 1148.95 1184.12 1309.17 1034.6 1392.85 974.114 C 1755.14 711.357 2210.9 587.762 2656.88 630.113 C 2812.66 645.67 3025.41 691.478 3069.92 720 C 3092.17 734.693 3105.52 775.316 3096.62 802.974 C 3091.28 818.531 2818 1046.7 2760.14 1083 C 2739.67 1096.83 2728.99 1096.83 2650.65 1087.32 C 2534.04 1073.5 2321.29 1082.14 2210.9 1105.49 C 2085.4 1131.4 2023.09 1153.02 1894.9 1214.37 C 1626.07 1342.29 1418.66 1538.49 1286.02 1787.4 C 1183.66 1982.74 1144.49 2127.07 1136.48 2339.7 C 1132.91 2430.45 1135.59 2507.37 1142.71 2557.49 C 1152.5 2627.51 1151.61 2637.87 1138.26 2658.62 C 1116.89 2689.74 921.946 2917.91 883.669 2956.82 C 844.501 2995.7 808.894 3000.03 774.177 2970.64 Z"
              transform="matrix(0.999997, -0.002458, 0.002458, 0.999997, -0.000001, 0)"
            />
          </g>
        </svg>
      </div>

      <div class="hero-text">
        <div class="hero-eyebrow">Local AI Workspace</div>
        <h1 class="hero-title">
          <span class="title-word">Sagit</span><span class="title-accent">tarius</span>
        </h1>
        <p class="hero-subtitle">
          A private, model-agnostic assistant for the work you do every day.<br />
          Run your own models. Own your context.
        </p>

        <!-- System Status Bar -->
        <div class="status-bar" :class="{ error: ollamaStatus.error }">
          <div
            class="status-indicator"
            :class="{ active: ollamaStatus.active, loading: ollamaStatus.loading }"
          />
          <span class="status-text">
            {{
              ollamaStatus.loading
                ? 'Connecting to Ollama...'
                : ollamaStatus.error
                  ? ollamaStatus.error
                  : ollamaStatus.active
                    ? `Ollama Active: ${ollamaStatus.model}`
                    : 'Ollama Offline'
            }}
          </span>
          <button
            v-if="ollamaStatus.error || !ollamaStatus.active"
            class="refresh-btn"
            @click="codeChat.refreshModels"
          >
            Retry
          </button>
        </div>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="quick-actions-row">
      <button class="action-card" @click="router.push('/code').then(() => codeChat.newChat())">
        <span class="action-icon">󰌢</span>
        <span class="action-label">New Code Chat</span>
      </button>
      <button class="action-card" @click="router.push('/mail').then(() => mailChat.newChat())">
        <span class="action-icon"></span>
        <span class="action-label">Draft Email</span>
      </button>
      <button class="action-card" @click="router.push('/notes').then(() => notesStore.addNote())">
        <span class="action-icon">󰎝</span>
        <span class="action-label">New Note</span>
      </button>
      <button class="action-card" @click="router.push('/calendar')">
        <span class="action-icon">󰃭</span>
        <span class="action-label">Add Event</span>
      </button>
    </section>

    <!-- Dashboard Widgets -->
    <section class="dashboard-grid">
      <!-- Today's Agenda -->
      <div class="widget">
        <header class="widget-header">
          <span class="widget-label">Today's Agenda</span>
          <router-link to="/calendar" class="widget-link">View All</router-link>
        </header>
        <div class="widget-content">
          <div v-for="event in todayEvents" :key="event.id" class="event-item" :class="event.type">
            <span class="event-time">{{ event.start }}</span>
            <span class="event-title">{{ event.title }}</span>
          </div>
          <p v-if="!todayEvents.length" class="empty-hint">No events scheduled for today.</p>
        </div>
      </div>

      <!-- Current Goals -->
      <div class="widget">
        <header class="widget-header">
          <span class="widget-label">Focus Goals</span>
          <router-link to="/calendar" class="widget-link">Manage</router-link>
        </header>
        <div class="widget-content">
          <div v-for="goal in pendingGoals" :key="goal.id" class="goal-item">
            <span class="goal-priority" :class="goal.priority" />
            <span class="goal-title">{{ goal.title }}</span>
            <span class="goal-meta">{{ goal.minutes }}m</span>
          </div>
          <p v-if="!pendingGoals.length" class="empty-hint">No active goals. Time to plan?</p>
        </div>
      </div>

      <!-- Knowledge Base -->
      <div class="widget">
        <header class="widget-header">
          <span class="widget-label">Knowledge Base</span>
          <router-link to="/notes" class="widget-link">Notes</router-link>
        </header>
        <div class="widget-content">
          <div
            v-for="note in recentNotes"
            :key="note.id"
            class="note-widget-item"
            @click="router.push('/notes')"
          >
            <span class="note-widget-title">{{ note.title }}</span>
            <span class="note-widget-date">{{ formatDate(note.ts) }}</span>
          </div>
          <p v-if="!recentNotes.length" class="empty-hint">No notes saved yet.</p>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="widget">
        <header class="widget-header">
          <span class="widget-label">Recent Sessions</span>
        </header>
        <div class="widget-content">
          <div
            v-for="chat in recentChats"
            :key="chat.id"
            class="activity-item"
            @click="router.push(`/${chat.tab}`)"
          >
            <span class="activity-accent" :style="{ background: chat.accent }" />
            <div class="activity-body">
              <span class="activity-title">{{ chat.title }}</span>
              <span class="activity-meta">{{ chat.tab }} session</span>
            </div>
          </div>
          <p v-if="!recentChats.length" class="empty-hint">No recent conversations.</p>
        </div>
      </div>
    </section>

    <div class="hero-divider">
      <span class="divider-line" />
      <span class="divider-label">Workspaces</span>
      <span class="divider-line" />
    </div>

    <!-- Feature cards -->
    <section class="features">
      <div
        v-for="(f, i) in features"
        :key="f.id"
        class="feature-card"
        :class="{ soon: f.soon }"
        :style="{ '--accent': f.accent, '--delay': i * 80 + 'ms' }"
        @click="!f.soon && router.push(f.path)"
      >
        <div class="card-corner card-corner-tl" />
        <div class="card-corner card-corner-br" />

        <div class="card-icon-wrap">
          <span class="card-icon" v-html="f.icon" />
        </div>

        <div class="card-body">
          <div class="card-label">{{ f.label }}</div>
          <div class="card-tagline">{{ f.tagline }}</div>
          <p class="card-desc">{{ f.description }}</p>
        </div>

        <div class="card-footer">
          <span v-if="f.soon" class="card-soon">Coming soon</span>
          <span v-else class="card-cta">
            Open
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>

        <div class="card-glow" />
      </div>
    </section>

    <!-- Footer hint -->
    <footer class="home-footer">
      <span class="footer-tag"
        >Powered by Ollama &nbsp;·&nbsp; Running locally &nbsp;·&nbsp; Zero telemetry</span
      >
    </footer>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px 48px;
  overflow-y: auto;
  overflow-x: hidden;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.home.visible {
  opacity: 1;
  transform: translateY(0);
}

.home::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    linear-gradient(120deg, rgba(242, 122, 26, 0.07), transparent 34%),
    linear-gradient(240deg, rgba(90, 167, 255, 0.055), transparent 38%);
}

/* ── Background ── */
.bg-glow {
  display: none;
}

.bg-glow-1 {
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(135, 4, 0, 0.18) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  animation: drift1 12s ease-in-out infinite alternate;
}

.bg-glow-2 {
  width: 500px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(80, 0, 1, 0.14) 0%, transparent 70%);
  bottom: 0;
  left: -80px;
  animation: drift2 15s ease-in-out infinite alternate;
}

@keyframes drift1 {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(-40px, 30px);
  }
}
@keyframes drift2 {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(30px, -20px);
  }
}

.bg-noise {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}

/* ── Hero ── */
.hero {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
  padding-bottom: 40px;
  width: 100%;
  max-width: 860px;
}

.hero-logo {
  margin-bottom: 24px;
}

.hero-svg {
  width: 70px;
  height: 70px;
  color: var(--orange);
  filter: drop-shadow(0 0 28px rgba(240, 118, 12, 0.45));
  animation: logo-pulse 5s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 20px rgba(240, 118, 12, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 40px rgba(240, 118, 12, 0.6));
  }
}

.hero-text {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.hero-eyebrow {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--orange);
  opacity: 0.7;
}

.hero-title {
  font-family: var(--font-serif), serif;
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  line-height: 1;
  margin: 0;
  letter-spacing: 0;
}

.title-word {
  color: var(--beige);
}

.title-accent {
  color: var(--orange);
  text-shadow: 0 0 60px rgba(240, 118, 12, 0.35);
}

.hero-subtitle {
  font-family: var(--font-sans), sans-serif;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-muted);
  max-width: 480px;
  margin: 0;
  text-align: center;
}

/* ── Quick Actions ── */
.quick-actions-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 860px;
  margin-bottom: 24px;
  z-index: 1;
}

@media (max-width: 600px) {
  .quick-actions-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px;
  background: var(--surface-1);
  border: 1px solid var(--assistant-bubble-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-card:hover {
  border-color: var(--orange);
  background: var(--sidebar-tab-hover-bg);
  transform: translateY(-2px);
}

.action-icon {
  font-family: var(--font-mono), monospace;
  color: var(--orange);
  font-size: 18px;
}

.action-label {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--beige);
}

/* ── Status Bar ── */
.status-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding: 6px 14px;
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
  border-radius: 99px;
  transition: all 0.3s ease;
}

.status-bar.error {
  border-color: var(--status-error-color);
  background: rgba(255, 131, 117, 0.05);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--model-dot-inactive);
}

.status-indicator.active {
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
}

.status-indicator.loading {
  background: var(--status-loading-color);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

.status-text {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--status-muted-color);
}

.refresh-btn {
  background: transparent;
  border: none;
  color: var(--orange);
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

/* ── Dashboard Grid ── */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 860px;
  margin-bottom: 40px;
  z-index: 1;
}

@media (max-width: 700px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.widget {
  background: var(--surface-1);
  border: 1px solid var(--assistant-bubble-border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 180px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-label {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--status-muted-color);
}

.widget-link {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--orange);
  text-decoration: none;
  opacity: 0.8;
}

.widget-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.widget-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Event items */
.event-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  background: var(--surface-2);
  border-radius: 6px;
  border-left: 3px solid var(--orange);
}

.event-item.focus {
  border-left-color: var(--accent-blue);
}
.event-item.goal {
  border-left-color: var(--accent-green);
}

.event-time {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.event-title {
  font-size: 12px;
  color: var(--beige);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Goal items */
.goal-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  background: var(--surface-2);
  border-radius: 6px;
}

.goal-priority {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.goal-priority.high {
  background: var(--status-error-color);
}
.goal-priority.medium {
  background: var(--orange);
}
.goal-priority.low {
  background: var(--status-muted-color);
}

.goal-title {
  flex: 1;
  font-size: 12px;
  color: var(--beige);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal-meta {
  font-family: var(--font-mono), monospace;
  font-size: 9px;
  color: var(--text-muted);
}

/* Note items */
.note-widget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--surface-2);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.note-widget-item:hover {
  background: var(--surface-3);
}

.note-widget-title {
  font-size: 12px;
  color: var(--beige);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.note-widget-date {
  font-family: var(--font-mono), monospace;
  font-size: 9px;
  color: var(--text-muted);
}

/* Activity items */
.activity-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 10px;
  background: var(--surface-2);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.activity-item:hover {
  background: var(--surface-3);
}

.activity-accent {
  width: 3px;
  height: 20px;
  border-radius: 2px;
}

.activity-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.activity-title {
  font-size: 12px;
  color: var(--beige);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-meta {
  font-family: var(--font-mono), monospace;
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  margin: 10px 0;
}

/* ── Hero Divider ── */
.hero-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  width: 100%;
  max-width: 520px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--sidebar-divider), transparent);
}

.divider-label {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--status-muted-color);
  white-space: nowrap;
}

/* ── Feature Cards ── */
.features {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 860px;
  margin-top: 24px;
}

@media (max-width: 680px) {
  .features {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--assistant-bubble-border);
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  transition:
    border-color 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
  animation: card-in 0.4s ease both;
  animation-delay: var(--delay);
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-card:not(.soon):hover {
  border-color: var(--accent);
  transform: translateY(-3px);
  box-shadow:
    0 14px 38px rgba(0, 0, 0, 0.22),
    0 0 0 1px var(--accent);
}

.feature-card:not(.soon):hover .card-glow {
  opacity: 1;
}

.feature-card:not(.soon):hover .card-cta {
  color: var(--beige);
  gap: 10px;
}

.feature-card.soon {
  opacity: 0.45;
  cursor: default;
}

/* Corner decorations */
.card-corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--sidebar-divider);
  border-style: solid;
}
.card-corner-tl {
  top: 8px;
  left: 8px;
  border-width: 1px 0 0 1px;
}
.card-corner-br {
  bottom: 8px;
  right: 8px;
  border-width: 0 1px 1px 0;
}

.feature-card:not(.soon):hover .card-corner {
  border-color: var(--accent);
  opacity: 0.6;
}

/* Card glow */
.card-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(var(--glow-rgb, 240, 118, 12), 0.06) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.feature-card[style*='#f0760c'] {
  --glow-rgb: 240, 118, 12;
}
.feature-card[style*='#c84a30'] {
  --glow-rgb: 200, 74, 48;
}
.feature-card[style*='#5aa7ff'] {
  --glow-rgb: 90, 167, 255;
}

/* Icon */
.card-icon-wrap {
  width: 38px;
  height: 38px;
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
  transition:
    background 0.25s,
    border-color 0.25s;
}

.feature-card:not(.soon):hover .card-icon-wrap {
  background: rgba(var(--glow-rgb, 242, 122, 26), 0.12);
  border-color: var(--accent);
}

.card-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

/* Body */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.card-label {
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--beige);
}

.card-tagline {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.08em;
}

.card-desc {
  font-family: var(--font-sans), sans-serif;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-muted);
  margin: 8px 0 0;
}

/* Footer */
.card-footer {
  padding-top: 12px;
  border-top: 1px solid var(--chat-input-border);
}

.card-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--status-muted-color);
  transition:
    color 0.25s,
    gap 0.25s;
}
.card-cta svg {
  width: 12px;
  height: 12px;
  transition: transform 0.25s;
}
.feature-card:not(.soon):hover .card-cta svg {
  transform: translateX(3px);
}

.card-soon {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--status-muted-color);
  background: var(--model-selector-bg);
  border: 1px solid var(--model-selector-border);
  padding: 3px 8px;
  border-radius: 999px;
  display: inline-block;
}

/* ── Footer ── */
.home-footer {
  position: relative;
  z-index: 1;
  margin-top: 48px;
}

.footer-tag {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--status-muted-color);
  text-transform: uppercase;
}
</style>
