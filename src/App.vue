<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import { useChat } from './composables/useChat.js'

const route = useRoute()

function handleKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    // Determine active tab from current route
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
  </div>
</template>

<style>
</style>