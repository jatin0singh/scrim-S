  import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ username: 'OPERATIVE' });
    const [balance, setBalance] = useState(0);
    const [activeMatches, setActiveMatches] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) return navigate('/login');
        setUser(storedUser);

        try {
            // 💰 Vault Data
            const walletRes = await fetch(`https://scrims-s.onrender.com/api/wallet/${storedUser.id}`);
            if (walletRes.ok) {
                const walletData = await walletRes.json();
                setBalance(walletData.balance);
            }

            // 🚀 Active Matches (Matches your fixed server.js route)
            const activeRes = await fetch(`https://scrims-s.onrender.com/api/my-active-matches/${storedUser.id}`);
            if (activeRes.ok) {
                const activeData = await activeRes.json();
                setActiveMatches(Array.isArray(activeData) ? activeData : []);
            }

            // 🏆 Global Intelligence (Leaderboard)
            const leaderRes = await fetch(`https://scrims-s.onrender.com/api/leaderboard`);
            if (leaderRes.ok) {
                const leaderData = await leaderRes.json();
                setLeaderboard(leaderData);
            }
        } catch (err) {
            console.error("Dashboard Sync Failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000); 
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    return (
        <div className="hud-viewport">
            {/* 🛸 MOBILE OVERLAY */}
            {isMobileMenuOpen && <div className="hud-mobile-dim" onClick={() => setIsMobileMenuOpen(false)}></div>}

            {/* 🛡️ TACTICAL SIDEBAR */}
            <aside className={`hud-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="hud-logo">SCRIMS<span>S</span></div>
                <div className="hud-user-tag">ID_{user.id || '000'} // {user.username.toUpperCase()}</div>
                <nav className="hud-nav">
                    <button className="active">OVERVIEW</button>
                    <button onClick={() => navigate('/profile')}>OPERATIVE</button>
                    <button onClick={() => navigate('/wallet')}>VAULT</button>
                </nav>
            </aside>

            <main className="hud-main">
                <header className="hud-header">
                    <div className="h-left">
                        <button className="hud-hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
                        <div className="uplink-status"><span className="pulse"></span> INTEL_UPLINK_STABLE</div>
                    </div>
                    <div className="hud-vault" onClick={() => navigate('/wallet')}>
                        <span className="v-tag">VAULT // CREDITS</span>
                        <span className="v-amt">₹{parseFloat(balance).toLocaleString()}</span>
                    </div>
                </header>

                <div className="hud-container">
                    {/* 👋 GREETING */}
                    <div className="hud-welcome">
                        <h1>WELCOME, <span className="text-p">{user.username.toUpperCase()}</span></h1>
                        <p>COMMANDER_LEVEL_ACCESS // SELECT SECTOR</p>
                    </div>

                    {/* 🚀 ACTIVE MISSIONS (HORIZONTAL PEEK-A-BOO SCROLL) */}
                    <section className="hud-section">
                        <div className="hud-section-label">ACTIVE_DEPLOYMENTS</div>
                        <div className="hud-peek-scroll">
                            {activeMatches.length > 0 ? activeMatches.map(match => (
                                <div key={match.id} className="mission-card" onClick={() => navigate(match.host_id === user.id ? `/host/${match.id}` : `/match/${match.id}`)}>
                                    <div className="m-tag">{match.role || 'OPERATIVE'}</div>
                                    <div className="m-info">
                                        <h3>MATCH #{match.id}</h3>
                                        <p>{match.game_type} // {match.slot_time}</p>
                                    </div>
                                    <div className="m-arrow">➔</div>
                                </div>
                            )) : (
                                <div className="hud-empty-box">NO ACTIVE MISSIONS. STANDING BY.</div>
                            )}
                        </div>
                    </section>

                    <div className="hud-split-grid">
                        {/* ⚔️ COMBAT ZONES */}
                        <div className="hud-grid-column">
                            <div className="hud-section-label">COMBAT_ZONES</div>
                            <div className="combat-tiles">
                                <div className="combat-tile ff" onClick={() => navigate('/freefire')}>
                                    <div className="tile-content">
                                        <h2>FREE FIRE</h2>
                                        <span>DEPLOY TO ARENA</span>
                                    </div>
                                </div>
                                <div className="combat-tile bgmi" onClick={() => navigate('/bgmi')}>
                                    <div className="tile-content">
                                        <h2>BGMI</h2>
                                        <span>DEPLOY TO ARENA</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🏆 GLOBAL INTEL (LEADERBOARD) */}
                        <div className="hud-grid-column">
                            <div className="hud-section-label">GLOBAL_SQUAD_INTEL</div>
                            <div className="intel-board">
                                {leaderboard.length > 0 ? leaderboard.map((team, i) => (
                                    <div key={i} className={`intel-row rank-${i+1}`}>
                                        <div className="i-rank">0{i+1}</div>
                                        <div className="i-team">{team.team_name}</div>
                                        <div className="i-pts">{team.total_score} PTS</div>
                                    </div>
                                )) : <div className="intel-empty">GATHERING SQUAD DATA...</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;700&display=swap');
                
                :root { --p: #FF4655; --cyan: #00F0FF; --bg: #08090B; --card: #111217; }
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                body { margin: 0; background: var(--bg); color: #fff; font-family: 'Inter', sans-serif; }

                .hud-viewport { display: flex; height: 100vh; overflow: hidden; }
                .text-p { color: var(--p); }

                /* Sidebar */
                .hud-sidebar { width: 260px; background: #000; border-right: 1px solid #1a1a1a; padding: 40px 20px; z-index: 1000; transition: 0.3s; }
                .hud-logo { font-family: 'Orbitron'; font-size: 1.6rem; color: #fff; margin-bottom: 5px; }
                .hud-logo span { color: var(--p); }
                .hud-user-tag { font-family: 'Orbitron'; font-size: 0.5rem; color: #333; margin-bottom: 50px; letter-spacing: 1px; }
                .hud-nav button { width: 100%; background: transparent; border: none; color: #444; padding: 15px; text-align: left; font-family: 'Orbitron'; font-size: 0.7rem; cursor: pointer; border-radius: 4px; transition: 0.2s; }
                .hud-nav button.active { color: var(--p); background: rgba(255,70,85,0.05); box-shadow: inset 4px 0 0 var(--p); }

                /* Main */
                .hud-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .hud-header { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; background: #000; border-bottom: 1px solid #1a1a1a; }
                .uplink-status { font-family: 'Orbitron'; font-size: 0.6rem; color: #555; display: flex; align-items: center; gap: 8px; }
                .pulse { width: 6px; height: 6px; background: #00FF66; border-radius: 50%; animation: p 1.5s infinite; }
                @keyframes p { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

                .hud-vault { background: #111; border: 1px solid #222; padding: 8px 20px; cursor: pointer; }
                .v-tag { font-size: 0.5rem; font-family: 'Orbitron'; color: #444; display: block; }
                .v-amt { font-family: 'Barlow Condensed'; font-size: 1.5rem; color: #00FF66; }

                .hud-container { flex: 1; overflow-y: auto; padding: 30px; scrollbar-width: none; }
                .hud-container::-webkit-scrollbar { display: none; }

                .hud-welcome h1 { font-family: 'Orbitron'; font-size: 2.5rem; margin: 0; letter-spacing: -1px; }
                .hud-welcome p { font-family: 'Orbitron'; font-size: 0.65rem; color: #333; margin-top: 5px; letter-spacing: 2px; }

                /* Horizontal Missions */
                .hud-section { margin-top: 40px; }
                .hud-section-label { font-family: 'Orbitron'; font-size: 0.7rem; color: #333; margin-bottom: 20px; letter-spacing: 2px; }
                .hud-peek-scroll { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; scroll-snap-type: x mandatory; }
                .hud-peek-scroll::-webkit-scrollbar { display: none; }

                .mission-card { min-width: 85%; background: #111217; border: 1px solid #1a1a1a; padding: 25px; scroll-snap-align: center; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: 0.2s; border-left: 4px solid var(--p); }
                .mission-card:active { transform: scale(0.98); }
                .m-tag { font-family: 'Orbitron'; font-size: 0.55rem; background: var(--p); color: #000; padding: 2px 8px; position: absolute; top: 0; left: 0; }
                .m-info h3 { margin: 0; font-family: 'Orbitron'; font-size: 1rem; }
                .m-info p { margin: 5px 0 0; font-size: 0.8rem; color: #555; font-family: 'Orbitron'; }
                .m-arrow { font-size: 1.2rem; color: #222; }

                /* Grid Systems */
                .hud-split-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px; margin-top: 40px; }
                .combat-tiles { display: grid; gap: 20px; }
                .combat-tile { height: 200px; border-radius: 4px; display: flex; align-items: flex-end; padding: 30px; cursor: pointer; transition: 0.3s; position: relative; overflow: hidden; border: 1px solid #1a1a1a; }
                .combat-tile:hover { transform: scale(1.02); border-color: var(--p); }
                .ff { background: linear-gradient(rgba(0,0,0,0.2), #000), url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070'); background-size: cover; }
                .bgmi { background: linear-gradient(rgba(0,0,0,0.2), #000), url('https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070'); background-size: cover; }
                .tile-content h2 { font-family: 'Orbitron'; font-size: 1.8rem; margin: 0; }
                .tile-content span { font-family: 'Orbitron'; font-size: 0.6rem; color: var(--p); letter-spacing: 2px; }

                /* Leaderboard Intel */
                .intel-board { background: #0a0a0c; border: 1px solid #1a1a1a; padding: 10px; }
                .intel-row { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #151515; transition: 0.2s; }
                .intel-row:hover { background: #111217; }
                .i-rank { font-family: 'Barlow Condensed'; font-size: 1.5rem; color: #222; width: 40px; }
                .i-team { flex: 1; font-family: 'Orbitron'; font-size: 0.85rem; color: #aaa; text-transform: uppercase; }
                .i-pts { font-family: 'Barlow Condensed'; font-size: 1.2rem; color: var(--cyan); }
                .rank-1 { border-left: 3px solid #FFD700; }
                .rank-1 .i-rank { color: #FFD700; }
                .rank-1 .i-team { color: #fff; }

                .hud-empty-box { padding: 40px; text-align: center; border: 1px dashed #1a1a1a; color: #222; font-family: 'Orbitron'; font-size: 0.7rem; width: 100%; }

                @media (min-width: 900px) {
                    .mission-card { min-width: 350px; }
                }

                @media (max-width: 900px) {
                    .hud-hamburger { display: block; background: transparent; border: none; color: #fff; font-size: 1.5rem; }
                    .hud-sidebar { position: fixed; left: -260px; top: 0; height: 100vh; }
                    .hud-sidebar.open { left: 0; box-shadow: 20px 0 50px #000; }
                    .hud-split-grid { grid-template-columns: 1fr; }
                    .hud-welcome h1 { font-size: 1.8rem; }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;