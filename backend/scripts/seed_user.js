const db = require('../config/database');

async function seedUser() {
    try {
        const connection = await db.getConnection();
        try {
            // Check if user 1 exists
            const [rows] = await connection.execute('SELECT * FROM USERS WHERE user_id = 1');
            if (rows.length === 0) {
                console.log('Inserting default user...');
                await connection.execute(`
          INSERT INTO USERS (
             user_id, user_name, email, preferred_language, user_role, auth_provider, created_at
          ) VALUES (
             1, 'Guest User', 'guest@reliefmap.com', 'ja', 'general', 'local', NOW()
          )
        `);
                console.log('Default user (ID: 1) created.');
            } else {
                console.log('Default user (ID: 1) already exists.');
            }
        } finally {
            connection.release();
        }
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seedUser();
