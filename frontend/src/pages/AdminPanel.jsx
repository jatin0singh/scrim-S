 import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [deposits, setDeposits] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('WITHDRAWALS');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminKey, setAdminKey] = useState('');

    const SECRET_KEY = "jatin@123"; 

    const fetchAllData = async () => {
        try {
            const [wRes, dRes, uRes] = await Promise.all([
                fetch('https://scrims-s.onrender.com/api/admin/withdrawals'),
                fetch('https://scrims-s.onrender.com/api/admin/deposits'),
                fetch('https://scrims-s.onrender.com/api/admin/users')
            ]);
            setWithdrawals(await wRes.json());
            setDeposits(await dRes.json());
            setUsers(await uRes.json());
        } catch (err) { console.error("Sync Error", err); }
    };

    useEffect(() => {
        if (isAdmin) fetchAllData();
    }, [isAdmin]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (adminKey === SECRET_KEY) setIsAdmin(true);
        else alert("🛑 ACCESS DENIED");
    };

    if (!isAdmin) {
        return (
            <div className="login-gate">
                <div className="gate-card">
                    <h1>SCRIMS S <span>CORE</span></h1>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="ENTER ADMIN KEY" onChange={(e) => setAdminKey(e.target.value)} />
                        <button type="submit">UNLOCK SYSTEM</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-viewport">
            <header className="admin-header">
                <h1>ADMIN <span>CONTROL</span></h1>
                <div className="tab-switcher">
                    <button className={activeTab === 'WITHDRAWALS' ? 'active' : ''} onClick={() => setActiveTab('WITHDRAWALS')}>PAYOUTS (OUT)</button>
                    <button className={activeTab === 'DEPOSITS' ? 'active' : ''} onClick={() => setActiveTab('DEPOSITS')}>DEPOSITS (IN)</button>
                    <button className={activeTab === 'USERS' ? 'active' : ''} onClick={() => setActiveTab('USERS')}>USERS</button>
                </div>
            </header>

            <div className="admin-container">
                {/* 🔴 WITHDRAWALS SECTION */}
                {activeTab === 'WITHDRAWALS' && (
                    <div className="request-table">
                        <div className="t-head"><span>USER</span><span>UPI ID</span><span>AMOUNT</span><span>STATUS</span></div>
                        {withdrawals.map(req => (
                            <div key={req.id} className="t-row">
                                <span>{req.username}</span>
                                <span className="u-upi">{req.upi_id}</span>
                                <span className="u-amt-red">₹{req.amount}</span>
                                <span className="status-pill">{req.status}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 🟢 DEPOSITS SECTION */}
                {activeTab === 'DEPOSITS' && (
                    <div className="request-table">
                        <div className="t-head"><span>USER</span><span>ORDER ID</span><span>AMOUNT</span><span>METHOD</span></div>
                        {deposits.map(dep => (
                            <div key={dep.id} className="t-row">
                                <span>{dep.username}</span>
                                <span style={{fontSize: '0.7rem', color: '#666'}}>{dep.order_id}</span>
                                <span className="u-amt-green">₹{dep.amount}</span>
                                <span className="status-pill green">{dep.method || 'UPI'}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 👤 USERS SECTION */}
                {activeTab === 'USERS' && (
                    <div className="request-table">
                        <div className="t-head"><span>ID</span><span>USERNAME</span><span>IGN</span><span>BALANCE</span></div>
                        {users.map(u => (
                            <div key={u.id} className="t-row">
                                <span style={{flex: '0.3'}}>{u.id}</span>
                                <span>{u.username}</span>
                                <span>{u.ign || '---'}</span>
                                <span className="u-amt-green">₹{u.total_earnings}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .admin-viewport { min-height: 100vh; background: #000; color: #fff; font-family: 'Rajdhani'; padding: 40px; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; margin-bottom: 30px; padding-bottom: 20px; }
                .admin-header h1 { font-family: 'Syncopate'; font-size: 1.2rem; }
                .admin-header span { color: #ff4655; }
                .tab-switcher { display: flex; gap: 10px; }
                .tab-switcher button { background: #111; border: 1px solid #333; color: #666; padding: 10px 20px; font-family: 'Orbitron'; font-size: 0.7rem; cursor: pointer; }
                .tab-switcher button.active { border-color: #ff4655; color: #fff; background: rgba(255, 70, 85, 0.1); }
                .request-table { background: #0a0a0a; border: 1px solid #111; border-radius: 4px; }
                .t-head { display: flex; padding: 15px 20px; background: #111; font-family: 'Orbitron'; font-size: 0.6rem; color: #444; }
                .t-row { display: flex; align-items: center; padding: 15px 20px; border-bottom: 1px solid #111; }
                .t-row span { flex: 1; font-size: 0.9rem; }
                .u-amt-red { color: #ff4655; font-weight: bold; font-family: 'Orbitron'; }
                .u-amt-green { color: #00ff66; font-weight: bold; font-family: 'Orbitron'; }
                .status-pill { font-size: 0.6rem; padding: 4px 8px; border: 1px solid #333; color: #666; font-family: 'Orbitron'; }
                .status-pill.green { border-color: #00ff66; color: #00ff66; }
                .u-upi { color: #00f0ff; font-family: 'Orbitron'; font-size: 0.7rem; }
                .login-gate { height: 100vh; background: #000; display: flex; justify-content: center; align-items: center; }
                .gate-card { background: #0a0a0a; padding: 40px; border: 1px solid #ff4655; text-align: center; }
                input { background: #000; border: 1px solid #333; padding: 15px; color: #fff; margin-bottom: 20px; text-align: center; }
                button { width: 100%; padding: 15px; background: #ff4655; color: #fff; border: none; font-family: 'Orbitron'; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default AdminPanel;