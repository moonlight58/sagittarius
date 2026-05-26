<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChat } from '../composables/useChat.js'
import { useTheme } from '../composables/useTheme.js'

const props = defineProps({
  activeTab: { type: String, default: 'code' },
})
const emit = defineEmits(['update:activeTab'])

const route = useRoute()
const collapsed = ref(false)
const { theme, toggle: toggleTheme } = useTheme()

const codeChat = useChat('code')
const mailChat = useChat('mail')

const currentTabChat = computed(() => {
  if (route.path === '/code') return codeChat
  if (route.path === '/mail') return mailChat
  return null
})

const currentChats = computed(() => currentTabChat.value?.chats.value ?? [])
const currentActiveChatId = computed(() => currentTabChat.value?.activeChatId.value ?? null)
const showHistory = computed(
  () => !collapsed.value && (route.path === '/code' || route.path === '/mail'),
)

function selectChat(id) {
  currentTabChat.value?.selectChat(id)
}

function newChat() {
  currentTabChat.value?.newChat()
}

function deleteChat(id) {
  currentTabChat.value?.deleteChat(id)
}

function setTab(id) {
  emit('update:activeTab', id)
}

const tabs = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'code', label: 'Code', path: '/code' },
  { id: 'mail', label: 'Mail', path: '/mail' },
  { id: 'calendar', label: 'Calendar', path: '/calendar' },
  { id: 'notes', label: 'Notes', path: '/notes' },
]

const tabIcons = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  notes: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
}
</script>

<template>
  <aside :class="['sidebar', { collapsed }]">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
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
      <Transition name="label-fade">
        <span v-if="!collapsed" class="logo-name">Sagittarius</span>
      </Transition>
    </div>

    <!-- Tab Navigation -->
    <nav class="sidebar-nav">
      <router-link
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.path"
        class="tab-btn"
        :class="{ active: route.path === tab.path }"
        @click="setTab(tab.id)"
        :title="collapsed ? tab.label : ''"
      >
        <span class="tab-icon" v-html="tabIcons[tab.id]" />
        <Transition name="label-fade">
          <span v-if="!collapsed" class="tab-label">{{ tab.label }}</span>
        </Transition>
        <span v-if="route.path === tab.path" class="active-pip" />
      </router-link>
    </nav>

    <!-- Divider -->
    <div class="sidebar-divider" />

    <!-- History section -->
    <Transition name="history-fade">
      <div v-if="showHistory" class="history-section">
        <!-- New chat button -->
        <button class="new-chat-btn" @click="newChat" :title="collapsed ? 'New chat' : ''">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <Transition name="label-fade">
            <span v-if="!collapsed">New chat</span>
          </Transition>
        </button>

        <!-- Chat list -->
        <div v-if="currentChats.length" class="chat-history">
          <div
            v-for="chat in currentChats"
            :key="chat.id"
            class="history-item"
            :class="{ active: chat.id === currentActiveChatId }"
            @click="selectChat(chat.id)"
          >
            <span class="history-title">{{ chat.title }}</span>
            <button class="history-delete" @click.stop="deleteChat(chat.id)" title="Delete">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Spacer -->
    <div class="sidebar-space" />

    <!-- Bottom controls -->
    <div class="sidebar-bottom">
      <!-- Theme toggle -->
      <button
        class="theme-toggle"
        @click="toggleTheme"
        :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'"
      >
        <!-- Sun icon (shown in dark mode → click to go light) -->
        <Transition name="icon-swap" mode="out-in">
          <svg
            v-if="theme === 'dark'"
            key="sun"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <!-- Moon icon (shown in light mode → click to go dark) -->
          <svg
            v-else
            key="moon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </Transition>
        <Transition name="label-fade">
          <span v-if="!collapsed" class="theme-label">
            {{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}
          </span>
        </Transition>
      </button>

      <!-- Collapse toggle -->
      <button
        class="collapse-toggle"
        @click="collapsed = !collapsed"
        :title="collapsed ? 'Expand' : 'Collapse'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 236px;
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 180px),
    var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  box-shadow: 10px 0 28px rgba(0, 0, 0, 0.18);
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.25s ease,
    border-color 0.25s ease;
  overflow: visible;
  font-family: var(--font-mono), sans-serif;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  border-bottom: 1px solid var(--sidebar-logo-border);
  overflow: hidden;
  min-height: 56px;
  flex-shrink: 0;
  transition: border-color 0.25s ease;
}

.logo-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--orange);
  filter: drop-shadow(0 0 5px rgba(240, 118, 12, 0.4));
}
.logo-icon svg {
  width: 100%;
  height: 100%;
}

