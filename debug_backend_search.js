const locationService = require('./backend/services/LocationService');
const db = require('./backend/config/database');

async function debugBackendSearch() {
    try {
        const filters = {
            searchTerm: 'ECC',
            lat: 34.706,
            lng: 135.503,
            radius: 1
        };

        console.log('Searching via LocationService...');
        const result = await locationService.searchLocations(filters);

        if (result.success) {
            console.log(`Found ${result.data.length} locations.`);
            result.data.forEach(loc => {
                if (loc.display_name && loc.display_name.includes('ECC') || (loc.name && loc.name.includes('ECC'))) {
                    console.log('\n--- MATCH ---');
                    console.log('ID:', loc.location_id);
                    console.log('Display Name:', loc.display_name);
                    console.log('Name:', loc.name); // Pending ones might have this
                    console.log('Address:', loc.address);
                    console.log('Address Input:', loc.address_input);
                    console.log('Status:', loc.verification_status);
                    // Inspect raw object keys to see what's available
                    console.log('Keys:', Object.keys(loc));
                }
            });
        } else {
            console.error('Search failed:', result.error);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugBackendSearch();
