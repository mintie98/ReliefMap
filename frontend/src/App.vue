<template>
  <div id="app">
    <router-view />
    <NotificationToast 
      :visible="visible"
      :message="message"
      :type="type"
      @close="hide"
    />
  </div>
</template>

<script>
import NotificationToast from './components/NotificationToast.vue';
import { useToast } from './composables/useToast';

export default {
  name: 'App',
  components: {
    NotificationToast
  },
  setup() {
    const { visible, message, type, hide } = useToast();
    return { visible, message, type, hide };
  }
};
</script>

<style>
:root {
  /* Share-Map Inspired Palette */
  --header-bg: #2C3E50; /* Charcoal/Dark Slate */
  --header-text: #FFFFFF;
  
  --primary-color: #008080; /* Teal */
  --primary-hover: #006666;
  --accent-color: #F43F5E; /* For alerts/markers */
  
  --bg-color: #F5F7FA;
  --surface-color: #FFFFFF;
  --border-color: #E2E8F0;
  
  --text-primary: #334155;
  --text-secondary: #64748B;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
  line-height: 1.5;
}

#app {
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', sans-serif;
  color: var(--text-primary);
}

/* Response Text Ratios */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  html {
    font-size: 13px;
  }
}

/* Global Utility Classes */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 1rem;
}

/* Touch-friendly buttons on mobile */
@media (max-width: 600px) {
  .btn {
    padding: 0.75rem 1.5rem;
    min-height: 44px;
  }
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.scroller {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 transparent;
}

.scroller::-webkit-scrollbar {
  width: 6px;
}

.scroller::-webkit-scrollbar-track {
  background: transparent;
}

.scroller::-webkit-scrollbar-thumb {
  background-color: #CBD5E1;
  border-radius: 20px;
}
</style>
