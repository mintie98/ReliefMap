<template>
  <div class="user-menu-container">
    <!-- Guest State -->
    <template v-if="!isAuthenticated">
      <router-link to="/login" class="login-btn">
        {{ $t('common.login') }}
      </router-link>
    </template>

    <!-- Authenticated State -->
    <div v-else class="user-profile-menu" @click="toggleDropdown" v-click-outside="closeDropdown">
          <div class="user-trigger">
            <div class="user-icon-container">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
               </svg>
            </div>
            <span class="user-name">{{ getDisplayName }}</span>
            <span class="dropdown-arrow">▼</span>
          </div>

      <!-- Dropdown Menu -->
      <transition name="fade">
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <router-link to="/profile" class="dropdown-item">
            <span class="icon">{{ ICONS.USER }}</span> {{ $t('common.profile') }}
          </router-link>
          <div class="dropdown-divider"></div>
          <button @click="handleLogout" class="dropdown-item logout-item">
            <span class="icon">{{ ICONS.LOGOUT }}</span> {{ $t('common.logout') }}
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { useUserMenu } from '../composables/useUserMenu';
import '../assets/styles/UserMenu.css';

export default {
  name: 'UserMenu',
  setup() {
    const {
        isAuthenticated,
        user,
        isDropdownOpen,
        checkAuth,
        toggleDropdown,
        closeDropdown,
        handleLogout,
        getDisplayName,
        ICONS
    } = useUserMenu();

    // Init check
    checkAuth();

    return {
        isAuthenticated,
        user,
        isDropdownOpen,
        toggleDropdown,
        closeDropdown,
        handleLogout,
        getDisplayName,
        ICONS
    };
  },
  directives: {
    'click-outside': {
      mounted(el, binding) {
        el.clickOutsideEvent = function(event) {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value(event, el);
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
