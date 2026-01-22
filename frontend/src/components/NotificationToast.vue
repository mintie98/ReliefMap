<template>
  <transition name="toast-fade">
    <div v-if="visible" :class="['toast-notification', type]">
      <span class="toast-icon">{{ icon }}</span>
      <span class="toast-message">{{ message }}</span>
      <button class="toast-close" @click="hide">×</button>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: Boolean,
  message: String,
  type: {
    type: String,
    default: 'info', // success, error, info, warning
    validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
  }
});

const emit = defineEmits(['close']);

const hide = () => {
  emit('close');
};

const icon = computed(() => {
  switch (props.type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
});
</script>

<style scoped>
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px; /* Or center: left: 50%; transform: translateX(-50%); */
  z-index: 10000;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
  min-width: 300px;
  max-width: 90vw;
}

.toast-notification.success { background-color: #10B981; }
.toast-notification.error { background-color: #EF4444; }
.toast-notification.warning { background-color: #F59E0B; }
.toast-notification.info { background-color: #3B82F6; }

.toast-icon { margin-right: 12px; font-size: 1.2rem; }
.toast-message { flex-grow: 1; font-size: 0.95rem; }
.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: 12px;
  opacity: 0.8;
}
.toast-close:hover { opacity: 1; }

/* Transitions */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
