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
    password: '67yI0sUrvCXjd2x2', // 🔴 Put your real password here!
    database: 'test',
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
});
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
        
        const [lobbies] = await pool.query(`
            SELECT l.*, 
            (SELECT COUNT(*) FROM participants p WHERE p.lobby_id = l.id AND p.user_id = ?) as isPlayer,
            (SELECT team_name FROM participants p WHERE p.lobby_id = l.id AND p.user_id = ?) as registeredTeam,
            (CASE WHEN l.host_id = ? THEN 1 ELSE 0 END) as isHost
            FROM lobbies l WHERE l.game_type = ? AND l.status != 'COMPLETED'
            ORDER BY l.lobby_no ASC`, 
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
        const newCount = lobby.slots_filled + 1;
        
        await pool.query('UPDATE lobbies SET slots_filled = ? WHERE id = ?', [newCount, lobbyId]);

        if (newCount >= lobby.max_slots) {
            await pool.query('UPDATE lobbies SET status = "FULL" WHERE id = ?', [lobbyId]);
            const [countResult] = await pool.query(
                'SELECT MAX(lobby_no) as maxNo FROM lobbies WHERE game_type = ? AND slot_time = ? AND entry_fee = ?',
                [lobby.game_type, lobby.slot_time, lobby.entry_fee]
            );
            const nextLobbyNo = (countResult[0].maxNo || 1) + 1;

            await pool.query(
                `INSERT INTO lobbies (game_type, slot_time, entry_fee, prize_pool, max_slots, status, lobby_no) 
                 VALUES (?, ?, ?, ?, ?, 'OPEN', ?)`, 
                [lobby.game_type, lobby.slot_time, lobby.entry_fee, lobby.prize_pool, lobby.max_slots, nextLobbyNo]
            );
        }
        res.json({ message: 'Slot secured!' });
    } catch (error) { res.status(500).json({ message: 'Join failed' }); }
});

app.post('/api/leave-lobby', async (req, res) => {
    const { userId, lobbyId } = req.body;
    try {
        const [participant] = await pool.query('SELECT * FROM participants WHERE lobby_id = ? AND user_id = ?', [lobbyId, userId]);
        if (participant.length === 0) return res.status(400).json({ message: "You aren't in this lobby." });

        await pool.query('DELETE FROM participants WHERE lobby_id = ? AND user_id = ?', [lobbyId, userId]);
        await pool.query('UPDATE lobbies SET slots_filled = slots_filled - 1, status = "OPEN" WHERE id = ?', [lobbyId]);

        res.json({ message: "Slot cancelled. Your entry has been removed." });
    } catch (err) { res.status(500).json({ message: "Failed to cancel slot." }); }
});

app.post('/api/host-lobby', async (req, res) => {
    try {
        const userId = parseInt(req.body.userId);
        const lobbyId = parseInt(req.body.lobbyId);
        const [pCheck] = await pool.query('SELECT COUNT(*) as count FROM participants WHERE lobby_id = ? AND user_id = ?', [lobbyId, userId]);
        if (pCheck[0].count > 0) return res.status(400).json({ message: '🛑 ANTI-CHEAT: Player cannot host.' });

        const [lobby] = await pool.query('SELECT host_id FROM lobbies WHERE id = ?', [lobbyId]);
        if (lobby[0].host_id !== null) return res.status(400).json({ message: 'Lobby already has a host!' });

        await pool.query('UPDATE lobbies SET host_id = ? WHERE id = ?', [userId, lobbyId]);
        res.json({ message: '🎧 YOU ARE NOW THE HOST!' });
    } catch (error) { res.status(500).json({ message: 'Hosting failed' }); }
});

