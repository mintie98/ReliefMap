import { reactive, ref } from 'vue';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';
import locationService from '../services/LocationService'; // Import Service
import { ICONS } from '../assets/icons';
import { useToast } from './useToast';
import i18n from '../i18n';

export function useAddLocationModal(emit) {
    const { createLocation } = useLocationViewModel();
    const toast = useToast();
    const loading = ref(false);
    const uploading = ref(false); // New state
    const error = ref(null);

    const form = reactive({
        name: '',
        address: '',
        latitude: null,
        longitude: null,
        gender_type: 'mixed',
        opening_hours: '', // New
        closed_days: '', // New
        notes: '', // New
        images: [], // New (array of strings)
        amenities: {
            western_style: true,
            japanese_style: false,
            accessible: false,
            child_seat: false, // Renamed
            diaper_changing: false,
            warm_seat: false,
            public_toilet: false,
            gender_separated: false,
            powder_room: false,
            barrier_free: false,
            ostomate: false,
            large_bed: false,
            parking: false,
            store_usage: false
        }
    });

    const getCurrentLocation = () => {
        loading.value = true;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = parseFloat(pos.coords.latitude.toFixed(6));
                    const lng = parseFloat(pos.coords.longitude.toFixed(6));

                    form.latitude = lat;
                    form.longitude = lng;

                    // Reverse geocode to get address
                    if (window.google) {
                        const geocoder = new window.google.maps.Geocoder();
                        const latlng = { lat, lng };

                        geocoder.geocode({ location: latlng }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                form.address = results[0].formatted_address;
                            } else {
                                console.warn('Reverse geocoding failed:', status);
                                form.address = `${lat}, ${lng}`;
                            }
                            loading.value = false;
                        });
                    } else {
                        // Fallback to coordinates if Google Maps not available
                        form.address = `${lat}, ${lng}`;
                        loading.value = false;
                    }
                },
                (err) => {
                    toast.error(i18n.global.t('messages.location_get_error'));
                    loading.value = false;
                }
            );
        } else {
            toast.error(i18n.global.t('messages.geo_not_supported'));
            loading.value = false;
        }
    };

    const geocodeAddress = () => {
        if (!form.address || !window.google) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: form.address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                form.latitude = parseFloat(location.lat().toFixed(6));
                form.longitude = parseFloat(location.lng().toFixed(6));
            } else {
                console.warn('Geocoding failed');
            }
        });
    };

    const handleImageUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        uploading.value = true;
        error.value = null;

        try {
            // Upload one by one or Promise.all if multiple supported
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const result = await locationService.uploadImage(file);

                if (result.success) {
                    form.images.push(result.url);
                } else {
                    console.error('Upload failed:', result.error);
                    error.value = `Failed to upload ${file.name}: ${result.error}`;
                }
            }
        } catch (e) {
            error.value = 'Upload error: ' + e.message;
        } finally {
            uploading.value = false;
        }
    };

    const removeImage = (index) => {
        form.images.splice(index, 1);
    };

    const handleSubmit = async () => {
        loading.value = true;
        error.value = null;

        // Validate
        if (!form.latitude || !form.longitude) {
            error.value = 'Coordinates missing. Please enter a valid address or use current location.';
            loading.value = false;
            return;
        }

        const ugcData = {
            name: form.name,
            address_input: form.address,
            latitude: form.latitude,
            longitude: form.longitude,
            user_id: 1, // hardcoded for now or fetch from store
            gender_type: form.gender_type,
            amenities: form.amenities,
            opening_hours: form.opening_hours,
            closed_days: form.closed_days,
            notes: form.notes,
            images: form.images
        };

        try {
            const result = await createLocation(ugcData);
            if (result.success) {
                toast.success(result.message || i18n.global.t('messages.location_added_success'));
                // Emit location data so map can pan to it
                emit('added', {
                    latitude: form.latitude,
                    longitude: form.longitude
                });
                emit('close');
            } else {
                error.value = result.error || 'Failed to add location.';
            }
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    };

    return {
        form,
        loading,
        uploading,
        error,
        getCurrentLocation,
        geocodeAddress,
        handleImageUpload,
        removeImage,
        handleSubmit,
        ICONS
    };
}
