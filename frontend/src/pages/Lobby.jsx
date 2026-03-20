 import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Lobby = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const isFF = location.pathname.includes('ff') || location.pathname.includes('freefire');
    const gameTypeParam = isFF ? 'ff' : 'bgmi';
    const gameName = isFF ? 'FREE FIRE MAX' : 'BGMI ESPORTS';
    const accentColor = isFF ? '#ff4655' : '#00f0ff';

    const [lobbies, setLobbies] = useState([]);
    const [balance, setBalance] = useState(0);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [popup, setPopup] = useState({ show: false, title: '', msg: '', type: 'info', onConfirm: null });

    // 🛠️ Normalize Time for comparison
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
        if (balance < fee) return setPopup({ show: true, title: "VAULT EMPTY", msg: "Please add money.", type: "error" });
        setPopup({ show: true, title: "CONFIRM", msg: `Join for ₹${fee}?`, type: "confirm", onConfirm: async () => {
            await fetch('https://scrims-s.onrender.com/api/join-lobby', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, lobbyId })
            });
            navigate(`/register-team/${lobbyId}`);
        }});
    };

    const handleHost = (lobbyId) => {
        setPopup({ show: true, title: "HOSTING", msg: "Take control of this arena?", type: "confirm", onConfirm: async () => {
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
        <div className="v8-viewport" style={{ '--accent': accentColor }}>
            {popup.show && (
                <div className="v8-modal-overlay">
                    <div className={`v8-modal ${popup.type}`}>
                        <h3>{popup.title}</h3>
                        <p>{popup.msg}</p>
                        <div className="v8-modal-btns">
                            <button onClick={() => setPopup({show:false})}>ABORT</button>
                            {popup.type === 'confirm' && <button className="exec" onClick={() => { popup.onConfirm(); setPopup({show:false}); }}>CONFIRM</button>}
                        </div>
                    </div>
                </div>
            )}

            <aside className={`v8-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="v8-brand">SCRIMS<span>S</span></div>
                <nav>
                    <button onClick={() => navigate('/dashboard')}>▤ OVERVIEW</button>
                    <button className="active">⚔️ ARENAS</button>
                    <button onClick={() => navigate('/wallet')}>🏦 VAULT</button>
                </nav>
            </aside>

            <main className="v8-main">
                <header className="v8-header">
                    <button className="mob-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
                    <div className="v8-balance" onClick={() => navigate('/wallet')}>
                        <label>VAULT</label>
                        <span>₹{parseFloat(balance).toLocaleString()}</span>
                    </div>
                </header>

                <div className="v8-content">
                    <section className="v8-section">
                        <h2 className="section-label">// MY ACTIVE MISSIONS</h2>
                        <div className="horizontal-row">
                            {myActive.length > 0 ? myActive.map(l => <ActiveCard key={l.id} lobby={l} navigate={navigate} />) : <div className="no-active">NO ACTIVE MISSIONS.</div>}
                        </div>
                    </section>

                    {scheduleTimes.map(time => {
                        const filtered = safeLobbies.filter(l => norm(l.slot_time) === norm(time)).sort((a,b) => a.entry_fee - b.entry_fee);
                        return (
                            <section className="v8-section" key={time}>
                                <h2 className="section-label">// WINDOW: {time}</h2>
                                <div className="horizontal-row">
                                    {filtered.length > 0 ? filtered.map(l => <ArenaTierCard key={l.id} lobby={l} onBuy={handleAction} onHost={handleHost} />) : <div className="no-active">INITIALIZING...</div>}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rajdhani:wght@600;700&family=Teko:wght@600&display=swap');
                .v8-viewport { display: flex; height: 100vh; background: #000; color: #fff; font-family: 'Rajdhani'; overflow: hidden; }
                .v8-sidebar { width: 260px; background: #050505; border-right: 1px solid #111; padding: 30px 20px; transition: 0.3s; z-index: 1000; }
                .v8-brand { font-family: 'Orbitron'; font-size: 1.5rem; margin-bottom: 50px; font-weight: 900; }
                .v8-brand span { color: var(--accent); }
                nav button { width: 100%; background: transparent; border: none; color: #444; padding: 18px; text-align: left; font-family: 'Orbitron'; font-size: 0.7rem; cursor: pointer; }
                nav button.active { color: var(--accent); border-left: 3px solid var(--accent); background: rgba(255,255,255,0.02); }
                .v8-main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: #000; }
                .v8-header { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; background: rgba(5,5,5,0.9); border-bottom: 1px solid #111; position: sticky; top: 0; z-index: 90; }
                .v8-balance { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 5px 20px; border-radius: 4px; text-align: right; }
                .v8-balance label { font-family: 'Orbitron'; font-size: 0.5rem; color: #444; display: block; }
                .v8-balance span { font-family: 'Teko'; font-size: 1.5rem; color: #00ff66; }
                .v8-content { padding: 20px; }
                .v8-section { margin-bottom: 40px; }
                .section-label { font-family: 'Orbitron'; font-size: 0.8rem; letter-spacing: 2px; color: #555; margin-bottom: 20px; border-left: 4px solid var(--accent); padding-left: 15px; }
                .horizontal-row { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; }
                .horizontal-row::-webkit-scrollbar { display: none; }
                .active-card { min-width: 300px; background: #111; border: 1px solid var(--accent); padding: 25px; }
                .active-card h4 { margin: 0; font-family: 'Orbitron'; color: var(--accent); font-size: 1rem; }
                .active-card p { margin: 5px 0 20px 0; font-size: 0.8rem; color: #888; }
                .tier-card { min-width: 300px; background: #080808; border: 1px solid #151515; padding: 25px; border-top: 3px solid #333; transition: 0.3s; }
                .tier-card:hover { border-top-color: var(--accent); background: #0c0c0c; }
                .t-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .t-fee { font-family: 'Teko'; font-size: 2.5rem; color: #fff; line-height: 1; }
                .t-prize { font-family: 'Teko'; font-size: 2.5rem; color: #00ff66; line-height: 1; }
                .pp-label { display: block; font-size: 0.55rem; color: #444; font-family: 'Orbitron'; }
                .t-payouts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #000; padding: 12px; margin-bottom: 20px; border: 1px solid #111; }
                .t-payouts div { text-align: center; }
                .t-payouts span { display: block; font-size: 0.5rem; color: #555; font-family: 'Orbitron'; }
                .t-payouts b { font-size: 1rem; color: var(--accent); font-family: 'Teko'; }
                .btn { width: 100%; padding: 14px; border: none; font-family: 'Orbitron'; font-weight: 900; font-size: 0.75rem; cursor: pointer; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0% 100%); transition: 0.2s; margin-top: 5px; }
                .btn-primary { background: var(--accent); color: #000; }
                .btn-success { background: #00ff66; color: #000; }
                .btn-host { background: transparent; border: 1px solid #222; color: #555; }
                .btn-host.active { border-color: var(--accent); color: var(--accent); }
                .no-active { padding: 50px; text-align: center; border: 1px dashed #222; width: 100%; color: #333; font-family: 'Orbitron'; font-size: 0.7rem; }
                .v8-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; }
                .v8-modal { background: #080808; border: 1px solid #222; width: 320px; padding: 30px; text-align: center; }
                .v8-modal-btns { display: flex; gap: 10px; margin-top: 20px; }
                .v8-modal-btns button { flex: 1; padding: 12px; cursor: pointer; background: transparent; color: #fff; border: 1px solid #333; font-family: 'Orbitron'; }
                .v8-modal-btns .exec { background: var(--accent); color: #000; border: none; }
                @media (max-width: 900px) {
                    .mob-btn { display: block !important; background: transparent; border: none; color: #fff; font-size: 1.5rem; }
                    .v8-sidebar { position: fixed; left: -260px; top: 0; height: 100vh; }
                    .v8-sidebar.open { left: 0; }
                    .tier-card, .active-card { min-width: 280px; }
                }
            `}</style>
        </div>
    );
};

const ActiveCard = ({ lobby, navigate }) => (
    <div className="active-card">
        <h4>MATCH #{lobby.id}</h4>
        <p>{lobby.slot_time} • {lobby.status}</p>
        <button className="btn btn-success" onClick={() => navigate(lobby.isHost ? `/host/${lobby.id}` : `/match/${lobby.id}`)}>
            {lobby.isHost ? 'OPEN HOST PANEL' : 'ENTER ROOM'}
        </button>
    </div>
);

const ArenaTierCard = ({ lobby, onBuy, onHost }) => {
    const ppMap = { 25: 200, 35: 300, 45: 400, 50: 500, 75: 800, 100: 1000 };
    const pool = ppMap[lobby.entry_fee] || lobby.prize_pool;
    return (
        <div className="tier-card">
            <div className="t-header">
                <div><span className="pp-label">ENTRY FEE</span><div className="t-fee">₹{lobby.entry_fee}</div></div>
                <div style={{textAlign:'right'}}><span className="pp-label">TOTAL POOL</span><div className="t-prize">₹{pool}</div></div>
            </div>
            <div className="t-payouts">
                <div><span>RANK 1</span><b>₹{Math.round(pool * 0.5)}</b></div>
                <div><span>RANK 2</span><b>₹{Math.round(pool * 0.3)}</b></div>
                <div><span>RANK 3</span><b>₹{Math.round(pool * 0.2)}</b></div>
            </div>
            <div className="t-actions">
                <button className="btn btn-primary" disabled={lobby.status === 'FULL' || lobby.isPlayer} onClick={() => onBuy(lobby.id, lobby.entry_fee)}>
                    {lobby.isPlayer ? 'SLOT SECURED' : lobby.status === 'FULL' ? 'FULL' : `JOIN ₹${lobby.entry_fee}`}
                </button>
                <button className={`btn btn-host ${lobby.isHost ? 'active' : ''}`} disabled={lobby.host_id !== null && !lobby.isHost} onClick={() => onHost(lobby.id)}>
                    {lobby.isHost ? 'COMMAND ACTIVE' : lobby.host_id ? 'HOST ASSIGNED' : 'CLAIM COMMAND'}
                </button>
            </div>
        </div>
    );
};

export default Lobby;