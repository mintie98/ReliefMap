const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');
const LocationRepository = require('../repositories/LocationRepository');

async function testBoundsSearch() {
    console.log('Testing Bounds Search...');

    // Osaka Station coordinates
    // roughly: 34.702485, 135.495951

    // Define a bounding box around Osaka Station (small area)
    // SW: 34.69, 135.48
    // NE: 34.71, 135.51
    const filters = {
        swLat: 34.69,
        swLng: 135.48,
        neLat: 34.71,
        neLng: 135.51
    };

    console.log('Searching within bounds:', filters);

    try {
        const locations = await LocationRepository.findAll(filters);
        console.log(`Found ${locations.length} locations within the box.`);

        if (locations.length > 0) {
            console.log('Sample location:', locations[0].display_name);
        } else {
            console.log('No locations found. (Did you run the previous import?)');
        }

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        process.exit(0);
    }
}

testBoundsSearch();
