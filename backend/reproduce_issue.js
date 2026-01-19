const locationService = require('./services/LocationService');
require('dotenv').config();

async function test() {
  try {
    const filters = {
      lat: 34.65174111216711,
      lng: 135.50210838038166,
      radius: 5,
      swLat: 34.63318134070366,
      swLng: 135.45889262873368,
      neLat: 34.66784955490723,
      neLng: 135.5211198778792
    };
    console.log('Testing searchLocations...');
    await locationService.searchLocations(filters);
    console.log('Success!');
    process.exit(0);
  } catch (error) {
    console.log('--- ERROR START ---');
    console.log(error.message);
    if (error.sqlMessage) console.log('SQL Message:', error.sqlMessage);
    if (error.sql) console.log('SQL Query:', error.sql);
    console.log('--- ERROR END ---');
    process.exit(1);
  }
}

test();
