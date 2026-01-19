const authService = require('./services/AuthService');
require('dotenv').config();

async function test() {
    console.log('Testing login for thanh@thanh.com...');
    try {
        const result = await authService.login('thanh@thanh.com', 'wrongpassword');
        console.log('Result for wrong password:', result);
    } catch (error) {
        console.error('Error for wrong password:', error);
    }

    console.log('\nTesting login for admin@reliefmap.com (suspected malformed hash)...');
    try {
        const result = await authService.login('admin@reliefmap.com', 'any');
        console.log('Result for admin:', result);
    } catch (error) {
        console.error('Error for admin (EXACT STACK TRACE):', error);
    }
}

test().then(() => process.exit());
