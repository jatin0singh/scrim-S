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
            setLobbies(data);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    }, [gameTypeParam, navigate]);

    useEffect(() => { 
        fetchLobbiesAndWallet(); 
        const interval = setInterval(fetchLobbiesAndWallet, 5000);
        return () => clearInterval(interval);
    }, [fetchLobbiesAndWallet]);

    const handleAction = (lobbyId, fee) => {
        if (balance < fee) return setPopup({ show: true, title: "VAULT EMPTY", msg: `Deposit ₹${fee - balance} more to enter.`, type: "error" });
        setPopup({ show: true, title: "CONFIRM ENTRY", msg: `Deduct ₹${fee} for Match #${lobbyId}?`, type: "confirm", onConfirm: async () => {
            await fetch('https://scrims-s.onrender.com/api/join-lobby', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, lobbyId })
            });
            navigate(`/register-team/${lobbyId}`);
        }});
    };

    const handleHost = (lobbyId) => {
        setPopup({ show: true, title: "CLAIM COMMAND", msg: "Initialize Host Terminal?", type: "confirm", onConfirm: async () => {
            const res = await fetch('https://scrims-s.onrender.com/api/host-lobby', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, lobbyId })
            });
            if (res.ok) navigate(`/host/${lobbyId}`);
        }});
    };

    // Logical Grouping
    const myActive = lobbies.filter(l => l.isPlayer || l.isHost);
     // Inside your Lobby component, update this line:
const scheduleTimes = ['12:00 AM', '03:00 PM', '06:00 PM', '09:00 PM'];
    return (
        <div className="v7-viewport" style={{ '--accent': accentColor }}>
            {popup.show && (
                <div className="v7-modal-overlay">
                    <div className={`v7-modal ${popup.type}`}>
                        <h3>{popup.title}</h3>
                        <p>{popup.msg}</p>
                        <div className="v7-modal-btns">
                            {popup.type === 'confirm' ? (
                                <>
                                    <button onClick={() => setPopup({show:false})}>ABORT</button>
                                    <button className="exec" onClick={() => { popup.onConfirm(); setPopup({show:false}); }}>CONFIRM</button>
                                </>
                            ) : <button className="exec" style={{width:'100%'}} onClick={() => setPopup({show:false})}>OK</button>}
                        </div>
                    </div>
                </div>
            )}

            <aside className={`v7-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="v7-brand">SCRIMS<span>S</span></div>
                <nav>
                    <button onClick={() => navigate('/dashboard')}>▤ DASHBOARD</button>
                    <button className="active">⚔️ ARENAS</button>
                    <button onClick={() => navigate('/wallet')}>🏦 VAULT</button>
                    <button onClick={() => navigate('/profile')}>👤 PROFILE</button>
                </nav>
            </aside>

            <main className="v7-main">
                <header className="v7-header">
                    <div className="h-left">
                        <button className="mob-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
                        <div className="game-status"><span className="pulse"></span> {gameName}</div>
                    </div>
                    <div className="v7-balance" onClick={() => navigate('/wallet')}>
                        <label>VAULT</label>
                        <span>₹{parseFloat(balance).toLocaleString()}</span>
                    </div>
                </header>

                <div className="v7-content">
                    {/* 🚀 TOP SECTION: MY ACTIVE MISSIONS */}
                    <section className="v7-section active-missions">
                        <h2 className="section-label">// MY ACTIVE MISSIONS</h2>
                        <div className="horizontal-row">
                            {myActive.length > 0 ? myActive.map(l => (
                                <ActiveCard key={l.id} lobby={l} navigate={navigate} />
                            )) : (
                                <div className="no-active">NO ACTIVE DEPLOYMENTS. JOIN A MATCH BELOW.</div>
                            )}
                        </div>
                    </section>

                    {/* 📅 BOTTOM SECTION: SCHEDULED TIMELINE */}
                    {scheduleTimes.map(time => (
                        <section className="v7-section" key={time}>
                            <h2 className="section-label">// TIME TARGET: {time}</h2>
                            <div className="horizontal-row">
                                {lobbies.filter(l => l.slot_time === time).map(l => (
                                    <ArenaTierCard key={l.id} lobby={l} onBuy={handleAction} onHost={handleHost} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@600;700&family=Teko:wght@600&display=swap');
                .v7-viewport { display: flex; height: 100vh; background: #000; color: #fff; font-family: 'Rajdhani'; overflow: hidden; }
                .v7-sidebar { width: 260px; background: #050505; border-right: 1px solid #111; padding: 30px 20px; transition: 0.3s; z-index: 1000; }
                .v7-brand { font-family: 'Orbitron'; font-size: 1.5rem; margin-bottom: 50px; font-weight: 900; }
                .v7-brand span { color: var(--accent); }
                nav button { width: 100%; background: transparent; border: none; color: #444; padding: 18px; text-align: left; font-family: 'Orbitron'; font-size: 0.7rem; cursor: pointer; transition: 0.2s; }
                nav button.active { color: var(--accent); border-left: 3px solid var(--accent); background: rgba(255,255,255,0.02); }
                
                .v7-main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
                .v7-header { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; background: rgba(5,5,5,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid #111; position: sticky; top: 0; z-index: 90; }
                .v7-balance { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 5px 20px; border-radius: 4px; cursor: pointer; text-align: right; }
                .v7-balance label { font-family: 'Orbitron'; font-size: 0.5rem; color: #444; display: block; }
                .v7-balance span { font-family: 'Teko'; font-size: 1.5rem; color: #00ff66; }

                .v7-content { padding: 20px; }
                .v7-section { margin-bottom: 40px; }
                .section-label { font-family: 'Orbitron'; font-size: 0.75rem; letter-spacing: 2px; color: #333; margin-bottom: 15px; border-left: 3px solid var(--accent); padding-left: 10px; }
                
                /* Horizontal Scroll */
                .horizontal-row { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 15px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
                .horizontal-row::-webkit-scrollbar { display: none; }

                /* Active Card */
                .active-card { min-width: 280px; background: #111; border: 1px solid var(--accent); padding: 20px; scroll-snap-align: start; position: relative; }
                .active-card h4 { margin: 0; font-family: 'Orbitron'; color: var(--accent); font-size: 0.9rem; }
                .active-card p { margin: 5px 0 15px 0; font-size: 0.8rem; color: #666; }

                /* Tier Card */
                .tier-card { min-width: 280px; background: #080808; border: 1px solid #151515; padding: 20px; scroll-snap-align: start; border-top: 2px solid #222; }
                .tier-card:hover { border-top-color: var(--accent); background: #0c0c0c; }
                .t-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
                .t-fee { font-family: 'Teko'; font-size: 2rem; color: #fff; line-height: 1; }
                .t-prize { font-family: 'Teko'; font-size: 2rem; color: #00ff66; line-height: 1; }
                .pp-label { display: block; font-size: 0.5rem; color: #444; font-family: 'Orbitron'; }

                .t-payouts { display: flex; justify-content: space-between; background: #000; padding: 8px; margin-bottom: 15px; border: 1px solid #111; }
                .t-payouts div { text-align: center; }
                .t-payouts span { display: block; font-size: 0.45rem; color: #444; font-family: 'Orbitron'; }
                .t-payouts b { font-size: 0.75rem; color: var(--accent); }

                .t-actions { display: flex; flex-direction: column; gap: 8px; }
                .btn { width: 100%; padding: 12px; border: none; font-family: 'Orbitron'; font-weight: 900; font-size: 0.7rem; cursor: pointer; clip-path: polygon(4% 0, 100% 0, 96% 100%, 0% 100%); transition: 0.2s; }
                .btn-primary { background: var(--accent); color: #000; }
                .btn-success { background: #00ff66; color: #000; }
                .btn-host { background: transparent; border: 1px solid #222; color: #444; }
                .btn-host.active { border-color: var(--accent); color: var(--accent); }

                .no-active { padding: 40px; text-align: center; border: 1px dashed #222; width: 100%; color: #333; font-family: 'Orbitron'; font-size: 0.7rem; }

                @media (max-width: 900px) {
                    .mob-btn { display: block !important; background: transparent; border: none; color: #fff; font-size: 1.5rem; }
                    .v7-sidebar { position: fixed; left: -260px; top: 0; height: 100vh; }
                    .v7-sidebar.open { left: 0; }
                    .v7-main { width: 100%; }
                }
            `}</style>
        </div>
    );
};

