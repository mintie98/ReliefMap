import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';
import { useReviewViewModel } from '../viewmodels/ReviewViewModel';
import authService from '../services/authService';
import { ICONS } from '../assets/icons';
import i18n from '../i18n'; // Import i18n instance
import { useToast } from './useToast';

import pinGreen from '../assets/toiletPin/green.png';
import pinYellow from '../assets/toiletPin/yellow.png';
import pinRed from '../assets/toiletPin/red.png';
import userIcon from '../assets/user.png';

export function useMapView() {
    const mapContainer = ref(null);
    const isMenuOpen = ref(false);
    const toast = useToast();
    const showRefine = ref(false);
    const showAddModal = ref(false);

    let map = null;
    let markers = [];

    const selectedLocation = ref(null);
    const amenities = ref({});
    const userLocation = ref(null); // Cache user location

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
        if (status === 'yellow' || status === 'in_review' || status === 'pending') return pinYellow;
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

        userLocation.value = loc; // Cache latest location

        if (!currentLocationMarker) {
            currentLocationMarker = new window.google.maps.Marker({
                position: loc,
                map: map,
                title: "You are here",
                zIndex: 999, // On top of other markers
                icon: {
                    url: userIcon,
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 20)
                }
            });
        } else {
            currentLocationMarker.setPosition(loc);
        }
    };

    const initMap = () => {
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
        // TODO: Implement toggle amenity logic
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
        toast.info(i18n.global.t('messages.search_searching', { query }));
        e.target.value = '';
    };

    const openRefine = () => {
        showRefine.value = true;
    };

    const openAddLocation = () => {
        isMenuOpen.value = false;
        showAddModal.value = true;
    };

    const handleLocationAdded = (locationData) => {
        // Pan map to the newly added location to ensure it's in view
        if (locationData && locationData.latitude && locationData.longitude && map) {
            const newLoc = { lat: locationData.latitude, lng: locationData.longitude };
            map.panTo(newLoc);
            map.setZoom(16); // Zoom in to show the new location clearly

            // Temporarily clear bounds to ensure new location is loaded
            // Store current bounds
            const currentBounds = {
                swLat: filters.swLat,
                swLng: filters.swLng,
                neLat: filters.neLat,
                neLng: filters.neLng
            };

            // Clear bounds filters temporarily
            updateFilters({
                swLat: null,
                swLng: null,
                neLat: null,
                neLng: null
            });

            // Reload locations without bounds restriction
            loadLocations().then(() => {
                // After a short delay, restore bounds-based filtering
                setTimeout(() => {
                    // The map's idle event will naturally update bounds on next interaction
                }, 500);
            });
        } else {
            // Fallback: just reload
            loadLocations();
        }
    };

    const navigateToLogin = () => {
        router.push('/login');
    };

    // Navigation State
    const isNavigating = ref(false);
    const navigationInfo = ref({ distance: '', duration: '' });
    let directionsService = null;
    let directionsRenderer = null;

    const handleNavigate = (loc) => {
        if (!loc) return;

        // Ensure map is initialized
        if (!map) return;

        // Init services if needed
        if (!directionsService && window.google) {
            directionsService = new window.google.maps.DirectionsService();
            directionsRenderer = new window.google.maps.DirectionsRenderer({
                map: map,
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: "#4285F4",
                    strokeWeight: 6,
                    strokeOpacity: 0.8
                }
            });
        }

        if (!directionsService) return;

        const performRoute = (origin) => {
            const destination = { lat: loc.latitude, lng: loc.longitude };
            const request = {
                origin: origin,
                destination: destination,
                travelMode: window.google.maps.TravelMode.WALKING,
                language: i18n.global.locale.value
            };

            directionsService.route(request, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(result);
                    isNavigating.value = true;

                    // Extract info
                    const leg = result.routes[0].legs[0];
                    navigationInfo.value = {
                        distance: leg.distance.text,
                        duration: leg.duration.text
                    };

                    // Close menus to show map full view
                    isMenuOpen.value = false;
                    showRefine.value = false;

                } else {
                    console.warn('In-app navigation failed:', status);
                    toast.error(i18n.global.t('navigation.error'));
                }
            });
        };

        // Use cached location if available (Instant)
        if (userLocation.value) {
            performRoute(userLocation.value);
        } else if (navigator.geolocation) {
            // Fallback: Fetch if not yet cached
            navigator.geolocation.getCurrentPosition((pos) => {
                const origin = { lat: pos.coords.lat || pos.coords.latitude, lng: pos.coords.lng || pos.coords.longitude };
                userLocation.value = origin;
                performRoute(origin);
            }, (err) => {
                toast.error(i18n.global.t('messages.location_get_error'));
            });
        } else {
            toast.error(i18n.global.t('messages.geo_not_supported'));
        }
    };

    const cancelNavigation = () => {
        if (directionsRenderer) {
            directionsRenderer.setDirections({ routes: [] });
        }
        isNavigating.value = false;
        navigationInfo.value = { distance: '', duration: '' };
    };

    // Smart Review Flow State
    const showLocationPicker = ref(false);
    const showStandaloneReviewModal = ref(false);
    const targetReviewLocation = ref(null);

    const handleReviewMenuClick = () => {
        // console.log("handleReviewMenuClick clicked");
        try {
            isMenuOpen.value = false;

            if (!authService) {
                toast.error(i18n.global.t('messages.auth_missing'));
                return;
            }

            const isAuth = authService.isAuthenticated();
            // console.log("Is Authenticated:", isAuth);

            if (!isAuth) {
                if (confirm(i18n.global.t('messages.login_required'))) {
                    router.push('/login');
                }
                return;
            }

            if (selectedLocation.value) {
                targetReviewLocation.value = selectedLocation.value;
                showStandaloneReviewModal.value = true;
            } else {
                showLocationPicker.value = true;
            }
        } catch (e) {
            console.error("Error in review menu click:", e);
            toast.error(i18n.global.t('messages.error_prefix', { message: e.message }));
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

        const result = await createReview(formData, targetReviewLocation.value.location_id);

        if (result.success) {
            toast.success(i18n.global.t('messages.review_success'));
            showStandaloneReviewModal.value = false;
            loadReviews(targetReviewLocation.value.location_id); // Load reviews immediately for panel
            loadLocations(); // Refresh map to show new rating/status if changed
        } else {
            const errorMsg = result.error || i18n.global.t('messages.unknown_error');
            toast.error(i18n.global.t('messages.review_error', { error: errorMsg }));
        }
    };

    const handleAddReview = () => {
        // Legacy or direct call
        // If called from DetailPanel, it handles everything internally.
    };

    const goHome = () => {
        router.push('/');
    };

    const handleRefineSearch = (filterData) => {
        showRefine.value = false;

        const newFilters = {};

        // Status: Convert booleans to array suitable for backend
        const statuses = [];
        if (filterData.status.verified) statuses.push('green', 'verified');
        if (filterData.status.inReview) statuses.push('yellow', 'pending', 'in_review');
        if (filterData.status.unverified) statuses.push('red', 'unverified');

        if (statuses.length > 0) newFilters.verificationStatus = statuses;
        else newFilters.verificationStatus = null;

        // Search Term
        newFilters.searchTerm = filterData.searchText;

        // Open Now
        newFilters.openNow = filterData.visitTime;

        // Amenities
        const activeAmenities = {};
        for (const [key, val] of Object.entries(filterData.features)) {
            if (val) activeAmenities[key] = true;
        }
        if (Object.keys(activeAmenities).length > 0) {
            newFilters.amenities = activeAmenities;
        } else {
            newFilters.amenities = null;
        }

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
        handleStandaloneReviewSubmit,
        isNavigating,
        navigationInfo,
        cancelNavigation
    };
}
