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
import '../assets/styles/NotificationToast.css';

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


