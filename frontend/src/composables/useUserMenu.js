import { ref, computed } from 'vue';
import authService from '../services/authService';
import { useRouter } from 'vue-router';
import { ICONS } from '../assets/icons';

export function useUserMenu() {
    const isAuthenticated = ref(false);
    const user = ref(null);
    const isDropdownOpen = ref(false);
    const router = useRouter();

    const checkAuth = () => {
        isAuthenticated.value = authService.isAuthenticated();
        user.value = authService.getCurrentUser();
    };

    const toggleDropdown = () => {
        isDropdownOpen.value = !isDropdownOpen.value;
    };

    const closeDropdown = () => {
        isDropdownOpen.value = false;
    };

    const getDisplayName = computed(() => {
        return user.value ? (user.value.name || user.value.email) : 'User';
    });

    const handleLogout = () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
            authService.logout();
            isAuthenticated.value = false;
            user.value = null;
            isDropdownOpen.value = false;
        }
    };

    return {
        isAuthenticated,
        user,
        isDropdownOpen,
        checkAuth,
        toggleDropdown,
        closeDropdown,
        handleLogout,
        handleLogout,
        getDisplayName,
        ICONS
    };
}
