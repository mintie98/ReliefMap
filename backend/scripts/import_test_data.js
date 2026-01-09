const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');
const LocationRepository = require('../repositories/LocationRepository');

async function importTestLocations() {
    console.log('Starting import test...');

    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_API_KEY) {
        console.error('Error: GOOGLE_MAPS_API_KEY is not defined in .env');
        process.exit(1);
    }

    // Search around Osaka Station
    const lat = 34.702485;
    const lng = 135.495951;
    const radius = 2000; // 2km radius
    const keyword = 'toilet'; // or 'restroom', 'wc'

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${keyword}&key=${GOOGLE_API_KEY}`;

    try {
        console.log(`Fetching data from Google Places API...`);
        const response = await axios.get(url);

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            console.error('Google API Error:', response.data.status, response.data.error_message);
            return;
        }

        const results = response.data.results;
        console.log(`Found ${results.length} locations. Saving to database...`);

        let successCount = 0;
        for (const place of results) {
            try {
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
                    opening_hours: place.opening_hours
                };

                await LocationRepository.upsertFromBase(placeData);
                process.stdout.write('.'); // Progress indicator
                successCount++;
            } catch (err) {
                console.error(`\nFailed to save ${place.name}:`, err.message);
            }
        }

        console.log(`\n\nImport completed! Successfully saved ${successCount} locations.`);

        // Verify data
        const saved = await LocationRepository.findAll();
        console.log(`Total merged locations in DB: ${saved.length}`);

    } catch (error) {
        console.error('Script failed:', error.message);
    } finally {
        process.exit(0);
    }
}

importTestLocations();
