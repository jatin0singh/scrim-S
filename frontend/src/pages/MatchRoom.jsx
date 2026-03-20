 import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MatchRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('BRIEFING');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [proofFile, setProofFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [lobby, setLobby] = useState({ room_id: '', room_pass: '', chat_enabled: 1, uploads_enabled: 0, start_time: null, slot_time: '12 AM', host_id: null, entry_fee: 0 });
    const [roster, setRoster] = useState([]);
    const [stats, setStats] = useState([]);
    const [chat, setChat] = useState([]);
    const [proofs, setProofs] = useState([]); 
    const [newMsg, setNewMsg] = useState('');
    
    // Timer & Rating State
    const [isRevealed, setIsRevealed] = useState(false);
    const [displayTime, setDisplayTime] = useState({ start: '', reveal: '' });
    const [myRating, setMyRating] = useState(0); // 👈 New state for rating

    const syncRoom = useCallback(async () => {
        try {
            const [lRes, rRes, sRes, cRes, pRes] = await Promise.all([
                fetch(`https://scrims-s.onrender.com/api/lobbies/room-check/${id}`),
                fetch(`https://scrims-s.onrender.com/api/lobby-participants/${id}`),
                fetch(`https://scrims-s.onrender.com/api/match-stats/${id}`), 
                fetch(`https://scrims-s.onrender.com/api/chat/${id}`),
                fetch(`https://scrims-s.onrender.com/api/proofs/${id}`) 
            ]);
            setLobby(await lRes.json());
            setRoster(await rRes.json());
            setStats(await sRes.json());
            setChat(await cRes.json());
            setProofs(await pRes.json()); 
        } catch (err) { console.log("Sync Error"); }
    }, [id]);

    useEffect(() => {
        syncRoom();
        const interval = setInterval(syncRoom, 3000); 
        return () => clearInterval(interval);
    }, [syncRoom]);

    // ⏱️ TIME ENGINE
    useEffect(() => {
        if (!lobby.slot_time && !lobby.start_time) return;
        let timeStr = lobby.start_time;
        if (!timeStr || timeStr === '') {
            if (lobby.slot_time === '12 AM') timeStr = '00:00';
            else if (lobby.slot_time === '3 PM') timeStr = '15:00';
            else if (lobby.slot_time === '6 PM') timeStr = '18:00';
            else if (lobby.slot_time === '9 PM') timeStr = '21:00';
            else timeStr = '00:00';
        }
        const [hours, minutes] = timeStr.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);

        const revealDate = new Date(startDate.getTime());
        revealDate.setMinutes(revealDate.getMinutes() - 2);

        const formatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        setDisplayTime({ start: startDate.toLocaleTimeString('en-US', formatOptions), reveal: revealDate.toLocaleTimeString('en-US', formatOptions) });

        const checkTime = () => {
            if (new Date().getTime() >= revealDate.getTime()) setIsRevealed(true);
            else setIsRevealed(false);
        };
        checkTime(); 
        const timer = setInterval(checkTime, 1000); 
        return () => clearInterval(timer);
    }, [lobby.start_time, lobby.slot_time]);

    // ⭐ SUBMIT RATING FUNCTION
    const submitRating = async (ratingValue) => {
        setMyRating(ratingValue);
        const user = JSON.parse(localStorage.getItem('user'));
        
        await fetch('https://scrims-s.onrender.com/api/rate-host', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId: id, hostId: lobby.host_id, playerId: user.id, rating: ratingValue })
        });
    };

    const sendChat = async () => {
        if (!newMsg.trim() || !lobby.chat_enabled) return;
        const user = JSON.parse(localStorage.getItem('user'));
        await fetch('https://scrims-s.onrender.com/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId: id, userId: user.id, message: newMsg })
        });
        setNewMsg('');
        syncRoom();
    };

    const handleUpload = async () => {
        if (!proofFile) return alert("❌ Please select a screenshot first!");
        const user = JSON.parse(localStorage.getItem('user'));
        setIsUploading(true);
        const formData = new FormData();
        formData.append('proof', proofFile);
        formData.append('lobbyId', id);
        formData.append('userId', user.id);

        try {
            const res = await fetch('https://scrims-s.onrender.com/api/upload-proof', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) { alert("✅ " + data.message); setProofFile(null); syncRoom(); } 
            else alert("❌ " + data.message);
        } catch (err) { alert("❌ Upload failed."); } 
        finally { setIsUploading(false); }
    };

    return (
        <div className="cyber-layout">
            {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}></div>}

            <aside className={`cyber-sidebar player-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>SCRIMS<span className="text-neon-green">S</span></h2>
                    <p className="sys-badge player-badge">PLAYER_OS v2.0</p>
                </div>
                <nav className="cyber-nav">
                    <button className={activeTab === 'BRIEFING' ? 'active' : ''} onClick={() => { setActiveTab('BRIEFING'); setIsMobileMenuOpen(false); }}><span className="icon">🎯</span> BRIEFING</button>
                    <button className={activeTab === 'ROSTER' ? 'active' : ''} onClick={() => { setActiveTab('ROSTER'); setIsMobileMenuOpen(false); }}><span className="icon">⚔️</span> ENEMY SQUADS</button>
                    <button className={activeTab === 'STANDINGS' ? 'active' : ''} onClick={() => { setActiveTab('STANDINGS'); setIsMobileMenuOpen(false); }}><span className="icon">🏆</span> STANDINGS</button>
                    <button className={activeTab === 'CHAT' ? 'active' : ''} onClick={() => { setActiveTab('CHAT'); setIsMobileMenuOpen(false); }}><span className="icon">💬</span> COMM-LINK</button>
                    <button className={activeTab === 'GALLERY' ? 'active' : ''} onClick={() => { setActiveTab('GALLERY'); setIsMobileMenuOpen(false); }}><span className="icon">🖼️</span> GALLERY</button>
                </nav>
                <div className="sidebar-footer">
                    <button className="btn-leave" onClick={() => navigate('/dashboard')}>LEAVE ROOM</button>
                </div>
            </aside>

            <main className="cyber-main">
                <header className="cyber-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
                        <div className="live-pulse-box"><span className="pulse-dot-green"></span> MATCH #{id} LIVE</div>
                    </div>
                    <div className="header-right"><span className="status-pill">AWAITING HOST DEPLOYMENT</span></div>
                </header>

                <div className="cyber-content">
                    {/* 🎯 MODULE: BRIEFING */}
                    {activeTab === 'BRIEFING' && (
                        <div className="module-grid">
                            <div className="cyber-card highlight-card">
                                <h3 className="card-title">ROOM CREDENTIALS</h3>
                                <p style={{fontFamily: 'Orbitron', color: '#a1a1aa', fontSize: '0.8rem', marginTop: '-15px', marginBottom: '20px'}}>
                                    MATCH START: <span style={{color: '#00f0ff'}}>{displayTime.start}</span>
                                </p>
                                {lobby.room_id ? (
                                    isRevealed ? (
                                        <div className="credentials-revealed">
                                            <div className="cred-box"><span>ROOM ID</span><h2>{lobby.room_id}</h2></div>
                                            <div className="cred-box"><span>PASSWORD</span><h2>{lobby.room_pass}</h2></div>
                                        </div>
                                    ) : (
                                        <div className="credentials-locked" style={{ borderColor: '#ffae00', color: '#ffae00' }}>
                                            <span style={{ fontSize: '2rem' }}>⏳</span>
                                            <h3 style={{ margin: '10px 0', fontFamily: 'Orbitron' }}>CREDENTIALS RECEIVED</h3>
                                            <p style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>
                                                ID & Password auto-reveal at:<br/>
                                                <strong style={{fontSize: '1.2rem', color: '#00ffcc', display: 'block', marginTop: '10px'}}>{displayTime.reveal}</strong>
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="credentials-locked">
                                        <div className="loader-ring"></div><p>AWAITING HOST TRANSMISSION...</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="cyber-card">
                                    <h3 className="card-title">PROOF UPLOAD</h3>
                                    {lobby.uploads_enabled ? (
                                        <div className="upload-portal open">
                                            <input type="file" className="file-input" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])} />
                                            <button className="btn-glitch-green" onClick={handleUpload} disabled={isUploading}>{isUploading ? 'UPLOADING...' : 'SUBMIT SCREENSHOT'}</button>
                                        </div>
                                    ) : (
                                        <div className="upload-portal locked">
                                            <span className="lock-icon">🔒</span><p>UPLOADS CURRENTLY LOCKED.</p>
                                        </div>
                                    )}
                                </div>

                                {/* ⭐ HOST RATING COMPONENT */}
                                <div className="cyber-card" style={{ borderColor: '#ffae00' }}>
                                    <h3 className="card-title" style={{ color: '#ffae00' }}>RATE YOUR HOST</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#a1a1aa', fontFamily: 'Orbitron' }}>Hold your host accountable! Rate their management.</p>
                                    <div style={{ display: 'flex', gap: '10px', fontSize: '2.5rem', justifyContent: 'center', marginTop: '15px' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span key={star} onClick={() => submitRating(star)} style={{ cursor: 'pointer', color: star <= myRating ? '#ffae00' : '#333', transition: '0.2s', textShadow: star <= myRating ? '0 0 10px #ffae00' : 'none' }}>★</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ROSTER' && (
                        <div className="roster-grid">
                            {roster.map((team, i) => (
                                <div key={i} className="roster-card player-view-card"><div className="r-header"><span className="r-rank">SQUAD {i+1}</span><h4 className="r-name">{team.team_name}</h4></div><p className="r-players">{team.teammates}</p></div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'STANDINGS' && (
                        <div className="cyber-card">
                            <h3 className="card-title">LIVE TOURNAMENT STANDINGS</h3>
                            <div className="table-responsive">
                                <table className="cyber-table read-only">
                                    <thead><tr><th>RANK</th><th>SQUAD</th><th>MATCHES</th><th>BOOYAHS</th><th>KILL PTS</th><th>POS PTS</th><th>TOTAL PTS</th></tr></thead>
                                    <tbody>
                                        {[...roster].sort((a, b) => {
                                            const statA = stats.find(s => s.team_name === a.team_name)?.total_pts || 0;
                                            const statB = stats.find(s => s.team_name === b.team_name)?.total_pts || 0;
                                            return statB - statA; 
                                        }).map((team, i) => {
                                            const teamStat = stats.find(s => s.team_name === team.team_name) || {};
                                            return (
                                                <tr key={i}><td><span className="r-rank">#{i + 1}</span></td><td className="t-name">{team.team_name}</td><td>{teamStat.matches || 0}</td><td>{teamStat.booyahs || 0}</td><td>{teamStat.kill_points || 0}</td><td>{teamStat.position_points || 0}</td><td className="t-total">{teamStat.total_pts || 0}</td></tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CHAT' && (
                        <div className="cyber-card chat-wrapper">
                            <h3 className="card-title">GLOBAL CHAT</h3>
                            <div className="chat-log">
                                {chat.map((m, i) => (<div key={i} className="chat-msg"><span className="c-user">{m.username}</span><span className="c-text">{m.message}</span></div>))}
                                {chat.length === 0 && <p className="no-data">NO COMMUNICATIONS YET.</p>}
                            </div>
                            {lobby.chat_enabled ? (
                                <div className="chat-input-area">
                                    <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="SEND MESSAGE TO LOBBY..." onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
                                    <button className="btn-send-green" onClick={sendChat}>SEND</button>
                                </div>
                            ) : (<div className="chat-locked-bar">🔒 CHAT HAS BEEN DISABLED BY HOST</div>)}
                        </div>
                    )}

                    {activeTab === 'GALLERY' && (
                        <div className="cyber-card">
                            <h3 className="card-title">MATCH GALLERY</h3>
                            <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                {proofs.map((proof, i) => (
                                    <div key={i} className="gallery-item" style={{ border: '1px solid #27272a', padding: '10px', background: '#09090b', borderRadius: '4px' }}>
                                        <p style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: '#00ffcc', margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{proof.team_name ? `[${proof.team_name}]` : proof.username}</span>
                                            {lobby.host_id === proof.user_id && <span style={{color: '#ffae00', fontWeight: 'bold'}}>(HOST)</span>}
                                        </p>
                                        <a href={`https://scrims-s.onrender.com${proof.image_url}`} target="_blank" rel="noreferrer"><img src={`https://scrims-s.onrender.com${proof.image_url}`} alt="Proof" style={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer', border: lobby.host_id === proof.user_id ? '2px solid #ffae00' : '1px solid #333', borderRadius: '4px' }}/></a>
                                    </div>
                                ))}
                                {proofs.length === 0 && <p style={{ color: '#a1a1aa', fontFamily: 'Orbitron' }}>NO IMAGES UPLOADED YET.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* 🎨 STYLES */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;900&family=Rajdhani:wght@500;700&display=swap');
                :root { --bg-dark: #09090b; --bg-panel: #121216; --neon-green: #00ffcc; --neon-blue: #00f0ff; --neon-red: #ff003c; --text-main: #f4f4f5; --text-muted: #a1a1aa; --border: #27272a; }
                * { box-sizing: border-box; }
                .cyber-layout { display: flex; height: 100vh; background: var(--bg-dark); color: var(--text-main); font-family: 'Rajdhani', sans-serif; overflow: hidden; }
                .text-neon-green { color: var(--neon-green); text-shadow: 0 0 10px rgba(0,255,204,0.5); }
                .card-title { font-family: 'Orbitron'; font-size: 0.8rem; color: var(--text-muted); letter-spacing: 2px; margin: 0 0 20px 0; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
                .cyber-sidebar { width: 260px; background: var(--bg-panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px; transition: 0.3s ease; z-index: 100; }
                .sidebar-brand h2 { font-family: 'Orbitron'; font-size: 1.5rem; margin: 0; font-weight: 900; }
                .player-badge { display: inline-block; background: var(--neon-green); color: #000; font-family: 'Orbitron'; font-size: 0.6rem; padding: 2px 8px; margin-top: 5px; border-radius: 2px; font-weight: 900; }
                .cyber-nav { margin-top: 40px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
                .cyber-nav button { background: transparent; border: 1px solid transparent; color: var(--text-muted); padding: 15px; text-align: left; font-family: 'Orbitron'; font-size: 0.8rem; cursor: pointer; transition: 0.3s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .cyber-nav button:hover { background: rgba(255,255,255,0.05); }
                .cyber-nav button.active { background: rgba(0,255,204,0.1); border-left: 3px solid var(--neon-green); color: var(--neon-green); }
                .icon { display: inline-block; width: 25px; }
                .btn-leave { width: 100%; background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 15px; font-family: 'Orbitron'; cursor: pointer; transition: 0.3s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .btn-leave:hover { background: var(--neon-red); color: #000; border-color: var(--neon-red); }
                .cyber-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
                .cyber-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; border-bottom: 1px solid var(--border); background: var(--bg-panel); }
                .header-left { display: flex; align-items: center; gap: 15px; }
                .mobile-menu-btn { display: none; background: transparent; border: 1px solid var(--border); color: var(--text-main); font-size: 1.5rem; cursor: pointer; padding: 5px 10px; border-radius: 4px; }
                .live-pulse-box { display: flex; align-items: center; gap: 10px; font-family: 'Orbitron'; font-size: 0.8rem; letter-spacing: 1px; }
                .pulse-dot-green { width: 10px; height: 10px; background: var(--neon-green); border-radius: 50%; box-shadow: 0 0 10px var(--neon-green); animation: pulse-g 2s infinite; }
                @keyframes pulse-g { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                .status-pill { background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 5px 15px; border-radius: 20px; font-family: 'Orbitron'; font-size: 0.6rem; color: var(--text-muted); }
                .cyber-content { flex: 1; padding: 30px; overflow-y: auto; }
                .cyber-card { background: var(--bg-panel); border: 1px solid var(--border); padding: 25px; border-radius: 8px; margin-bottom: 20px; }
                .highlight-card { border-color: rgba(0,255,204,0.3); position: relative; overflow: hidden; }
                .highlight-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: var(--neon-green); }
                .module-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .credentials-revealed { display: flex; gap: 20px; }
                .cred-box { flex: 1; background: rgba(0,255,204,0.05); border: 1px solid var(--neon-green); padding: 20px; text-align: center; border-radius: 4px; }
                .cred-box span { font-family: 'Orbitron'; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 2px; }
                .cred-box h2 { font-family: 'Orbitron'; font-size: 1.8rem; color: var(--neon-green); margin: 5px 0 0 0; }
                .credentials-locked { padding: 40px; text-align: center; border: 1px dashed var(--border); border-radius: 4px; }
                .loader-ring { display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--neon-green); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .upload-portal { padding: 30px; text-align: center; border: 1px solid var(--border); border-radius: 4px; }
                .upload-portal.locked { background: rgba(255,0,60,0.05); border-color: rgba(255,0,60,0.2); color: var(--neon-red); }
                .lock-icon { font-size: 2rem; display: block; margin-bottom: 10px; }
                .upload-portal.open { background: rgba(0,255,204,0.05); border-color: rgba(0,255,204,0.3); }
                .file-input { margin: 20px 0; font-family: 'Rajdhani'; }
                .btn-glitch-green { background: var(--neon-green); color: #000; font-family: 'Orbitron'; font-weight: 900; padding: 12px 25px; border: none; cursor: pointer; transition: 0.3s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .btn-glitch-green:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 0 15px rgba(0,255,204,0.4); }
                .roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
                .roster-card { background: var(--bg-panel); border: 1px solid var(--border); padding: 20px; transition: 0.3s; }
                .player-view-card { border-left: 3px solid var(--border); }
                .player-view-card:hover { border-left-color: var(--neon-green); transform: translateY(-2px); }
                .r-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
                .r-rank { font-family: 'Orbitron'; font-size: 0.7rem; color: var(--text-muted); background: var(--bg-dark); padding: 3px 8px; border-radius: 2px; }
                .r-name { font-family: 'Orbitron'; font-size: 1rem; margin: 0; color: #fff; }
                .r-players { font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; margin: 0; }
                .no-data { font-family: 'Orbitron'; color: var(--text-muted); text-align: center; padding: 20px; }
                .table-responsive { overflow-x: auto; }
                .cyber-table { width: 100%; min-width: 600px; border-collapse: collapse; text-align: center; }
                .cyber-table th { padding: 15px; font-family: 'Orbitron'; font-size: 0.8rem; color: var(--text-muted); border-bottom: 1px solid var(--border); }
                .cyber-table th:first-child, .cyber-table td:first-child { text-align: left; }
                .cyber-table td { padding: 15px; border-bottom: 1px solid var(--border); font-family: 'Orbitron'; font-size: 0.9rem; }
                .t-name { font-weight: bold; color: #fff; }
                .t-total { color: var(--neon-green); font-weight: 900; font-size: 1.1rem; }
                .chat-wrapper { height: 600px; display: flex; flex-direction: column; }
                .chat-log { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; padding-right: 10px; }
                .chat-msg { background: var(--bg-dark); padding: 12px 15px; border-radius: 4px; border-left: 2px solid var(--border); }
                .c-user { font-family: 'Orbitron'; font-size: 0.7rem; color: var(--neon-green); display: block; margin-bottom: 4px; }
                .c-text { font-size: 0.9rem; }
                .chat-input-area { display: flex; gap: 10px; }
                .chat-input-area input { flex: 1; background: var(--bg-dark); border: 1px solid var(--border); color: #fff; padding: 15px; font-family: 'Rajdhani'; outline: none; }
                .chat-input-area input:focus { border-color: var(--neon-green); }
                .btn-send-green { background: var(--neon-green); color: #000; border: none; padding: 0 30px; font-family: 'Orbitron'; font-weight: bold; cursor: pointer; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .chat-locked-bar { background: rgba(255,0,60,0.1); border: 1px solid rgba(255,0,60,0.3); color: var(--neon-red); padding: 15px; text-align: center; font-family: 'Orbitron'; font-size: 0.8rem; letter-spacing: 2px; border-radius: 4px; }
                @media (max-width: 1024px) { .module-grid { grid-template-columns: 1fr; } }
                @media (max-width: 768px) {
                    .mobile-menu-btn { display: block; }
                    .cyber-sidebar { position: fixed; left: -300px; top: 0; height: 100vh; box-shadow: 10px 0 30px rgba(0,0,0,0.8); }
                    .cyber-sidebar.open { left: 0; }
                    .mobile-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 99; backdrop-filter: blur(5px); }
                    .header-right { display: none; }
                    .credentials-revealed { flex-direction: column; }
                    .cyber-header { padding: 15px 20px; }
                    .cyber-content { padding: 15px; }
                }
            `}</style>
        </div>
    );
};

export default MatchRoom;