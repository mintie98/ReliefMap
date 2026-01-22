import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';
import { useToast } from './useToast';
import i18n from '../i18n';

export function useRegisterView() {
    const router = useRouter();
    const toast = useToast();
    const fullname = ref('');
    const email = ref('');
    const password = ref('');

    const handleRegister = async () => {
        try {
            const response = await authService.register({
                name: fullname.value,
                email: email.value,
                password: password.value
            });

            if (response.success) {
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user_info', JSON.stringify(response.user));
                localStorage.setItem('user_info', JSON.stringify(response.user));
                toast.success(i18n.global.t('auth.register_success'));
                router.push('/');
            }
        } catch (error) {
            console.error('Registration error:', error);
            console.error('Registration error:', error);
            toast.error(error.message || i18n.global.t('auth.register_failed'));
        }
    };

    return {
        fullname,
        email,
        password,
        handleRegister
    };
}
