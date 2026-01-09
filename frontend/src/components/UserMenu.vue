<template>
  <div class="user-menu-container">
    <!-- Guest State -->
    <template v-if="!isAuthenticated">
      <router-link to="/login" class="btn btn-primary login-btn">
        Login
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
            <span class="user-name">{{ userName }}</span>
            <span class="dropdown-arrow">▼</span>
          </div>

      <!-- Dropdown Menu -->
      <transition name="fade">
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <router-link to="/profile" class="dropdown-item">
            <span class="icon">👤</span> User Profile
          </router-link>
          <div class="dropdown-divider"></div>
          <button @click="handleLogout" class="dropdown-item logout-item">
            <span class="icon">🚪</span> Logout
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import authService from '../services/authService';

export default {
  name: 'UserMenu',
  data() {
    return {
      isAuthenticated: false,
      user: null,
      isDropdownOpen: false
    };
  },
  computed: {
    userName() {
      return this.user ? (this.user.name || this.user.email) : 'User';
    }
  },
  created() {
    this.checkAuth();
  },
  methods: {
    checkAuth() {
      this.isAuthenticated = authService.isAuthenticated();
      this.user = authService.getCurrentUser();
    },
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown() {
      this.isDropdownOpen = false;
    },
    handleLogout() {
      if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
        authService.logout();
        this.isAuthenticated = false;
        this.user = null;
        this.isDropdownOpen = false;
        // Stay on current page, do not redirect
      }
    }
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

<style scoped>
.user-menu-container {
  display: flex;
  align-items: center;
}

.login-btn {
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  background-color: transparent;
  color: white;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: background 0.2s;
}

.login-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: white;
}

/* User Menu Styles */
.user-profile-menu {
  position: relative;
  cursor: pointer;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  background-color: rgba(255,255,255,0.1); /* Subtle background */
  transition: background 0.2s;
}

.user-trigger:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.user-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: inherit;
  white-space: nowrap;
}

.dropdown-arrow {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 130%;
  right: 0;
  width: 200px;
  background: white;
  color: #333;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  padding: 0.5rem 0;
  overflow: hidden;
  transform-origin: top right;
  z-index: 1000;
  border: 1px solid #f0f0f0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.2rem;
  text-decoration: none;
  color: #333;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
  font-weight: 500;
}

.dropdown-item:hover {
  background-color: #f7f9fc;
  color: var(--primary-color);
}

.dropdown-divider {
  height: 1px;
  background-color: #eee;
  margin: 0.5rem 0;
}

.logout-item {
  color: #d32f2f;
}

.logout-item:hover {
  background-color: #fff1f2;
}

.icon {
  width: 20px;
  text-align: center;
  font-size: 1.1rem;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
