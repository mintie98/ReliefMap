import { useRouter } from 'vue-router';
import japanMapImg from '../assets/japan_map.png';
import { ICONS } from '../assets/icons';

export function useHomeView() {
    const router = useRouter();

    const navigateToMap = () => {
        router.push('/map');
    };

    const navigateToLogin = () => {
        router.push('/login');
    };

    return {
        navigateToMap,
        navigateToLogin,
        japanMapImg,
        ICONS
    };
}
