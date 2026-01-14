import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';

export function useRegisterView() {
    const router = useRouter();
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
                alert('Registration successful!');
                router.push('/');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'Registration failed');
        }
    };

    return {
        fullname,
        email,
        password,
        handleRegister
    };
}