const ActiveCard = ({ lobby, navigate }) => (
    <div className="active-card">
        <h4>MATCH #{lobby.id}</h4>
        <p>{lobby.slot_time} • {lobby.status}</p>
        {lobby.isHost ? (
            <button className="btn btn-primary" onClick={() => navigate(`/host/${lobby.id}`)}>OPEN HOST PANEL</button>
        ) : (
            <button className="btn btn-success" onClick={() => navigate(`/match/${lobby.id}`)}>ENTER ROOM</button>
        )}
    </div>
);

const ArenaTierCard = ({ lobby, onBuy, onHost }) => {
    // Dynamic Prize Multipliers
    const p1 = lobby.entry_fee === 25 ? 100 : lobby.entry_fee === 35 ? 150 : lobby.entry_fee === 45 ? 200 : lobby.entry_fee === 50 ? 250 : lobby.entry_fee === 75 ? 400 : 500;
    const p2 = p1 * 0.7;
    const p3 = p1 * 0.5;

    return (
        <div className="tier-card">
            <div className="t-header">
                <div><span className="pp-label">ENTRY FEE</span><div className="t-fee">₹{lobby.entry_fee}</div></div>
                <div style={{textAlign:'right'}}><span className="pp-label">PRIZE POOL</span><div className="t-prize">₹{lobby.prize_pool}</div></div>
            </div>
            <div className="t-payouts">
                <div><span>1ST</span><b>₹{p1}</b></div>
                <div><span>2ND</span><b>₹{Math.round(p2)}</b></div>
                <div><span>3RD</span><b>₹{Math.round(p3)}</b></div>
            </div>
            <div className="t-actions">
                <button className="btn btn-primary" disabled={lobby.status === 'FULL' || lobby.isPlayer} onClick={() => onBuy(lobby.id, lobby.entry_fee)}>
                    {lobby.isPlayer ? 'DEPLOYED' : lobby.status === 'FULL' ? 'FULL' : `JOIN ₹${lobby.entry_fee}`}
                </button>
                <button className={`btn btn-host ${lobby.isHost ? 'active' : ''}`} disabled={lobby.host_id !== null && !lobby.isHost} onClick={() => onHost(lobby.id)}>
                    {lobby.isHost ? 'COMMANDER ON-SITE' : lobby.host_id ? 'HOST ASSIGNED' : 'CLAIM COMMAND'}
                </button>
            </div>
        </div>
    );
};

export default Lobby;