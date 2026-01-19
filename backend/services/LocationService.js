const locationRepository = require('../repositories/LocationRepository');
const userRepository = require('../repositories/UserRepository');
const reviewRepository = require('../repositories/ReviewRepository');
const axios = require('axios');

class LocationService {
  // Search locations with filters (Smart Search: DB + Google API)
  async searchLocations(filters) {
    try {
      // 1. Initial fetch from verified DB
      let locations = await locationRepository.findAll(filters);

      // fetch pending locations (unverified/red or pending/yellow)
      const pendingRows = await locationRepository.findAllPending();

      const pendingLocations = pendingRows.map(row => {
        let data = {};
        if (typeof row.location_data === 'string') {
          try { data = JSON.parse(row.location_data); } catch (e) { }
        } else {
          data = row.location_data || {};
        }

        return {
          ...data,
          location_id: `pending_${row.id}`,
          id: row.id,
          is_pending: true,
          verification_status: row.status === 'pending' ? 'yellow' : (row.status === 'unverified' ? 'red' : row.status),
          verification_score: row.verification_score,
          source_type: 'user_pending'
        };
      });

      // Simple in-memory filter (Previous logic)
      let visiblePending = pendingLocations;
      if (filters.swLat && filters.neLat && filters.swLng && filters.neLng) {
        visiblePending = pendingLocations.filter(loc =>
          loc.latitude >= filters.swLat && loc.latitude <= filters.neLat &&
          loc.longitude >= filters.swLng && loc.longitude <= filters.neLng
        );
      } else if (filters.lat && filters.lng && filters.radius) {
        visiblePending = pendingLocations.filter(loc => {
          const dist = this.haversineDistance(filters.lat, filters.lng, loc.latitude, loc.longitude);
          return dist <= filters.radius;
        });
      }

      locations = locations.concat(visiblePending);

      // --- Time Filter (Open Now) ---
      if (filters.openNow) {
        locations = locations.filter(loc => this.checkIsOpenNow(loc));
      }

      // Smart Search Trigger
      if (filters.swLat && filters.neLat && filters.swLng && filters.neLng) {
        const swLat = parseFloat(filters.swLat);
        const neLat = parseFloat(filters.neLat);
        const swLng = parseFloat(filters.swLng);
        const neLng = parseFloat(filters.neLng);

        const centerLat = (swLat + neLat) / 2;
        const centerLng = (swLng + neLng) / 2;
        const radiusKm = Math.sqrt(Math.pow((neLat - swLat) * 111 / 2, 2) + Math.pow((neLng - swLng) * 111 * Math.cos(centerLat * Math.PI / 180) / 2, 2));

        if (!isNaN(radiusKm) && radiusKm > 0 && radiusKm < 5) {
          try {
            await this.fetchAndSaveGoogleNearby(centerLat, centerLng, radiusKm);
            const freshLocations = await locationRepository.findAll(filters);
            locations = freshLocations.concat(visiblePending); // Re-merge to avoid loss
          } catch (e) {
            console.error('Bound-based Google Fetch failed', e.message);
          }
        }
      }
      // Legacy support: radius search
      else if (filters.lat && filters.lng && filters.radius) {
        try {
          await this.fetchAndSaveGoogleNearby(filters.lat, filters.lng, filters.radius);
          const freshLocations = await locationRepository.findAll(filters);
          locations = freshLocations.concat(visiblePending);
        } catch (googleError) {
          console.error('Background Google Fetch Failed:', googleError.message);
        }
      } // --- NEW: Text Search Hybrid (Multilingual Support) ---
      else if (filters.searchTerm) {
        try {
          console.log(`Performing Hybrid Search for: "${filters.searchTerm}"`);
          // We already got DB results in `locations`.
          // Now fetch from Google Text Search
          // We use a fallback center for bias if available, else standard text search
          const googleRes = await this.searchFromGoogleAPI(filters.searchTerm,
            (filters.lat && filters.lng) ? { lat: filters.lat, lng: filters.lng } : null
          );

          if (googleRes.success && googleRes.data.length > 0) {
            const googlePlaces = googleRes.data;
            const existingSourceIds = new Set(locations.map(l => l.source_id || l.base_id)); // heuristic

            // Process Google Results
            const newLocations = [];
            for (const place of googlePlaces) {
              // 1. Save to DB (Upsert) to cache for future
              // We need to map place fields to upsertFromBase format
              const placeData = {
                source_id: place.source_id,
                name: place.name,
                address: place.address,
                latitude: place.latitude,
                longitude: place.longitude,
                source_name: place.source_name,
                is_official: true,
                place_types: place.place_types,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                opening_hours: place.opening_hours, // Pass through if available
                photo_reference: null // Text Search might not give photos, but we can try
              };

              try {
                const baseId = await locationRepository.upsertFromBase(placeData);

                // 2. If it wasn't in our initial DB result, add it to the return list
                // We check via source_id to avoid visual duplicates
                if (!existingSourceIds.has(place.source_id)) {
                  // Construct a minimal "Merged" object for frontend display
                  newLocations.push({
                    location_id: `temp_${baseId}`, // Temporary ID or we could fetch the real merged ID
                    base_id: baseId,
                    display_name: place.name,
                    address: place.address,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    source_type: 'api',
                    verification_status: 'green',
                    verification_score: 1.0,
                    google_rating: place.rating,
                    google_ratings_total: place.user_ratings_total,
                    opening_hours: place.opening_hours
                  });
                  existingSourceIds.add(place.source_id);
                }
              } catch (upsertErr) {
                console.error('Failed to upsert Google search result:', upsertErr.message);
              }
            }

            // Merge
            if (newLocations.length > 0) {
              console.log(`Merging ${newLocations.length} Google results into search.`);
              locations = locations.concat(newLocations);
            }
          }
        } catch (e) {
          console.error('Hybrid Search Google API failed:', e.message);
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

      // Append "toilet" to query if not present to ensure relevance
      let apiQuery = query;
      if (!apiQuery.toLowerCase().includes('toilet') && !apiQuery.toLowerCase().includes('restroom')) {
        apiQuery += ' toilet';
      }

      const requestBody = {
        textQuery: apiQuery,
        maxResultCount: 20,
        // includedType: 'restroom', // Removed to avoid 400 (Types are strict in New API)
        languageCode: 'ja' // changed to 'ja' to get Japanese names if possible, or 'en' if preferred. User wants multilingual support.
        // Google usually returns mixed or local. Let's stick to 'ja' or removing it to auto-detect. 
        // If user searches "Shibuya", they might want "Shibuya". 
        // Let's use 'en' as default or just remove languageCode to default. 
        // Keeping 'en' for now or maybe 'ja' since map is in Japan? 
        // Let's use 'ja' so we get "渋谷" which matches our DB/Map data better?
        // Actually user said "Searching non-Japanese terms for Japanese locations".
        // If I search "Shibuya" and get "渋谷", that's good.
      };

      requestBody.languageCode = 'ja';

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
        // If response is OK but no places, just return empty
        return { success: true, data: [] };
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
      console.warn(`New Places API failed (${error.status || error.message}), falling back to Legacy.`);
      // Fallback to old Places API if new API fails (400, 404, etc)
      return this.searchFromGoogleAPILegacy(query, location);
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
        console.log(`Duplicate found: merging UGC with existing verified location ID ${duplicate.location_id}`);

        // Update Amenities
        // Note: ugcData.amenities might be partial, but we assume it's the latest info
        if (ugcData.amenities) {
          await locationRepository.updateAmenities(duplicate.location_id, {
            ...ugcData.amenities,
            gender_type: ugcData.gender_type
          });
        }

        // Increment verification/trust score
        const trustIncrement = (user.trust_score >= 7) ? 1.0 : 0.5; // Higher trust user gives more score
        await locationRepository.incrementVerificationScore(duplicate.location_id, trustIncrement);

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

      // 3.5 Check duplicates in Pending (wc_verifications)
      // Iterate pending list (optimize with spatial query later)
      const pendingRows = await locationRepository.findAllPending();
      let pendingDuplicate = null;

      for (const row of pendingRows) {
        let pData = row.location_data;
        if (typeof pData === 'string') try { pData = JSON.parse(pData); } catch (e) { }

        const dist = this.haversineDistance(ugcData.latitude, ugcData.longitude, pData.latitude, pData.longitude);
        if (dist <= 0.05) { // 50m
          pendingDuplicate = row;
          break;
        }
      }

      if (pendingDuplicate) {
        console.log(`Pending Duplicate found: merging UGC with pending ID ${pendingDuplicate.id}`);
        // Increment pending verification score
        const trustIncrement = user.trust_score || 5;
        await locationRepository.incrementPendingVerificationScore(pendingDuplicate.id, trustIncrement);

        // TODO: Check if score enables promotion to Green/Yellow

        return {
          success: true,
          data: { location_id: `pending_${pendingDuplicate.id}`, is_merged: true },
          message: 'Location matches a pending submission. You have verified it!'
        };
      }

      // 4. No Duplicate -> Create New Pending Verification
      const initialStatus = (user.trust_score && user.trust_score >= 7) ? 'pending' : 'unverified';
      const initialScore = user.trust_score || 5; // Initial score based on creator

      // Ensure location_data contains display_name etc for frontend
      const locationPayload = {
        ...ugcData,
        display_name: ugcData.name, // Frontend expects display_name
        address: ugcData.address_input
      };

      const verificationId = await locationRepository.createVerification({
        user_id: user.user_id,
        location_data: locationPayload,
        status: initialStatus,
        verification_score: initialScore
      });

      // Log contribution
      await userRepository.incrementContribution(ugcData.user_id);

      return {
        success: true,
        data: { location_id: `pending_${verificationId}`, is_merged: false },
        message: 'Location submitted for verification. It will appear on the map soon!'
      };

      // 4. No Duplicate -> Create New (MOVED ABOVE to Pending)
      // const locationId = await locationRepository.createFromUGC(ugcData);

      // Save Amenities for new location
      /* Amenities for pending location are stored inside JSON location_data. 
         Only when approved to LOCATIONS_MERGED do we write to AMENITIES table. */
      /*
      if (ugcData.amenities) {
        await locationRepository.updateAmenities(locationId, {
          ...ugcData.amenities,
          gender_type: ugcData.gender_type
        });
      }
      */

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
  // Check if location is open now
  checkIsOpenNow(location) {
    if (!location.opening_hours) return true; // Assume open if no info? Or false? User preference. Usually assume maybe open. Assuming true for now to not hide too much.

    try {
      let schedule = location.opening_hours;
      if (typeof schedule === 'string') {
        schedule = JSON.parse(schedule);
      }

      // Google Places "open_now" field (if available directly from fresh fetch)
      if (schedule.open_now !== undefined) return schedule.open_now;

      // Logic to check periods
      if (!schedule.periods) return true;

      const now = new Date();
      // Server time is UTC or configured timezone. User is in Japan? 
      // Assumption: Node server running in same timezone or UTC.
      // Need precise day/time. Google periods are 0 (Sun) - 6 (Sat).

      // Convert now to Japan Time for accuracy if deployed elsewhere? 
      // User requested "bộ lọc thời gian là sẽ so sánh thời gian tìm kiếm hiện tại". 
      // Ideally use server time or passed client time. Using server time.
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeStr = (hours * 100) + minutes; // 1430 for 14:30

      // Find today's period
      const todaysPeriods = schedule.periods.filter(p => p.open.day === day);

      if (!todaysPeriods.length) return false; // Closed today?

      // Check if current time is within any open-close range
      for (const p of todaysPeriods) {
        // 24 hours open?
        if (p.open.time === '0000' && (!p.close || (p.close.day === day && p.close.time === '0000'))) return true; // Google indicates 24h as open day 0000 and close day-next 0000 sometimes or just open.

        // Simple same-day check
        // Note: Google close might be next day (day+1). simplified check:
        const openTime = parseInt(p.open.time);

        let closeTime = 2400;
        if (p.close) {
          closeTime = parseInt(p.close.time);
          if (p.close.day !== day) closeTime += 2400; // Spill over
        }

        if (timeStr >= openTime && timeStr < closeTime) return true;
      }
      return false;

    } catch (e) {
      return true; // Fallback
    }
  }
}

module.exports = new LocationService();

