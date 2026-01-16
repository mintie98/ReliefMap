import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';
import { useReviewViewModel } from '../viewmodels/ReviewViewModel';
import authService from '../services/authService';
import { ICONS } from '../assets/icons';

import pinGreen from '../assets/toiletPin/green.png';
import pinYellow from '../assets/toiletPin/yellow.png';
import pinRed from '../assets/toiletPin/red.png';

export function useMapView() {
    const mapContainer = ref(null);
    const isMenuOpen = ref(false);
    const showRefine = ref(false);
    const showAddModal = ref(false);

    let map = null;
    let markers = [];

    const selectedLocation = ref(null);
    const amenities = ref({});

    const {
        locations,
        filteredLocations,
        loading,
        error,
        filters,
        loadLocations,
        updateFilters,
        clearFilters: originalClearFilters
    } = useLocationViewModel();

    const router = useRouter();

    const hasActiveFilters = computed(() => {
        return filters.verificationStatus || filters.sourceType;
    });

    const getPinIcon = (loc) => {
        if (loc.source_type === 'api') return pinGreen;

        const status = loc.verification_status;
        if (status === 'verified' || status === 'green') return pinGreen;
        if (status === 'yellow' || status === 'in_review') return pinYellow;
        if (status === 'unverified' || status === 'red') return pinRed;

        return pinYellow;
    };

    const focusLocation = (loc) => {
        selectedLocation.value = loc;
        if (map) {
            map.panTo({ lat: loc.latitude, lng: loc.longitude });
        }
    };

    const updateMarkers = () => {
        console.log('updateMarkers called. Locations:', filteredLocations.value.length);
        if (!map) {
            console.warn('Map not initialized yet');
            return;
        }
        markers.forEach(m => m.setMap(null));
        markers = [];

        filteredLocations.value.forEach(loc => {
            const marker = new window.google.maps.Marker({
                position: { lat: loc.latitude, lng: loc.longitude },
                map: map,
                title: loc.display_name,
                icon: {
                    url: getPinIcon(loc),
                    scaledSize: new window.google.maps.Size(45, 60),
                    anchor: new window.google.maps.Point(22.5, 60)
                }
            });
            marker.addListener('click', () => focusLocation(loc));
            markers.push(marker);
        });
    };

    let currentLocationMarker = null;

    const updateCurrentLocationMarker = (loc) => {
        if (!map) return;

        if (!currentLocationMarker) {
            currentLocationMarker = new window.google.maps.Marker({
                position: loc,
                map: map,
                title: "You are here",
                zIndex: 999, // On top of other markers
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                }
            });
        } else {
            currentLocationMarker.setPosition(loc);
        }
    };

    const initMap = () => {
        console.log('initMap called');
        if (!window.google || !mapContainer.value) return;
        const defaultCenter = { lat: 35.6762, lng: 139.6503 };

        map = new window.google.maps.Map(mapContainer.value, {
            zoom: 14,
            center: defaultCenter,
            disableDefaultUI: true,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });

        map.addListener('idle', () => {
            const bounds = map.getBounds();
            if (bounds) {
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                updateFilters({
                    swLat: sw.lat(),
                    swLng: sw.lng(),
                    neLat: ne.lat(),
                    neLng: ne.lng()
                });
                loadLocations();
            }
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    map.setCenter(loc);
                    updateCurrentLocationMarker(loc);
                    updateFilters({ lat: loc.lat, lng: loc.lng });
                    loadLocations();
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    loadLocations();
                }
            );
        } else {
            loadLocations();
        }
    };

    const toggleFilter = (key, value) => {
        if (filters[key] === value) {
            updateFilters({ [key]: null });
        } else {
            updateFilters({ [key]: value });
        }
    };

    const toggleAmenity = (key) => {
        console.log('Implement toggle amenity:', key);
    };

    const clearFilters = () => {
        originalClearFilters();
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                map.panTo(loc);
                map.setZoom(15);
                updateCurrentLocationMarker(loc);
                updateFilters({ lat: loc.lat, lng: loc.lng });
                loadLocations();
            });
        }
    };

    const zoomIn = () => map?.setZoom((map.getZoom() || 14) + 1);
    const zoomOut = () => map?.setZoom((map.getZoom() || 14) - 1);

    const searchGooglePlaces = (e) => {
        const query = e.target.value;
        if (!query) return;
        alert(`Search for: ${query} (Implement API call)`);
        e.target.value = '';
    };

    const openRefine = () => {
        showRefine.value = true;
    };

    const openAddLocation = () => {
        isMenuOpen.value = false;
        showAddModal.value = true;
    };

    const handleLocationAdded = () => {
        loadLocations();
    };

    const navigateToLogin = () => {
        router.push('/login');
    };

    const handleNavigate = (loc) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
        window.open(url, '_blank');
    };

    // Smart Review Flow State
    const showLocationPicker = ref(false);
    const showStandaloneReviewModal = ref(false);
    const targetReviewLocation = ref(null);



    const handleReviewMenuClick = () => {
        console.log("handleReviewMenuClick clicked");
        try {
            isMenuOpen.value = false;

            if (!authService) {
                alert("AuthService is missing!");
                return;
            }

            const isAuth = authService.isAuthenticated();
            console.log("Is Authenticated:", isAuth);

            if (!isAuth) {
                if (confirm('You need to login to write a review. Go to login page?')) {
                    router.push('/login');
                }
                return;
            }

            if (selectedLocation.value) {
                console.log("Has selected location:", selectedLocation.value);
                targetReviewLocation.value = selectedLocation.value;
                showStandaloneReviewModal.value = true;
            } else {
                console.log("No selected location, showing picker");
                showLocationPicker.value = true;
            }
        } catch (e) {
            console.error("Error in review menu click:", e);
            alert("Error: " + e.message);
        }
    };

    const handleLocationPick = (loc) => {
        showLocationPicker.value = false;
        targetReviewLocation.value = loc;
        focusLocation(loc);
        showStandaloneReviewModal.value = true;
    };

    const closeStandaloneReview = () => {
        showStandaloneReviewModal.value = false;
        targetReviewLocation.value = null;
    };

    const handleStandaloneReviewSubmit = async (reviewData) => {
        if (!targetReviewLocation.value) return;

        const formData = new FormData();
        formData.append('location_id', targetReviewLocation.value.location_id);
        formData.append('review_text', reviewData.review_text);
        formData.append('cleanliness_score', reviewData.cleanliness_score);

        const waitMap = { 'none': 5, 'short': 4, 'medium': 3, 'long': 1 };
        formData.append('wait_time_score', waitMap[reviewData.wait_time] || 0);

        formData.append('amenities', JSON.stringify(reviewData.amenities));

        if (reviewData.images && reviewData.images.length > 0) {
            reviewData.images.forEach(file => {
                formData.append('images', file);
            });
        }

        const { createReview } = useReviewViewModel();
        const result = await createReview(formData, targetReviewLocation.value.location_id);

        if (result.success) {
            alert('Review Submitted Successfully!');
            showStandaloneReviewModal.value = false;
            loadLocations(); // Refresh map to show new rating/status if changed
        } else {
            alert('Failed to submit review: ' + (result.error || 'Unknown error'));
        }
    };

    const handleAddReview = () => {
        // Legacy or direct call
        // If called from DetailPanel, it handles everything internally.
        console.log('Detail Panel handles review internally.');
    };

    const goHome = () => {
        router.push('/');
    };

    const handleRefineSearch = (filterData) => {
        showRefine.value = false;

        const newFilters = {};
        if (filterData.status.verified) newFilters.verificationStatus = 'green';
        else if (filterData.status.inReview) newFilters.verificationStatus = 'yellow';
        else if (filterData.status.unverified) newFilters.verificationStatus = 'red';
        else newFilters.verificationStatus = null;

        updateFilters(newFilters);
        loadLocations();
    };

    onMounted(() => {
        if (window.google) {
            initMap();
        } else {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&callback=initReliefMap&loading=async&libraries=places`;
            script.async = true;
            script.defer = true;
            window.initReliefMap = initMap;
            document.head.appendChild(script);
        }
    });

    watch(filteredLocations, updateMarkers);

    return {
        mapContainer,
        isMenuOpen,
        filters,
        hasActiveFilters,
        amenities,
        loading,
        filteredLocations,
        selectedLocation,
        toggleFilter,
        toggleAmenity,
        clearFilters,
        focusLocation,
        getCurrentLocation,
        zoomIn,
        zoomOut,
        searchGooglePlaces,
        showRefine,
        showAddModal,
        openRefine,
        openAddLocation,
        handleRefineSearch,
        handleLocationAdded,
        handleNavigate,
        handleReviewMenuClick,
        handleAddReview,
        navigateToLogin,
        navigateToLogin,
        goHome,
        ICONS,
        showLocationPicker,
        showStandaloneReviewModal,
        handleLocationPick,
        closeStandaloneReview,
        handleStandaloneReviewSubmit
    };
}
