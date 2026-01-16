<template>
  <header class="app-header">
    <div class="header-content">
      <div class="brand">
        <router-link to="/" class="brand-link">
          <h1>ReliefMap</h1>
        </router-link>
      </div>

      <div class="nav-actions">
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </div>
  </header>
</template>

<script>
import UserMenu from './UserMenu.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import '../assets/styles/AppHeader.css';

export default {
  name: 'AppHeader',
  components: {
    UserMenu,
    LanguageSwitcher
  }
};
</script>