app.post('/api/transfer-host', async (req, res) => {
    try {
        const { currentHostId, lobbyId, targetUsername } = req.body;
        const [lobby] = await pool.query('SELECT host_id FROM lobbies WHERE id = ?', [lobbyId]);
        if (!lobby[0] || lobby[0].host_id !== parseInt(currentHostId)) return res.status(403).json({ message: '🛑 No permission.' });

        const [targetUser] = await pool.query('SELECT id FROM users WHERE username = ?', [targetUsername]);
        if (targetUser.length === 0) return res.status(404).json({ message: 'Target not found.' });

        await pool.query('UPDATE lobbies SET host_id = ? WHERE id = ?', [targetUser[0].id, lobbyId]);
        res.json({ message: `🔄 Host rights transferred!` });
    } catch (error) { res.status(500).json({ message: 'Transfer failed' }); }
});

app.post('/api/register-team', async (req, res) => {
    const { userId, lobbyId, teamName, teammates } = req.body;
    try {
        await pool.query('UPDATE participants SET team_name = ?, teammates = ? WHERE user_id = ? AND lobby_id = ?', [teamName, teammates, userId, lobbyId]);
        res.json({ message: 'TEAM REGISTERED FOR BATTLE!' });
    } catch (error) { res.status(500).json({ message: 'Registration failed' }); }
});

app.post('/api/update-room', async (req, res) => {
    try {
        const { lobbyId, roomId, roomPass, startTime } = req.body;
        await pool.query('UPDATE lobbies SET room_id = ?, room_pass = ?, start_time = ? WHERE id = ?', [roomId, roomPass, startTime, lobbyId]);
        res.json({ message: 'Credentials & Time broadcasted!' });
    } catch (error) { res.status(500).json({ message: 'Update failed' }); }
});

