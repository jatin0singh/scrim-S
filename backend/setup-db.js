 const mysql = require('mysql2/promise');

const setupDatabase = async () => {
    // 🚀 CLOUD DATABASE CONNECTION
    const pool = mysql.createPool({
        host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '2e5zxGGtzoeG9UH.root',
        password: '67yI0sUrvCXjd2x2', // 🔴 PUT YOUR REAL PASSWORD HERE
        database: 'test',
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        }
    });

    try {
        console.log("📡 Connecting to TiDB Cloud...");

        // 1. USERS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                ign VARCHAR(255),
                total_earnings DECIMAL(10, 2) DEFAULT 0.00,
                team_name VARCHAR(255),
                profile_pic VARCHAR(500),
                security_pin VARCHAR(4),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. LOBBIES
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lobbies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                game_type VARCHAR(50) NOT NULL,
                slot_time VARCHAR(50) NOT NULL,
                entry_fee INT DEFAULT 0,
                prize_pool INT DEFAULT 0,
                max_slots INT DEFAULT 12,
                slots_filled INT DEFAULT 0,
                status VARCHAR(50) DEFAULT 'OPEN',
                lobby_no INT DEFAULT 1,
                host_id INT,
                room_id VARCHAR(100),
                room_pass VARCHAR(100),
                start_time VARCHAR(50),
                chat_enabled BOOLEAN DEFAULT TRUE,
                uploads_enabled BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. PARTICIPANTS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS participants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lobby_id INT NOT NULL,
                user_id INT NOT NULL,
                team_name VARCHAR(255),
                teammates TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. TEAMS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teams (
                id INT AUTO_INCREMENT PRIMARY KEY,
                team_name VARCHAR(255) UNIQUE NOT NULL,
                team_code VARCHAR(50) UNIQUE NOT NULL,
                leader_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. MATCH STATS (🏆 THE NEW TABLE!)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS match_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lobby_id INT NOT NULL,
                team_name VARCHAR(255) NOT NULL,
                matches INT DEFAULT 0,
                booyahs INT DEFAULT 0,
                kill_points INT DEFAULT 0,
                position_points INT DEFAULT 0,
                total_pts INT DEFAULT 0,
                UNIQUE KEY unique_team_lobby (lobby_id, team_name)
            )
        `);

        // 6. WITHDRAWALS & TRANSACTIONS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                upi_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'PENDING',
                type VARCHAR(50) DEFAULT 'WITHDRAWAL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                order_id VARCHAR(100) UNIQUE NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                method VARCHAR(50),
                status VARCHAR(50) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 7. HOST RATINGS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS host_ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lobby_id INT NOT NULL,
                host_id INT NOT NULL,
                player_id INT NOT NULL,
                rating INT NOT NULL,
                UNIQUE KEY unique_rating (lobby_id, player_id)
            )
        `);

        // 8. PROOFS & CHAT
        await pool.query(`
            CREATE TABLE IF NOT EXISTS player_proofs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lobby_id INT NOT NULL,
                user_id INT NOT NULL,
                image_url VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS lobby_chat (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lobby_id INT NOT NULL,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ All Database Tables Created Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error setting up database:", error);
        process.exit(1);
    }
};

setupDatabase();