import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';
import i18n from '../i18n';
import { useToast } from './useToast';

export function useLoginView() {
    const router = useRouter();
    const toast = useToast();
    const email = ref('');
    const password = ref('');

    const handleLogin = async () => {
        try {
            const response = await authService.login({
                email: email.value,
                password: password.value
            });

            if (response.success) {
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user_info', JSON.stringify(response.user));

                // Set language based on user preference
                if (response.user.preferred_language) {
                    i18n.global.locale.value = response.user.preferred_language;
                    localStorage.setItem('user_locale', response.user.preferred_language);
                }

                router.push('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            console.error('Login error:', error);
            toast.error(error.message || i18n.global.t('auth.login_failed'));
        }
    };

    return {
        email,
        password,
        handleLogin
    };
}
