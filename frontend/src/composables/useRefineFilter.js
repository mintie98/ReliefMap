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
        { key: 'public_toilet', label: 'Public Toilet' }, // Changed key to match backend
        { key: 'diaper', label: 'Diaper Changing' },
        { key: 'wheelchair', label: 'Wheelchair' },
        { key: 'child_seat', label: 'Child Seat' },
        { key: 'gender_separated', label: 'Gender Separated' },
        { key: 'powder_room', label: 'Powder Room' },
        { key: 'ostomate', label: 'Ostomate' },
        { key: 'large_bed', label: 'Large Bed' },
        { key: 'parking', label: 'Parking' },
        { key: 'store_usage', label: 'Store Usage' }
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
