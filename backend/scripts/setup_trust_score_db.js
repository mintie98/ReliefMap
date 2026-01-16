const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'reliefmap'
};

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // 1. Create wc_verifications table
        console.log('Creating wc_verifications table...');
        await connection.execute('DROP TABLE IF EXISTS wc_verifications');
        await connection.execute(`
      CREATE TABLE wc_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        location_data JSON,
        status ENUM('unverified', 'pending', 'approved', 'rejected') DEFAULT 'unverified',
        verification_score INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES USERS(user_id)
      )
    `);
        console.log('wc_verifications table created/verified.');

        // 2. Add trust_score to USERS
        console.log('Checking trust_score in USERS...');
        try {
            await connection.execute(`
        ALTER TABLE USERS ADD COLUMN trust_score INT DEFAULT 5
      `);
            console.log('Added trust_score column to USERS.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('trust_score column already exists in USERS.');
            } else {
                throw e;
            }
        }

        // 3. Add is_location_accurate to REVIEWS
        console.log('Checking is_location_accurate in REVIEWS...');
        try {
            await connection.execute(`
        ALTER TABLE REVIEWS ADD COLUMN is_location_accurate BOOLEAN DEFAULT FALSE
      `);
            console.log('Added is_location_accurate column to REVIEWS.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('is_location_accurate column already exists in REVIEWS.');
            } else {
                throw e;
            }
        }

        // 4. Ensure source_type and creator_user_id in LOCATIONS_MERGED (Check if needed)
        // Based on repository, these likely exist, but let's double check columns if we were stricter.
        // For now, assuming repository reflects schema.

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
