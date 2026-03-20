  import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Lobby = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const isFF = location.pathname.includes('ff') || location.pathname.includes('freefire');
    const gameTypeParam = isFF ? 'ff' : 'bgmi';
    const gameName = isFF ? 'FREE FIRE MAX' : 'BGMI ESPORTS';
    const themeClass = isFF ? 'theme-orange' : 'theme-blue';

    const [activeSlot, setActiveSlot] = useState('12 AM');
    const [lobbies, setLobbies] = useState([]);
    const [balance, setBalance] = useState(0);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 🛡️ NEW POPUP STATE
    const [popup, setPopup] = useState({ show: false, title: '', msg: '', type: 'info', onConfirm: null });

    // Helper to trigger sexy popups
    const triggerPopup = (title, msg, type = 'info', onConfirm = null) => {
        setPopup({ show: true, title, msg, type, onConfirm });
    };

    const fetchLobbiesAndWallet = useCallback(async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (!storedUser) return navigate('/login');
            setUser(storedUser);

            const walletRes = await fetch(`http://localhost:5000/api/wallet/${storedUser.id}`);
            if (walletRes.ok) {
                const walletData = await walletRes.json();
                setBalance(walletData.balance);
            }

            const response = await fetch(`http://localhost:5000/api/lobbies/${gameTypeParam}?userId=${storedUser.id}`);
            const data = await response.json();
            setLobbies(data);
        } catch (error) { 
            console.error("Fetch Error:", error); 
        } finally { 
            setIsLoading(false); 
        }
    }, [gameTypeParam, navigate]);

    useEffect(() => { 
        fetchLobbiesAndWallet(); 
        const interval = setInterval(fetchLobbiesAndWallet, 5000);
        return () => clearInterval(interval);
    }, [fetchLobbiesAndWallet]);

    const handleBuySlot = async (lobbyId, fee) => {
        if (balance < fee) {
            return triggerPopup("INSUFFICIENT VAULT", `You need ₹${fee} to deploy. Current balance: ₹${balance}`, "error");
        }
        
        // Show Confirmation Popup instead of browser confirm
        triggerPopup(
            "AUTHORIZE DEPLOYMENT", 
            `Confirm deduction of ₹${fee} for Match #${lobbyId}?`, 
            "confirm", 
            async () => {
                const response = await fetch('http://localhost:5000/api/join-lobby', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, lobbyId })
                });
                const data = await response.json();
                
                if (response.ok) { 
                    navigate(`/register-team/${lobbyId}`); 
                } else {
                    triggerPopup("UPLINK FAILED", data.message, "error");
                }
            }
        );
    };

    const handleLeaveLobby = async (lobbyId) => {
        triggerPopup(
            "ABORT MISSION?", 
            "Cancel your slot? Funds will be credited back to your vault.", 
            "confirm", 
            async () => {
                const response = await fetch('http://localhost:5000/api/leave-lobby', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, lobbyId })
                });
                const data = await response.json();
                if (response.ok) {
                    triggerPopup("SLOT RELEASED", "Your entry has been removed successfully.", "success");
                    fetchLobbiesAndWallet();
                } else {
                    triggerPopup("ERROR", data.message, "error");
                }
            }
        );
    };

    const handleHostLobby = async (lobbyId) => {
        triggerPopup(
            "CLAIM COMMAND?", 
            "Do you want to host this arena?", 
            "confirm", 
            async () => {
                const response = await fetch('http://localhost:5000/api/host-lobby', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, lobbyId })
                });
                const data = await response.json();
                if (response.ok) { 
                    triggerPopup("COMMAND ACQUIRED", "You are now the host. Redirecting to terminal...", "success");
                    setTimeout(() => navigate(`/host/${lobbyId}`), 2000);
                } else {
                    triggerPopup("DENIED", data.message, "error");
                }
            }
        );
    };

    const displayedLobbies = lobbies
        .filter(l => l.slot_time === activeSlot)
        .sort((a, b) => a.lobby_no - b.lobby_no);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className={`tactical-layout ${themeClass}`}>
            <div className="ambient-glow"></div>
            <div className="scanline-overlay"></div>

            {/* 📱 MOBILE OVERLAY */}
            {isMobileMenuOpen && <div className="mobile-overlay" onClick={toggleMenu}></div>}

            {/* 💎 SEXY POPUP SYSTEM */}
            {popup.show && (
                <div className="cyber-modal-overlay">
                    <div className={`cyber-modal premium-glass ${popup.type}-border`}>
                        <div className="modal-accent"></div>
                        <h2 className="modal-title">
                            {popup.type === 'error' ? '⚠️' : popup.type === 'success' ? '✅' : '🛡️'} {popup.title}
                        </h2>
                        <p className="modal-msg">{popup.msg}</p>
                        
                        <div className="modal-actions">
                            {popup.type === 'confirm' ? (
                                <>
                                    <button className="modal-btn btn-cancel" onClick={() => setPopup({...popup, show: false})}>CANCEL</button>
                                    <button className="modal-btn btn-confirm" onClick={() => { popup.onConfirm(); setPopup({...popup, show: false}); }}>CONFIRM</button>
                                </>
                            ) : (
                                <button className="modal-btn btn-confirm" style={{width: '100%'}} onClick={() => setPopup({...popup, show: false})}>ACKNOWLEDGE</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <aside className={`tactical-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>SCRIMS<span className="text-theme">S</span></h2>
                    <p className="sys-badge">ARENA_LIVE</p>
                </div>
                <nav className="cyber-nav">
                    <button className="nav-btn" onClick={() => navigate('/dashboard')}><span className="icon">▤</span> DASHBOARD</button>
                    <button className="nav-btn" onClick={() => navigate('/profile')}><span className="icon">👤</span> PROFILE</button>
                    <button className="nav-btn" onClick={() => navigate('/wallet')}><span className="icon">🏦</span> VAULT</button>
                </nav>
            </aside>

            <main className="tactical-main">
                <header className="tactical-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={toggleMenu}>☰</button>
                        <div className="live-pulse-box"><span className="pulse-dot"></span> {gameName}</div>
                    </div>
                    <div className="header-right" onClick={() => navigate('/wallet')} style={{cursor: 'pointer'}}>
                        <div className="balance-pill premium-glass">
                            <span className="b-label">VAULT:</span>
                            <span className="b-amount text-green">₹{parseFloat(balance).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </header>

                <div className="tactical-content">
                    <div className="header-section">
                        <h1 className="hero-title text-theme">{gameName} <span style={{color:'#fff'}}>ARENA</span></h1>
                        <p className="hero-subtext">SELECT A TIME SLOT AND SECURE YOUR DEPLOYMENT</p>
                    </div>

                    <div className="time-slot-container">
                        {['12 AM', '3 PM', '6 PM', '9 PM'].map(slot => (
                            <button 
                                key={slot} 
                                className={`slot-tab ${activeSlot === slot ? 'active-slot' : ''}`}
                                onClick={() => setActiveSlot(slot)}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>

                    <div className="lobby-grid">
                        {isLoading ? (
                            <div className="empty-state">SCANNING FOR ACTIVE ARENAS...</div>
                        ) : displayedLobbies.length === 0 ? (
                            <div className="empty-state">NO DEPLOYMENTS FOUND FOR {activeSlot}</div>
                        ) : (
                            displayedLobbies.map(lobby => (
                                <div key={lobby.id} className={`lobby-card premium-glass ${lobby.status === 'FULL' ? 'card-full' : ''}`}>
                                    <div className="l-header">
                                        <div className="l-tag-group">
                                            <span className="l-id">MATCH #{lobby.id}</span>
                                            <span className="l-number-tag">#LOBBY {lobby.lobby_no || 1}</span>
                                        </div>
                                        <span className={`status-badge ${lobby.status === 'FULL' ? 'bg-red' : 'bg-green'}`}>
                                            {lobby.status}
                                        </span>
                                    </div>
                                    
                                    <div className="economy-info">
                                        <div className="eco-box">
                                            <p>ENTRY</p>
                                            <h3 className="text-theme">₹{lobby.entry_fee}</h3>
                                        </div>
                                        <div className="eco-box prize-box">
                                            <p>PRIZE</p>
                                            <h3 className="text-green">₹{lobby.prize_pool}</h3>
                                        </div>
                                    </div>

                                    <div className="progress-container">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${(lobby.slots_filled / lobby.max_slots) * 100}%`, background: lobby.status === 'FULL' ? '#ff4655' : 'var(--theme-color)' }}></div>
                                        </div>
                                        <div className="slots-label">
                                            <span>SQUAD REGISTRY</span>
                                            <p>{lobby.slots_filled} / {lobby.max_slots}</p>
                                        </div>
                                    </div>

                                    <div className="host-info">COMMANDER: {lobby.host_id ? `USER #${lobby.host_id}` : 'PENDING ASSIGNMENT'}</div>

                                    <div className="l-actions">
                                        {lobby.isPlayer ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {lobby.registeredTeam ? (
                                                    <button className="btn-solid-green" onClick={() => navigate(`/match/${lobby.id}`)}>ENTER MATCH ROOM</button>
                                                ) : (
                                                    <button className="btn-solid-warning" onClick={() => navigate(`/register-team/${lobby.id}`)}>COMPLETE REGISTRATION</button>
                                                )}
                                                <button className="btn-cancel-slot" onClick={() => handleLeaveLobby(lobby.id)}>CANCEL MY SLOT</button>
                                            </div>
                                        ) : lobby.status === 'FULL' ? (
                                            <button className="btn-disabled" disabled>LOBBY FULL</button>
                                        ) : (
                                            <button className="btn-solid-theme" onClick={() => handleBuySlot(lobby.id, lobby.entry_fee)}>BUY SLOT (₹{lobby.entry_fee})</button>
                                        )}

                                        {lobby.isHost ? (
                                            <button className="btn-outline-host active-host" onClick={() => navigate(`/host/${lobby.id}`)}>GO TO HOST PANEL</button>
                                        ) : (
                                            <button className="btn-outline-host" onClick={() => handleHostLobby(lobby.id)} disabled={lobby.host_id !== null}>
                                                {lobby.host_id ? 'HOST ASSIGNED' : 'HOST THIS ARENA'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;700&family=Syncopate:wght@700&display=swap');
                :root { --bg-main: #050507; --bg-panel: #0a0a0e; --border-color: #1a1a24; --neon-blue: #00d2ff; --neon-orange: #ffae00; --neon-green: #00ff66; --neon-red: #ff4655; }
                .theme-orange { --theme-color: var(--neon-orange); --glow: rgba(255, 174, 0, 0.2); }
                .theme-blue { --theme-color: var(--neon-blue); --glow: rgba(0, 210, 255, 0.2); }
                * { box-sizing: border-box; }
                body { margin: 0; background: var(--bg-main); color: #fff; font-family: 'Rajdhani', sans-serif; }
                
                /* Modal Styling */
                .cyber-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease-out; }
                .cyber-modal { width: 100%; max-width: 450px; padding: 40px; border-radius: 12px; text-align: center; position: relative; overflow: hidden; animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .modal-accent { position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--theme-color); box-shadow: 0 0 15px var(--theme-color); }
                .error-border { border: 1px solid var(--neon-red); }
                .success-border { border: 1px solid var(--neon-green); }
                .confirm-border { border: 1px solid var(--neon-blue); }
                
                .modal-title { font-family: 'Syncopate'; font-size: 1.2rem; margin-bottom: 20px; letter-spacing: 1px; color: #fff; }
                .modal-msg { font-family: 'Rajdhani'; font-size: 1.1rem; color: #aaa; line-height: 1.6; margin-bottom: 30px; }
                .modal-actions { display: flex; gap: 15px; }
                .modal-btn { flex: 1; padding: 15px; font-family: 'Orbitron'; font-weight: 900; font-size: 0.8rem; cursor: pointer; border-radius: 4px; transition: 0.3s; border: none; }
                .btn-confirm { background: var(--theme-color); color: #000; }
                .btn-confirm:hover { background: #fff; box-shadow: 0 0 20px var(--theme-color); }
                .btn-cancel { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #333; }
                .btn-cancel:hover { background: var(--neon-red); border-color: var(--neon-red); color: #000; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                /* Standard tactical layout remains below... */
                .tactical-layout { display: flex; height: 100vh; overflow: hidden; position: relative; }
                .ambient-glow { position: fixed; inset: 0; background: radial-gradient(circle at 50% 0%, var(--glow), transparent 50%); pointer-events: none; }
                .scanline-overlay { position: fixed; inset: 0; background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 50%); background-size: 100% 4px; pointer-events: none; opacity: 0.3; }
                .premium-glass { background: linear-gradient(135deg, rgba(20,20,25,0.8), rgba(10,10,12,0.9)); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); }
                .tactical-sidebar { width: 260px; background: var(--bg-panel); border-right: 1px solid var(--border-color); padding: 20px; transition: 0.3s ease; z-index: 100; }
                .sidebar-brand h2 { font-family: 'Syncopate'; font-size: 1.5rem; margin: 0; }
                .sys-badge { display: inline-block; background: rgba(255,255,255,0.05); color: var(--theme-color); font-family: 'Orbitron'; font-size: 0.6rem; padding: 4px 10px; border-radius: 4px; border: 1px solid var(--theme-color); margin-top: 5px;}
                .cyber-nav { margin-top: 50px; display: flex; flex-direction: column; gap: 10px; }
                .nav-btn { background: transparent; border: none; color: #888; padding: 15px; text-align: left; font-family: 'Orbitron'; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 15px; transition: 0.3s; }
                .nav-btn.active { background: rgba(255,255,255,0.02); color: var(--theme-color); border-left: 3px solid var(--theme-color); }
                .tactical-main { flex: 1; overflow-y: auto; position: relative; z-index: 5; }
                .tactical-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; border-bottom: 1px solid var(--border-color); background: rgba(10,10,14,0.8); position: sticky; top: 0; z-index: 50; }
                .header-left { display: flex; align-items: center; gap: 15px; }
                .mobile-menu-btn { display: none; background: transparent; border: 1px solid var(--border-color); color: #fff; font-size: 1.5rem; padding: 5px 12px; border-radius: 4px; }
                .live-pulse-box { display: flex; align-items: center; gap: 10px; font-family: 'Orbitron'; font-size: 0.8rem; color: #888; }
                .pulse-dot { width: 8px; height: 8px; background: var(--theme-color); border-radius: 50%; box-shadow: 0 0 10px var(--theme-color); }
                .balance-pill { display: flex; align-items: center; gap: 10px; padding: 8px 20px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); }
                .b-label { font-family: 'Orbitron'; font-size: 0.7rem; color: #888; }
                .b-amount { font-family: 'Syncopate'; font-size: 1.1rem; }
                .tactical-content { padding: 40px; max-width: 1400px; margin: 0 auto; }
                .header-section { text-align: center; margin-bottom: 40px; }
                .hero-title { font-family: 'Syncopate'; font-size: 2.5rem; margin: 0; }
                .hero-subtext { font-family: 'Orbitron'; color: #666; font-size: 0.8rem; letter-spacing: 2px; margin-top: 10px; }
                .time-slot-container { display: flex; justify-content: center; gap: 15px; margin-bottom: 40px; flex-wrap: wrap; }
                .slot-tab { padding: 12px 30px; background: var(--bg-panel); border: 1px solid var(--border-color); color: #555; font-family: 'Orbitron'; font-weight: bold; cursor: pointer; border-radius: 4px; transition: 0.3s; }
                .active-slot { border-color: var(--theme-color); color: var(--theme-color); box-shadow: 0 0 15px var(--glow); }
                .lobby-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; }
                .lobby-card { padding: 25px; border-radius: 12px; display: flex; flex-direction: column; gap: 20px; border-top: 2px solid transparent; transition: 0.3s; }
                .lobby-card:hover { border-top-color: var(--theme-color); transform: translateY(-5px); }
                .card-full { opacity: 0.6; filter: grayscale(0.5); }
                .l-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .l-tag-group { display: flex; flex-direction: column; gap: 4px; }
                .l-id { font-family: 'Syncopate'; font-size: 1rem; color: #fff; }
                .l-number-tag { font-family: 'Orbitron'; font-size: 0.7rem; color: var(--theme-color); font-weight: 900; letter-spacing: 1px; }
                .status-badge { font-family: 'Orbitron'; font-size: 0.6rem; padding: 4px 10px; border-radius: 4px; font-weight: 900; }
                .bg-green { background: rgba(0,255,102,0.1); color: var(--neon-green); border: 1px solid var(--neon-green); }
                .bg-red { background: rgba(255,70,85,0.1); color: var(--neon-red); border: 1px solid var(--neon-red); }
                .economy-info { display: flex; gap: 15px; }
                .eco-box { flex: 1; background: #000; padding: 15px; text-align: center; border: 1px solid var(--border-color); border-radius: 6px; }
                .eco-box p { margin: 0 0 5px 0; font-size: 0.6rem; color: #555; font-family: 'Orbitron'; }
                .eco-box h3 { margin: 0; font-family: 'Syncopate'; font-size: 1.2rem; }
                .progress-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
                .progress-fill { height: 100%; transition: 0.5s ease; }
                .slots-label { display: flex; justify-content: space-between; font-size: 0.7rem; font-family: 'Orbitron'; color: #666; margin-top: 5px; }
                .slots-label p { margin: 0; color: var(--theme-color); font-weight: bold; }
                .host-info { font-family: 'Orbitron'; font-size: 0.7rem; color: #444; border-top: 1px solid var(--border-color); padding-top: 10px; }
                .l-actions { display: flex; flex-direction: column; gap: 10px; }
                .btn-solid-theme { width: 100%; padding: 14px; background: var(--theme-color); color: #000; border: none; font-family: 'Orbitron'; font-weight: 900; cursor: pointer; border-radius: 4px; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0% 100%); }
                .btn-solid-green { width: 100%; padding: 14px; background: var(--neon-green); color: #000; border: none; font-family: 'Orbitron'; font-weight: 900; cursor: pointer; border-radius: 4px; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0% 100%); }
                .btn-solid-warning { width: 100%; padding: 14px; background: #ffae00; color: #000; border: none; font-family: 'Orbitron'; font-weight: 900; cursor: pointer; border-radius: 4px; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0% 100%); box-shadow: 0 0 15px rgba(255, 174, 0, 0.3); }
                .btn-outline-host { width: 100%; padding: 12px; background: transparent; border: 1px solid #333; color: #555; font-family: 'Orbitron'; font-weight: bold; cursor: pointer; border-radius: 4px; }
                .active-host { border-color: var(--theme-color); color: var(--theme-color); }
                .btn-disabled { width: 100%; padding: 14px; background: rgba(255,255,255,0.05); color: #444; border: 1px solid #222; font-family: 'Orbitron'; font-weight: 900; cursor: not-allowed; border-radius: 4px; }
                .btn-cancel-slot { width: 100%; padding: 10px; background: transparent; color: var(--neon-red); border: 1px solid var(--neon-red); font-family: 'Orbitron'; font-size: 0.7rem; font-weight: bold; cursor: pointer; border-radius: 4px; transition: 0.3s; text-transform: uppercase; letter-spacing: 1px; }
                .btn-cancel-slot:hover { background: var(--neon-red); color: #000; box-shadow: 0 0 15px rgba(255, 70, 85, 0.3); }
                .empty-state { text-align: center; padding: 100px; color: #444; font-family: 'Orbitron'; letter-spacing: 2px; width: 100%; }

                @media (max-width: 900px) {
                    .mobile-menu-btn { display: block; }
                    .tactical-sidebar { position: fixed; left: -300px; top: 0; height: 100vh; box-shadow: 10px 0 30px #000; }
                    .tactical-sidebar.open { left: 0; }
                    .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; backdrop-filter: blur(3px); }
                    .tactical-header { padding: 15px 20px; }
                    .tactical-content { padding: 20px; }
                }
            `}</style>
        </div>
    );
};

export default Lobby;