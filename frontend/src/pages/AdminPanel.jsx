  import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
    const [requests, setRequests] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminKey, setAdminKey] = useState('');

    const SECRET_KEY = "jatin@123"; 

    const fetchRequests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/withdrawals');
            const data = await res.json();

            // 🛡️ Safety check: Ensure the data is actually a list
            if (data && Array.isArray(data)) {
                setRequests(data);
            } else {
                console.error("Backend error or no data found:", data);
                setRequests([]); 
            }
        } catch (err) {
            console.error("Fetch error", err);
            setRequests([]); 
        }
    };

    useEffect(() => {
        if (isAdmin) fetchRequests();
    }, [isAdmin]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (adminKey === SECRET_KEY) {
            setIsAdmin(true);
        } else {
            alert("🛑 ACCESS DENIED: INVALID ADMIN KEY");
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/approve-payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: id })
            });
            if (res.ok) {
                alert("PAYOUT VERIFIED!");
                fetchRequests();
            }
        } catch (err) {
            console.error("Approval failed", err);
        }
    };

    if (!isAdmin) {
        return (
            <div className="login-gate">
                <div className="gate-card">
                    <h1>SCRIMS S <span>CORE</span></h1>
                    <p>ENTER ADMIN SECURITY KEY</p>
                    <form onSubmit={handleLogin}>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            onChange={(e) => setAdminKey(e.target.value)} 
                        />
                        <button type="submit">UNLOCK SYSTEM</button>
                    </form>
                </div>
                <style>{`
                    .login-gate { height: 100vh; background: #000; display: flex; justify-content: center; align-items: center; font-family: 'Rajdhani'; }
                    .gate-card { background: #0a0a0a; padding: 50px; border: 1px solid #ff4655; text-align: center; border-radius: 8px; box-shadow: 0 0 50px rgba(255, 70, 85, 0.1); }
                    .gate-card h1 { font-family: 'Syncopate'; color: #fff; margin-bottom: 10px; }
                    .gate-card span { color: #ff4655; }
                    .gate-card p { color: #666; font-family: 'Orbitron'; font-size: 0.7rem; letter-spacing: 2px; margin-bottom: 30px; }
                    input { background: #000; border: 1px solid #333; padding: 15px; color: #fff; width: 100%; margin-bottom: 20px; text-align: center; font-family: 'Orbitron'; }
                    button { width: 100%; padding: 15px; background: #ff4655; color: #fff; border: none; font-family: 'Orbitron'; font-weight: 900; cursor: pointer; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-viewport">
            <header className="admin-header">
                <h1>ADMIN <span>DASHBOARD</span></h1>
                <div className="status-tag">SECURE SESSION ACTIVE</div>
            </header>

            <div className="admin-container">
                <div className="stats-bar">
                    <div className="stat-item">
                        <p>PENDING WITHDRAWALS</p>
                        {/* 🛡️ Guard against length checks on non-arrays */}
                        <h2>{Array.isArray(requests) ? requests.length : 0}</h2>
                    </div>
                </div>

                <div className="request-table">
                    <div className="t-head">
                        <span>USER</span>
                        <span>UPI ID</span>
                        <span>AMOUNT</span>
                        <span>ACTION</span>
                    </div>
                    
                    {/* 🛡️ Final defense: Verify it's an array before mapping */}
                    {Array.isArray(requests) && requests.length > 0 ? (
                        requests.map(req => (
                            <div key={req.id} className="t-row">
                                <span className="u-name">{req.username}</span>
                                <span className="u-upi">{req.upi_id}</span>
                                <span className="u-amt">₹{req.amount}</span>
                                <button className="approve-btn" onClick={() => handleApprove(req.id)}>PAY & APPROVE</button>
                            </div>
                        ))
                    ) : (
                        <p className="empty">NO PENDING PAYOUTS FOUND</p>
                    )}
                </div>
            </div>

            <style>{`
                .admin-viewport { min-height: 100vh; background: #020202; color: #fff; font-family: 'Rajdhani'; padding: 50px; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; padding-bottom: 20px; margin-bottom: 40px; }
                .admin-header h1 { font-family: 'Syncopate'; font-size: 1.5rem; }
                .admin-header span { color: #ff4655; }
                .status-tag { font-family: 'Orbitron'; font-size: 0.6rem; color: #00ff00; border: 1px solid #00ff00; padding: 5px 10px; }
                .stat-item { background: #0a0a0a; padding: 20px; border-left: 4px solid #ff4655; display: inline-block; min-width: 200px; }
                .stat-item p { font-size: 0.7rem; color: #666; font-weight: bold; margin: 0; }
                .stat-item h2 { font-family: 'Orbitron'; margin: 5px 0 0 0; color: #fff; }
                .request-table { background: #0a0a0a; border: 1px solid #111; }
                .t-head { display: flex; padding: 20px; background: #111; font-family: 'Orbitron'; font-size: 0.7rem; color: #444; }
                .t-row { display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #111; }
                .t-head span, .t-row span { flex: 1; }
                .u-name { font-weight: bold; }
                .u-upi { color: #00d2ff; font-family: 'Orbitron'; font-size: 0.8rem; }
                .u-amt { font-family: 'Orbitron'; color: #00ff00; font-weight: 900; }
                .approve-btn { padding: 10px 20px; background: #ff4655; color: #fff; border: none; font-family: 'Orbitron'; font-weight: bold; cursor: pointer; }
                .empty { padding: 50px; text-align: center; color: #333; font-family: 'Orbitron'; letter-spacing: 5px; }
            `}</style>
        </div>
    );
};

export default AdminPanel;