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

// 📅 1. DEFINE DYNAMIC MATCH SCHEDULE
const MATCH_SCHEDULE = {
    'Free Fire': [
        { time: '12:00 AM', fee: 25, prize: 220 },
        { time: '03:00 PM', fee: 35, prize: 320 },
        { time: '06:00 PM', fee: 45, prize: 420 },
        { time: '08:00 PM', fee: 50, prize: 520 },
        { time: '10:00 PM', fee: 75, prize: 800 },
        { time: '11:00 PM', fee: 100, prize: 1100 }
    ],
    'BGMI': [
        { time: '12:00 AM', fee: 25, prize: 220 },
        { time: '02:00 PM', fee: 35, prize: 320 },
        { time: '05:00 PM', fee: 45, prize: 420 },
        { time: '07:00 PM', fee: 50, prize: 520 },
        { time: '09:00 PM', fee: 75, prize: 800 },
        { time: '11:00 PM', fee: 100, prize: 1100 }
    ]
};

// 🔄 2. HELPER FUNCTION: ENSURE LOBBIES EXIST
async function ensureLobbiesExist(gameType) {
    const slots = MATCH_SCHEDULE[gameType];
    for (const slot of slots) {
        const [existing] = await pool.query(
            'SELECT id FROM lobbies WHERE game_type = ? AND slot_time = ? AND entry_fee = ? AND status != "COMPLETED"',
            [gameType, slot.time, slot.fee]
        );

        if (existing.length === 0) {
            await pool.query(
                `INSERT INTO lobbies (game_type, slot_time, entry_fee, prize_pool, max_slots, status, lobby_no) 
                 VALUES (?, ?, ?, ?, 12, 'OPEN', 1)`,
                [gameType, slot.time, slot.fee, slot.prize]
            );
            console.log(`✨ Auto-Reset: ${gameType} lobby for ${slot.time} (Fee: ${slot.fee})`);
        }
    }
}

// 🔐 2. AUTHENTICATION
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

// 🎮 3. LOBBIES & MATCHMAKING
app.get('/api/lobbies/:game', async (req, res) => {
    try {
        const gameType = req.params.game === 'ff' ? 'Free Fire' : 'BGMI';
        const userId = parseInt(req.query.userId) || 0;
        
        // 🔄 Run the auto-generator check
        await ensureLobbiesExist(gameType);

        const [lobbies] = await pool.query(`
            SELECT l.*, 
            (SELECT COUNT(*) FROM participants p WHERE p.lobby_id = l.id AND p.user_id = ?) as isPlayer,
            (SELECT team_name FROM participants p WHERE p.lobby_id = l.id AND p.user_id = ?) as registeredTeam,
            (CASE WHEN l.host_id = ? THEN 1 ELSE 0 END) as isHost
            FROM lobbies l WHERE l.game_type = ? AND l.status != 'COMPLETED'
            ORDER BY l.entry_fee ASC`, 
            [userId, userId, userId, gameType]
        );
        res.json(lobbies);
    } catch (error) { res.status(500).json({ message: 'Error fetching lobbies' }); }
});

app.post('/api/join-lobby', async (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const lobbyId = parseInt(req.body.lobbyId);
        const [lobbies] = await pool.query('SELECT * FROM lobbies WHERE id = ?', [lobbyId]);
        const lobby = lobbies[0];
        if (lobby.host_id === userId) return res.status(400).json({ message: '🛑 Host cannot buy a player slot.' });
        const [existing] = await pool.query('SELECT * FROM participants WHERE lobby_id = ? AND user_id = ?', [lobbyId, userId]);
        if (existing.length > 0) return res.status(400).json({ message: 'Already in lobby!' });
        if (lobby.slots_filled >= lobby.max_slots) return res.status(400).json({ message: 'Lobby is full!' });
        await pool.query('INSERT INTO participants (lobby_id, user_id) VALUES (?, ?)', [lobbyId, userId]);
        await pool.query('UPDATE lobbies SET slots_filled = slots_filled + 1 WHERE id = ?', [lobbyId]);
        res.json({ message: 'Slot secured!' });
    } catch (error) { res.status(500).json({ message: 'Join failed' }); }
});

