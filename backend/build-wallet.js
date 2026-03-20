const mysql = require('mysql2/promise');

async function buildWallet() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost', user: 'root', 
            password: 'Jatin@123', // 👈 PASSWORD
            database: 'scrims_s'
        });

        console.log("⏳ Forging Withdrawal Ledger...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                amount DECIMAL(10,2) NOT NULL,
                upi_id VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);
        console.log("🔥 WALLET DATABASE ONLINE.");
        process.exit();
    } catch (err) { console.error(err); process.exit(1); }
}
buildWallet();