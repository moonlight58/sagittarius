<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  activeTab: { type: String, default: 'code' },
})
const emit = defineEmits(['update:activeTab'])

const route = useRoute()
const collapsed = ref(false)

function setTab(id) {
  emit('update:activeTab', id)
}

const tabs = [
  {
    id: 'code',
    label: 'Code',
    path: '/code',
    icon: '',
  },
  {
    id: 'mail',
    label: 'Mail',
    path: '/mail',
    icon: '',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: '',
  },
]
</script>

<template>
  <aside :class="['sidebar', { collapsed }]">
    <!-- Logo -->
    <div class="sidebar-logo">
      <Transition name="label-fade">
        <span v-if="!collapsed" class="logo-name">Sagittarius</span>
      </Transition>
    </div>

    <!-- Tab Navigation -->
    <nav class="sidebar-nav">
      <template v-for="tab in tabs">
        <router-link
          v-if="tab.path"
          :key="tab.id"
          :to="tab.path"
          class="tab-btn"
          :class="{ active: route.path === tab.path }"
          @click="setTab(tab.id)"
          :title="collapsed ? tab.label : ''"
        >
          <span class="tab-icon" v-html="tab.icon" />
          <Transition name="label-fade">
            <span v-if="!collapsed" class="tab-label">{{ tab.label }}</span>
          </Transition>
          <span v-if="route.path === tab.path" class="active-pip" />
        </router-link>

        <button
          v-else
          :key="tab.id + '-btn'"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="setTab(tab.id)"
          :title="collapsed ? tab.label : ''"
        >
          <span class="tab-icon" v-html="tab.icon" />
          <Transition name="label-fade">
            <span v-if="!collapsed" class="tab-label">{{ tab.label }}</span>
          </Transition>
          <span v-if="activeTab === tab.id" class="active-pip" />
        </button>
      </template>
    </nav>

    <!-- Divider -->
    <div class="sidebar-divider" />

    <!-- Spacer -->
    <div class="sidebar-space" />

    <!-- Collapse toggle on edge -->
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
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 220px;
  min-height: 100vh;
  background-color: #110000;
  border-right: 1px solid #2e0000;
  padding: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
  font-family: var(--font-mono), sans-serif;
}

.sidebar.collapsed {
  width: 64px;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 18px;
  border-bottom: 1px solid #1f0000;
  overflow: hidden;
  min-height: 64px;
}

.logo-name {
  font-family: var(--font-serif), sans-serif;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.12em;
  color: #fbf5d7;
  white-space: nowrap;
}

/* Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
}

.tab-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  color: #7a3030;
  overflow: hidden;
  width: 100%;
  text-align: left;
  text-decoration: none;
}

.tab-btn:hover {
  background: rgba(135, 4, 0, 0.15);
  color: #fbf5d7;
}

.tab-btn.active {
  background: rgba(135, 4, 0, 0.25);
  color: #f0760c;
}

.tab-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.tab-label {
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.active-pip {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: #f0760c;
  border-radius: 2px 0 0 2px;
  box-shadow: 0 0 8px rgba(240, 118, 12, 0.6);
}

/* Divider */
.sidebar-divider {
  margin: 4px 16px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #2e0000, transparent);
}

/* Space */
.sidebar-space {
  flex: 1;
}

/* Collapse toggle */
.collapse-toggle {
  position: absolute;
  right: -13px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  background: #1f0000;
  border: 1px solid #3a0000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #7a3030;
  transition:
    color 0.15s,
    background 0.15s,
    box-shadow 0.15s;
  z-index: 10;
  padding: 0;
}

.collapse-toggle:hover {
  color: #f0760c;
  background: #2e0000;
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
    opacity 0.2s ease,
    transform 0.2s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
