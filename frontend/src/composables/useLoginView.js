import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';

export function useLoginView() {
    const router = useRouter();
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
                router.push('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Login failed');
        }
    };

    return {
        email,
        password,
        handleLogin
    };
}