app.get('/api/lobbies/room-check/:id', async (req, res) => {
    try {
        const [lobby] = await pool.query('SELECT room_id, room_pass, chat_enabled, uploads_enabled, start_time, slot_time, host_id, entry_fee FROM lobbies WHERE id = ?', [req.params.id]);
        if(lobby.length === 0) return res.json({});

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

// 📊 HOST STATS & SCORING
app.post('/api/host/toggle', async (req, res) => {
    try { 
        await pool.query(`UPDATE lobbies SET ${req.body.field} = ? WHERE id = ?`, [req.body.value, req.body.lobbyId]); 
        res.json({ success: true }); 
    } catch (err) { res.status(500).send(err); }
});

app.post('/api/host/update-stats', async (req, res) => {
    try {
        await pool.query(`INSERT INTO match_stats (lobby_id, team_name, ${req.body.field}) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ${req.body.field} = ?, total_pts = kill_points + position_points`, [req.body.lobbyId, req.body.teamName, req.body.value, req.body.value]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// ✅ NEW: FETCH MATCH STATS FOR HOST PANEL
app.get('/api/match-stats/:lobbyId', async (req, res) => {
    try {
        const [stats] = await pool.query('SELECT * FROM match_stats WHERE lobby_id = ?', [req.params.lobbyId]);
        res.json(stats);
    } catch (error) {
        console.error("Stats Fetch Error:", error);
        res.status(500).json({ message: 'Failed to fetch match stats' });
    }
});

// ⭐ HOST RATING & PAYOUT SYSTEM (RESTORED)
app.post('/api/rate-host', async (req, res) => {
    const { lobbyId, hostId, playerId, rating } = req.body;
    try {
        await pool.query(
            'INSERT INTO host_ratings (lobby_id, host_id, player_id, rating) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?',
            [lobbyId, hostId, playerId, rating, rating]
        );
        res.json({ success: true, message: 'Rating submitted!' });
    } catch (err) { res.status(500).json({ message: 'Rating failed' }); }
});

app.post('/api/host/complete-match', async (req, res) => {
    const { lobbyId, hostId } = req.body;
    try {
        const [lobbies] = await pool.query('SELECT entry_fee, status FROM lobbies WHERE id = ?', [lobbyId]);
        const lobby = lobbies[0];
        if (lobby.status === 'COMPLETED') return res.status(400).json({ message: 'Match is already completed!' });

        const [ratings] = await pool.query('SELECT AVG(rating) as avgRating FROM host_ratings WHERE lobby_id = ?', [lobbyId]);
        const avgRating = ratings[0].avgRating || 0;

        let hostPayout = 50; 
        if (lobby.entry_fee === 25 && avgRating <= 3 && avgRating > 0) {
             hostPayout = 0; 
        }

        if (hostPayout > 0) {
            await pool.query('UPDATE users SET total_earnings = total_earnings + ? WHERE id = ?', [hostPayout, hostId]);
        }

        await pool.query('UPDATE lobbies SET status = "COMPLETED" WHERE id = ?', [lobbyId]);
        res.json({ message: `Match Completed! You earned ₹${hostPayout}` });
    } catch (err) { res.status(500).json({ message: 'Completion failed' }); }
});

// 🖼️ PROOFS UPLOAD & GALLERY (RESTORED)
app.post('/api/upload-proof', upload.single('proof'), async (req, res) => {
    try {
        const [lobby] = await pool.query('SELECT uploads_enabled, host_id FROM lobbies WHERE id = ?', [req.body.lobbyId]);
        if (lobby[0] && lobby[0].uploads_enabled === 0 && lobby[0].host_id !== parseInt(req.body.userId)) {
            return res.status(403).json({ message: 'Uploads are locked by the host.' });
        }
        if (!req.file) return res.status(400).json({ message: 'No image provided.' });
        await pool.query('INSERT INTO player_proofs (lobby_id, user_id, image_url) VALUES (?, ?, ?)', [req.body.lobbyId, req.body.userId, `/uploads/${req.file.filename}`]);
        res.json({ message: 'Proof submitted successfully!', imageUrl: `/uploads/${req.file.filename}` });
    } catch (err) { res.status(500).json({ message: 'Upload failed.' }); }
});

app.get('/api/proofs/:lobbyId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT p.*, u.username, part.team_name FROM player_proofs p JOIN users u ON p.user_id = u.id LEFT JOIN participants part ON p.lobby_id = part.lobby_id AND p.user_id = part.user_id WHERE p.lobby_id = ?', [req.params.lobbyId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: 'Failed to fetch proofs' }); }
});

// 💬 CHAT SYSTEM
app.get('/api/chat/:lobbyId', async (req, res) => {
    try { const [chat] = await pool.query('SELECT c.message, u.username, c.created_at FROM lobby_chat c JOIN users u ON c.user_id = u.id WHERE c.lobby_id = ? ORDER BY c.created_at ASC', [req.params.lobbyId]); res.json(chat); } catch (err) { res.status(500).json({ message: 'Chat fetch failed' }); }
});
app.post('/api/chat/send', async (req, res) => {
    try {
        const [lobby] = await pool.query('SELECT chat_enabled FROM lobbies WHERE id = ?', [req.body.lobbyId]);
        if (lobby[0] && lobby[0].chat_enabled === 0) return res.status(403).json({ message: 'Chat is disabled.' });
        await pool.query('INSERT INTO lobby_chat (lobby_id, user_id, message) VALUES (?, ?, ?)', [req.body.lobbyId, req.body.userId, req.body.message]); res.json({ success: true });
    } catch (err) { res.status(500).json({ message: 'Chat send failed' }); }
});

// 🔐 PROFILE, SECURITY PIN & AVATARS
app.post('/api/profile/set-pin', async (req, res) => {
    const { userId, newPin } = req.body;
    try {
        await pool.query('UPDATE users SET security_pin = ? WHERE id = ?', [newPin, userId]);
        res.json({ success: true, message: 'SECURITY PIN UPDATED' });
    } catch (err) { res.status(500).json({ message: 'Failed to update PIN' }); }
});

app.post('/api/profile/reset-pin-with-password', async (req, res) => {
    const { userId, password, newPin } = req.body;
    try {
        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, users[0].password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "INCORRECT ACCOUNT PASSWORD" });
        }

        await pool.query('UPDATE users SET security_pin = ? WHERE id = ?', [newPin, userId]);
        res.json({ success: true, message: "SECURITY PIN RESET SUCCESSFUL" });
    } catch (err) { res.status(500).json({ message: "Internal server error during reset" }); }
});

app.post('/api/verify-pin', async (req, res) => {
    const { userId, pin } = req.body;
    try {
        const [user] = await pool.query('SELECT security_pin FROM users WHERE id = ?', [userId]);
        if (user[0].security_pin === pin) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'INVALID SECURITY PIN' });
        }
    } catch (err) { res.status(500).json({ message: 'Verification error' }); }
});

