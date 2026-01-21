import { reactive } from 'vue';
import { ICONS } from '../assets/icons';

export function useRefineFilter(emit) {
    const filters = reactive({
        searchText: '',
        visitTime: null,
        status: {
            unverified: false,
            inReview: false,
            verified: false
        },
        features: {}
    });

    const featureList = [
        { key: 'japanese', label: 'Japanese-style' },
        { key: 'western', label: 'Western-style' },
        { key: 'washlet', label: 'Washlet/Bidet' },
        { key: 'public', label: 'Public Toilet' },
        { key: 'diaper', label: 'Diaper Changing' },
        { key: 'wheelchair', label: 'Wheelchair' },
        { key: 'child_seat', label: 'Child Seat' },
        { key: 'parking', label: 'Parking' }
    ];

    // Initialize features state
    featureList.forEach(f => {
        filters.features[f.key] = false;
    });

    const toggleFeature = (key) => {
        filters.features[key] = !filters.features[key];
    };

    const applyFilters = () => {
        emit('search', filters);
    };

    return {
        filters,
        featureList,
        toggleFeature,
        toggleFeature,
        applyFilters,
        ICONS
    };
}
