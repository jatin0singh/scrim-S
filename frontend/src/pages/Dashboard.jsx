 import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ username: 'Loading...' });
    const [balance, setBalance] = useState(0);
    const [activeMatches, setActiveMatches] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // 🛡️ State for the Expandable Dock
    const [isDockExpanded, setIsDockExpanded] = useState(false);

    // 📡 FETCH LIVE DATA
    const fetchDashboardData = useCallback(async () => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) return navigate('/login');
        setUser(storedUser);

        try {
            // Fetch Vault Balance
            const walletRes = await fetch(`https://scrims-s.onrender.com/api/wallet/${storedUser.id}`);
            if (walletRes.ok) {
                const walletData = await walletRes.json();
                setBalance(walletData.balance);
            }

            // Fetch Active Matches
            const activeRes = await fetch(`https://scrims-s.onrender.com/api/my-active-matches/${storedUser.id}`);
            if (activeRes.ok) {
                const activeData = await activeRes.json();
                setActiveMatches(activeData);
            }

            // Fetch Leaderboard
            const leaderRes = await fetch(`https://scrims-s.onrender.com/api/leaderboard`);
            if (leaderRes.ok) {
                const leaderData = await leaderRes.json();
                setLeaderboard(leaderData);
            }
        } catch (err) {
            console.error("Dashboard Sync Error:", err);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000); 
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    // 🚀 Logic to decide how many matches to show
    const visibleMatches = isDockExpanded ? activeMatches : activeMatches.slice(0, 2);

    return (
        <div className="tactical-layout">
            <div className="ambient-glow"></div>
            <div className="scanline-overlay"></div>

            {isMobileMenuOpen && <div className="mobile-overlay" onClick={toggleMenu}></div>}

            <aside className={`tactical-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>SCRIMS<span className="text-neon-blue">S</span></h2>
                    <p className="sys-badge">COMMAND_CENTER</p>
                </div>
                
                <nav className="cyber-nav">
                    <button className="nav-btn active" onClick={() => setIsMobileMenuOpen(false)}>
                        <span className="icon">▤</span> DASHBOARD
                    </button>
                    <button className="nav-btn" onClick={() => navigate('/profile')}>
                        <span className="icon">👤</span> PROFILE
                    </button>
                    <button className="nav-btn" onClick={() => navigate('/wallet')}>
                        <span className="icon">🏦</span> VAULT
                    </button>
                </nav>
            </aside>

            <main className="tactical-main">
                <header className="tactical-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={toggleMenu}>☰</button>
                        <div className="live-pulse-box">
                            <span className="pulse-dot"></span> SECURE UPLINK
                        </div>
                    </div>
                    <div className="header-right" onClick={() => navigate('/wallet')} style={{cursor: 'pointer'}}>
                        <div className="balance-pill premium-glass">
                            <span className="b-label">VAULT:</span>
                            <span className="b-amount text-green">₹{parseFloat(balance).toLocaleString('en-IN')}</span>
                            <span className="b-add">+</span>
                        </div>
                    </div>
                </header>

                <div className="tactical-content">
                    
                    <div className="welcome-banner premium-glass">
                        <h1 className="welcome-text">WELCOME BACK, <span className="text-neon-blue">{user.username.toUpperCase()}</span></h1>
                        <p className="welcome-subtext">Select your combat zone or review global intelligence.</p>
                    </div>

                    {/* 🚀 EXPANDABLE ACTIVE DEPLOYMENTS DOCK */}
                    {activeMatches.length > 0 && (
                        <div className="active-deployments-dock">
                            <div className="dock-header" onClick={() => setIsDockExpanded(!isDockExpanded)}>
                                <h3 className="section-title">ACTIVE <span className="text-cyan">DEPLOYMENTS</span></h3>
                                <div className="dock-controls">
                                    <span className="match-count-badge">{activeMatches.length} LOBBIES ACTIVE</span>
                                    <button className={`expand-trigger ${isDockExpanded ? 'rotated' : ''}`}>▼</button>
                                </div>
                            </div>
                            
                            <div className={`deployments-grid ${isDockExpanded ? 'grid-expanded' : 'grid-collapsed'}`}>
                                {visibleMatches.map(match => (
                                    <div key={match.id} className="deployment-card premium-glass" onClick={() => navigate(match.role === 'HOST' ? `/host/${match.id}` : `/match/${match.id}`)}>
                                        <div className="d-left">
                                            <span className={`role-badge ${match.role === 'HOST' ? 'bg-orange' : 'bg-cyan'}`}>{match.role}</span>
                                            <div>
                                                <h4>MATCH #{match.id}</h4>
                                                <p>{match.slot_time} • {match.game_type}</p>
                                            </div>
                                        </div>
                                        <div className="d-right">
                                            <span className="enter-arrow">➔</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {activeMatches.length > 2 && (
                                <button className="dock-toggle-btn" onClick={() => setIsDockExpanded(!isDockExpanded)}>
                                    {isDockExpanded ? 'HIDE EXTRA SLOTS' : `SHOW ALL (${activeMatches.length})`}
                                </button>
                            )}
                        </div>
                    )}

                    {/* ⚔️ TWO-COLUMN TACTICAL GRID */}
                    <div className="dashboard-split-grid">
                        
                        {/* LEFT COLUMN: COMBAT ZONES */}
                        <div className="combat-zones-section">
                            <h3 className="section-title">COMBAT <span className="text-cyan">ZONES</span></h3>
                            <div className="game-grid">
                                <div className="game-card ff-card" onClick={() => navigate('/freefire')}>
                                    <div className="card-overlay"></div>
                                    <div className="game-content">
                                        <h2 className="game-title">FREE FIRE MAX</h2>
                                        <p className="game-desc">BATTLE ROYALE • ESPORTS</p>
                                        <button className="enter-btn btn-orange">VIEW LOBBIES</button>
                                    </div>
                                </div>

                                <div className="game-card bgmi-card" onClick={() => navigate('/bgmi')}>
                                    <div className="card-overlay"></div>
                                    <div className="game-content">
                                        <h2 className="game-title">BGMI</h2>
                                        <p className="game-desc">BATTLEGROUNDS MOBILE INDIA</p>
                                        <button className="enter-btn btn-blue">VIEW LOBBIES</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: GLOBAL LEADERBOARD */}
                        <div className="leaderboard-section">
                            <div className="leaderboard-card premium-glass">
                                <div className="lb-header">
                                    <h3 className="section-title"><span className="text-cyan">TOP 10</span> SQUADS</h3>
                                    <div className="live-pulse-box"><span className="pulse-dot"></span> LIVE</div>
                                </div>
                                
                                <div className="lb-list">
                                    {leaderboard.length > 0 ? (
                                        leaderboard.map((team, index) => (
                                            <div key={index} className={`lb-row rank-${index + 1}`}>
                                                <div className="lb-rank">#{index + 1}</div>
                                                <div className="lb-team">{team.team_name}</div>
                                                <div className="lb-pts">{team.total_score} PTS</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-lb">NO DATA CAPTURED YET.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;700&family=Syncopate:wght@700&display=swap');

                :root {
                    --bg-main: #050507; --bg-panel: #0a0a0e; --border-color: #1a1a24;
                    --neon-blue: #00d2ff; --neon-blue-dim: rgba(0, 210, 255, 0.1);
                    --neon-orange: #ffae00; --neon-orange-dim: rgba(255, 174, 0, 0.1);
                    --neon-green: #00ff66; --neon-red: #ff4655;
                    --text-main: #f4f4f5; --text-muted: #888899;
                }

                * { box-sizing: border-box; }
                body { margin: 0; background: var(--bg-main); color: var(--text-main); font-family: 'Rajdhani', sans-serif; }

                .text-cyan { color: var(--neon-blue); text-shadow: 0 0 10px rgba(0,210,255,0.4); }
                .text-neon-blue { color: var(--neon-blue); }
                .text-green { color: var(--neon-green); }
                
                .tactical-layout { display: flex; height: 100vh; overflow: hidden; position: relative; }
                .ambient-glow { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: radial-gradient(circle at 50% 0%, rgba(0, 210, 255, 0.05), transparent 50%); z-index: 0; pointer-events: none; }
                .scanline-overlay { position: fixed; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1)); background-size: 100% 4px; z-index: 1; pointer-events: none; opacity: 0.3; }

                .premium-glass { background: linear-gradient(135deg, rgba(20,20,25,0.8), rgba(10,10,12,0.9)); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 15px 35px rgba(0,0,0,0.5); }

                /* Sidebar */
                .tactical-sidebar { width: 280px; background: var(--bg-panel); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; padding: 20px; transition: 0.3s ease; z-index: 100; position: relative; }
                .sidebar-brand h2 { font-family: 'Syncopate', sans-serif; margin: 0; font-size: 1.5rem; letter-spacing: 1px; }
                .sys-badge { display: inline-block; background: var(--neon-blue-dim); color: var(--neon-blue); font-family: 'Orbitron'; font-size: 0.6rem; padding: 4px 10px; border-radius: 4px; border: 1px solid var(--neon-blue); }
                .cyber-nav { margin-top: 50px; display: flex; flex-direction: column; gap: 10px; }
                .nav-btn { background: transparent; border: 1px solid transparent; color: var(--text-muted); padding: 15px; text-align: left; font-family: 'Orbitron'; font-size: 0.9rem; cursor: pointer; transition: 0.3s; border-radius: 4px; display: flex; align-items: center; gap: 15px; }
                .nav-btn:hover { background: rgba(255,255,255,0.02); color: #fff; }
                .nav-btn.active { background: var(--neon-blue-dim); border-left: 3px solid var(--neon-blue); color: var(--neon-blue); }

                /* Main Area */
                .tactical-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; position: relative; z-index: 5; }
                .tactical-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; border-bottom: 1px solid var(--border-color); background: rgba(10,10,14,0.8); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 50; }
                .header-left { display: flex; align-items: center; gap: 15px; }
                .mobile-menu-btn { display: none; background: transparent; border: 1px solid var(--border-color); color: #fff; font-size: 1.5rem; cursor: pointer; padding: 5px 12px; border-radius: 4px; }
                .live-pulse-box { display: flex; align-items: center; gap: 10px; font-family: 'Orbitron'; font-size: 0.8rem; color: var(--text-muted); }
                .pulse-dot { width: 8px; height: 8px; background: var(--neon-blue); border-radius: 50%; box-shadow: 0 0 10px var(--neon-blue); animation: pulse 2s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

                .balance-pill { display: flex; align-items: center; gap: 10px; padding: 8px 15px; border-radius: 30px; border: 1px solid rgba(0,255,102,0.3); transition: 0.3s; }
                .balance-pill:hover { border-color: var(--neon-green); box-shadow: 0 0 15px rgba(0,255,102,0.2); }
                .b-amount { font-family: 'Syncopate'; font-size: 1.1rem; color: var(--neon-green); }
                .b-add { background: var(--neon-green); color: #000; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold; }

                .tactical-content { padding: clamp(20px, 4vw, 50px); max-width: 1500px; margin: 0 auto; width: 100%; }
                .welcome-banner { padding: 30px; border-radius: 12px; margin-bottom: 40px; border-left: 4px solid var(--neon-blue); }
                .welcome-text { font-family: 'Syncopate'; font-size: clamp(1rem, 3vw, 2.2rem); margin: 0 0 10px 0; }
                .section-title { font-family: 'Orbitron'; font-size: 1.2rem; letter-spacing: 2px; margin: 0 0 20px 0; }

                /* 🟢 ACTIVE DOCK STYLES */
                .active-deployments-dock { background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 40px; }
                .dock-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 20px; }
                .dock-header .section-title { margin: 0; }
                .dock-controls { display: flex; align-items: center; gap: 15px; }
                .match-count-badge { font-family: 'Orbitron'; font-size: 0.7rem; background: var(--neon-blue-dim); color: var(--neon-blue); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--neon-blue); }
                .expand-trigger { background: none; border: none; color: var(--text-muted); font-size: 0.8rem; transition: 0.3s; cursor: pointer; }
                .expand-trigger.rotated { transform: rotate(180deg); color: var(--neon-blue); }

                .grid-collapsed { max-height: 250px; overflow: hidden; }
                .grid-expanded { max-height: 2000px; }
                .deployments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; transition: max-height 0.5s ease-in-out; }
                
                .deployment-card { padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.3s; border-left: 3px solid var(--neon-blue); }
                .deployment-card:hover { transform: translateY(-3px); border-color: #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
                .d-left { display: flex; align-items: center; gap: 15px; }
                .role-badge { font-family: 'Orbitron'; font-size: 0.6rem; padding: 4px 10px; border-radius: 4px; font-weight: 900; color: #000; }
                .bg-orange { background: var(--neon-orange); }
                .bg-cyan { background: var(--neon-blue); }
                .d-left h4 { margin: 0; font-family: 'Orbitron'; font-size: 1rem; }
                .d-left p { margin: 5px 0 0 0; font-size: 0.8rem; color: var(--text-muted); }
                .enter-arrow { font-size: 1.5rem; color: var(--text-muted); transition: 0.3s; }

                .dock-toggle-btn { width: 100%; margin-top: 20px; background: rgba(255,255,255,0.03); border: 1px dashed var(--border-color); color: var(--text-muted); padding: 12px; font-family: 'Orbitron'; font-size: 0.7rem; letter-spacing: 2px; cursor: pointer; transition: 0.3s; border-radius: 4px; }
                .dock-toggle-btn:hover { background: var(--neon-blue-dim); color: var(--neon-blue); border-style: solid; border-color: var(--neon-blue); }

                /* ⚔️ SPLIT GRID (GAMES & LEADERBOARD) */
                .dashboard-split-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 40px; align-items: start; }

                /* Game Grid */
                .game-grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
                .game-card { position: relative; height: 300px; border-radius: 16px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; justify-content: flex-end; padding: 40px; transition: 0.4s; border: 1px solid rgba(255,255,255,0.1); }
                .game-card:hover { transform: scale(1.02); box-shadow: 0 15px 40px rgba(0, 210, 255, 0.2); border-color: var(--neon-blue); }
                .ff-card { background: linear-gradient(180deg, transparent, rgba(0,0,0,0.9)), url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop') center/cover; }
                .bgmi-card { background: linear-gradient(180deg, transparent, rgba(0,0,0,0.9)), url('https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop') center/cover; }
                .card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); }
                .game-content { position: relative; z-index: 2; }
                .game-title { font-family: 'Syncopate'; font-size: 2.2rem; margin: 0; }
                .game-desc { font-family: 'Orbitron'; color: #ccc; letter-spacing: 2px; margin: 10px 0 25px 0; font-size: 0.8rem; }
                .enter-btn { padding: 12px 25px; font-family: 'Orbitron'; font-weight: 900; border: none; cursor: pointer; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); transition: 0.3s;}
                .enter-btn:hover { background: #fff; color: #000; box-shadow: 0 0 20px rgba(255,255,255,0.5); }
                .btn-orange { background: var(--neon-orange); color: #000; }
                .btn-blue { background: var(--neon-blue); color: #000;}

                /* 🏆 LEADERBOARD STYLES */
                .leaderboard-card { border-radius: 16px; padding: 30px; display: flex; flex-direction: column; }
                .lb-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-bottom: 20px; }
                .lb-header .section-title { margin: 0; }
                
                .lb-list { display: flex; flex-direction: column; gap: 10px; max-height: 570px; overflow-y: auto; padding-right: 5px;}
                .lb-list::-webkit-scrollbar { width: 4px; }
                .lb-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                
                .lb-row { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 15px 20px; border-radius: 8px; border: 1px solid transparent; transition: 0.2s; }
                .lb-row:hover { background: rgba(255,255,255,0.05); transform: translateX(5px); }
                
                .lb-rank { font-family: 'Syncopate'; font-size: 1.2rem; font-weight: 700; color: #555; width: 40px;}
                .lb-team { flex: 1; font-family: 'Orbitron'; font-size: 1rem; font-weight: 700; color: #ddd; letter-spacing: 1px; }
                .lb-pts { font-family: 'Syncopate'; font-size: 1rem; color: var(--neon-blue); }
                
                /* Top 3 Prestige Colors */
                .rank-1 { border-left: 3px solid #ffd700; background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent); }
                .rank-1 .lb-rank { color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
                .rank-1 .lb-team { color: #ffd700; }
                
                .rank-2 { border-left: 3px solid #c0c0c0; background: linear-gradient(90deg, rgba(192, 192, 192, 0.1), transparent); }
                .rank-2 .lb-rank { color: #c0c0c0; }
                .rank-2 .lb-team { color: #c0c0c0; }
                
                .rank-3 { border-left: 3px solid #cd7f32; background: linear-gradient(90deg, rgba(205, 127, 50, 0.1), transparent); }
                .rank-3 .lb-rank { color: #cd7f32; }
                .rank-3 .lb-team { color: #cd7f32; }

                .empty-lb { text-align: center; padding: 40px; font-family: 'Orbitron'; color: var(--text-muted); letter-spacing: 2px; }

                /* Responsive Design */
                @media (max-width: 1200px) {
                    .dashboard-split-grid { grid-template-columns: 1fr; }
                    .game-grid { grid-template-columns: 1fr 1fr; }
                }

                @media (max-width: 900px) {
                    .mobile-menu-btn { display: block; }
                    .tactical-sidebar { position: fixed; left: -300px; top: 0; height: 100vh; box-shadow: 10px 0 30px #000; }
                    .tactical-sidebar.open { left: 0; }
                    .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99; backdrop-filter: blur(3px); }
                    .game-grid { grid-template-columns: 1fr; }
                    .game-card { height: 250px; }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;