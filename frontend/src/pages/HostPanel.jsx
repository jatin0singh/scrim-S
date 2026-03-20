 import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const HostPanel = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('COMMAND');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [lobby, setLobby] = useState({ room_id: '', room_pass: '', chat_enabled: 1, uploads_enabled: 0, avgRating: 0, totalRatings: 0, entry_fee: 0, start_time: '' });
    const [roster, setRoster] = useState([]);
    const [stats, setStats] = useState([]);
    const [chat, setChat] = useState([]);
    const [proofs, setProofs] = useState([]); 
    const [newMsg, setNewMsg] = useState('');
    const [roomData, setRoomData] = useState({ id: '', pass: '', startTime: '' });
    const [proofFile, setProofFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // 🪟 Tactical Modal State
    const [modal, setModal] = useState({ show: false, type: '', val1: '', val2: '' });
    // 💎 Sexy Popup State
    const [popup, setPopup] = useState({ show: false, title: '', msg: '', type: 'info', redirect: null });

    const triggerPopup = (title, msg, type = 'info', redirect = null) => {
        setPopup({ show: true, title, msg, type, redirect });
    };

    const handlePopupClose = () => {
        if (popup.redirect) navigate(popup.redirect);
        setPopup({ ...popup, show: false });
    };

    // 📡 FETCH LIVE DATA
    const syncHost = useCallback(async () => {
        try {
            const [lRes, rRes, sRes, cRes, pRes] = await Promise.all([
                fetch(`https://scrims-s.onrender.com/api/lobbies/room-check/${id}`),
                fetch(`https://scrims-s.onrender.com/api/lobby-participants/${id}`),
                fetch(`https://scrims-s.onrender.com/api/match-stats/${id}`), 
                fetch(`https://scrims-s.onrender.com/api/chat/${id}`),
                fetch(`https://scrims-s.onrender.com/api/proofs/${id}`) 
            ]);
            
            if (lRes.ok) setLobby(await lRes.json());
            if (rRes.ok) setRoster(await rRes.json());
            if (sRes.ok) setStats(await sRes.json());
            if (cRes.ok) setChat(await cRes.json());
            if (pRes.ok) setProofs(await pRes.json());
        } catch (err) { 
            console.error("Uplink Sync Error:", err); 
        }
    }, [id]);

    useEffect(() => {
        if (lobby.room_id || lobby.room_pass || lobby.start_time) {
            setRoomData({ id: lobby.room_id || '', pass: lobby.room_pass || '', startTime: lobby.start_time || '' });
        }
    }, [lobby.room_id, lobby.room_pass, lobby.start_time]);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) return navigate('/login');
        syncHost();
        const interval = setInterval(syncHost, 3000);
        return () => clearInterval(interval);
    }, [syncHost, navigate]);

    // 🖼️ UPLOAD PROOFS
    const handleUpload = async () => {
        if (!proofFile) return triggerPopup("UPLOAD DENIED", "Please select a screenshot first.", "error");
        const user = JSON.parse(localStorage.getItem('user'));
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append('proof', proofFile);
        formData.append('lobbyId', id);
        formData.append('userId', user.id);

        try {
            const res = await fetch('https://scrims-s.onrender.com/api/upload-proof', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) { 
                triggerPopup("UPLOAD SUCCESS", data.message, "success");
                setProofFile(null); 
                syncHost(); 
            } else {
                triggerPopup("UPLOAD FAILED", data.message, "error");
            }
        } catch (err) { 
            triggerPopup("CRITICAL ERROR", "Upload failed due to network disruption.", "error");
        } finally { 
            setIsUploading(false); 
        }
    };

    // ⭐ COMPLETE MATCH (MODAL CONFIRMATION INSTEAD OF NATIVE ALERT)
    const requestFinishMatch = () => {
        setModal({ show: true, type: 'confirm-finish', val1: '', val2: '' });
    };

    const executeFinishMatch = async () => {
        setModal({ show: false, type: '', val1: '', val2: '' });
        try {
            const res = await fetch('https://scrims-s.onrender.com/api/host/complete-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyId: id, hostId: lobby.host_id })
            });
            const data = await res.json();
            
            if(res.ok) {
                triggerPopup("MATCH COMPLETED", data.message, "success", "/dashboard");
            } else {
                triggerPopup("ACTION DENIED", data.message, "error");
            }
        } catch (err) {
            triggerPopup("CRITICAL ERROR", "Failed to complete match.", "error");
        }
    };

    // 💬 SEND CHAT MESSAGE
    const sendChat = async () => {
        if (!newMsg.trim()) return;
        const user = JSON.parse(localStorage.getItem('user'));
        try {
            await fetch('https://scrims-s.onrender.com/api/chat/send', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyId: id, userId: user.id, message: newMsg })
            });
            setNewMsg(''); 
            syncHost();
        } catch (err) { console.error("Chat Error:", err); }
    };

    // 🎛️ TOGGLE CHAT/UPLOADS
    const updateToggle = async (field, val) => {
        try {
            await fetch('https://scrims-s.onrender.com/api/host/toggle', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyId: id, field, value: val ? 1 : 0 })
            });
            syncHost();
        } catch (err) { console.error("Toggle Error:", err); }
    };

    // 📡 BROADCAST CREDENTIALS
    const handleBroadcast = async () => {
        try {
            await fetch('https://scrims-s.onrender.com/api/update-room', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyId: id, roomId: roomData.id, roomPass: roomData.pass, startTime: roomData.startTime })
            });
            triggerPopup("TRANSMISSION SUCCESS", "Room credentials are now live for all players.", "success");
            syncHost();
        } catch (err) {
            triggerPopup("TRANSMISSION FAILED", "Failed to broadcast credentials.", "error");
        }
    };

    // 🎯 UPDATE SCORING
    const updateTeamStat = async (teamName, fieldName, val) => {
        if (val === '') return; 
        const parsedVal = parseInt(val, 10);
        if (isNaN(parsedVal)) return;

        try {
            await fetch('https://scrims-s.onrender.com/api/host/update-stats', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyId: id, teamName: teamName, field: fieldName, value: parsedVal })
            });
            syncHost(); 
        } catch (err) { console.error("Stat Update Error:", err); }
    };

    return (
        <div className="cyber-layout">
            {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}></div>}

            {/* 🛑 BRUTALIST SEXY POPUP */}
            {popup.show && (
                <div className="v4-modal-overlay" style={{zIndex: 9999}}>
                    <div className={`v4-alert-box ${popup.type}-alert`}>
                        <div className="alert-deco-line"></div>
                        <h2 className="alert-title">{popup.type === 'error' ? '⚠️ SYSTEM ALERT' : '✅ PROTOCOL SUCCESS'}</h2>
                        <h3 className="alert-subtitle">{popup.title}</h3>
                        <p className="alert-msg">{popup.msg}</p>
                        <button className="v4-btn-solid alert-btn" onClick={handlePopupClose}>
                            ACKNOWLEDGE
                        </button>
                    </div>
                </div>
            )}

            {/* 🎛️ HIGH-TECH TERMINAL MODAL FOR ACTIONS */}
            {modal.show && (
                <div className="v4-modal-overlay" style={{zIndex: 9998}}>
                    <div className="v4-terminal-modal">
                        <div className="terminal-header">
                            <h3>{modal.type === 'confirm-finish' ? '// END_MATCH_PROTOCOL' : '// TERMINAL_PROMPT'}</h3>
                            <button className="close-terminal" onClick={() => setModal({show: false, type: '', val1: '', val2: ''})}>×</button>
                        </div>
                        
                        <div className="terminal-body">
                            {modal.type === 'confirm-finish' && (
                                <div style={{textAlign: 'center'}}>
                                    <h3 style={{color: 'var(--neon-red)', fontFamily: 'Orbitron'}}>⚠️ WARNING</h3>
                                    <p style={{fontFamily: 'Rajdhani', fontSize: '1.1rem', color: '#ccc'}}>Are you sure you want to end this match and process host payouts? This action is irreversible.</p>
                                </div>
                            )}
                        </div>

                        <div className="terminal-footer">
                            <button className="v4-btn-ghost" onClick={() => setModal({show: false, type: '', val1: '', val2: ''})}>ABORT</button>
                            <button className="v4-btn-solid" onClick={modal.type === 'confirm-finish' ? executeFinishMatch : () => {}}>EXECUTE</button>
                        </div>
                    </div>
                </div>
            )}

            <aside className={`cyber-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>SCRIMS<span className="text-neon">S</span></h2>
                    <p className="sys-badge">HOST_OS v2.0</p>
                </div>
                
                <nav className="cyber-nav">
                    <button className={activeTab === 'COMMAND' ? 'active' : ''} onClick={() => { setActiveTab('COMMAND'); setIsMobileMenuOpen(false); }}><span className="icon">⚡</span> COMMAND</button>
                    <button className={activeTab === 'ROSTER' ? 'active' : ''} onClick={() => { setActiveTab('ROSTER'); setIsMobileMenuOpen(false); }}><span className="icon">👥</span> SQUADS</button>
                    <button className={activeTab === 'STATS' ? 'active' : ''} onClick={() => { setActiveTab('STATS'); setIsMobileMenuOpen(false); }}><span className="icon">🎯</span> SCORING</button>
                    <button className={activeTab === 'CHAT' ? 'active' : ''} onClick={() => { setActiveTab('CHAT'); setIsMobileMenuOpen(false); }}><span className="icon">💬</span> COMM-LINK</button>
                    <button className={activeTab === 'GALLERY' ? 'active' : ''} onClick={() => { setActiveTab('GALLERY'); setIsMobileMenuOpen(false); }}><span className="icon">🖼️</span> PROOFS</button>
                </nav>

                <div className="sidebar-footer">
                    <button className="btn-shutdown" onClick={() => navigate('/dashboard')}>EXIT PANEL</button>
                </div>
            </aside>

            <main className="cyber-main">
                <header className="cyber-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>☰</button>
                        <div className="live-pulse-box"><span className="pulse-dot"></span> LIVE MATCH #{id}</div>
                    </div>
                    
                    <div className="header-actions">
                        <div className="toggle-group">
                            <button className={`cyber-toggle ${lobby.chat_enabled ? 'on' : 'off'}`} onClick={() => updateToggle('chat_enabled', !lobby.chat_enabled)}>CHAT {lobby.chat_enabled ? 'ON' : 'OFF'}</button>
                            <button className={`cyber-toggle ${lobby.uploads_enabled ? 'on' : 'off'}`} onClick={() => updateToggle('uploads_enabled', !lobby.uploads_enabled)}>PROOFS {lobby.uploads_enabled ? 'ON' : 'OFF'}</button>
                        </div>
                    </div>
                </header>

                <div className="cyber-content">
                    {/* ⚡ MODULE: COMMAND */}
                    {activeTab === 'COMMAND' && (
                        <div className="module-grid">
                            <div className="cyber-card">
                                <h3 className="card-title">BROADCAST CREDENTIALS</h3>
                                <div className="input-matrix">
                                    <div className="input-wrap"><label>ROOM ID</label><input type="text" placeholder="ENTER ID" value={roomData.id} onChange={(e) => setRoomData({...roomData, id: e.target.value})} /></div>
                                    <div className="input-wrap"><label>PASSWORD</label><input type="text" placeholder="ENTER PASS" value={roomData.pass} onChange={(e) => setRoomData({...roomData, pass: e.target.value})} /></div>
                                    <div className="input-wrap"><label>START TIME (e.g. 15:10)</label><input type="time" value={roomData.startTime} onChange={(e) => setRoomData({...roomData, startTime: e.target.value})} /></div>
                                </div>
                                <button className="btn-glitch" onClick={handleBroadcast}>TRANSMIT TO PLAYERS</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="cyber-card status-card">
                                    <h3 className="card-title">LOBBY STATUS</h3>
                                    <div className="status-display">
                                        <div className="stat-circle"><h2>{roster.length}<span>/{lobby.max_slots || 12}</span></h2></div>
                                        <p>TEAMS DEPLOYED</p>
                                    </div>
                                </div>

                                {/* ⭐ HOST RATING & PAYOUT BOX */}
                                <div className="cyber-card">
                                    <h3 className="card-title" style={{color: '#ffae00'}}>HOST RATING</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <h2 style={{ fontSize: '2.5rem', margin: 0, color: Number(lobby.avgRating) > 3 || lobby.entry_fee !== 25 ? '#00ff66' : '#ff003c' }}>
                                            {Number(lobby.avgRating).toFixed(1)} <span style={{fontSize: '1.5rem', color: '#ffae00'}}>★</span>
                                        </h2>
                                        <p style={{fontFamily: 'Orbitron', color: '#a1a1aa', fontSize: '0.8rem'}}>{lobby.totalRatings} Votes</p>
                                    </div>
                                    <button onClick={requestFinishMatch} style={{ width: '100%', background: '#ffae00', color: '#000', border: 'none', padding: '15px', fontFamily: 'Orbitron', fontWeight: 'bold', cursor: 'pointer', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                                        FINISH MATCH & CLAIM PAYOUT
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ROSTER' && (
                        <div className="roster-grid">
                            {roster.map((team, i) => (
                                <div key={i} className="roster-card"><div className="r-header"><span className="r-rank">#{i+1}</span><h4 className="r-name">{team.team_name}</h4></div><p className="r-players">{team.teammates}</p><div className="r-footer">LEADER: <span>{team.username}</span></div></div>
                            ))}
                            {roster.length === 0 && <p className="no-data">NO SQUADS DEPLOYED YET.</p>}
                        </div>
                    )}

                    {activeTab === 'STATS' && (
                        <div className="cyber-card">
                            <h3 className="card-title">TOURNAMENT LEADERBOARD</h3>
                            <div className="table-responsive">
                                <table className="cyber-table">
                                    <thead><tr><th>SQUAD</th><th>MATCHES</th><th>BOOYAHS</th><th>KILL PTS</th><th>POS PTS</th><th>TOTAL PTS</th></tr></thead>
                                    <tbody>
                                        {roster.map((team, i) => {
                                            const teamStat = stats.find(s => s.team_name === team.team_name) || {};
                                            return (
                                                <tr key={i}>
                                                    <td className="t-name">{team.team_name}</td>
                                                    <td><input type="number" min="0" className="t-input" placeholder="0" defaultValue={teamStat.matches !== undefined ? teamStat.matches : ''} onBlur={(e) => updateTeamStat(team.team_name, 'matches', e.target.value)} /></td>
                                                    <td><input type="number" min="0" className="t-input" placeholder="0" defaultValue={teamStat.booyahs !== undefined ? teamStat.booyahs : ''} onBlur={(e) => updateTeamStat(team.team_name, 'booyahs', e.target.value)} /></td>
                                                    <td><input type="number" min="0" className="t-input" placeholder="0" defaultValue={teamStat.kill_points !== undefined ? teamStat.kill_points : ''} onBlur={(e) => updateTeamStat(team.team_name, 'kill_points', e.target.value)} /></td>
                                                    <td><input type="number" min="0" className="t-input" placeholder="0" defaultValue={teamStat.position_points !== undefined ? teamStat.position_points : ''} onBlur={(e) => updateTeamStat(team.team_name, 'position_points', e.target.value)} /></td>
                                                    <td className="t-total">{teamStat.total_pts || 0}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CHAT' && (
                        <div className="cyber-card chat-wrapper">
                            <div className="chat-log">
                                {chat.map((m, i) => (<div key={i} className="chat-msg"><span className="c-user">{m.username}</span><span className="c-text">{m.message}</span></div>))}
                            </div>
                            <div className="chat-input-area">
                                <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Enter command..." onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
                                <button className="btn-send" onClick={sendChat}>SEND</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'GALLERY' && (
                        <div className="cyber-card">
                            <h3 className="card-title">SUBMITTED PROOFS ({proofs.length})</h3>
                            <div style={{ background: '#000', padding: '15px', border: '1px solid #333', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0])} style={{ color: '#00f0ff', fontFamily: 'Orbitron', flex: 1 }} />
                                <button onClick={handleUpload} disabled={isUploading} style={{ background: '#00f0ff', color: '#000', border: 'none', padding: '10px 20px', fontFamily: 'Orbitron', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}>{isUploading ? 'UPLOADING...' : 'HOST UPLOAD'}</button>
                            </div>
                            <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                {proofs.map((proof, i) => (
                                    <div key={i} className="gallery-item" style={{ border: '1px solid #27272a', padding: '10px', background: '#09090b', borderRadius: '4px' }}>
                                        <p style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: '#00f0ff', margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{proof.team_name ? proof.team_name : proof.username}</span>
                                            {lobby.host_id === proof.user_id && <span style={{color: '#ffae00', fontWeight: 'bold'}}>(HOST)</span>}
                                        </p>
                                        <a href={`https://scrims-s.onrender.com${proof.image_url}`} target="_blank" rel="noreferrer"><img src={`https://scrims-s.onrender.com${proof.image_url}`} alt="Proof" style={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer', border: lobby.host_id === proof.user_id ? '2px solid #ffae00' : '1px solid #333', borderRadius: '4px' }}/></a>
                                    </div>
                                ))}
                                {proofs.length === 0 && <p style={{ color: '#a1a1aa', fontFamily: 'Orbitron' }}>NO PROOFS SUBMITTED YET.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* 🎨 STYLES */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;900&family=Rajdhani:wght@500;700&display=swap');
                :root { --bg-dark: #09090b; --bg-panel: #121216; --neon-blue: #00f0ff; --neon-red: #ff003c; --neon-green: #00ff66; --text-main: #f4f4f5; --text-muted: #a1a1aa; --border: #27272a; }
                * { box-sizing: border-box; }
                .cyber-layout { display: flex; height: 100vh; background: var(--bg-dark); color: var(--text-main); font-family: 'Rajdhani', sans-serif; overflow: hidden; }
                .text-neon { color: var(--neon-blue); text-shadow: 0 0 10px rgba(0,240,255,0.5); }
                .card-title { font-family: 'Orbitron'; font-size: 0.8rem; color: var(--text-muted); letter-spacing: 2px; margin: 0 0 20px 0; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
                .cyber-sidebar { width: 260px; background: var(--bg-panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 20px; transition: 0.3s ease; z-index: 100; }
                .sidebar-brand h2 { font-family: 'Orbitron'; font-size: 1.5rem; margin: 0; font-weight: 900; }
                .sys-badge { display: inline-block; background: var(--neon-blue); color: #000; font-family: 'Orbitron'; font-size: 0.6rem; padding: 2px 8px; margin-top: 5px; border-radius: 2px; font-weight: 900; }
                .cyber-nav { margin-top: 40px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
                .cyber-nav button { background: transparent; border: 1px solid transparent; color: var(--text-muted); padding: 15px; text-align: left; font-family: 'Orbitron'; font-size: 0.8rem; cursor: pointer; transition: 0.3s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .cyber-nav button:hover { background: rgba(255,255,255,0.05); }
                .cyber-nav button.active { background: rgba(0,240,255,0.1); border-left: 3px solid var(--neon-blue); color: var(--neon-blue); }
                .icon { display: inline-block; width: 25px; }
                .btn-shutdown { width: 100%; background: transparent; border: 1px solid var(--neon-red); color: var(--neon-red); padding: 15px; font-family: 'Orbitron'; cursor: pointer; transition: 0.3s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .btn-shutdown:hover { background: var(--neon-red); color: #000; box-shadow: 0 0 15px var(--neon-red); }
                .cyber-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
                .cyber-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; border-bottom: 1px solid var(--border); background: var(--bg-panel); }
                .header-left { display: flex; align-items: center; gap: 15px; }
                .mobile-menu-btn { display: none; background: transparent; border: 1px solid var(--border); color: var(--text-main); font-size: 1.5rem; cursor: pointer; padding: 5px 10px; border-radius: 4px; }
                .live-pulse-box { display: flex; align-items: center; gap: 10px; font-family: 'Orbitron'; font-size: 0.8rem; letter-spacing: 1px; }
                .pulse-dot { width: 10px; height: 10px; background: var(--neon-green); border-radius: 50%; box-shadow: 0 0 10px var(--neon-green); animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                .cyber-content { flex: 1; padding: 30px; overflow-y: auto; }
                .cyber-card { background: var(--bg-panel); border: 1px solid var(--border); padding: 25px; border-radius: 8px; margin-bottom: 20px; }
                .module-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
                .input-matrix { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
                .input-wrap label { display: block; font-family: 'Orbitron'; font-size: 0.6rem; color: var(--neon-blue); margin-bottom: 5px; }
                .input-wrap input { width: 100%; background: var(--bg-dark); border: 1px solid var(--border); color: #fff; padding: 12px; font-family: 'Orbitron'; outline: none; transition: 0.3s; }
                .input-wrap input:focus { border-color: var(--neon-blue); box-shadow: 0 0 10px rgba(0,240,255,0.2); }
                .btn-glitch { width: 100%; background: var(--neon-blue); color: #000; font-family: 'Orbitron'; font-weight: 900; padding: 15px; border: none; cursor: pointer; transition: 0.3s; clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px); }
                .btn-glitch:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(0,240,255,0.4); }
                .status-display { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
                .stat-circle { width: 120px; height: 120px; border: 4px solid var(--border); border-top-color: var(--neon-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: 0 0 20px rgba(0,240,255,0.1); }
                .stat-circle h2 { font-family: 'Orbitron'; font-size: 2rem; margin: 0; }
                .stat-circle span { font-size: 1rem; color: var(--text-muted); }
                .status-display p { font-family: 'Orbitron'; font-size: 0.8rem; color: var(--neon-blue); }
                .roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
                .roster-card { background: var(--bg-panel); border: 1px solid var(--border); padding: 20px; border-left: 4px solid var(--neon-blue); transition: 0.3s; }
                .roster-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.5); border-color: var(--neon-blue); }
                .r-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
                .r-rank { font-family: 'Orbitron'; font-size: 0.8rem; color: var(--text-muted); }
                .r-name { font-family: 'Orbitron'; font-size: 1rem; margin: 0; color: var(--neon-blue); }
                .r-players { font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 15px; }
                .r-footer { font-family: 'Orbitron'; font-size: 0.6rem; color: var(--text-muted); }
                .r-footer span { color: var(--text-main); font-size: 0.7rem; }
                .table-responsive { overflow-x: auto; }
                .cyber-table { width: 100%; min-width: 600px; border-collapse: collapse; }
                .cyber-table th { text-align: left; padding: 15px; font-family: 'Orbitron'; font-size: 0.8rem; color: var(--neon-blue); border-bottom: 1px solid var(--border); }
                .cyber-table td { padding: 12px 15px; border-bottom: 1px solid var(--border); }
                .t-name { font-family: 'Orbitron'; font-weight: bold; }
                .t-input { width: 60px; background: var(--bg-dark); border: 1px solid var(--border); color: var(--neon-green); text-align: center; padding: 8px; font-family: 'Orbitron'; outline: none; }
                .t-input:focus { border-color: var(--neon-green); }
                .t-total { font-family: 'Orbitron'; color: var(--neon-green); font-size: 1.1rem; font-weight: 900; }
                .chat-wrapper { height: 600px; display: flex; flex-direction: column; }
                .chat-log { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; padding-right: 10px; }
                .chat-msg { background: var(--bg-dark); padding: 12px 15px; border-radius: 4px; border-left: 2px solid var(--border); }
                .c-user { font-family: 'Orbitron'; font-size: 0.7rem; color: var(--neon-blue); display: block; margin-bottom: 4px; }
                .c-text { font-size: 0.9rem; }
                .chat-input-area { display: flex; gap: 10px; }
                .chat-input-area input { flex: 1; background: var(--bg-dark); border: 1px solid var(--border); color: #fff; padding: 15px; font-family: 'Rajdhani'; outline: none; }
                .chat-input-area input:focus { border-color: var(--neon-blue); }
                .btn-send { background: var(--neon-blue); color: #000; border: none; padding: 0 30px; font-family: 'Orbitron'; font-weight: bold; cursor: pointer; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .toggle-group { display: flex; gap: 10px; }
                .cyber-toggle { padding: 8px 15px; font-family: 'Orbitron'; font-size: 0.7rem; border-radius: 4px; cursor: pointer; border: 1px solid; transition: 0.3s; }
                .cyber-toggle.on { background: rgba(0,255,102,0.1); color: var(--neon-green); border-color: var(--neon-green); box-shadow: 0 0 10px rgba(0,255,102,0.2); }
                .cyber-toggle.off { background: rgba(255,0,60,0.1); color: var(--neon-red); border-color: var(--neon-red); }

                /* 🎛️ TERMINAL MODALS (FOR CONFIRM MATCH) */
                .v4-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(5px); z-index: 2000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
                .v4-terminal-modal { width: 100%; max-width: 450px; background: var(--bg-dark); border: 1px solid #333; box-shadow: 0 20px 50px rgba(0,0,0,0.8); animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1); }
                .terminal-header { background: #111; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
                .terminal-header h3 { margin: 0; font-family: 'Orbitron'; font-size: 0.85rem; color: var(--neon-blue); letter-spacing: 2px; }
                .close-terminal { background: none; border: none; color: #666; font-size: 1.5rem; cursor: pointer; line-height: 1; }
                .close-terminal:hover { color: var(--neon-red); }
                .terminal-body { padding: 30px; }
                .terminal-footer { display: flex; gap: 15px; padding: 20px 30px; background: #0a0a0d; border-top: 1px solid #222; }
                .v4-btn-solid { width: 100%; background: var(--neon-blue); color: #000; border: none; padding: 16px; font-family: 'Orbitron'; font-weight: 900; font-size: 0.8rem; letter-spacing: 2px; cursor: pointer; transition: 0.2s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .v4-btn-solid:hover { background: #fff; box-shadow: 0 0 20px var(--neon-blue); }
                .v4-btn-ghost { width: 100%; background: transparent; color: var(--text-muted); border: 1px solid transparent; padding: 15px; font-family: 'Orbitron'; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
                .v4-btn-ghost:hover { color: var(--text-main); border-bottom: 1px solid var(--text-main); }

                /* 🛑 BRUTALIST ALERTS */
                .v4-alert-box { width: 400px; background: var(--bg-panel); border: 1px solid #333; padding: 40px; text-align: center; position: relative; }
                .alert-deco-line { position: absolute; top: 0; left: 0; width: 100%; height: 3px; }
                .error-alert .alert-deco-line { background: var(--neon-red); box-shadow: 0 0 20px var(--neon-red); }
                .success-alert .alert-deco-line { background: var(--neon-green); box-shadow: 0 0 20px var(--neon-green); }
                .alert-title { font-family: 'Orbitron'; font-size: 1rem; color: #888; margin-bottom: 10px; letter-spacing: 3px; }
                .alert-subtitle { font-family: 'Syncopate'; font-size: 1.2rem; margin-bottom: 15px; color: #fff;}
                .alert-msg { font-family: 'Rajdhani'; font-size: 1.1rem; color: var(--text-muted); margin-bottom: 30px; }
                .alert-btn { width: 100%; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                @media (max-width: 1024px) { .module-grid { grid-template-columns: 1fr; } }
                @media (max-width: 768px) {
                    .mobile-menu-btn { display: block; }
                    .cyber-sidebar { position: fixed; left: -300px; top: 0; height: 100vh; box-shadow: 10px 0 30px rgba(0,0,0,0.8); }
                    .cyber-sidebar.open { left: 0; }
                    .mobile-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 99; backdrop-filter: blur(5px); }
                    .header-actions { display: none; }
                    .input-matrix { grid-template-columns: 1fr; }
                    .cyber-header { padding: 15px 20px; }
                    .cyber-content { padding: 15px; }
                }
            `}</style>
        </div>
    );
};

export default HostPanel;