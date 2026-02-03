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
          class="lang-dropdown-item" 
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
import viFlag from '@/assets/flags/vi.png'; // Assuming exists
import zhFlag from '@/assets/flags/zh.png'; // Assuming exists
import frFlag from '@/assets/flags/fr.png'; // Assuming exists
import koFlag from '@/assets/flags/ko.png'; // Assuming exists
import '../assets/styles/LanguageSwitcher.css';


export default {
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n();
    const isOpen = ref(false);

    const currentLocale = computed(() => locale.value);

    const availableLocales = [
      { code: 'en', label: 'English' },
      { code: 'ja', label: '日本語' },
      { code: 'vi', label: 'Tiếng Việt' },
      { code: 'zh', label: '中文' },
      { code: 'fr', label: 'Français' },
      { code: 'ko', label: '한국어' }
    ];

    const getFlagSrc = (code) => {
      switch(code) {
        case 'en': return enFlag;
        case 'ja': return jaFlag;
        case 'vi': return viFlag;
        case 'zh': return zhFlag;
        case 'fr': return frFlag;
        case 'ko': return koFlag;
        default: return enFlag;
      }
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


