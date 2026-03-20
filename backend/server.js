 const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// 📁 SETUP FILE UPLOADS
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// 🚀 CLOUD DATABASE CONNECTION
const pool = mysql.createPool({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2e5zxGGtzoeG9UH.root',
    password: '67yI0sUrvCXjd2x2', 
    database: 'test',
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
});

// 🎮 1. MASTER CONFIG
const SLOT_COUNTS = { 'Free Fire': 12, 'BGMI': 25 };
const TIMES = ['12:00 AM', '03:00 PM', '06:00 PM', '09:00 PM'];
const TIERS = [
    { fee: 25, prize: 250 }, 
    { fee: 35, prize: 350 }, 
    { fee: 45, prize: 450 },
    { fee: 50, prize: 500 }, 
    { fee: 75, prize: 750 }, 
    { fee: 100, prize: 1000 }
];

// 🔄 2. SEQUENTIAL AUTO-GENERATOR
// Spawns Lobby 1 initially, then only spawns Lobby 2 if Lobby 1 is 'FULL'
async function ensureLobbiesExist(gameType) {
    const maxSlots = SLOT_COUNTS[gameType] || 12;

    for (const time of TIMES) {
        for (const tier of TIERS) {
            const [rows] = await pool.query(
                `SELECT lobby_no, status FROM lobbies 
                 WHERE game_type = ? AND slot_time = ? AND entry_fee = ? 
                 ORDER BY lobby_no DESC LIMIT 1`,
                [gameType, time, tier.fee]
            );

            if (rows.length === 0) {
                // Initialize first lobby
                await pool.query(
                    `INSERT INTO lobbies (game_type, slot_time, entry_fee, prize_pool, max_slots, slots_filled, status, lobby_no) 
                     VALUES (?, ?, ?, ?, ?, 0, 'OPEN', 1)`,
                    [gameType, time, tier.fee, tier.prize, maxSlots]
                );
            } else if (rows[0].status === 'FULL') {
                // Spawn next sequential lobby only if latest is full
                const nextNo = rows[0].lobby_no + 1;
                await pool.query(
                    `INSERT INTO lobbies (game_type, slot_time, entry_fee, prize_pool, max_slots, slots_filled, status, lobby_no) 
                     VALUES (?, ?, ?, ?, ?, 0, 'OPEN', ?)`,
                    [gameType, time, tier.fee, tier.prize, maxSlots, nextNo]
                );
            }
        }
    }
}

// 🔐 3. AUTHENTICATION
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) return res.status(400).json({ message: 'User already exists!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await pool.query('INSERT INTO users (username, email, password, ign) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, username]);
        const token = jwt.sign({ id: result.insertId }, 'scrims_super_secret_key_2026', { expiresIn: '7d' });
        res.status(201).json({ message: 'Account created!', token, user: { id: result.insertId, username, email } });
    } catch (error) { res.status(500).json({ message: 'Registration failed' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id }, 'scrims_super_secret_key_2026', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, ign: user.ign } });
    } catch (error) { res.status(500).json({ message: 'Login failed' }); }
});

// 🎮 4. LOBBIES & ACTION ROUTES (With Anti-Cheat)
app.get('/api/lobbies/:game', async (req, res) => {
    try {
        const gameType = req.params.game === 'ff' ? 'Free Fire' : 'BGMI';
        const userId = parseInt(req.query.userId) || 0;
        await ensureLobbiesExist(gameType);
        
        const [lobbies] = await pool.query(`
            SELECT l.*, 
            (SELECT COUNT(*) FROM participants p WHERE p.lobby_id = l.id AND p.user_id = ?) as isPlayer,
            (CASE WHEN l.host_id = ? THEN 1 ELSE 0 END) as isHost
            FROM lobbies l WHERE l.game_type = ? AND l.status != 'COMPLETED'
            ORDER BY l.entry_fee ASC, l.lobby_no ASC`, 
            [userId, userId, gameType]
        );
        res.json(lobbies);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/join-lobby', async (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const lobbyId = parseInt(req.body.lobbyId);

        const [lobbies] = await pool.query('SELECT * FROM lobbies WHERE id = ?', [lobbyId]);
        if (lobbies.length === 0) return res.status(404).json({ message: 'Lobby not found' });
        const lobby = lobbies[0];

        // 🛡️ ANTI-CHEAT: Host cannot play in their own lobby
        if (lobby.host_id === userId) {
            return res.status(400).json({ message: '🛑 COMMANDERS CANNOT DEPLOY IN THEIR OWN ARENA.' });
        }

        const [existing] = await pool.query('SELECT * FROM participants WHERE lobby_id = ? AND user_id = ?', [lobbyId, userId]);
        if (existing.length > 0) return res.status(400).json({ message: 'ALREADY DEPLOYED.' });
        if (lobby.slots_filled >= lobby.max_slots) return res.status(400).json({ message: 'ARENA FULL.' });

        await pool.query('INSERT INTO participants (lobby_id, user_id) VALUES (?, ?)', [lobbyId, userId]);
        
        const newFilled = lobby.slots_filled + 1;
        const newStatus = newFilled >= lobby.max_slots ? 'FULL' : 'OPEN';
        await pool.query('UPDATE lobbies SET slots_filled = ?, status = ? WHERE id = ?', [newFilled, newStatus, lobbyId]);

        res.json({ message: 'SLOT SECURED' });
    } catch (error) { res.status(500).json({ message: 'Join failed' }); }
});

