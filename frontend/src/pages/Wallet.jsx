 import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Wallet = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [request, setRequest] = useState({ amount: '', upi: '' });
    const [depositAmt, setDepositAmt] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // 🛡️ Gateway & Popup States
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState(1); 
    const [popup, setPopup] = useState({ show: false, title: '', msg: '', type: 'info', onConfirm: null });
    
    // 🔑 PIN State
    const [pinEntry, setPinEntry] = useState(false);
    const [pin, setPin] = useState('');

    const triggerPopup = (title, msg, type = 'info', onConfirm = null) => {
        setPopup({ show: true, title, msg, type, onConfirm });
    };

    const fetchWallet = useCallback(async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return navigate('/login');
            const res = await fetch(`http://localhost:5000/api/wallet/${user.id}`);
            const data = await res.json();
            setBalance(data.balance || 0);
            setHistory(data.history || []);
        } catch (err) { console.error("Wallet fetch failed:", err); }
    }, [navigate]);

    useEffect(() => { fetchWallet(); }, [fetchWallet]);

    // 🚀 DEPOSIT LOGIC
    const handleRealSimDeposit = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!depositAmt || depositAmt < 1) return triggerPopup("DENIED", "Minimum top-up is ₹1.", "error");

        setIsProcessing(true);
        setStep(2); 

        try {
            const orderRes = await fetch('http://localhost:5000/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, amount: depositAmt, method: 'UPI' })
            });
            const orderData = await orderRes.json();

            setTimeout(async () => {
                const verifyRes = await fetch('http://localhost:5000/api/verify-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: orderData.orderId, userId: user.id, amount: depositAmt })
                });

                if (verifyRes.ok) {
                    setStep(3); 
                    fetchWallet();
                    setTimeout(() => { setIsProcessing(false); setDepositAmt(''); setStep(1); }, 2500);
                }
            }, 3000);
        } catch (err) {
            setIsProcessing(false);
            triggerPopup("GATEWAY ERROR", "Connection lost.", "error");
        }
    };

    const finalizeWithdrawal = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // 1. Verify PIN with Backend
    const verifyRes = await fetch('http://localhost:5000/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pin: pin })
    });
    
    if (!verifyRes.ok) {
        return triggerPopup("ACCESS DENIED", "The Security PIN you entered is incorrect.", "error");
    }

    // 2. If PIN is correct, proceed with Withdrawal
    const res = await fetch('http://localhost:5000/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: user.id, 
            amount: parseFloat(request.amount), 
            upiId: request.upi 
        })
    });
    
    if (res.ok) {
        triggerPopup("SUCCESS", "Funds extracted successfully.", "success");
        setRequest({ amount: '', upi: '' });
        setPin('');
        fetchWallet();
    }
};

    const handleWithdrawClick = () => {
        if (!request.amount || !request.upi) return triggerPopup("MISSING DATA", "Fill all extraction fields.", "error");
        if (parseFloat(request.amount) > balance) return triggerPopup("INSUFFICIENT", "Not enough funds.", "error");

        triggerPopup(
            "CONFIRM PAYOUT", 
            `Transfer ₹${request.amount} to ${request.upi}?`, 
            "confirm", 
            () => setPinEntry(true) // Open PIN pad instead of processing immediately
        );
    };

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="tactical-layout">
            <div className="ambient-glow"></div>
            <div className="scanline-overlay"></div>

            {isMobileMenuOpen && <div className="mobile-overlay" onClick={toggleMenu}></div>}

            {/* 🛡️ SECURITY PIN OVERLAY */}
            {pinEntry && (
                <div className="cyber-modal-overlay">
                    <div className="cyber-modal premium-glass confirm-border">
                        <div className="modal-accent" style={{background: '#00d2ff'}}></div>
                        <h2 className="modal-title">IDENTITY VERIFICATION</h2>
                        <p className="modal-msg">Enter 4-digit Security PIN to authorize withdrawal.</p>
                        
                        <input 
                            type="password" 
                            maxLength="4" 
                            className="pin-input" 
                            value={pin}
                            placeholder="****"
                            onChange={(e) => setPin(e.target.value)}
                            autoFocus
                        />

                        <div className="modal-actions">
                            <button className="modal-btn btn-cancel" onClick={() => {setPinEntry(false); setPin('');}}>ABORT</button>
                            <button className="modal-btn btn-confirm" onClick={() => {setPinEntry(false); finalizeWithdrawal();}}>VERIFY</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 💎 STANDARD POPUPS */}
            {popup.show && (
                <div className="cyber-modal-overlay">
                    <div className={`cyber-modal premium-glass ${popup.type}-border`}>
                        <div className="modal-accent"></div>
                        <h2 className="modal-title">{popup.title}</h2>
                        <p className="modal-msg">{popup.msg}</p>
                        <div className="modal-actions">
                            {popup.type === 'confirm' ? (
                                <>
                                    <button className="modal-btn btn-cancel" onClick={() => setPopup({...popup, show: false})}>CANCEL</button>
                                    <button className="modal-btn btn-confirm" onClick={() => { popup.onConfirm(); setPopup({...popup, show: false}); }}>PROCEED</button>
                                </>
                            ) : (
                                <button className="modal-btn btn-confirm" style={{width: '100%'}} onClick={() => setPopup({...popup, show: false})}>OK</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DEPOSIT PROCESSING OVERLAY */}
            {isProcessing && (
                <div className="payment-overlay">
                    <div className="gateway-modal premium-glass">
                        {step === 2 ? (
                            <div className="loader-content">
                                <div className="cyber-spinner"></div>
                                <h3 className="text-neon-blue" style={{fontFamily: 'Syncopate'}}>SECURE LINK</h3>
                                <p className="encrypt-text">AUTHORIZING TRANSACTION...</p>
                                <div className="progress-bar-container"><div className="progress-bar-fill"></div></div>
                            </div>
                        ) : (
                            <div className="success-content">
                                <div className="success-ring"><span className="check-icon">✓</span></div>
                                <h3 style={{color: '#00ff66', fontFamily: 'Orbitron'}}>FUNDS ACQUIRED</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <aside className={`tactical-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>SCRIMS<span className="text-neon-blue">S</span></h2>
                    <p className="sys-badge">FINANCE_OS</p>
                </div>
                <nav className="cyber-nav">
                    <button className="nav-btn" onClick={() => navigate('/dashboard')}><span className="icon">▤</span> DASHBOARD</button>
                    <button className="nav-btn" onClick={() => navigate('/profile')}><span className="icon">👤</span> PROFILE</button>
                    <button className="nav-btn active" onClick={() => setIsMobileMenuOpen(false)}><span className="icon">🏦</span> VAULT</button>
                </nav>
            </aside>

            <main className="tactical-main">
                <header className="tactical-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={toggleMenu}>☰</button>
                        <div className="live-pulse-box"><span className="pulse-dot"></span> ENCRYPTED LEDGER</div>
                    </div>
                </header>

                <div className="tactical-content">
                    <div className="hero-card">
                        <div className="hero-text">
                            <p className="sub-label">TOTAL COMBAT FUNDS</p>
                            <h1 className="hero-balance">
                                <span className="currency">₹</span>{parseFloat(balance).toLocaleString('en-IN')}
                            </h1>
                        </div>
                        <div className="hero-decor"><div className="bar"></div><div className="bar short"></div></div>
                    </div>

                    <div className="action-grid">
                        <div className="cyber-panel border-blue">
                            <h3 className="panel-title text-neon-blue">ACQUIRE FUNDS</h3>
                            <div className="input-wrap">
                                <span className="prefix" style={{padding:'12px', color:'#555'}}>₹</span>
                                <input type="number" placeholder="0.00" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} />
                            </div>
                            <button className="btn-solid-blue" onClick={handleRealSimDeposit}>INITIATE DEPOSIT</button>
                        </div>

                        <div className="cyber-panel border-orange">
                            <h3 className="panel-title text-orange">EXTRACT FUNDS</h3>
                            <div className="input-wrap" style={{marginBottom: '10px'}}>
                                <span className="prefix" style={{padding:'12px', color:'#555'}}>₹</span>
                                <input type="number" placeholder="Amount" value={request.amount} onChange={(e)=>setRequest({...request, amount: e.target.value})} />
                            </div>
                            <div className="input-wrap">
                                <span className="prefix" style={{padding:'12px', color:'#555'}}>🆔</span>
                                <input type="text" placeholder="UPI ID" value={request.upi} onChange={(e)=>setRequest({...request, upi: e.target.value})} />
                            </div>
                            <button className="btn-solid-orange" onClick={handleWithdrawClick}>CONFIRM EXTRACTION</button>
                        </div>
                    </div>

                    <div className="cyber-panel ledger-panel">
                        <div className="ledger-header">
                            <h3 className="panel-title">TRANSACTION LEDGER</h3>
                            <span className="entry-count">{history.length} ENTRIES</span>
                        </div>
                        <div className="history-container">
                            {history.length === 0 ? <div className="empty-state">NO DATA FOUND</div> : 
                                history.map(item => {
                                    const isDeposit = item.type === 'DEPOSIT';
                                    return (
                                        <div key={item.id} className="history-row">
                                            <div className="h-info">
                                                <div className={`status-indicator ${isDeposit ? 'bg-green' : 'bg-red'}`}></div>
                                                <div className="h-text">
                                                    <span className="h-id">TXN: #{item.id}</span>
                                                    <span className="h-date">{new Date(item.created_at).toLocaleDateString()}</span>
                                                    <span className="h-dest">{isDeposit ? 'System Deposit' : item.upi_id}</span>
                                                </div>
                                            </div>
                                            <div className="h-amount-box">
                                                <h4 className={isDeposit ? 'text-green' : 'text-red'}>{isDeposit ? '+' : '-'}₹{parseFloat(item.amount).toLocaleString('en-IN')}</h4>
                                                <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;700&family=Syncopate:wght@700&display=swap');
                :root { --bg-main: #050507; --bg-panel: #0a0a0e; --border-color: #1a1a24; --neon-blue: #00d2ff; --neon-orange: #ffae00; --neon-green: #00ff66; --neon-red: #ff4655; }
                * { box-sizing: border-box; }
                body { margin: 0; background: var(--bg-main); color: #fff; font-family: 'Rajdhani', sans-serif; }
                
                /* Modal Styling */
                .cyber-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .cyber-modal { width: 100%; max-width: 450px; padding: 40px; border-radius: 12px; text-align: center; position: relative; overflow: hidden; animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .modal-accent { position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--neon-blue); box-shadow: 0 0 15px var(--neon-blue); }
                .error-border { border: 1px solid var(--neon-red); }
                .success-border { border: 1px solid var(--neon-green); }
                .confirm-border { border: 1px solid var(--neon-blue); }
                .modal-title { font-family: 'Syncopate'; font-size: 1.1rem; margin-bottom: 20px; color: #fff; }
                .modal-msg { font-family: 'Rajdhani'; font-size: 1rem; color: #aaa; margin-bottom: 30px; }
                
                /* PIN INPUT STYLE */
                .pin-input { background: #000; border: 1px solid #333; color: var(--neon-blue); font-size: 2.5rem; text-align: center; width: 150px; letter-spacing: 15px; padding: 10px; font-family: 'Orbitron'; margin-bottom: 30px; outline: none; }
                .pin-input:focus { border-color: var(--neon-blue); box-shadow: 0 0 15px var(--neon-blue); }

                .modal-actions { display: flex; gap: 15px; }
                .modal-btn { flex: 1; padding: 15px; font-family: 'Orbitron'; font-weight: 900; font-size: 0.8rem; cursor: pointer; border-radius: 4px; transition: 0.3s; border: none; }
                .btn-confirm { background: var(--neon-blue); color: #000; }
                .btn-cancel { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #334155; }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                /* Layout & Hero */
                .tactical-layout { display: flex; height: 100vh; overflow: hidden; position: relative; }
                .ambient-glow { position: fixed; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(0, 210, 255, 0.05), transparent 50%); pointer-events: none; }
                .scanline-overlay { position: fixed; inset: 0; background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.05) 50%); background-size: 100% 4px; pointer-events: none; opacity: 0.3; }
                .premium-glass { background: linear-gradient(135deg, rgba(20,20,25,0.8), rgba(10,10,12,0.9)); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); }
                .tactical-sidebar { width: 280px; background: var(--bg-panel); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; padding: 20px; transition: 0.3s ease; z-index: 100; }
                .sidebar-brand h2 { font-family: 'Syncopate'; font-size: 1.5rem; margin: 0; }
                .sys-badge { display: inline-block; background: var(--neon-blue-dim); color: var(--neon-blue); font-family: 'Orbitron'; font-size: 0.6rem; padding: 4px 10px; border-radius: 4px; border: 1px solid var(--neon-blue); margin-top: 5px; }
                .cyber-nav { margin-top: 50px; display: flex; flex-direction: column; gap: 10px; }
                .nav-btn { background: transparent; border: none; color: #888; padding: 15px; text-align: left; font-family: 'Orbitron'; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 15px; transition: 0.3s; }
                .nav-btn.active { background: var(--neon-blue-dim); color: var(--neon-blue); border-left: 3px solid var(--neon-blue); }
                .tactical-main { flex: 1; overflow-y: auto; position: relative; z-index: 5; }
                .tactical-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; border-bottom: 1px solid var(--border-color); background: rgba(10,10,14,0.8); position: sticky; top: 0; z-index: 50; }
                .live-pulse-box { display: flex; align-items: center; gap: 10px; font-family: 'Orbitron'; font-size: 0.8rem; color: #888; }
                .pulse-dot { width: 8px; height: 8px; background: var(--neon-blue); border-radius: 50%; box-shadow: 0 0 10px var(--neon-blue); animation: pulse 2s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .tactical-content { padding: 40px; max-width: 1200px; margin: 0 auto; }
                .hero-card { background: linear-gradient(135deg, rgba(0, 210, 255, 0.1), transparent); border: 1px solid var(--neon-blue-dim); border-radius: 12px; padding: 40px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; position: relative; overflow: hidden; }
                .hero-balance { font-family: 'Syncopate'; font-size: clamp(2rem, 5vw, 4rem); margin: 0; display: flex; align-items: flex-start; gap: 5px; }
                .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
                .cyber-panel { background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 8px; padding: 25px; }
                .border-blue { border-top: 3px solid var(--neon-blue); }
                .border-orange { border-top: 3px solid var(--neon-orange); }
                .input-wrap { display: flex; background: #000; border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; transition: 0.3s; margin-bottom: 15px; }
                .input-wrap input { flex: 1; background: transparent; border: none; color: #fff; padding: 12px; font-family: 'Orbitron'; outline: none; }
                .btn-solid-blue { width: 100%; padding: 15px; background: var(--neon-blue); color: #000; border: none; font-family: 'Orbitron'; font-weight: bold; cursor: pointer; border-radius: 4px; }
                .btn-solid-orange { width: 100%; padding: 15px; background: var(--neon-orange); color: #000; border: none; font-family: 'Orbitron'; font-weight: bold; cursor: pointer; border-radius: 4px; }
                .history-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #000; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 10px; }
                .bg-green { background: var(--neon-green); }
                .bg-red { background: var(--neon-red); }
                .text-green { color: var(--neon-green); }
                .text-red { color: var(--neon-red); }
                .badge { font-family: 'Orbitron'; font-size: 0.6rem; padding: 3px 8px; border-radius: 4px; border: 1px solid #333; }
                .payment-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 3000; display: flex; align-items: center; justify-content: center; }
                .gateway-modal { background: #000; border: 1px solid var(--neon-blue); padding: 50px; text-align: center; border-radius: 12px; width: 100%; max-width: 400px; }
                .cyber-spinner { width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.05); border-top: 3px solid var(--neon-blue); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                .progress-bar-container { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-top: 15px;}
                .progress-bar-fill { height: 100%; width: 50%; background: var(--neon-blue); animation: fillBar 3s ease-in-out forwards; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fillBar { 0% { width: 0%; } 100% { width: 100%; } }
                @media (max-width: 900px) { .mobile-menu-btn { display: block; } .tactical-sidebar { position: fixed; left: -300px; top: 0; height: 100vh; box-shadow: 10px 0 30px #000; } .tactical-sidebar.open { left: 0; } .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; backdrop-filter: blur(3px); } }
            `}</style>
        </div>
    );
};

export default Wallet;