.logo-name {
  font-family: var(--font-serif), sans-serif;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.08em;
  color: var(--beige);
  white-space: nowrap;
  transition: color 0.25s ease;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 10px;
  flex-shrink: 0;
}

.tab-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background 0.25s ease,
    color 0.25s ease;
  color: var(--sidebar-tab-color);
  overflow: hidden;
  width: 100%;
  text-align: left;
  text-decoration: none;
}

.tab-btn:hover {
  background: var(--sidebar-tab-hover-bg);
  color: var(--beige);
  border-color: var(--sidebar-logo-border);
}
.tab-btn.active {
  background: var(--sidebar-tab-active-bg);
  border-color: rgba(242, 122, 26, 0.28);
  color: var(--orange);
}

.tab-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tab-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.tab-label {
  font-family: var(--font-sans), sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.active-pip {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: var(--orange);
  border-radius: 999px;
  box-shadow: 0 0 10px rgba(242, 122, 26, 0.7);
}

.sidebar-divider {
  margin: 2px 14px 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--sidebar-divider), transparent);
  flex-shrink: 0;
  transition: background 0.25s ease;
}

/* History section */
.history-section {
  display: flex;
  flex-direction: column;
  padding: 8px 8px 4px;
  min-height: 0;
  overflow: hidden;
}

/* New chat button */
.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: var(--model-selector-bg);
  border: 1px solid var(--sidebar-new-chat-border);
  border-radius: 6px;
  color: var(--sidebar-new-chat-color);
  font-family: var(--font-sans), sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    border-color 0.25s,
    color 0.25s,
    background 0.25s;
  flex-shrink: 0;
  margin-bottom: 6px;
}

.new-chat-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.new-chat-btn:hover {
  border-color: var(--orange);
  color: var(--beige);
  background: var(--sidebar-tab-hover-bg);
}

/* Chat list */
.chat-history {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  max-height: 38vh;
  scrollbar-width: thin;
  scrollbar-color: var(--sidebar-border) transparent;
}

.chat-history::-webkit-scrollbar {
  width: 3px;
}
.chat-history::-webkit-scrollbar-thumb {
  background: var(--sidebar-border);
  border-radius: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 7px 7px 7px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background 0.25s ease,
    color 0.25s ease;
  color: var(--history-item-color);
  min-width: 0;
}

.history-item:hover {
  background: var(--history-item-hover-bg);
  color: var(--sidebar-tab-color);
  border-color: var(--sidebar-logo-border);
}
.history-item.active {
  background: var(--history-item-active-bg);
  border-color: rgba(242, 122, 26, 0.22);
  color: var(--beige);
}

.history-title {
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.history-delete {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--history-delete-color);
  border-radius: 3px;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.25s ease,
    color 0.25s ease,
    background 0.25s ease;
  padding: 0;
}

.history-item:hover .history-delete {
  opacity: 1;
}
.history-delete:hover {
  color: #e05040;
  background: rgba(200, 50, 30, 0.12);
}
.history-delete svg {
  width: 12px;
  height: 12px;
}

.sidebar-space {
  flex: 1;
}

/* Bottom controls row */
.sidebar-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px 14px;
  gap: 6px;
  border-top: 1px solid var(--sidebar-logo-border);
  transition: border-color 0.25s ease;
}

.collapsed .sidebar-bottom {
  flex-direction: column;
  justify-content: center;
}

/* Theme toggle */
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 7px 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--sidebar-tab-color);
  cursor: pointer;
  transition:
    background 0.25s ease,
    color 0.25s ease;
}

.collapsed .theme-toggle {
  flex: 0 0 auto;
  padding: 6px;
  justify-content: center;
}

.theme-toggle:hover {
  background: var(--sidebar-tab-hover-bg);
  color: var(--orange);
}

.theme-toggle svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.theme-label {
  font-family: var(--font-sans), sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Collapse toggle */
.collapse-toggle {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: var(--sidebar-collapse-bg);
  border: 1px solid var(--sidebar-collapse-border);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--sidebar-tab-color);
  transition:
    color 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
  padding: 0;
}

.collapse-toggle:hover {
  color: var(--orange);
  box-shadow: 0 0 10px rgba(240, 118, 12, 0.3);
}

.collapse-toggle svg {
  width: 14px;
  height: 14px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Transitions */
.label-fade-enter-active,
.label-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.history-fade-enter-active,
.history-fade-leave-active {
  transition: opacity 0.25s ease;
}
.history-fade-enter-from,
.history-fade-leave-to {
  opacity: 0;
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.icon-swap-enter-from {
  opacity: 0;
  transform: rotate(-30deg) scale(0.8);
}
.icon-swap-leave-to {
  opacity: 0;
  transform: rotate(30deg) scale(0.8);
}
</style>
