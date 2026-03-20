 const mysql = require('mysql2/promise');

async function rebuildArena() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Jatin@123', 
            database: 'scrims_s'
        });

        // 🧨 This clears out the old ₹25 only data
        await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
        await connection.query("TRUNCATE TABLE participants;");
        await connection.query("TRUNCATE TABLE lobbies;");
        await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

        console.log("🧹 Old Arena Cleared...");

        const times = ['12 AM', '3 PM', '6 PM', '9 PM'];
        
        // 💰 All the Tiers you wanted: 25, 35, 45, 50, 75, 100
        const tiers = [25, 35, 45, 50, 75, 100];

        for (const time of times) {
            for (const fee of tiers) {
                // Seed Free Fire (12 Slots)
                await connection.query(`
                    INSERT INTO lobbies (game_type, slot_time, entry_fee, prize_pool, max_slots, status) 
                    VALUES ('Free Fire', ?, ?, ?, 12, 'OPEN')`, 
                    [time, fee, fee * 10] 
                );

                // Seed BGMI (25 Slots)
                await connection.query(`
                    INSERT INTO lobbies (game_type, slot_time, entry_fee, prize_pool, max_slots, status) 
                    VALUES ('BGMI', ?, ?, ?, 25, 'OPEN')`, 
                    [time, fee, fee * 15] 
                );
            }
        }

        console.log("✅ SUCCESS: 48 New Multi-Tier Lobbies created!");
        process.exit();
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}
rebuildArena();