app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image provided.' });
        const imageUrl = `/uploads/${req.file.filename}`;
        await pool.query('UPDATE users SET profile_pic = ? WHERE id = ?', [imageUrl, req.body.userId]);
        res.json({ message: 'Avatar updated successfully!', imageUrl });
    } catch (err) { res.status(500).json({ message: 'Avatar upload failed.' }); }
});

app.post('/api/profile/remove-avatar', async (req, res) => {
    try {
        await pool.query('UPDATE users SET profile_pic = NULL WHERE id = ?', [req.body.userId]);
        res.json({ success: true, message: 'Visual signature deleted.' });
    } catch (err) { res.status(500).json({ message: 'Deletion failed.' }); }
});

app.get('/api/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [userRows] = await pool.query('SELECT username, ign, total_earnings, team_name, profile_pic, security_pin FROM users WHERE id = ?', [userId]);
        if(userRows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        let teamCode = null;
        let teamMembers = [];

        if (userRows[0].team_name) {
            const [teamRows] = await pool.query('SELECT team_code FROM teams WHERE team_name = ?', [userRows[0].team_name]);
            if (teamRows.length > 0) teamCode = teamRows[0].team_code;
            const [memberRows] = await pool.query('SELECT username, ign, profile_pic FROM users WHERE team_name = ?', [userRows[0].team_name]);
            teamMembers = memberRows;
        }

        const [ratings] = await pool.query('SELECT AVG(rating) as avgRating, COUNT(rating) as totalRatings FROM host_ratings WHERE host_id = ?', [userId]);
        const [hosted] = await pool.query('SELECT COUNT(*) as hostedCount FROM lobbies WHERE host_id = ?', [userId]);
        const [played] = await pool.query('SELECT COUNT(*) as playedCount FROM participants WHERE user_id = ?', [userId]);
        const [wins] = await pool.query(`SELECT SUM(ms.booyahs) as totalWins FROM match_stats ms JOIN participants p ON ms.lobby_id = p.lobby_id AND ms.team_name = p.team_name WHERE p.user_id = ?`, [userId]);
        const [history] = await pool.query(`
            SELECT l.id, l.game_type, l.status, l.slot_time, p.team_name as role FROM lobbies l JOIN participants p ON l.id = p.lobby_id WHERE p.user_id = ?
            UNION SELECT id, game_type, status, slot_time, 'HOST' as role FROM lobbies WHERE host_id = ? ORDER BY id DESC LIMIT 5
        `, [userId, userId]);

        res.json({
            user: userRows[0],
            rating: { avg: ratings[0].avgRating || 0, count: ratings[0].totalRatings || 0 },
            stats: { hosted: hosted[0].hostedCount || 0, played: played[0].playedCount || 0, wins: wins[0].totalWins || 0 },
            team: userRows[0].team_name || 'LONE WOLF (NO TEAM)',
            teamCode: teamCode,
            teamMembers: teamMembers,
            history: history
        });
    } catch (error) { res.status(500).json({ message: 'Error fetching profile' }); }
});

app.post('/api/profile/edit', async (req, res) => {
    try {
        await pool.query('UPDATE users SET username = ?, ign = ? WHERE id = ?', [req.body.username, req.body.ign, req.body.userId]);
        res.json({ success: true, message: 'Identity Updated Successfully!' });
    } catch (err) { res.status(500).json({ message: 'Failed to update identity' }); }
});

