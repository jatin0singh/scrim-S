const mysql = require('mysql2/promise');

async function buildResults() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost', user: 'root', 
            password: 'Jatin@123
', // 👈 PASSWORD HERE
            database: 'scrims_s'
        });

        console.log("⏳ Forging Match Results Table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS match_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lobby_id INT,
                user_id INT,
                rank_attained INT,
                kills INT,
                winnings DECIMAL(10,2) DEFAULT 0.00,
                FOREIGN KEY (lobby_id) REFERENCES lobbies(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        console.log("🔥 RESULTS ENGINE ONLINE.");
        process.exit();
    } catch (err) { console.error(err); process.exit(1); }
}
buildResults();