app.post('/api/leave-lobby', async (req, res) => {
    const { userId, lobbyId } = req.body;
    try {
        await pool.query('DELETE FROM participants WHERE lobby_id = ? AND user_id = ?', [lobbyId, userId]);
        await pool.query('UPDATE lobbies SET slots_filled = slots_filled - 1, status = "OPEN" WHERE id = ?', [lobbyId]);
        res.json({ message: "Slot cancelled." });
    } catch (err) { res.status(500).json({ message: "Failed to cancel slot." }); }
});

app.post('/api/host-lobby', async (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const lobbyId = parseInt(req.body.lobbyId);
        await pool.query('UPDATE lobbies SET host_id = ? WHERE id = ?', [userId, lobbyId]);
        res.json({ message: '🎧 YOU ARE NOW THE HOST!' });
    } catch (error) { res.status(500).json({ message: 'Hosting failed' }); }
});

app.post('/api/register-team', async (req, res) => {
    const { userId, lobbyId, teamName, teammates } = req.body;
    try {
        await pool.query('UPDATE participants SET team_name = ?, teammates = ? WHERE user_id = ? AND lobby_id = ?', [teamName, teammates, userId, lobbyId]);
        res.json({ message: 'TEAM REGISTERED!' });
    } catch (error) { res.status(500).json({ message: 'Registration failed' }); }
});

app.post('/api/update-room', async (req, res) => {
    try {
        const { lobbyId, roomId, roomPass, startTime } = req.body;
        await pool.query('UPDATE lobbies SET room_id = ?, room_pass = ?, start_time = ? WHERE id = ?', [roomId, roomPass, startTime, lobbyId]);
        res.json({ message: 'Credentials broadcasted!' });
    } catch (error) { res.status(500).json({ message: 'Update failed' }); }
});

app.get('/api/lobbies/room-check/:id', async (req, res) => {
    try {
        const [lobby] = await pool.query('SELECT * FROM lobbies WHERE id = ?', [req.params.id]);
        const [ratings] = await pool.query('SELECT AVG(rating) as avgRating, COUNT(rating) as totalRatings FROM host_ratings WHERE lobby_id = ?', [req.params.id]);
        res.json({ ...lobby[0], avgRating: ratings[0].avgRating || 0, totalRatings: ratings[0].totalRatings || 0 });
    } catch (error) { res.status(500).json({ message: 'Check failed' }); }
});

app.get('/api/lobby-participants/:lobbyId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT p.team_name, p.teammates, u.username FROM participants p JOIN users u ON p.user_id = u.id WHERE p.lobby_id = ?', [req.params.lobbyId]);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: 'Error fetching roster' }); }
});

// 🛡️ 4. ADMIN COMMAND CENTER (FIXED & CONSOLIDATED)
app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, email, ign, total_earnings, created_at FROM users ORDER BY id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/deposits', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, u.username FROM transactions t 
            JOIN users u ON t.user_id = u.id 
            ORDER BY t.created_at DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/withdrawals', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT w.*, u.username FROM withdrawals w 
            JOIN users u ON w.user_id = u.id 
            WHERE w.type = 'WITHDRAWAL' 
            ORDER BY w.created_at DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 📊 5. HOST STATS & SCORING
