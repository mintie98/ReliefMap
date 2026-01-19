import { useRouter } from 'vue-router';
import japanMapImg from '../assets/japan_map.png';
import pinGreen from '../assets/toiletPin/green.png';
import pinYellow from '../assets/toiletPin/yellow.png';
import pinRed from '../assets/toiletPin/red.png';
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
        pinGreen,
        pinYellow,
        pinRed,
        ICONS
    };
}
