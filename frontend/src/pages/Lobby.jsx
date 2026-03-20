 import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Lobby = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const isFF = location.pathname.includes('ff') || location.pathname.includes('freefire');
    const gameTypeParam = isFF ? 'ff' : 'bgmi';
    const gameName = isFF ? 'FREE FIRE MAX' : 'BGMI ESPORTS';
    
    // 🎨 PRO GAMING HUD PALETTE
    const theme = isFF ? {
        primary: '#FF4655', // Valorant Red
        bg: '#08090B',
        card: '#111217',
        accent: 'rgba(255, 70, 85, 0.15)'
    } : {
        primary: '#00F0FF', // Cyber Cyan
        bg: '#08090B',
        card: '#111217',
        accent: 'rgba(0, 240, 255, 0.15)'
    };

    const [lobbies, setLobbies] = useState([]);
    const [balance, setBalance] = useState(0);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [popup, setPopup] = useState({ show: false, title: '', msg: '', type: 'info', onConfirm: null });

    const norm = (t) => t ? t.replace(/^0/, '').trim().toUpperCase() : "";

    const fetchLobbiesAndWallet = useCallback(async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (!storedUser) return navigate('/login');
            setUser(storedUser);

            const walletRes = await fetch(`https://scrims-s.onrender.com/api/wallet/${storedUser.id}`);
            const walletData = await walletRes.json();
            setBalance(walletData.balance);

            const response = await fetch(`https://scrims-s.onrender.com/api/lobbies/${gameTypeParam}?userId=${storedUser.id}`);
            const data = await response.json();
            setLobbies(Array.isArray(data) ? data : []);
        } catch (error) { setLobbies([]); } finally { setIsLoading(false); }
    }, [gameTypeParam, navigate]);

    useEffect(() => { 
        fetchLobbiesAndWallet(); 
        const interval = setInterval(fetchLobbiesAndWallet, 5000);
        return () => clearInterval(interval);
    }, [fetchLobbiesAndWallet]);

    const handleAction = (lobbyId, fee) => {
        if (balance < fee) return setPopup({ show: true, title: "INSUFFICIENT CREDITS", msg: `Vault requires ₹${fee - balance} more.`, type: "error" });
        setPopup({ show: true, title: "CONFIRM DEPLOY", msg: `Join match for ₹${fee}?`, type: "confirm", onConfirm: async () => {
            await fetch('https://scrims-s.onrender.com/api/join-lobby', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, lobbyId })
            });
            navigate(`/register-team/${lobbyId}`);
        }});
    };

    const handleHost = (lobbyId) => {
        setPopup({ show: true, title: "CLAIM COMMAND", msg: "Initialize Host rights for this arena?", type: "confirm", onConfirm: async () => {
            const res = await fetch('https://scrims-s.onrender.com/api/host-lobby', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, lobbyId })
            });
            if (res.ok) navigate(`/host/${lobbyId}`);
        }});
    };

    const safeLobbies = Array.isArray(lobbies) ? lobbies : [];
    const myActive = safeLobbies.filter(l => l.isPlayer || l.isHost);
    const scheduleTimes = ['12:00 AM', '03:00 PM', '06:00 PM', '09:00 PM'];

    return (
        <div className="hud-viewport" style={{ '--p': theme.primary, '--bg': theme.bg, '--card': theme.card, '--accent': theme.accent }}>
            {/* 🛡️ HUD MODAL */}
            {popup.show && (
                <div className="hud-overlay">
                    <div className={`hud-modal ${popup.type}`}>
                        <div className="hud-modal-header">{popup.title}</div>
                        <p>{popup.msg}</p>
                        <div className="hud-modal-actions">
                            <button className="h-btn-secondary" onClick={() => setPopup({show:false})}>CANCEL</button>
                            {popup.type === 'confirm' && <button className="h-btn-primary" onClick={() => { popup.onConfirm(); setPopup({show:false}); }}>CONFIRM</button>}
                        </div>
                    </div>
                </div>
            )}

            <aside className={`hud-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="hud-logo">SCRIMS<span>S</span></div>
                <nav>
                    <button onClick={() => navigate('/dashboard')}>DASHBOARD</button>
                    <button className="active">ARENAS</button>
                    <button onClick={() => navigate('/wallet')}>VAULT</button>
                    <button onClick={() => navigate('/profile')}>OPERATIVE</button>
                </nav>
            </aside>

            <main className="hud-main">
                <header className="hud-header">
                    <button className="hud-hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
                    <div className="hud-vault" onClick={() => navigate('/wallet')}>
                        <span className="v-tag">VAULT // CREDITS</span>
                        <span className="v-amt">₹{parseFloat(balance).toLocaleString()}</span>
                    </div>
                </header>

                <div className="hud-scroll-container">
                    <div className="hud-hero">
                        <h1>{gameName}</h1>
                        <div className="hud-line"></div>
                    </div>

                    {/* 🚀 TOP: MY MISSIONS */}
                    <section className="hud-section">
                        <div className="hud-section-header">
                            <span className="pulse-dot"></span> MY ACTIVE MISSIONS
                        </div>
                        <div className="hud-horizontal-scroll">
                            {myActive.length > 0 ? myActive.map(l => (
                                <ActiveCard key={l.id} lobby={l} navigate={navigate} />
                            )) : <div className="hud-empty">NO ACTIVE DEPLOYMENTS.</div>}
                        </div>
                    </section>

                    {/* 📅 SCHEDULE */}
                    {scheduleTimes.map(time => {
                        const filtered = safeLobbies.filter(l => norm(l.slot_time) === norm(time)).sort((a,b) => a.entry_fee - b.entry_fee);
                        return (
                            <section className="hud-section" key={time}>
                                <div className="hud-section-header">SCHEDULED // {time}</div>
                                <div className="hud-horizontal-scroll">
                                    {filtered.length > 0 ? filtered.map(l => (
                                        <ArenaCard key={l.id} lobby={l} onBuy={handleAction} onHost={handleHost} />
                                    )) : <div className="hud-empty">SYNCING DATA...</div>}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Orbitron:wght@800;900&family=Barlow+Condensed:wght@700;800&display=swap');
                
                :root { --p: #FF4655; --bg: #08090B; --card: #111217; }
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                body { margin: 0; background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; }

                .hud-viewport { display: flex; height: 100vh; overflow: hidden; }

                /* Sidebar */
                .hud-sidebar { width: 260px; background: #000; border-right: 1px solid #1a1a1a; padding: 40px 20px; z-index: 1000; transition: 0.3s; }
                .hud-logo { font-family: 'Orbitron'; font-size: 1.5rem; color: #fff; margin-bottom: 50px; text-align: center; }
                .hud-logo span { color: var(--p); }
                .hud-sidebar nav button { width: 100%; background: transparent; border: none; color: #444; padding: 15px; text-align: left; font-family: 'Orbitron'; font-size: 0.7rem; cursor: pointer; letter-spacing: 1px; }
                .hud-sidebar nav button.active { color: var(--p); border-left: 2px solid var(--p); background: rgba(255,255,255,0.02); }

                /* Main Body */
                .hud-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .hud-header { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1a1a1a; background: #000; }
                .hud-vault { background: #111; border: 1px solid #222; padding: 8px 20px; cursor: pointer; display: flex; flex-direction: column; align-items: flex-end; }
                .v-tag { font-size: 0.5rem; font-family: 'Orbitron'; color: #555; }
                .v-amt { font-family: 'Barlow Condensed'; font-size: 1.5rem; color: #00FF66; }

                .hud-scroll-container { flex: 1; overflow-y: auto; padding: 20px; scrollbar-width: none; }
                .hud-scroll-container::-webkit-scrollbar { display: none; }

                .hud-hero { padding: 20px 10px 40px; }
                .hud-hero h1 { font-family: 'Orbitron'; font-size: 2.2rem; margin: 0; text-transform: uppercase; letter-spacing: -1px; }
                .hud-line { width: 60px; height: 4px; background: var(--p); margin-top: 10px; }

                /* Sections & Horizontal Scroll */
                .hud-section { margin-bottom: 40px; }
                .hud-section-header { font-family: 'Orbitron'; font-size: 0.75rem; color: #333; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; letter-spacing: 1px; }
                .pulse-dot { width: 8px; height: 8px; background: #00FF66; border-radius: 50%; animation: p 1.5s infinite; }
                @keyframes p { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

                .hud-horizontal-scroll { 
                    display: flex; 
                    gap: 15px; 
                    overflow-x: auto; 
                    padding: 0 10px 20px; 
                    scroll-snap-type: x mandatory;
                    scrollbar-width: none;
                }
                .hud-horizontal-scroll::-webkit-scrollbar { display: none; }

                /* ⚔️ PRO CARDS */
                .hud-card { 
                    min-width: 85%; /* Shows a peek of the next card on mobile */
                    background: var(--card); 
                    border: 1px solid #1a1a1a; 
                    padding: 25px; 
                    scroll-snap-align: center;
                    position: relative;
                    transition: 0.3s;
                }
                .hud-card:active { transform: scale(0.98); }
                .hud-card::after { content: ""; position: absolute; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 15px 15px 0; border-color: transparent #1a1a1a transparent transparent; }

                .c-top { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .c-id { font-family: 'Orbitron'; font-size: 0.8rem; color: #444; }
                .c-status { font-family: 'Orbitron'; font-size: 0.6rem; padding: 2px 8px; border: 1px solid #333; color: #444; }
                .c-status.OPEN { color: #00FF66; border-color: #00FF66; }

                .c-main { display: flex; justify-content: space-between; margin-bottom: 25px; align-items: center; }
                .c-fee { font-family: 'Barlow Condensed'; font-size: 3rem; line-height: 0.8; }
                .c-prize { text-align: right; }
                .c-prize span { display: block; font-size: 0.6rem; color: #555; font-family: 'Orbitron'; }
                .c-prize b { font-family: 'Barlow Condensed'; font-size: 2.2rem; color: #00FF66; }

                .c-payouts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #1a1a1a; margin-bottom: 25px; border: 1px solid #1a1a1a; }
                .p-item { background: var(--card); padding: 10px; text-align: center; }
                .p-item span { display: block; font-size: 0.5rem; color: #444; font-family: 'Orbitron'; }
                .p-item b { font-family: 'Barlow Condensed'; font-size: 1rem; color: var(--p); }

                /* HUD Buttons */
                .h-btn { width: 100%; padding: 16px; border: none; font-family: 'Orbitron'; font-weight: 900; font-size: 0.8rem; cursor: pointer; transition: 0.2s; position: relative; }
                .h-btn-prime { background: var(--p); color: #000; }
                .h-btn-prime:hover { background: #fff; }
                .h-btn-success { background: #00FF66; color: #000; }
                .h-btn-ghost { background: transparent; border: 1px solid #222; color: #444; margin-top: 10px; }
                .h-btn-ghost.active { border-color: var(--p); color: var(--p); }

                .hud-empty { padding: 40px; text-align: center; color: #222; font-family: 'Orbitron'; font-size: 0.7rem; border: 1px dashed #1a1a1a; width: 100%; }

                /* Mobile Overlays */
                .hud-hamburger { display: none; background: transparent; border: none; color: #fff; font-size: 1.5rem; }

                @media (min-width: 900px) {
                    .hud-card { min-width: 320px; }
                    .hud-scroll-container { padding: 40px; }
                    .hud-hero h1 { font-size: 4rem; }
                    .hud-horizontal-scroll { gap: 30px; }
                }

                @media (max-width: 900px) {
                    .hud-hamburger { display: block; }
                    .hud-sidebar { position: fixed; left: -260px; top: 0; height: 100vh; }
                    .hud-sidebar.open { left: 0; box-shadow: 20px 0 50px #000; }
                }

                /* Modals */
                .hud-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .hud-modal { background: #000; border: 1px solid #222; width: 100%; max-width: 400px; padding: 30px; }
                .hud-modal-header { font-family: 'Orbitron'; color: var(--p); font-size: 1rem; margin-bottom: 15px; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px; }
                .hud-modal-actions { display: flex; gap: 10px; margin-top: 30px; }
                .h-btn-secondary { flex: 1; padding: 15px; background: #111; border: 1px solid #222; color: #fff; font-family: 'Orbitron'; font-size: 0.7rem; }
                .h-btn-primary { flex: 1; padding: 15px; background: var(--p); border: none; color: #000; font-family: 'Orbitron'; font-weight: 900; font-size: 0.7rem; }
            `}</style>
        </div>
    );
};

