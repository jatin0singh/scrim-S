  import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 📋 COMPONENT: Detailed Active Mission (Top Section)
const ActiveCard = ({ lobby, navigate }) => {
    const pool = (lobby.entry_fee || 0) * 10;
    const p1 = Math.round(pool * 0.48); 
    const p2 = Math.round(pool * 0.32); 
    const p3 = Math.round(pool * 0.20); 
    
    return (
        <div className="p-card active-mission-card">
            <div className="mission-glow"></div>
            <div className="p-card-top">
                <span className="p-m-id">#MISSION_LOBBY_{lobby.lobby_no}</span>
                <span className={`role-badge-v15 ${lobby.isHost ? 'host' : 'player'}`}>
                    {lobby.isHost ? 'COMMANDER' : 'OPERATIVE'}
                </span>
            </div>
            
            <div className="p-card-main">
                <div className="mission-time-row">
                    <span className="label">DEPLOYMENT WINDOW</span>
                    <div className="p-time-big">{lobby.slot_time}</div>
                </div>
            </div>

            <div className="p-card-economy">
                <div className="p-eco-box">
                    <label>ENTRY FEE</label>
                    <div className="p-fee-val">₹{lobby.entry_fee}</div>
                </div>
                <div className="p-eco-box prize">
                    <label>TARGET POOL</label>
                    <div className="p-prize-val">₹{pool}</div>
                </div>
            </div>

            <div className="p-payouts mission-intel">
                <div className="p-item"><span>1ST</span><b>₹{p1}</b></div>
                <div className="p-item"><span>2ND</span><b>₹{p2}</b></div>
                <div className="p-item"><span>3RD</span><b>₹{p3}</b></div>
            </div>

            <button className="p-btn-green" onClick={() => navigate(lobby.isHost ? `/host/${lobby.id}` : `/match/${lobby.id}`)}>
                {lobby.isHost ? 'OPEN COMMAND TERMINAL' : 'ENTER MATCH ROOM'}
            </button>
        </div>
    );
};

// 📋 COMPONENT: Regular Arena Card (Schedule Section)
const ArenaTierCard = ({ lobby, onBuy, onHost, gameType }) => {
    const pool = (lobby.entry_fee || 0) * 10;
    const filled = lobby.slots_filled || 0;
    const total = gameType === 'ff' ? 12 : 25;
    const progress = (filled / total) * 100;

    return (
        <div className={`p-card ${lobby.status === 'FULL' ? 'full-fade' : ''}`}>
            <div className="p-card-top">
                <span className="p-m-id">LOBBY {lobby.lobby_no}</span>
                <span className={`p-status ${lobby.status}`}>{lobby.status}</span>
            </div>
            
            <div className="p-card-economy">
                <div className="p-eco-box">
                    <label>ENTRY</label>
                    <div className="p-fee-val">₹{lobby.entry_fee}</div>
                </div>
                <div className="p-eco-box prize">
                    <label>POOL</label>
                    <div className="p-prize-val">₹{pool}</div>
                </div>
            </div>

            <div className="p-registry-container">
                <div className="p-registry-bar">
                    <div className="p-registry-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="p-registry-labels">
                    <span>SLOT REGISTRY</span>
                    <b className={lobby.status === 'FULL' ? 'text-red' : ''}>{filled} / {total}</b>
                </div>
            </div>

            <div className="p-payouts">
                <div className="p-item"><span>1ST</span><b>₹{Math.round(pool * 0.48)}</b></div>
                <div className="p-item"><span>2ND</span><b>₹{Math.round(pool * 0.32)}</b></div>
                <div className="p-item"><span>3RD</span><b>₹{Math.round(pool * 0.20)}</b></div>
            </div>

            <div className="p-actions">
                <button 
                    className={lobby.status === 'FULL' ? 'p-btn-disabled' : 'p-btn-prime'} 
                    disabled={lobby.status === 'FULL' || lobby.isPlayer || lobby.isHost} 
                    onClick={() => onBuy(lobby.id, lobby.entry_fee)}
                >
                    {lobby.isPlayer ? 'SLOT SECURED' : lobby.status === 'FULL' ? 'LOBBY FULL' : `JOIN LOBBY`}
                </button>
                <button 
                    className={`p-btn-ghost ${lobby.isHost ? 'active-host' : ''}`}
                    disabled={(lobby.host_id !== null && !lobby.isHost) || lobby.isPlayer}
                    onClick={() => onHost(lobby.id)}
                >
                    {lobby.isHost ? 'MANAGE' : lobby.isPlayer ? 'IN-COMBAT' : 'HOST ARENA'}
                </button>
            </div>
        </div>
    );
};

