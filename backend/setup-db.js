const mysql = require('mysql2/promise');

async function buildDatabase() {
    try {
        console.log("⏳ Connecting to MySQL...");
        // Connect WITHOUT specifying a database first
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Jatin@123'
        });

        console.log("✅ Connected! Creating 'scrims_s' database...");
        await connection.query("CREATE DATABASE IF NOT EXISTS scrims_s;");
        
        console.log("✅ Database ready! Creating 'users' table...");
        await connection.query("USE scrims_s;");
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                ign VARCHAR(50) DEFAULT 'Player',
                profile_pic VARCHAR(255) DEFAULT 'default.png',
                total_earnings DECIMAL(10,2) DEFAULT 0.00,
                host_rating DECIMAL(3,2) DEFAULT 0.00,
                total_ratings_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("🚀 BOOM! Database and Tables are 100% ready.");
        process.exit();
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        console.log("Make sure XAMPP/WAMP MySQL is actually running!");
        process.exit(1);
    }
}

buildDatabase();