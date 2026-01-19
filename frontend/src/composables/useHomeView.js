import { useRouter } from 'vue-router';
import japanMapImg from '../assets/japan_map.png';
import pinToilet from '../assets/pins/red_toilet.png';
import pinCamera from '../assets/pins/yellow_camera.png';
import pinMedical from '../assets/pins/green_medical.png';
import pinFishing from '../assets/pins/yellow_fishing.png';
import pinOnsen from '../assets/pins/green_onsen.png';
import pinCampingNew from '../assets/pins/green_camping_v2.png';
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
        pinToilet,
        pinCamera,
        pinMedical,
        pinFishing,
        pinOnsen,
        pinCampingNew,
        ICONS
    };
}
