import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]); // 👤 NEW: State for all users
    const [activeTab, setActiveTab] = useState('WITHDRAWALS'); // 📑 NEW: Tab toggle
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminKey, setAdminKey] = useState('');

    const SECRET_KEY = "jatin@123"; 

    // 📡 FETCH 1: MONEY REQUESTS
    const fetchRequests = async () => {
        try {
            const res = await fetch('https://scrims-s.onrender.com/api/admin/withdrawals');
            const data = await res.json();
            if (Array.isArray(data)) setRequests(data);
        } catch (err) { console.error("Withdrawal fetch failed", err); }
    };

    // 📡 FETCH 2: ALL REGISTERED USERS
    const fetchUsers = async () => {
        try {
            const res = await fetch('https://scrims-s.onrender.com/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data)) setUsers(data);
        } catch (err) { console.error("User fetch failed", err); }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchRequests();
            fetchUsers();
        }
    }, [isAdmin]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (adminKey === SECRET_KEY) setIsAdmin(true);
        else alert("🛑 ACCESS DENIED: INVALID ADMIN KEY");
    };

    const handleApprove = async (id) => {
        try {
            const res = await fetch('https://scrims-s.onrender.com/api/admin/approve-payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: id })
            });
            if (res.ok) {
                alert("PAYOUT VERIFIED!");
                fetchRequests();
            }
        } catch (err) { console.error("Approval failed", err); }
    };

    if (!isAdmin) {
        return (
            <div className="login-gate">
                <div className="gate-card">
                    <h1>SCRIMS S <span>CORE</span></h1>
                    <p>ENTER ADMIN SECURITY KEY</p>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="••••••••" onChange={(e) => setAdminKey(e.target.value)} />
                        <button type="submit">UNLOCK SYSTEM</button>
                    </form>
                </div>
                <style>{`.login-gate { height: 100vh; background: #000; display: flex; justify-content: center; align-items: center; font-family: 'Rajdhani'; } .gate-card { background: #0a0a0a; padding: 50px; border: 1px solid #ff4655; text-align: center; border-radius: 8px; } .gate-card h1 { font-family: 'Syncopate'; color: #fff; } .gate-card span { color: #ff4655; } input { background: #000; border: 1px solid #333; padding: 15px; color: #fff; width: 100%; margin-bottom: 20px; text-align: center; font-family: 'Orbitron'; } button { width: 100%; padding: 15px; background: #ff4655; color: #fff; border: none; font-family: 'Orbitron'; font-weight: 900; cursor: pointer; }`}</style>
            </div>
        );
    }

    return (
        <div className="admin-viewport">
            <header className="admin-header">
                <h1>ADMIN <span>DASHBOARD</span></h1>
                <div className="tab-switcher">
                    <button className={activeTab === 'WITHDRAWALS' ? 'active' : ''} onClick={() => setActiveTab('WITHDRAWALS')}>MONEY REQUESTS</button>
                    <button className={activeTab === 'USERS' ? 'active' : ''} onClick={() => setActiveTab('USERS')}>USER DATABASE</button>
                </div>
            </header>

            <div className="admin-container">
                {activeTab === 'WITHDRAWALS' ? (
                    <div className="request-table">
                        <div className="t-head">
                            <span>USER</span>
                            <span>UPI ID</span>
                            <span>AMOUNT</span>
                            <span>ACTION</span>
                        </div>
                        {requests.length > 0 ? requests.map(req => (
                            <div key={req.id} className="t-row">
                                <span className="u-name">{req.username}</span>
                                <span className="u-upi">{req.upi_id}</span>
                                <span className="u-amt">₹{req.amount}</span>
                                <button className="approve-btn" onClick={() => handleApprove(req.id)}>PAY & APPROVE</button>
                            </div>
                        )) : <p className="empty">NO PENDING PAYOUTS FOUND</p>}
                    </div>
                ) : (
                    <div className="request-table">
                        <div className="t-head">
                            <span>ID</span>
                            <span>USERNAME</span>
                            <span>IGN</span>
                            <span>EMAIL</span>
                            <span>BALANCE</span>
                        </div>
                        {users.length > 0 ? users.map(user => (
                            <div key={user.id} className="t-row">
                                <span style={{flex: '0.3'}}>{user.id}</span>
                                <span className="u-name">{user.username}</span>
                                <span className="u-upi">{user.ign || '---'}</span>
                                <span style={{fontSize: '0.8rem', color: '#666'}}>{user.email}</span>
                                <span className="u-amt">₹{user.total_earnings}</span>
                            </div>
                        )) : <p className="empty">DATABASE EMPTY</p>}
                    </div>
                )}
            </div>

            <style>{`
                .admin-viewport { min-height: 100vh; background: #020202; color: #fff; font-family: 'Rajdhani'; padding: 50px; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; padding-bottom: 20px; margin-bottom: 40px; }
                .admin-header h1 { font-family: 'Syncopate'; font-size: 1.2rem; }
                .admin-header span { color: #ff4655; }
                
                .tab-switcher { display: flex; gap: 10px; }
                .tab-switcher button { background: transparent; border: 1px solid #333; color: #666; padding: 10px 20px; font-family: 'Orbitron'; font-size: 0.7rem; cursor: pointer; transition: 0.3s; }
                .tab-switcher button.active { border-color: #ff4655; color: #fff; background: rgba(255, 70, 85, 0.1); }

                .request-table { background: #0a0a0a; border: 1px solid #111; border-radius: 4px; overflow: hidden; }
                .t-head { display: flex; padding: 20px; background: #111; font-family: 'Orbitron'; font-size: 0.7rem; color: #444; }
                .t-row { display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #111; }
                .t-head span, .t-row span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .u-name { font-weight: bold; color: #fff; }
                .u-upi { color: #00d2ff; font-family: 'Orbitron'; font-size: 0.7rem; }
                .u-amt { font-family: 'Orbitron'; color: #00ff00; font-weight: 900; }
                .approve-btn { padding: 10px 15px; background: #ff4655; color: #fff; border: none; font-family: 'Orbitron'; font-size: 0.7rem; font-weight: bold; cursor: pointer; }
                .empty { padding: 50px; text-align: center; color: #333; font-family: 'Orbitron'; letter-spacing: 5px; }
            `}</style>
        </div>
    );
};

export default AdminPanel;