app.post('/api/host-lobby', async (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const lobbyId = parseInt(req.body.lobbyId);

        // 🛡️ ANTI-CHEAT: Registered players cannot host this specific lobby
        const [asPlayer] = await pool.query('SELECT * FROM participants WHERE lobby_id = ? AND user_id = ?', [lobbyId, userId]);
        if (asPlayer.length > 0) {
            return res.status(400).json({ message: '🛑 PLAYERS CANNOT CLAIM COMMAND. ABORT MISSION FIRST.' });
        }

        const [lobby] = await pool.query('SELECT host_id FROM lobbies WHERE id = ?', [lobbyId]);
        if (lobby[0].host_id !== null) return res.status(400).json({ message: 'ARENA ALREADY ASSIGNED.' });

        await pool.query('UPDATE lobbies SET host_id = ? WHERE id = ?', [userId, lobbyId]);
        res.json({ message: 'COMMAND ACQUIRED' });
    } catch (error) { res.status(500).json({ message: 'Hosting failed' }); }
});

app.post('/api/register-team', async (req, res) => {
    try {
        const { userId, lobbyId, teamName, teammates } = req.body;
        await pool.query('UPDATE participants SET team_name = ?, teammates = ? WHERE user_id = ? AND lobby_id = ?', [teamName, teammates, userId, lobbyId]);
        res.json({ message: 'TEAM REGISTERED SUCCESSFULLY!' });
    } catch (error) { res.status(500).json({ message: 'Registration failed' }); }
});

// 🚀 5. DASHBOARD & STATS
app.get('/api/my-active-matches/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT l.*, 'PLAYER' as role FROM lobbies l
            JOIN participants p ON l.id = p.lobby_id
            WHERE p.user_id = ? AND l.status != 'COMPLETED'
            UNION
            SELECT *, 'HOST' as role FROM lobbies WHERE host_id = ? AND status != 'COMPLETED'
        `, [req.params.userId, req.params.userId]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 💰 6. ECONOMY
app.post('/api/create-order', async (req, res) => {
    const { userId, amount, method } = req.body;
    const orderId = `SCR_ORD_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await pool.query('INSERT INTO transactions (user_id, order_id, amount, method, status) VALUES (?, ?, ?, ?, "PENDING")', [userId, orderId, amount, method]);
    res.json({ orderId, amount });
});

app.post('/api/verify-order', async (req, res) => {
    const { orderId, userId, amount } = req.body;
    await pool.query('UPDATE transactions SET status = "SUCCESS" WHERE order_id = ?', [orderId]);
    await pool.query('UPDATE users SET total_earnings = total_earnings + ? WHERE id = ?', [amount, userId]);
    await pool.query('INSERT INTO withdrawals (user_id, amount, upi_id, status, type) VALUES (?, ?, "SYSTEM", "COMPLETED", "DEPOSIT")', [userId, amount]);
    res.json({ message: 'VERIFIED' });
});

app.get('/api/wallet/:userId', async (req, res) => {
    const [user] = await pool.query('SELECT total_earnings FROM users WHERE id = ?', [req.params.userId]);
    const [history] = await pool.query('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
    res.json({ balance: user[0].total_earnings, history });
});

// 🏆 7. LEADERBOARD
app.get('/api/leaderboard', async (req, res) => {
    const [rows] = await pool.query(`SELECT team_name, SUM(total_pts) as total_score FROM match_stats GROUP BY team_name ORDER BY total_score DESC LIMIT 10`);
    res.json(rows);
});

// 🛡️ 8. ADMIN COMMAND CENTER
app.get('/api/admin/users', async (req, res) => {
    const [rows] = await pool.query('SELECT id, username, email, ign, total_earnings FROM users ORDER BY id DESC');
    res.json(rows);
});

app.get('/api/admin/deposits', async (req, res) => {
    const [rows] = await pool.query(`SELECT t.*, u.username FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC`);
    res.json(rows);
});

app.get('/api/admin/withdrawals', async (req, res) => {
    const [rows] = await pool.query(`SELECT w.*, u.username FROM withdrawals w JOIN users u ON w.user_id = u.id WHERE w.type = 'WITHDRAWAL' ORDER BY w.created_at DESC`);
    res.json(rows);
});

const PORT = process.env.PORT || 5000;

// Render needs "0.0.0.0" to communicate with the outside world
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SCRIMS S System Online on Port ${PORT}`);
});