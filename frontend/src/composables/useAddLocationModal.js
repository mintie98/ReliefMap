import { reactive, ref } from 'vue';
import { useLocationViewModel } from '../viewmodels/LocationViewModel';
import { ICONS } from '../assets/icons';

export function useAddLocationModal(emit) {
    const { createLocation } = useLocationViewModel();
    const loading = ref(false);
    const error = ref(null);

    const form = reactive({
        name: '',
        address: '',
        latitude: null,
        longitude: null,
        gender_type: 'mixed',
        amenities: {
            western_style: true,
            japanese_style: false,
            accessible: false,
            baby_changing: false,
            warm_seat: false
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
                    alert('Cannot get location: ' + err.message);
                    loading.value = false;
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
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
            user_id: 1,
            amenities: form.amenities,
            gender_type: form.gender_type
        };

        try {
            const result = await createLocation(ugcData);
            if (result.success) {
                alert(result.message || 'Location processed successfully!');
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
        error,
        getCurrentLocation,
        geocodeAddress,
        getCurrentLocation,
        geocodeAddress,
        handleSubmit,
        ICONS
    };
}