app.post('/api/host/update-stats', async (req, res) => {
    try {
        const { lobbyId, teamName, field, value } = req.body;
        await pool.query(`INSERT INTO match_stats (lobby_id, team_name, ${field}) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ${field} = ?, total_pts = kill_points + position_points`, [lobbyId, teamName, value, value]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

app.get('/api/match-stats/:lobbyId', async (req, res) => {
    try {
        const [stats] = await pool.query('SELECT * FROM match_stats WHERE lobby_id = ?', [req.params.lobbyId]);
        res.json(stats);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch match stats' }); }
});

// 💰 6. ECONOMY & TRANSACTION LEDGER
app.post('/api/create-order', async (req, res) => {
    const { userId, amount, method } = req.body;
    try {
        const orderId = `SCR_ORD_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        await pool.query('INSERT INTO transactions (user_id, order_id, amount, method, status) VALUES (?, ?, ?, ?, "PENDING")', [userId, orderId, amount, method]);
        res.json({ orderId, amount });
    } catch (error) { res.status(500).json({ message: 'Order creation failed' }); }
});

app.post('/api/verify-order', async (req, res) => {
    const { orderId, userId, amount } = req.body;
    try {
        await pool.query('UPDATE transactions SET status = "SUCCESS" WHERE order_id = ?', [orderId]);
        await pool.query('UPDATE users SET total_earnings = total_earnings + ? WHERE id = ?', [amount, userId]);
        await pool.query('INSERT INTO withdrawals (user_id, amount, upi_id, status, type) VALUES (?, ?, "SYSTEM", "COMPLETED", "DEPOSIT")', [userId, amount]);
        res.json({ message: 'PAYMENT VERIFIED' });
    } catch (error) { res.status(500).json({ message: 'Verification failed' }); }
});

app.get('/api/wallet/:userId', async (req, res) => {
    try {
        const [user] = await pool.query('SELECT total_earnings FROM users WHERE id = ?', [req.params.userId]);
        const [history] = await pool.query('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
        res.json({ balance: user[0].total_earnings, history });
    } catch (error) { res.status(500).json({ message: 'Wallet error' }); }
});

app.post('/api/withdraw', async (req, res) => {
    const { userId, amount, upiId } = req.body;
    try {
        const [user] = await pool.query('SELECT total_earnings FROM users WHERE id = ?', [userId]);
        if (user[0].total_earnings < amount) return res.status(400).json({ message: 'Insufficient Balance' });
        await pool.query('UPDATE users SET total_earnings = total_earnings - ? WHERE id = ?', [amount, userId]);
        await pool.query('INSERT INTO withdrawals (user_id, amount, upi_id, status, type) VALUES (?, ?, ?, "PENDING", "WITHDRAWAL")', [userId, amount, upiId]);
        res.json({ message: 'Withdrawal request sent!' });
    } catch (error) { res.status(500).json({ message: 'Withdraw failed' }); }
});

// 👤 7. PROFILE & SOCIAL
app.get('/api/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [userRows] = await pool.query('SELECT username, ign, total_earnings, team_name, profile_pic, security_pin FROM users WHERE id = ?', [userId]);
        const [hosted] = await pool.query('SELECT COUNT(*) as hostedCount FROM lobbies WHERE host_id = ?', [userId]);
        const [played] = await pool.query('SELECT COUNT(*) as playedCount FROM participants WHERE user_id = ?', [userId]);
        const [history] = await pool.query(`SELECT id, game_type, status, slot_time, 'PLAYER' as role FROM lobbies l JOIN participants p ON l.id = p.lobby_id WHERE p.user_id = ? UNION SELECT id, game_type, status, slot_time, 'HOST' as role FROM lobbies WHERE host_id = ? ORDER BY id DESC LIMIT 5`, [userId, userId]);
        res.json({ user: userRows[0], stats: { hosted: hosted[0].hostedCount, played: played[0].playedCount }, history });
    } catch (error) { res.status(500).json({ message: 'Error fetching profile' }); }
});

app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        const imageUrl = `/uploads/${req.file.filename}`;
        await pool.query('UPDATE users SET profile_pic = ? WHERE id = ?', [imageUrl, req.body.userId]);
        res.json({ message: 'Avatar updated!', imageUrl });
    } catch (err) { res.status(500).json({ message: 'Upload failed.' }); }
});

// 🏆 8. GLOBAL LEADERBOARD
app.get('/api/leaderboard', async (req, res) => {
    try {
        const [leaderboard] = await pool.query(`SELECT team_name, SUM(total_pts) as total_score FROM match_stats WHERE team_name IS NOT NULL GROUP BY team_name ORDER BY total_score DESC LIMIT 10`);
        res.json(leaderboard);
    } catch (error) { res.status(500).json({ message: 'Error fetching leaderboard' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on Port ${PORT}`);
});