const Lobby = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isFF = location.pathname.includes('ff') || location.pathname.includes('freefire');
    const gameTypeParam = isFF ? 'ff' : 'bgmi';
    const gameName = isFF ? 'FREE FIRE MAX' : 'BGMI ESPORTS';
    const accent = isFF ? '#FF4655' : '#00F0FF';

    const [lobbies, setLobbies] = useState([]);
    const [balance, setBalance] = useState(0);
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [popup, setPopup] = useState({ show: false, title: '', msg: '', type: 'info', onConfirm: null });

    const fetchLobbiesAndWallet = useCallback(async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (!storedUser) return navigate('/login');
            setUser(storedUser);

            const walletRes = await fetch(`https://scrims-s.onrender.com/api/wallet/${storedUser.id}`);
            if (walletRes.ok) {
                const walletData = await walletRes.json();
                setBalance(walletData.balance);
            }

            const response = await fetch(`https://scrims-s.onrender.com/api/lobbies/${gameTypeParam}?userId=${storedUser.id}`);
            const data = await response.json();
            setLobbies(Array.isArray(data) ? data : []);
        } catch (error) { console.error(error); }
    }, [gameTypeParam, navigate]);

    useEffect(() => { 
        fetchLobbiesAndWallet(); 
        const interval = setInterval(fetchLobbiesAndWallet, 5000);
        return () => clearInterval(interval);
    }, [fetchLobbiesAndWallet]);

    const handleAction = (lobbyId, fee) => {
        if (balance < fee) return setPopup({ show: true, title: "VAULT EMPTY", msg: `Deposit required. Need ₹${fee - balance} more.`, type: "error" });
        setPopup({ show: true, title: "CONFIRM ENTRY", msg: `Deduct ₹${fee} for deployment?`, type: "confirm", onConfirm: async () => {
            await fetch('https://scrims-s.onrender.com/api/join-lobby', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, lobbyId })
            });
            navigate(`/register-team/${lobbyId}`);
        }});
    };

    const handleHost = (lobbyId) => {
        setPopup({ show: true, title: "COMMANDER", msg: "Claim host rights for this sector?", type: "confirm", onConfirm: async () => {
            await fetch('https://scrims-s.onrender.com/api/host-lobby', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, lobbyId })
            });
            navigate(`/host/${lobbyId}`);
        }});
    };

    const scheduleTimes = ['12:00 AM', '03:00 PM', '06:00 PM', '09:00 PM'];
    const myActive = lobbies.filter(l => l.isPlayer || l.isHost);

    return (
        <div className="p-viewport" style={{ '--p': accent }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap');
                
                :root { --bg: #0A0B0E; --card: #12141C; --border: #1F222C; --green: #00FF66; }
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                body { margin: 0; background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }

                /* Animations */
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .p-viewport { display: flex; height: 100vh; overflow: hidden; animation: fadeIn 0.4s ease-out; }

                /* Sidebar Layout */
                .p-sidebar { width: 280px; background: #000; border-right: 1px solid var(--border); padding: 40px 20px; z-index: 1000; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .p-brand { font-family: 'Orbitron'; font-size: 1.8rem; font-weight: 900; margin-bottom: 50px; text-align: center; }
                .p-brand span { color: var(--p); text-shadow: 0 0 10px var(--p); }
                nav button { width: 100%; background: transparent; border: none; color: #555; padding: 16px; text-align: left; font-family: 'Orbitron'; font-size: 0.75rem; cursor: pointer; border-radius: 4px; transition: 0.2s; }
                nav button.active { color: var(--p); background: rgba(255,255,255,0.02); border-left: 3px solid var(--p); }

                /* Main Body */
                .p-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .p-header { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); background: #000; }
                .p-hamburger { display: none; background: transparent; border: none; color: #fff; font-size: 1.8rem; cursor: pointer; }
                
                .p-vault { background: #111; border: 1px solid var(--border); padding: 8px 20px; border-radius: 4px; cursor: pointer; text-align: right; min-width: 120px; }
                .p-v-label { display: block; font-family: 'Orbitron'; font-size: 0.5rem; color: #444; }
                .p-v-amt { font-family: 'Barlow Condensed'; font-size: 1.6rem; color: var(--green); }

                .p-container { flex: 1; overflow-y: auto; padding: 30px; scrollbar-width: none; }
                .p-container::-webkit-scrollbar { display: none; }
                .p-hero h1 { font-family: 'Orbitron'; font-size: 2.8rem; margin: 0; text-transform: uppercase; letter-spacing: -1px; }
                .p-hero p { font-family: 'Orbitron'; font-size: 0.7rem; color: #444; margin-top: 5px; letter-spacing: 2px; margin-bottom: 40px; }

                /* Section Logic */
                .p-section { margin-bottom: 50px; }
                .p-section-label { font-family: 'Orbitron'; font-size: 0.8rem; color: #333; margin-bottom: 25px; padding-left: 12px; border-left: 4px solid var(--p); letter-spacing: 2px; text-transform: uppercase; }
                .p-row { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
                .p-row::-webkit-scrollbar { display: none; }

                /* Card Design */
                .p-card { min-width: 320px; background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 4px; scroll-snap-align: start; transition: 0.3s; position: relative; }
                .p-card:hover { border-color: var(--p); box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
                .full-fade { opacity: 0.5; filter: grayscale(0.8); }

                .active-mission-card { border: 1px solid var(--p) !important; background: linear-gradient(135deg, #111 0%, #000 100%) !important; overflow: hidden; }
                .mission-glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255, 70, 85, 0.05) 0%, transparent 70%); pointer-events: none; }
                
                .p-card-top { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .p-m-id { font-family: 'Orbitron'; font-size: 0.8rem; color: #444; }
                .p-status { font-family: 'Orbitron'; font-size: 0.6rem; border: 1px solid #222; padding: 2px 8px; color: #444; letter-spacing: 1px; }
                .p-status.OPEN { color: var(--green); border-color: var(--green); }
                .p-status.FULL { color: var(--p); border-color: var(--p); }

                .p-card-economy { display: flex; gap: 20px; margin-bottom: 20px; }
                .p-eco-box { flex: 1; background: #000; padding: 12px; border: 1px solid #1a1a1a; }
                .p-eco-box label { display: block; font-family: 'Orbitron'; font-size: 0.5rem; color: #333; margin-bottom: 5px; }
                .p-fee-val { font-family: 'Barlow Condensed'; font-size: 2.2rem; color: #fff; line-height: 1; }
                .p-prize-val { font-family: 'Barlow Condensed'; font-size: 2.2rem; color: var(--green); line-height: 1; }

                /* Slot Registry HUD */
                .p-registry-container { margin-bottom: 20px; }
                .p-registry-bar { width: 100%; height: 4px; background: #000; margin: 10px 0; border-radius: 2px; overflow: hidden; }
                .p-registry-fill { height: 100%; background: var(--p); box-shadow: 0 0 10px var(--p); transition: 0.6s ease; }
                .p-registry-labels { display: flex; justify-content: space-between; font-family: 'Orbitron'; font-size: 0.55rem; color: #444; }
                .text-red { color: var(--p) !important; }

                /* Payouts */
                .p-payouts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #222; margin-bottom: 25px; border: 1px solid #222; }
                .p-item { background: var(--card); padding: 12px 5px; text-align: center; }
                .p-item span { display: block; font-family: 'Orbitron'; font-size: 0.45rem; color: #444; margin-bottom: 3px; }
                .p-item b { font-family: 'Barlow Condensed'; font-size: 1.1rem; color: var(--p); }

                /* Buttons */
                .p-actions { display: flex; flex-direction: column; gap: 10px; }
                .p-btn-prime { padding: 16px; background: var(--p); border: none; color: #000; font-family: 'Orbitron'; font-weight: 900; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
                .p-btn-prime:hover { background: #fff; }
                .p-btn-green { padding: 16px; background: var(--green); border: none; color: #000; font-family: 'Orbitron'; font-weight: 900; font-size: 0.8rem; cursor: pointer; }
                .p-btn-ghost { padding: 14px; background: transparent; border: 1px solid #222; color: #444; font-family: 'Orbitron'; font-size: 0.7rem; cursor: pointer; transition: 0.2s; }
                .p-btn-ghost.active-host { border-color: var(--p); color: var(--p); }
                .p-btn-disabled { padding: 16px; background: #1a1a1a; color: #333; border: none; font-family: 'Orbitron'; font-weight: 900; cursor: not-allowed; text-transform: uppercase; }

                /* Mobile Specific Fixes */
                @media (max-width: 900px) {
                    .p-sidebar { 
                        position: fixed; 
                        left: -280px; 
                        top: 0; 
                        height: 100vh; 
                        background: rgba(0, 0, 0, 0.98) !important; 
                        backdrop-filter: blur(15px); 
                        border-right: 1px solid var(--p);
                        box-shadow: 20px 0 60px #000;
                    }
                    .p-sidebar.open { left: 0; }
                    .p-hamburger { display: block !important; }
                    .p-main { width: 100%; }
                    .p-header { justify-content: space-between !important; padding: 10px 20px; }
                    .p-container { padding: 20px 15px; }
                    .p-hero h1 { font-size: 2.1rem; }
                    .p-card { min-width: 88vw; scroll-snap-align: center; }
                    .p-row { padding-left: 5px; }
                }

                /* Modals */
                .p-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px); }
                .p-modal { background: #000; border: 1px solid #222; width: 100%; max-width: 400px; padding: 35px; text-align: center; border-top: 4px solid var(--p); box-shadow: 0 20px 50px #000; }
                .p-modal h3 { font-family: 'Orbitron'; margin-bottom: 10px; font-size: 1.2rem; }
                .p-modal p { color: #666; font-size: 0.95rem; margin-bottom: 30px; }
                .p-modal-btns { display: flex; gap: 15px; }
                .p-modal-btns button { flex: 1; padding: 15px; background: #111; border: 1px solid #222; color: #fff; font-family: 'Orbitron'; cursor: pointer; }
                .btn-confirm { background: var(--p) !important; border: none !important; color: #000 !important; font-weight: 900; }
            `}</style>

            {/* 🛸 HUD POPUP */}
            {popup.show && (
                <div className="p-modal-overlay">
                    <div className="p-modal">
                        <h3>{popup.title}</h3>
                        <p>{popup.msg}</p>
                        <div className="p-modal-btns">
                            <button onClick={() => setPopup({show:false})}>ABORT</button>
                            {popup.type === 'confirm' && <button className="btn-confirm" onClick={() => { popup.onConfirm(); setPopup({show:false}); }}>CONFIRM</button>}
                        </div>
                    </div>
                </div>
            )}

            {/* 🛡️ TACTICAL SIDEBAR */}
            <aside className={`p-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="p-brand">SCRIMS<span>S</span></div>
                <nav>
                    <button onClick={() => navigate('/dashboard')}>▤ OVERVIEW</button>
                    <button className="active">⚔️ ARENAS</button>
                    <button onClick={() => navigate('/wallet')}>🏦 VAULT</button>
                    <button onClick={() => navigate('/profile')}>👤 OPERATIVE</button>
                </nav>
            </aside>

            <main className="p-main">
                <header className="p-header">
                    <button className="p-hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
                    <div className="p-vault" onClick={() => navigate('/wallet')}>
                        <span className="p-v-label">VAULT // CREDITS</span>
                        <span className="p-v-amt">₹{parseFloat(balance).toLocaleString()}</span>
                    </div>
                </header>

                <div className="p-container">
                    <div className="p-hero">
                        <h1>{gameName}</h1>
                        <p>READY_FOR_DEPLOYMENT // SEQUENTIAL_HUD_V18</p>
                    </div>
                    
                    {/* 🚀 TOP: ACTIVE MISSIONS */}
                    {myActive.length > 0 && (
                        <section className="p-section">
                            <h2 className="p-section-label">MY ACTIVE MISSIONS</h2>
                            <div className="p-row">
                                {myActive.map(l => <ActiveCard key={l.id} lobby={l} navigate={navigate} />)}
                            </div>
                        </section>
                    )}

                    {/* 📅 BOTTOM: SCHEDULE WINDOWS */}
                    {scheduleTimes.map(time => {
                        const filtered = lobbies.filter(l => l.slot_time?.includes(time)).sort((a,b) => a.entry_fee - b.entry_fee);
                        return (
                            <section className="p-section" key={time}>
                                <h2 className="p-section-label">WINDOW: {time}</h2>
                                <div className="p-row">
                                    {filtered.length > 0 ? filtered.map(l => (
                                        <ArenaTierCard 
                                            key={l.id} 
                                            lobby={l} 
                                            onBuy={handleAction} 
                                            onHost={handleHost} 
                                            gameType={gameTypeParam}
                                        />
                                    )) : <div style={{color:'#222', fontSize:'0.7rem', paddingLeft:'15px'}}>INITIALIZING SECTOR INTEL...</div>}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default Lobby;