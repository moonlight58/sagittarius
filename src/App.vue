<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import CommandPalette from './components/CommandPalette.vue'
import { useChat } from './composables/useChat.js'

const route = useRoute()
const showPalette = ref(false)

function handleKeydown(e) {
  const isK = e.key.toLowerCase() === 'k'
  const isModifier = e.metaKey || e.ctrlKey

  if (isModifier && isK) {
    e.preventDefault()
    showPalette.value = !showPalette.value
    return
  }

  // Legacy quick new chat shortcut
  if (isModifier && e.key === 'n') {
    e.preventDefault()
    if (route.path === '/code') {
      useChat('code').newChat()
    } else if (route.path === '/mail') {
      useChat('mail').newChat()
    }
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="app-layout">
    <AppSidebar />
    <main class="app-main">
      <router-view />
    </main>

    <CommandPalette v-model="showPalette" />
  </div>
</template>

<style>
</style>