const ActiveCard = ({ lobby, navigate }) => (
    <div className="hud-card" style={{borderColor: 'var(--p)'}}>
        <div className="c-top">
            <span className="c-id">MISSION_{lobby.id}</span>
            <span className="c-status OPEN">ACTIVE</span>
        </div>
        <div className="c-main">
            <div className="c-fee" style={{fontSize: '2rem'}}>{lobby.slot_time}</div>
        </div>
        <button className="h-btn h-btn-success" onClick={() => navigate(lobby.isHost ? `/host/${lobby.id}` : `/match/${lobby.id}`)}>
            {lobby.isHost ? 'COMMAND TERMINAL' : 'ENTER ARENA'}
        </button>
    </div>
);

const ArenaCard = ({ lobby, onBuy, onHost }) => {
    const ppMap = { 25: 200, 35: 300, 45: 400, 50: 500, 75: 800, 100: 1000 };
    const pool = ppMap[lobby.entry_fee] || lobby.prize_pool;
    
    return (
        <div className="hud-card">
            <div className="c-top">
                <span className="c-id">HUD_LOBBY_{lobby.id}</span>
                <span className={`c-status ${lobby.status}`}>{lobby.status}</span>
            </div>
            <div className="c-main">
                <div className="c-fee">₹{lobby.entry_fee}</div>
                <div className="c-prize">
                    <span>WINNING POOL</span>
                    <b>₹{pool}</b>
                </div>
            </div>
            <div className="c-payouts">
                <div className="p-item"><span>1ST</span><b>₹{Math.round(pool * 0.5)}</b></div>
                <div className="p-item"><span>2ND</span><b>₹{Math.round(pool * 0.3)}</b></div>
                <div className="p-item"><span>3RD</span><b>₹{Math.round(pool * 0.2)}</b></div>
            </div>
            <button className="h-btn h-btn-prime" disabled={lobby.status === 'FULL' || lobby.isPlayer} onClick={() => onBuy(lobby.id, lobby.entry_fee)}>
                {lobby.isPlayer ? 'SLOT SECURED' : lobby.status === 'FULL' ? 'DEPLOYMENT FULL' : `BUY SLOT`}
            </button>
            <button className={`h-btn h-btn-ghost ${lobby.isHost ? 'active' : ''}`} disabled={lobby.host_id !== null && !lobby.isHost} onClick={() => onHost(lobby.id)}>
                {lobby.isHost ? 'COMMANDER ON-SITE' : lobby.host_id ? 'COMMAND ASSIGNED' : 'CLAIM COMMAND'}
            </button>
        </div>
    );
};

export default Lobby;