<template>
  <header class="app-header">
    <div class="header-content">
      <div class="brand">
        <router-link to="/" class="brand-link">
          <h1>ReliefMap</h1>
        </router-link>
      </div>

      <div class="nav-actions">
        <UserMenu />
      </div>
    </div>
  </header>
</template>

<script>
import UserMenu from './UserMenu.vue';
import '../assets/styles/AppHeader.css';

export default {
  name: 'AppHeader',
  components: {
    UserMenu
  }
};
</script>
