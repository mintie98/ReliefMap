const locationRepository = require('../repositories/LocationRepository');
const userRepository = require('../repositories/UserRepository');
const reviewRepository = require('../repositories/ReviewRepository');
const axios = require('axios');

class LocationService {
  // Search locations with filters (Smart Search: DB + Google API)
  async searchLocations(filters) {
    try {
      // 1. Initial fetch from local DB
      let locations = await locationRepository.findAll(filters);

      // 2. If searching by Bounding Box, we also want to trigger Google API fetch
      // We calculate the center point and an approximate radius to keep the "Smart Search" feature working
      if (filters.swLat && filters.neLat && filters.swLng && filters.neLng) {
        const centerLat = (filters.swLat + filters.neLat) / 2;
        const centerLng = (filters.swLng + filters.neLng) / 2;

        // Calculate radius (distance from center to corner) in km
        // Using simplified euclidean distance for small areas is acceptable
        // 1 degree lat ~= 111km
        const latRadius = (filters.neLat - filters.swLat) * 111 / 2;
        const lngRadius = (filters.neLng - filters.swLng) * 111 * Math.cos(centerLat * Math.PI / 180) / 2;
        const radiusKm = Math.sqrt(latRadius * latRadius + lngRadius * lngRadius);

        // Only fetch if radius is reasonable (e.g. < 5km) to avoid spamming API when zoomed out too far
        if (radiusKm < 5) {
          try {
            await this.fetchAndSaveGoogleNearby(centerLat, centerLng, radiusKm);
            // Re-fetch from DB
            locations = await locationRepository.findAll(filters);
          } catch (e) {
            console.error('Bound-based Google Fetch failed', e.message);
          }
        }
      }
      // Legacy support: radius search
      else if (filters.lat && filters.lng && filters.radius) {
        try {
          // Check if we need to fetch from Google (optimization: could check a cache key or timestamp here)
          await this.fetchAndSaveGoogleNearby(filters.lat, filters.lng, filters.radius);

          // 3. Re-fetch from DB to include newly added locations
          locations = await locationRepository.findAll(filters);
        } catch (googleError) {
          console.error('Background Google Fetch Failed:', googleError.message);
          // Don't fail the request, just return what we have in DB
        }
      }

      return {
        success: true,
        data: locations,
        count: locations.length
      };
    } catch (error) {
      throw new Error(`Failed to search locations: ${error.message}`);
    }
  }

