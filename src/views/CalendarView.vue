<script setup>
import { ref, onMounted } from 'vue'

const visible = ref(false)
onMounted(() => setTimeout(() => { visible.value = true }, 80))
</script>

<template>
  <div class="calendar-view" :class="{ visible }">
    <!-- Ambient glows -->
    <div class="glow glow-1" />
    <div class="glow glow-2" />

    <div class="content">
      <!-- Icon -->
      <div class="icon-wrap">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="calendar-icon"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <!-- Calendar dots -->
          <circle cx="8" cy="15" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="16" cy="15" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <!-- Text -->
      <div class="text-block">
        <div class="eyebrow">Coming soon</div>
        <h2 class="title">Calendar</h2>
        <p class="tagline">Plan. Schedule. Focus.</p>
        <p class="description">
          Intelligent scheduling that understands context — protect your deep-work time,
          summarise upcoming events, and let the model handle the planning overhead.
        </p>
      </div>

      <!-- Feature pills -->
      <div class="features">
        <div class="feature-pill">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Smart scheduling
        </div>
        <div class="feature-pill">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          Event summaries
        </div>
        <div class="feature-pill">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          Focus blocks
        </div>
        <div class="feature-pill">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Natural language input
        </div>
      </div>

      <!-- Divider -->
      <div class="divider" />

      <p class="footnote">Local-first · No cloud sync · Powered by your Ollama model</p>
    </div>
  </div>
</template>

<style scoped>
.calendar-view {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  overflow: hidden;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.calendar-view.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Background glows */
.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(100px);
}

.glow-1 {
  width: 500px;
  height: 350px;
  background: radial-gradient(ellipse, rgba(135, 4, 0, 0.14) 0%, transparent 70%);
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
}

.glow-2 {
  width: 400px;
  height: 250px;
  background: radial-gradient(ellipse, rgba(80, 0, 1, 0.10) 0%, transparent 70%);
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
}

/* Content card */
.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  max-width: 440px;
  width: 100%;
  padding: 0 24px;
}

/* Icon */
.icon-wrap {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(135, 4, 0, 0.1);
  border: 1px solid #3a1010;
  border-radius: 18px;
  color: #870400;
  animation: icon-pulse 4s ease-in-out infinite;
}

.calendar-icon {
  width: 36px;
  height: 36px;
}

@keyframes icon-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(135, 4, 0, 0); border-color: #3a1010; color: #870400; }
  50% { box-shadow: 0 0 24px rgba(135, 4, 0, 0.2); border-color: #6a1010; color: #b03010; }
}

/* Text */
.text-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.eyebrow {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #a50500;
  background: rgba(135, 4, 0, 0.12);
  border: 1px solid #3a1010;
  padding: 3px 12px;
  border-radius: 20px;
}

.title {
  font-family: var(--font-serif), serif;
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--beige);
  margin: 0;
  letter-spacing: -0.01em;
}

.tagline {
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  color: var(--orange);
  letter-spacing: 0.1em;
  margin: 0;
}

.description {
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
  line-height: 1.7;
  color: #a4654c;
  margin: 8px 0 0;
  max-width: 360px;
}

/* Feature pills */
.features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.feature-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 13px;
  background: rgba(164, 5, 0, 0.06);
  border: 1px solid #6f2c2c;
  border-radius: 20px;
  font-family: var(--font-sans), sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #83472f;
  letter-spacing: 0.03em;
}

.feature-pill svg {
  width: 12px;
  height: 12px;
  color: #ae4629;
  flex-shrink: 0;
}

/* Divider */
.divider {
  width: 100%;
  max-width: 280px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #853030, transparent);
}

.footnote {
  font-family: var(--font-mono), monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #9f482d;
  text-transform: uppercase;
}
</style>