// 🛡️ SQUAD MANAGEMENT
app.post('/api/team/create', async (req, res) => {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); 
    try {
        await pool.query('INSERT INTO teams (team_name, team_code, leader_id) VALUES (?, ?, ?)', [req.body.teamName, code, req.body.userId]);
        await pool.query('UPDATE users SET team_name = ? WHERE id = ?', [req.body.teamName, req.body.userId]);
        res.json({ success: true, message: `Squad Created! Invite Code: ${code}` });
    } catch (err) { res.status(400).json({ message: 'Team name already exists!' }); }
});

app.post('/api/team/join', async (req, res) => {
    try {
        const [team] = await pool.query('SELECT team_name FROM teams WHERE team_code = ?', [req.body.teamCode.toUpperCase()]);
        if (team.length === 0) return res.status(404).json({ message: '🛑 Invalid Squad Invite Code!' });
        await pool.query('UPDATE users SET team_name = ? WHERE id = ?', [team[0].team_name, req.body.userId]);
        res.json({ success: true, message: `Successfully joined ${team[0].team_name}!` });
    } catch (err) { res.status(500).json({ message: 'Failed to join squad' }); }
});

app.post('/api/team/leave', async (req, res) => {
    try {
        await pool.query('UPDATE users SET team_name = NULL WHERE id = ?', [req.body.userId]);
        res.json({ success: true, message: 'You have left the squad.' });
    } catch (err) { res.status(500).json({ message: 'Failed to leave squad' }); }
});

// 💰 4. ECONOMY & TRANSACTION LEDGER
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
        await pool.query('UPDATE users SET total_earnings = total_earnings - ? WHERE id = ?', [amount, userId]);
        await pool.query('INSERT INTO withdrawals (user_id, amount, upi_id, status, type) VALUES (?, ?, ?, "PENDING", "WITHDRAWAL")', [userId, amount, upiId]);
        res.json({ message: 'Withdrawal request sent!' });
    } catch (error) { res.status(500).json({ message: 'Withdraw failed' }); }
});

app.get('/api/admin/withdrawals', async (req, res) => {
    try {
        const [requests] = await pool.query(`SELECT w.id, w.amount, w.upi_id, w.status, u.username, w.created_at FROM withdrawals w INNER JOIN users u ON w.user_id = u.id WHERE w.status = 'PENDING' AND w.type = 'WITHDRAWAL' ORDER BY w.created_at ASC`);
        res.json(requests);
    } catch (error) { res.status(500).json({ message: 'Admin fetch failed' }); }
});

// 📱 DASHBOARD DATA
app.get('/api/my-active-matches/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [matches] = await pool.query(`
            SELECT l.id, l.game_type, l.slot_time, 'PLAYER' as role, p.team_name as registeredTeam
            FROM lobbies l JOIN participants p ON l.id = p.lobby_id 
            WHERE p.user_id = ? AND l.status != 'COMPLETED'
            UNION
            SELECT id, game_type, slot_time, 'HOST' as role, NULL as registeredTeam
            FROM lobbies 
            WHERE host_id = ? AND status != 'COMPLETED'
        `, [userId, userId]);
        res.json(matches);
    } catch (err) { res.status(500).json({ message: 'Error fetching matches' }); }
});

// 🏆 GLOBAL SQUAD LEADERBOARD
app.get('/api/leaderboard', async (req, res) => {
    try {
        const [leaderboard] = await pool.query(`
            SELECT team_name, SUM(total_pts) as total_score 
            FROM match_stats 
            WHERE team_name IS NOT NULL AND team_name != ''
            GROUP BY team_name 
            ORDER BY total_score DESC 
            LIMIT 10
        `);
        res.json(leaderboard);
    } catch (error) { res.status(500).json({ message: 'Error fetching leaderboard' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n======================================`);
    console.log(`🚀 SCRIMS S Server running on Port ${PORT}`);
    console.log(`======================================\n`);
});