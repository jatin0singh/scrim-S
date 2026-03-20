 import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminKey, setAdminKey] = useState('');
    const [activeTab, setActiveTab] = useState('USERS');
    
    const [data, setData] = useState({ users: [], deposits: [], withdrawals: [] });
    const SECRET_KEY = "jatin@123";

    const syncData = useCallback(async () => {
        try {
            const [u, d, w] = await Promise.all([
                fetch('https://scrims-s.onrender.com/api/admin/users').then(res => res.json()),
                fetch('https://scrims-s.onrender.com/api/admin/deposits').then(res => res.json()),
                fetch('https://scrims-s.onrender.com/api/admin/withdrawals').then(res => res.json())
            ]);
            setData({ users: u, deposits: d, withdrawals: w });
        } catch (e) { console.error("Sync Error", e); }
    }, []);

    useEffect(() => {
        if (isAdmin) {
            syncData();
            const interval = setInterval(syncData, 5000); // Auto-refresh every 5 seconds
            return () => clearInterval(interval);
        }
    }, [isAdmin, syncData]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (adminKey === SECRET_KEY) setIsAdmin(true);
        else alert("ACCESS DENIED");
    };

    if (!isAdmin) return (
        <div className="admin-gate">
            <div className="gate-box">
                <div className="glitch-line"></div>
                <h1>SCRIMS S // <span>CORE</span></h1>
                <p>AUTHORIZATION REQUIRED</p>
                <form onSubmit={handleLogin}>
                    <input type="password" placeholder="••••••••" onChange={(e) => setAdminKey(e.target.value)} />
                    <button type="submit">INITIALIZE SYSTEM</button>
                </form>
            </div>
        </div>
    );

    return (
        <div className="admin-v4">
            <aside className="admin-sidebar">
                <div className="brand">SCRIMS<span>S</span></div>
                <nav>
                    <button className={activeTab === 'USERS' ? 'active' : ''} onClick={() => setActiveTab('USERS')}>OPERATIVES</button>
                    <button className={activeTab === 'DEPOSITS' ? 'active' : ''} onClick={() => setActiveTab('DEPOSITS')}>INFLOW (DEPOSITS)</button>
                    <button className={activeTab === 'WITHDRAWALS' ? 'active' : ''} onClick={() => setActiveTab('WITHDRAWALS')}>OUTFLOW (PAYOUTS)</button>
                </nav>
                <button className="exit-btn" onClick={() => navigate('/dashboard')}>EXIT CORE</button>
            </aside>

            <main className="admin-main">
                <header className="admin-top">
                    <div className="stat-card">
                        <label>TOTAL USERS</label>
                        <h2>{data.users.length}</h2>
                    </div>
                    <div className="stat-card">
                        <label>TOTAL DEPOSITS</label>
                        <h2 className="text-green">₹{data.deposits.reduce((acc, curr) => acc + parseFloat(curr.amount), 0)}</h2>
                    </div>
                    <div className="stat-card">
                        <label>PENDING PAYOUTS</label>
                        <h2 className="text-red">{data.withdrawals.filter(w => w.status === 'PENDING').length}</h2>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                {activeTab === 'USERS' && <tr><th>ID</th><th>USERNAME</th><th>IGN</th><th>BALANCE</th><th>JOINED</th></tr>}
                                {activeTab === 'DEPOSITS' && <tr><th>USER</th><th>ORDER_ID</th><th>AMOUNT</th><th>DATE</th></tr>}
                                {activeTab === 'WITHDRAWALS' && <tr><th>USER</th><th>UPI ID</th><th>AMOUNT</th><th>STATUS</th></tr>}
                            </thead>
                            <tbody>
                                {activeTab === 'USERS' && data.users.map(u => (
                                    <tr key={u.id}><td>#{u.id}</td><td>{u.username}</td><td>{u.ign || '---'}</td><td className="text-green">₹{u.total_earnings}</td><td>{new Date(u.created_at).toLocaleDateString()}</td></tr>
                                ))}
                                {activeTab === 'DEPOSITS' && data.deposits.map(d => (
                                    <tr key={d.id}><td>{d.username}</td><td className="text-muted">{d.order_id}</td><td className="text-green">₹{d.amount}</td><td>{new Date(d.created_at).toLocaleDateString()}</td></tr>
                                ))}
                                {activeTab === 'WITHDRAWALS' && data.withdrawals.map(w => (
                                    <tr key={w.id}><td>{w.username}</td><td className="text-blue">{w.upi_id}</td><td className="text-red">₹{w.amount}</td><td><span className={`badge ${w.status}`}>{w.status}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Rajdhani:wght@500;700&display=swap');
                .admin-v4 { display: flex; height: 100vh; background: #050505; color: #fff; font-family: 'Rajdhani', sans-serif; }
                .admin-sidebar { width: 260px; background: #0a0a0a; border-right: 1px solid #1a1a1a; padding: 30px; display: flex; flex-direction: column; }
                .brand { font-family: 'Orbitron'; font-size: 1.5rem; margin-bottom: 50px; }
                .brand span { color: #ff4655; }
                nav { flex: 1; display: flex; flex-direction: column; gap: 10px; }
                nav button { background: transparent; border: 1px solid transparent; color: #555; padding: 15px; text-align: left; font-family: 'Orbitron'; font-size: 0.7rem; cursor: pointer; transition: 0.3s; }
                nav button.active { color: #ff4655; border-left: 3px solid #ff4655; background: rgba(255, 70, 85, 0.05); }
                .exit-btn { border: 1px solid #333; color: #333; padding: 10px; font-family: 'Orbitron'; font-size: 0.6rem; cursor: pointer; }
                .admin-main { flex: 1; padding: 40px; overflow-y: auto; }
                .admin-top { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
                .stat-card { background: #0d0d0d; padding: 25px; border: 1px solid #1a1a1a; border-bottom: 3px solid #333; }
                .stat-card label { font-family: 'Orbitron'; font-size: 0.6rem; color: #555; letter-spacing: 2px; }
                .stat-card h2 { margin: 10px 0 0 0; font-size: 2.5rem; font-family: 'Rajdhani'; }
                .text-green { color: #00ff66; } .text-red { color: #ff4655; } .text-blue { color: #00f0ff; }
                .table-wrapper { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; }
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; padding: 20px; background: #111; font-family: 'Orbitron'; font-size: 0.6rem; color: #444; }
                td { padding: 20px; border-bottom: 1px solid #1a1a1a; font-size: 0.9rem; }
                .badge { font-size: 0.6rem; padding: 4px 8px; border: 1px solid #333; color: #555; font-family: 'Orbitron'; }
                .PENDING { color: #ffae00; border-color: #ffae00; }
                .admin-gate { height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; }
                .gate-box { background: #0a0a0a; padding: 50px; border: 1px solid #ff4655; text-align: center; width: 400px; position: relative; }
                .glitch-line { position: absolute; top: 0; left: 0; width: 40px; height: 3px; background: #ff4655; }
                .gate-box h1 { font-family: 'Orbitron'; font-size: 1.2rem; }
                .gate-box input { background: #000; border: 1px solid #222; padding: 15px; color: #fff; width: 100%; margin: 20px 0; text-align: center; }
                .gate-box button { width: 100%; padding: 15px; background: #ff4655; color: #fff; border: none; font-family: 'Orbitron'; font-weight: 900; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default AdminPanel;