  // Helper: Fetch from Google Places Nearby and Save to DB
  async fetchAndSaveGoogleNearby(lat, lng, radius) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API Key is MISSING in backend .env');
      return;
    }

    // Use nearbysearch for better local results than textsearch
    console.log(`Fetching from Google Nearby: lat=${lat}, lng=${lng}, radius=${radius}`);
    // Use nearbysearch for better local results than textsearch
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${Math.min(radius * 1000, 5000)}&type=point_of_interest&keyword=toilet&key=${apiKey}`;

    const response = await axios.get(url);

    console.log('Google API Status:', response.data.status);
    if (response.data.results) {
      console.log('Google API Results count:', response.data.results.length);
    }

    if (response.data.status === 'OK') {
      const promises = response.data.results.map(place => {
        const placeData = {
          name: place.name,
          address: place.vicinity || place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          source_name: 'google_places',
          source_id: place.place_id,
          is_official: true,
          place_types: place.types,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          opening_hours: place.opening_hours,
          // Store up to 10 photo references as JSON string
          photo_reference: place.photos && place.photos.length > 0
            ? JSON.stringify(place.photos.slice(0, 10).map(p => p.photo_reference))
            : null
        };

        if (placeData.photo_reference) {
          console.log(`Found photo for ${place.name}: ${placeData.photo_reference.substring(0, 20)}...`);
        } else {
          console.log(`No photos found for ${place.name}`);
        }

        // Upsert silently
        return locationRepository.upsertFromBase(placeData)
          .then(id => console.log('Upserted location ID:', id))
          .catch(err => console.error('Upsert failed for', place.name, err.message));
      });

      await Promise.all(promises);
    }
  }



  // ... inside class ...

  // Get location details by ID
  async getLocationById(locationId) {
    try {
      const location = await locationRepository.findById(locationId);
      if (!location) {
        return {
          success: false,
          message: 'Location not found'
        };
      }

      // Fetch reviews
      const reviews = await reviewRepository.findByLocationId(locationId);

      // Aggregate images from reviews
      let images = [];
      if (reviews && reviews.length > 0) {
        reviews.forEach(r => {
          if (r.images && r.images.length > 0) {
            images = images.concat(r.images);
          }
        });
      }

      // If we need more images (e.g. less than 3), fallback/append Google Photos
      if (images.length < 3 && location.photo_reference) {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          let photoRefs = [];
          try {
            // Try parsing as JSON array
            if (location.photo_reference.startsWith('[')) {
              photoRefs = JSON.parse(location.photo_reference);
            } else {
              // Legacy: single string
              photoRefs = [location.photo_reference];
            }
          } catch (e) {
            photoRefs = [location.photo_reference];
          }

          // Filter out any invalid
          photoRefs = photoRefs.filter(ref => typeof ref === 'string');

          // Generate URLs (max needed to fill up to reasonable amount, e.g. 10 total)
          const needed = 10 - images.length;
          const toAdd = photoRefs.slice(0, needed);

          toAdd.forEach(ref => {
            const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${apiKey}`;
            images.push(url);
          });
        }
      }

      // Calculate average scores from reviews if not stored in location
      // (Optional: depending on if we update location.cleanliness_score on write)

      return {
        success: true,
        data: {
          ...location,
          reviews: reviews || [],
          images: images
        }
      };
    } catch (error) {
      throw new Error(`Failed to get location: ${error.message}`);
    }
  }

  // Search locations from Google Places API (New)
  async searchFromGoogleAPI(query, location = null) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      // Use Places API (New) - Text Search endpoint
      const url = `https://places.googleapis.com/v1/places:searchText`;

      const requestBody = {
        textQuery: query,
        maxResultCount: 20,
        includedType: 'toilet',
        languageCode: 'en'
      };

      // Add location bias if provided
      if (location) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: 5000.0 // meters
          }
        };
      }

      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types'
        }
      });

      if (!response.data || !response.data.places) {
        throw new Error('Invalid response from Google Places API');
      }

      // Transform Google Places API (New) data to our format
      const places = response.data.places.map(place => ({
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress || '',
        latitude: place.location?.latitude || 0,
        longitude: place.location?.longitude || 0,
        source_name: 'google_places_new',
        source_id: place.id || '',
        is_official: true
      }));

      return {
        success: true,
        data: places
      };
    } catch (error) {
      // Fallback to old Places API if new API fails
      if (error.response?.status === 404 || error.message.includes('Invalid')) {
        return this.searchFromGoogleAPILegacy(query, location);
      }
      throw new Error(`Failed to search Google API: ${error.message}`);
    }
  }

  // Fallback: Search using legacy Places API (Text Search)
  async searchFromGoogleAPILegacy(query, location = null) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&type=establishment`;

      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=5000`;
      }

      const response = await axios.get(url);

      if (response.data.status !== 'OK') {
        throw new Error(`Google API error: ${response.data.status}`);
      }

      // Transform Google Places data to our format
      const places = response.data.results.map(place => ({
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        source_name: 'google_places',
        source_id: place.place_id,
        is_official: true,
        place_types: place.types,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        opening_hours: place.opening_hours // Note: text search might not return full opening hours, might need place details
      }));

      return {
        success: true,
        data: places
      };
    } catch (error) {
      throw new Error(`Failed to search Google API: ${error.message}`);
    }
  }

  // Import location from Google API
  async importFromGoogleAPI(placeData) {
    try {
      const locationId = await locationRepository.upsertFromBase(placeData);
      return {
        success: true,
        data: { location_id: locationId },
        message: 'Location imported successfully'
      };
    } catch (error) {
      throw new Error(`Failed to import location: ${error.message}`);
    }
  }

  // Create location from UGC (with Deduplication & Merging)
  async createFromUGC(ugcData) {
    try {
      // 0. Verify user exists
      const user = await userRepository.findById(ugcData.user_id);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      let duplicate = null;

      // 1. Check Matching by Source ID (if available, mostly for explicit edits/reports)
      if (ugcData.source_id) {
        duplicate = await locationRepository.findBySourceId(ugcData.source_id);
      }

      // 2. Check Matching by Distance & Name (if not found by ID)
      if (!duplicate) {
        // Strategy: Search in a slightly larger radius (50m) to be safe, then filter precisely
        const nearbyFilter = {
          lat: ugcData.latitude,
          lng: ugcData.longitude,
          radius: 0.05 // 50 meters
        };

        const nearbyLocations = await locationRepository.findAll(nearbyFilter);

        for (const loc of nearbyLocations) {
          const dist = this.haversineDistance(ugcData.latitude, ugcData.longitude, loc.latitude, loc.longitude);

          // Check 1: Distance <= 50 meters (0.05 km) - Primary Radius for Address Check
          if (dist <= 0.05) {
            // A. Address Similarity Check (> 85%)
            // Use input address vs stored address
            const addr1 = ugcData.address_input || "";
            const addr2 = loc.address || "";
            const addrSimilarity = this.calculateNameSimilarity(addr1, addr2); // Reuse string sim function

            if (addrSimilarity >= 0.85) {
              duplicate = loc;
              break;
            }

            // B. Name Similarity Check (> 70%) - Only if VERY close (<= 20m)
            if (dist <= 0.02) {
              const nameSimilarity = this.calculateNameSimilarity(ugcData.name, loc.display_name);
              if (nameSimilarity >= 0.7) {
                duplicate = loc;
                break;
              }
            }
          }
        }
      }

      // 3. Merging Strategy
      if (duplicate) {
        // Merge Logic: Update amenities and increment trust
        console.log(`Duplicate found: merging UGC with existing location ID ${duplicate.location_id}`);

        // Update Amenities
        // Note: ugcData.amenities might be partial, but we assume it's the latest info
        if (ugcData.amenities) {
          await locationRepository.updateAmenities(duplicate.location_id, {
            ...ugcData.amenities,
            gender_type: ugcData.gender_type
          });
        }

        // Increment verification/trust score
        await locationRepository.incrementVerificationScore(duplicate.location_id, 0.1);

        // Log contribution
        await userRepository.incrementContribution(ugcData.user_id);
        if (duplicate.verification_score > 2.0) { // e.g., verified by many
          await userRepository.incrementVerifiedContribution(ugcData.user_id);
        }

        return {
          success: true,
          data: { location_id: duplicate.location_id, is_merged: true },
          message: 'Location already exists. Your information has been merged to update it!'
        };
      }

      // 4. No Duplicate -> Create New
      const locationId = await locationRepository.createFromUGC(ugcData);

      // Save Amenities for new location
      if (ugcData.amenities) {
        await locationRepository.updateAmenities(locationId, {
          ...ugcData.amenities,
          gender_type: ugcData.gender_type
        });
      }

      // Log contribution
      await userRepository.incrementContribution(ugcData.user_id);

      return {
        success: true,
        data: { location_id: locationId, is_merged: false },
        message: 'Location created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }
  }

  // Helper: Haversine Distance (in km)
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Helper: Name Similarity (Levenshtein based)
  calculateNameSimilarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshtein(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / parseFloat(longer.length);
  }

  levenshtein(a, b) {
    const matrix = [];
    let i, j;

    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    for (i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1  // deletion
            )
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Update location
  async updateLocation(locationId, updateData) {
    try {
      const updated = await locationRepository.update(locationId, updateData);
      if (!updated) {
        return {
          success: false,
          message: 'Location not found or no changes made'
        };
      }
      return {
        success: true,
        message: 'Location updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update location: ${error.message}`);
    }
  }

  // Delete location
  async deleteLocation(locationId) {
    try {
      const deleted = await locationRepository.delete(locationId);
      if (!deleted) {
        return {
          success: false,
          message: 'Location not found'
        };
      }
      return {
        success: true,
        message: 'Location deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete location: ${error.message}`);
    }
  }

  // Search locations by text
  async searchByText(searchTerm) {
    try {
      const locations = await locationRepository.search(searchTerm);
      return {
        success: true,
        data: locations,
        count: locations.length
      };
    } catch (error) {
      throw new Error(`Failed to search locations: ${error.message}`);
    }
  }
}

module.exports = new LocationService();

