<template>
  <div class="language-switcher" v-click-outside="closeDropdown">
    <!-- Trigger Button (Current Language) -->
    <button class="lang-btn current-lang" @click="toggleDropdown" :title="currentLocale === 'en' ? 'English' : '日本語'">
      <img :src="getFlagSrc(currentLocale)" :alt="currentLocale" class="flag-icon" />
      <span class="dropdown-arrow">▼</span>
    </button>

    <!-- Dropdown Menu -->
    <transition name="fade">
      <div v-if="isOpen" class="lang-dropdown">
        <button 
          v-for="lang in availableLocales" 
          :key="lang.code"
          class="dropdown-item" 
          :class="{ active: currentLocale === lang.code }"
          @click="selectLocale(lang.code)"
        >
          <img :src="getFlagSrc(lang.code)" :alt="lang.label" class="flag-icon small" />
          <span class="lang-label">{{ lang.label }}</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
// Import images explicitly to ensure Vite resolves them correctly
import enFlag from '@/assets/flags/en.png';
import jaFlag from '@/assets/flags/ja.png';

export default {
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n();
    const isOpen = ref(false);

    const currentLocale = computed(() => locale.value);

    const availableLocales = [
      { code: 'en', label: 'English' },
      { code: 'ja', label: '日本語' }
    ];

    const getFlagSrc = (code) => {
      return code === 'en' ? enFlag : jaFlag;
    };

    const toggleDropdown = () => {
      isOpen.value = !isOpen.value;
    };

    const closeDropdown = () => {
      isOpen.value = false;
    };

    const selectLocale = (newLocale) => {
      locale.value = newLocale;
      localStorage.setItem('user_locale', newLocale);
      closeDropdown();
    };

    return {
      currentLocale,
      isOpen,
      availableLocales,
      getFlagSrc,
      toggleDropdown,
      closeDropdown,
      selectLocale
    };
  },
  directives: {
    'click-outside': {
      mounted(el, binding) {
        el.clickOutsideEvent = function(event) {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value(event);
          }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
      },
      unmounted(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
      }
    }
  }
};
</script>

<style scoped>
.language-switcher {
  position: relative;
  display: flex;
  align-items: center;
}

.lang-btn {
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.lang-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.flag-icon {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.dropdown-arrow {
  font-size: 0.6rem;
  color: #666;
}

/* Dropdown Styles */
.lang-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 140px;
  z-index: 1000;
  border: 1px solid #eee;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  transition: background 0.2s;
  text-align: left;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item.active {
  background-color: #e3f2fd;
  color: #1976D2;
  font-weight: 600;
}

.flag-icon.small {
  width: 20px;
  height: 20px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
