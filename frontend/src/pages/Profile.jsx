import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null); 
    const [userId, setUserId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // 📡 Real Data State
    const [profileData, setProfileData] = useState({
        user: { username: 'Loading...', ign: '', total_earnings: 0, profile_pic: null, security_pin: null },
        rating: { avg: 0, count: 0 },
        stats: { hosted: 0, played: 0, wins: 0 },
        team: 'LONE WOLF (NO TEAM)',
        teamCode: null,
        teamMembers: [],
        history: []
    });

    // 🪟 Tactical Modal State
    const [modal, setModal] = useState({ show: false, type: '', val1: '', val2: '' });
    // 💎 Success/Error Popup State
    const [popup, setPopup] = useState({ show: false, title: '', msg: '', type: 'info' });

    const triggerPopup = (title, msg, type = 'info') => {
        setPopup({ show: true, title, msg, type });
    };

    const fetchProfileData = useCallback((uid) => {
        fetch(`https://scrims-s.onrender.com/api/profile/${uid}`)
            .then(res => res.json())
            .then(data => {
                if(!data.message) setProfileData(data);
            })
            .catch(err => console.error("Failed to load profile stats.", err));
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserId(parsedUser.id);
            fetchProfileData(parsedUser.id);
        } else {
            navigate('/login');
        }
    }, [navigate, fetchProfileData]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('userId', userId);

        try {
            const res = await fetch('https://scrims-s.onrender.com/api/upload-avatar', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                triggerPopup("IDENTITY UPDATED", "Visual signature accepted.", "success");
                fetchProfileData(userId);
            } else {
                triggerPopup("UPLOAD FAILED", data.message, "error");
            }
        } catch (err) { 
            triggerPopup("CONNECTION ERROR", "Failed to reach server.", "error");
        } finally { 
            setIsUploading(false); 
        }
    };

    const handleModalSubmit = async () => {
        let endpoint = '';
        let payload = { userId };

        if (modal.type === 'edit') {
            if (!modal.val1.trim()) return triggerPopup("INPUT ERROR", "Username is required.", "error");
            endpoint = '/api/profile/edit';
            payload = { ...payload, username: modal.val1, ign: modal.val2 };
            const stored = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...stored, username: modal.val1, ign: modal.val2 }));
        } 
        else if (modal.type === 'pin') {
            if (modal.val1.length !== 4) return triggerPopup("INVALID PIN", "PIN must be exactly 4 digits.", "error");
            endpoint = '/api/profile/set-pin';
            payload = { ...payload, newPin: modal.val1 };
        }
        else if (modal.type === 'forgot-pin') {
            if (!modal.val1.trim() || modal.val2.length !== 4) {
                return triggerPopup("INPUT ERROR", "Enter password and a new 4-digit PIN.", "error");
            }
            endpoint = '/api/profile/reset-pin-with-password';
            payload = { ...payload, password: modal.val1, newPin: modal.val2 };
        }
        else if (modal.type === 'create') {
            if (!modal.val1.trim()) return triggerPopup("INPUT ERROR", "Squad name required.", "error");
            endpoint = '/api/team/create';
            payload = { ...payload, teamName: modal.val1 };
        } 
        else if (modal.type === 'join') {
            endpoint = '/api/team/join';
            payload = { ...payload, teamCode: modal.val1 };
        } 
        else if (modal.type === 'leave') {
            endpoint = '/api/team/leave';
        }
        // ✅ NEW: REMOVE AVATAR ENDPOINT CALL
        else if (modal.type === 'remove-avatar') {
            endpoint = '/api/profile/remove-avatar';
        }

        try {
            const res = await fetch(`https://scrims-s.onrender.com${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                triggerPopup("SUCCESS", data.message, "success");
                setModal({ show: false, type: '', val1: '', val2: '' });
                fetchProfileData(userId);
            } else {
                triggerPopup("DENIED", data.message, "error");
            }
        } catch (err) { 
            triggerPopup("OFFLINE", "Database connection lost.", "error");
        }
    };

    return (
        <div className="v4-viewport">
            <div className="v4-bg-noise"></div>
            <div className="v4-ambient-glow"></div>

            {/* 🛑 BRUTALIST POPUP */}
            {popup.show && (
                <div className="v4-modal-overlay">
                    <div className={`v4-alert-box ${popup.type}-alert`}>
                        <div className="alert-deco-line"></div>
                        <h2 className="alert-title">{popup.title}</h2>
                        <p className="alert-msg">{popup.msg}</p>
                        <button className="v4-btn-solid alert-btn" onClick={() => setPopup({...popup, show: false})}>
                            ACKNOWLEDGE
                        </button>
                    </div>
                </div>
            )}

            {/* 🎛️ HIGH-TECH TERMINAL MODAL */}
            {modal.show && (
                <div className="v4-modal-overlay">
                    <div className="v4-terminal-modal">
                        <div className="terminal-header">
                            <h3>
                                {modal.type === 'edit' ? '// EDIT_IDENTITY' : 
                                 modal.type === 'pin' ? '// SECURE_VAULT' :
                                 modal.type === 'forgot-pin' ? '// OVERRIDE_PIN' :
                                 modal.type === 'create' ? '// INIT_SQUAD' : 
                                 modal.type === 'remove-avatar' ? '// DELETE_AVATAR' :
                                 modal.type === 'leave' ? '// DESERT_SQUAD?' : '// JOIN_SQUAD'}
                            </h3>
                            <button className="close-terminal" onClick={() => setModal({show: false, type: '', val1: '', val2: ''})}>×</button>
                        </div>
                        
                        <div className="terminal-body">
                            {modal.type === 'edit' && (
                                <>
                                    <div className="input-group">
                                        <label>OPERATIVE NAME</label>
                                        <input type="text" className="v4-input" value={modal.val1} onChange={(e) => setModal({...modal, val1: e.target.value})} autoFocus />
                                    </div>
                                    <div className="input-group">
                                        <label>IN-GAME NAME (IGN)</label>
                                        <input type="text" className="v4-input" value={modal.val2} onChange={(e) => setModal({...modal, val2: e.target.value})} />
                                    </div>
                                </>
                            )}
                            {modal.type === 'pin' && (
                                <div className="input-group">
                                    <label>4-DIGIT SECURITY PIN</label>
                                    <input type="password" maxLength="4" className="v4-input pin-entry" placeholder="••••" value={modal.val1} onChange={(e) => setModal({...modal, val1: e.target.value})} autoFocus />
                                </div>
                            )}
                            {modal.type === 'forgot-pin' && (
                                <>
                                    <div className="input-group">
                                        <label>ACCOUNT PASSWORD (AUTHORIZATION)</label>
                                        <input type="password" className="v4-input" value={modal.val1} onChange={(e) => setModal({...modal, val1: e.target.value})} autoFocus />
                                    </div>
                                    <div className="input-group">
                                        <label>NEW 4-DIGIT PIN</label>
                                        <input type="password" maxLength="4" className="v4-input pin-entry" placeholder="••••" value={modal.val2} onChange={(e) => setModal({...modal, val2: e.target.value})} />
                                    </div>
                                </>
                            )}
                            {(modal.type === 'create' || modal.type === 'join') && (
                                <div className="input-group">
                                    <label>{modal.type === 'create' ? "SQUAD DESIGNATION" : "INVITE CODE"}</label>
                                    <input type="text" className="v4-input" value={modal.val1} onChange={(e) => setModal({...modal, val1: e.target.value})} autoFocus />
                                </div>
                            )}
                            {modal.type === 'leave' && (
                                <p className="warning-text">WARNING: Leaving will sever all ties with your current roster. Proceed?</p>
                            )}
                            {/* ✅ NEW: CONFIRM AVATAR DELETION */}
                            {modal.type === 'remove-avatar' && (
                                <p className="warning-text" style={{color: 'var(--v4-cyan)'}}>Confirm deletion of your visual signature? You will be reverted to the default operative avatar.</p>
                            )}
                        </div>

                        <div className="terminal-footer">
                            <button className="v4-btn-ghost" onClick={() => setModal({show: false, type: '', val1: '', val2: ''})}>CANCEL</button>
                            <button className="v4-btn-solid" onClick={handleModalSubmit}>EXECUTE</button>
                        </div>
                    </div>
                </div>
            )}

            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />

            {/* 🛸 NAVBAR */}
            <nav className="v4-nav">
                <div className="nav-brand" onClick={() => navigate('/dashboard')}>
                    SCRIMS<span className="accent-red">S</span>
                </div>
                <div className="nav-links">
                    <button onClick={() => navigate('/dashboard')} className="nav-item">DASHBOARD</button>
                    <button className="nav-item active">PROFILE</button>
                    <button onClick={() => navigate('/wallet')} className="nav-item">VAULT</button>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="nav-item logout-btn">LOGOUT</button>
                </div>
            </nav>

            {/* ⚔️ MAIN GRID */}
            <div className="v4-container">
                
                {/* LEFT SIDEBAR */}
                <aside className="v4-sidebar">
                    {/* Identity Block */}
                    <div className="v4-card id-card">
                        <div className="card-glitch-bar"></div>
                        <div className="avatar-hexagon" onClick={() => fileInputRef.current.click()}>
                            <img src={profileData.user.profile_pic ? `https://scrims-s.onrender.com${profileData.user.profile_pic}` : "/default-avatar.png"} alt="Profile" />
                            <div className="avatar-hover">UPLOAD</div>
                        </div>

                        {/* ✅ NEW: REMOVE AVATAR BUTTON (Only shows if an image is uploaded) */}
                        {profileData.user.profile_pic && (
                            <button className="remove-avatar-btn" onClick={() => setModal({ show: true, type: 'remove-avatar', val1: '', val2: '' })}>
                                [ REMOVE AVATAR ]
                            </button>
                        )}

                        <h2 className="user-name">{profileData.user.username.toUpperCase()}</h2>
                        <div className="user-ign">IGN // <span>{profileData.user.ign || 'UNREGISTERED'}</span></div>

                        <button className="v4-btn-outline edit-id-btn" onClick={() => setModal({ show: true, type: 'edit', val1: profileData.user.username, val2: profileData.user.ign || '' })}>
                            EDIT IDENTITY
                        </button>
                    </div>

                    {/* Security Block */}
                    <div className="v4-card sec-card">
                        <h3 className="card-title">VAULT SECURITY</h3>
                        <div className={`sec-status ${profileData.user.security_pin ? "active" : "disabled"}`}>
                            <div className="sec-dot"></div>
                            {profileData.user.security_pin ? "ENCRYPTION ACTIVE" : "NO PIN SET"}
                        </div>
                        
                        {!profileData.user.security_pin ? (
                            <button className="v4-btn-solid mini-btn" onClick={() => setModal({show: true, type: 'pin', val1: '', val2: ''})}>ENABLE PIN</button>
                        ) : (
                            <button className="v4-btn-ghost mini-btn" onClick={() => setModal({show: true, type: 'forgot-pin', val1: '', val2: ''})}>RESET PIN</button>
                        )}
                    </div>

                    {/* Squad Block */}
                    <div className="v4-card squad-card">
                        <h3 className="card-title">SQUAD AFFILIATION</h3>
                        <div className="squad-name">{profileData.team}</div>
                        
                        {profileData.teamCode && (
                            <div className="invite-code-box" onClick={() => {
                                navigator.clipboard.writeText(profileData.teamCode);
                                triggerPopup("COPIED", "Invite code copied.", "success");
                            }}>
                                <span>INVITE CODE</span>
                                <h4>{profileData.teamCode}</h4>
                            </div>
                        )}

                        {profileData.team !== 'LONE WOLF (NO TEAM)' && (
                            <div className="roster-box">
                                <span className="roster-count">ROSTER [{profileData.teamMembers.length}/4]</span>
                                <div className="roster-list">
                                    {profileData.teamMembers.map((member, idx) => (
                                        <div key={idx} className="roster-row">
                                            <img src={member.profile_pic ? `https://scrims-s.onrender.com${member.profile_pic}` : "/default-avatar.png"} alt="member" />
                                            <div>
                                                <p>{member.username}</p>
                                                <span>{member.ign || 'NO IGN'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="squad-btn-group">
                            {profileData.team === 'LONE WOLF (NO TEAM)' ? (
                                <>
                                    <button className="v4-btn-outline" onClick={() => setModal({ show: true, type: 'create', val1: '', val2: '' })}>CREATE</button>
                                    <button className="v4-btn-solid" onClick={() => setModal({ show: true, type: 'join', val1: '', val2: '' })}>JOIN</button>
                                </>
                            ) : (
                                <button className="v4-btn-danger" onClick={() => setModal({ show: true, type: 'leave', val1: '', val2: '' })}>LEAVE SQUAD</button>
                            )}
                        </div>
                    </div>
                </aside>

                {/* RIGHT CONTENT */}
                <main className="v4-main-content">
                    
                    {/* Massive Vault Display */}
                    <div className="v4-vault-display">
                        <div className="vault-bg-text">FUNDS</div>
                        <div className="vault-meta">TOTAL EXTRACTABLE BALANCE</div>
                        <h1 className="vault-amount">₹{parseFloat(profileData.user.total_earnings || 0).toLocaleString('en-IN')}</h1>
                    </div>

                    {/* Stats Grid */}
                    <div className="v4-stats-grid">
                        <div className="stat-module">
                            <span className="stat-label">MATCHES PLAYED</span>
                            <span className="stat-num">{profileData.stats.played}</span>
                        </div>
                        <div className="stat-module win-module">
                            <span className="stat-label">TOTAL BOOYAHS</span>
                            <span className="stat-num">{profileData.stats.wins}</span>
                        </div>
                        <div className="stat-module host-module">
                            <span className="stat-label">HOSTED LOBBIES</span>
                            <span className="stat-num">{profileData.stats.hosted}</span>
                            <div className="host-rating-tag">★ {Number(profileData.rating.avg).toFixed(1)} AVG RATING</div>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="v4-history-section">
                        <h3 className="history-title">// DEPLOYMENT_LOG</h3>
                        <div className="history-wrapper">
                            {profileData.history.length > 0 ? (
                                profileData.history.map((match, i) => (
                                    <div key={i} className="history-item">
                                        <div className="h-data">
                                            <h4>MATCH #{match.id}</h4>
                                            <span className="h-game">{match.game_type}</span>
                                            <p>{match.slot_time} • {match.status}</p>
                                        </div>
                                        <div className={`h-role ${match.role.toLowerCase()}`}>
                                            {match.role}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="history-empty">NO DEPLOYMENT DATA DETECTED</div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&family=Teko:wght@500;600;700&display=swap');
                
                :root { 
                    --v4-bg: #050507; 
                    --v4-card: #0d0d12;
                    --v4-border: #1f1f26;
                    --v4-cyan: #00f0ff; 
                    --v4-red: #ff4655;
                    --v4-text: #ece8e1;
                    --v4-muted: #8b92a5;
                }
                
                .v4-viewport { min-height: 100vh; background: var(--v4-bg); color: var(--v4-text); font-family: 'Rajdhani', sans-serif; position: relative; overflow-x: hidden; }
                .v4-bg-noise { position: fixed; inset: 0; background: url('https://grainy-gradients.vercel.app/noise.svg'); opacity: 0.1; pointer-events: none; z-index: 0; }
                .v4-ambient-glow { position: fixed; top: -20%; right: -10%; width: 50vw; height: 50vh; background: radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 60%); z-index: 1; pointer-events: none; }
                
                /* TACTICAL NAV */
                .v4-nav { position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 20px 5%; border-bottom: 1px solid var(--v4-border); background: rgba(5, 5, 7, 0.9); backdrop-filter: blur(10px); }
                .nav-brand { font-family: 'Teko', sans-serif; font-size: 2rem; font-weight: 700; letter-spacing: 2px; cursor: pointer; line-height: 1; }
                .accent-red { color: var(--v4-red); }
                .nav-links { display: flex; gap: 30px; }
                .nav-item { background: none; border: none; color: var(--v4-muted); font-family: 'Orbitron'; font-weight: 700; font-size: 0.8rem; letter-spacing: 2px; cursor: pointer; transition: 0.2s; position: relative; }
                .nav-item:hover, .nav-item.active { color: var(--v4-text); }
                .nav-item.active::before { content: ''; position: absolute; top: -20px; left: 0; width: 100%; height: 3px; background: var(--v4-cyan); box-shadow: 0 0 10px var(--v4-cyan); }
                .logout-btn:hover { color: var(--v4-red) !important; }

                /* GRID LAYOUT */
                .v4-container { display: grid; grid-template-columns: 340px 1fr; gap: 40px; padding: 40px 5%; max-width: 1500px; margin: 0 auto; position: relative; z-index: 5; }
                
                /* V4 CARDS */
                .v4-card { background: var(--v4-card); border: 1px solid var(--v4-border); padding: 30px; position: relative; }
                .card-glitch-bar { position: absolute; top: -1px; left: -1px; width: 40px; height: 3px; background: var(--v4-cyan); }
                .card-title { font-family: 'Orbitron'; font-size: 0.8rem; color: var(--v4-muted); margin: 0 0 20px 0; letter-spacing: 2px; border-bottom: 1px solid var(--v4-border); padding-bottom: 10px; }

                /* IDENTITY BLOCK */
                .id-card { text-align: center; display: flex; flex-direction: column; align-items: center; }
                .avatar-hexagon { width: 130px; height: 130px; margin-bottom: 10px; cursor: pointer; position: relative; clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%); background: var(--v4-cyan); padding: 3px; transition: 0.3s; }
                .avatar-hexagon img { width: 100%; height: 100%; object-fit: cover; clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%); background: var(--v4-bg); }
                .avatar-hover { position: absolute; inset: 0; background: rgba(0, 240, 255, 0.8); color: #000; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron'; font-weight: 700; font-size: 0.8rem; opacity: 0; transition: 0.2s; z-index: 10;}
                .avatar-hexagon:hover .avatar-hover { opacity: 1; }
                .avatar-hexagon:hover { transform: scale(1.05); }
                
                /* ✅ REMOVE AVATAR STYLES */
                .remove-avatar-btn { background: none; border: none; color: var(--v4-red); font-family: 'Orbitron'; font-size: 0.6rem; font-weight: 700; letter-spacing: 2px; cursor: pointer; margin-bottom: 15px; transition: 0.2s; }
                .remove-avatar-btn:hover { color: #fff; text-shadow: 0 0 10px var(--v4-red); }

                .user-name { font-family: 'Teko'; font-size: 2.5rem; line-height: 1; margin: 0; letter-spacing: 1px; }
                .user-ign { font-family: 'Orbitron'; font-size: 0.7rem; color: var(--v4-muted); letter-spacing: 2px; margin-bottom: 30px; }
                .user-ign span { color: var(--v4-text); font-weight: 700; }

                /* SECURITY BLOCK */
                .sec-status { display: flex; align-items: center; gap: 10px; font-family: 'Orbitron'; font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--v4-border); }
                .sec-status.active { border-left: 3px solid var(--v4-cyan); color: var(--v4-cyan); }
                .sec-status.disabled { border-left: 3px solid var(--v4-red); color: var(--v4-red); }
                .sec-dot { width: 8px; height: 8px; background: currentColor; box-shadow: 0 0 10px currentColor; }

                /* SQUAD BLOCK */
                .squad-name { font-family: 'Teko'; font-size: 2rem; line-height: 1; margin-bottom: 20px; }
                .invite-code-box { background: rgba(0, 240, 255, 0.05); border: 1px dashed var(--v4-cyan); padding: 15px; text-align: center; cursor: pointer; margin-bottom: 20px; transition: 0.2s; }
                .invite-code-box:hover { background: rgba(0, 240, 255, 0.1); }
                .invite-code-box span { font-family: 'Orbitron'; font-size: 0.6rem; color: var(--v4-cyan); display: block; margin-bottom: 5px; }
                .invite-code-box h4 { font-family: 'Orbitron'; font-size: 1.2rem; margin: 0; letter-spacing: 3px; }
                
                .roster-box { margin-bottom: 20px; }
                .roster-count { font-family: 'Orbitron'; font-size: 0.6rem; color: var(--v4-muted); display: block; margin-bottom: 10px; }
                .roster-list { display: flex; flex-direction: column; gap: 10px; }
                .roster-row { display: flex; align-items: center; gap: 12px; background: var(--v4-bg); padding: 10px; border: 1px solid var(--v4-border); }
                .roster-row img { width: 30px; height: 30px; border-radius: 4px; border: 1px solid #333; }
                .roster-row p { margin: 0; font-family: 'Orbitron'; font-size: 0.75rem; font-weight: 700; }
                .roster-row span { font-size: 0.7rem; color: var(--v4-cyan); }

                /* BUTTONS V4 */
                .v4-btn-solid { width: 100%; background: var(--v4-cyan); color: #000; border: none; padding: 16px; font-family: 'Orbitron'; font-weight: 900; font-size: 0.8rem; letter-spacing: 2px; cursor: pointer; transition: 0.2s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .v4-btn-solid:hover { background: #fff; box-shadow: 0 0 20px var(--v4-cyan); }
                
                .v4-btn-outline { width: 100%; background: transparent; color: var(--v4-text); border: 1px solid #444; padding: 15px; font-family: 'Orbitron'; font-weight: 700; font-size: 0.8rem; letter-spacing: 2px; cursor: pointer; transition: 0.2s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .v4-btn-outline:hover { border-color: var(--v4-cyan); color: var(--v4-cyan); }
                
                .v4-btn-ghost { width: 100%; background: transparent; color: var(--v4-muted); border: 1px solid transparent; padding: 15px; font-family: 'Orbitron'; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
                .v4-btn-ghost:hover { color: var(--v4-text); border-bottom: 1px solid var(--v4-text); }
                
                .v4-btn-danger { width: 100%; background: rgba(255, 70, 85, 0.1); color: var(--v4-red); border: 1px solid var(--v4-red); padding: 15px; font-family: 'Orbitron'; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .v4-btn-danger:hover { background: var(--v4-red); color: #000; }

                .squad-btn-group { display: flex; gap: 15px; }
                .mini-btn { padding: 12px; font-size: 0.7rem; }

                /* MAIN VAULT & STATS */
                .v4-main-content { display: flex; flex-direction: column; gap: 30px; }
                
                .v4-vault-display { position: relative; background: var(--v4-card); border: 1px solid var(--v4-border); padding: 40px; overflow: hidden; border-left: 4px solid var(--v4-cyan); }
                .vault-bg-text { position: absolute; right: -20px; bottom: -30px; font-family: 'Teko'; font-size: 10rem; color: rgba(255,255,255,0.02); line-height: 1; pointer-events: none; z-index: 0;}
                .vault-meta { font-family: 'Orbitron'; font-size: 0.8rem; color: var(--v4-cyan); letter-spacing: 3px; position: relative; z-index: 1; margin-bottom: 10px; }
                .vault-amount { font-family: 'Teko'; font-size: 6rem; line-height: 1; margin: 0; color: var(--v4-text); position: relative; z-index: 1; text-shadow: 0 0 30px rgba(0, 240, 255, 0.2); }

                .v4-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .stat-module { background: var(--v4-card); border: 1px solid var(--v4-border); padding: 30px; display: flex; flex-direction: column; justify-content: center; position: relative; }
                .stat-module::before { content: ''; position: absolute; top: 10px; right: 10px; width: 6px; height: 6px; background: #333; }
                .stat-label { font-family: 'Orbitron'; font-size: 0.65rem; color: var(--v4-muted); letter-spacing: 2px; margin-bottom: 10px; }
                .stat-num { font-family: 'Teko'; font-size: 3.5rem; line-height: 1; }
                
                /* ✅ RATING MOVED INSIDE HOST MODULE */
                .host-module { border-bottom: 2px solid var(--v4-cyan); }
                .host-rating-tag { display: inline-block; background: rgba(0, 240, 255, 0.1); color: var(--v4-cyan); font-family: 'Orbitron'; font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 2px; margin-top: 10px; width: fit-content; }
                
                .win-module { border-bottom: 2px solid var(--v4-red); }
                .win-module .stat-num { color: var(--v4-red); text-shadow: 0 0 15px rgba(255, 70, 85, 0.3); }

                /* HISTORY */
                .v4-history-section { flex: 1; background: var(--v4-card); border: 1px solid var(--v4-border); padding: 30px; }
                .history-title { font-family: 'Orbitron'; font-size: 0.9rem; letter-spacing: 2px; margin: 0 0 25px 0; color: var(--v4-muted); }
                .history-wrapper { display: flex; flex-direction: column; gap: 10px; }
                .history-item { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: var(--v4-bg); border: 1px solid transparent; transition: 0.2s; }
                .history-item:hover { border-color: #333; }
                .h-data h4 { margin: 0 0 5px 0; font-family: 'Orbitron'; font-size: 1rem; letter-spacing: 1px; display: inline-block; }
                .h-game { background: #222; font-family: 'Rajdhani'; font-size: 0.7rem; padding: 2px 8px; margin-left: 10px; border-radius: 2px; }
                .h-data p { margin: 0; font-size: 0.85rem; color: var(--v4-muted); }
                .h-role { font-family: 'Orbitron'; font-size: 0.7rem; font-weight: 900; letter-spacing: 1px; padding: 6px 12px; }
                .h-role.host { color: var(--v4-red); border: 1px solid var(--v4-red); }
                .h-role.player { color: var(--v4-cyan); border: 1px solid var(--v4-cyan); }
                .history-empty { text-align: center; padding: 40px; font-family: 'Orbitron'; color: #444; letter-spacing: 2px; }

                /* 🎛️ NEW TERMINAL MODALS */
                .v4-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(5px); z-index: 2000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
                .v4-terminal-modal { width: 100%; max-width: 450px; background: var(--v4-bg); border: 1px solid #333; box-shadow: 0 20px 50px rgba(0,0,0,0.8); animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1); }
                .terminal-header { background: #111; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
                .terminal-header h3 { margin: 0; font-family: 'Orbitron'; font-size: 0.85rem; color: var(--v4-cyan); letter-spacing: 2px; }
                .close-terminal { background: none; border: none; color: #666; font-size: 1.5rem; cursor: pointer; line-height: 1; }
                .close-terminal:hover { color: var(--v4-red); }
                
                .terminal-body { padding: 30px; }
                .input-group { margin-bottom: 25px; text-align: left; }
                .input-group label { display: block; font-family: 'Orbitron'; font-size: 0.65rem; color: var(--v4-muted); margin-bottom: 8px; letter-spacing: 1px; }
                
                /* ✅ SEXY FLOATING INPUTS */
                .v4-input { width: 100%; background: transparent; border: none; border-bottom: 2px solid #333; color: #fff; padding: 10px 5px; font-family: 'Rajdhani'; font-size: 1.2rem; font-weight: 600; outline: none; transition: 0.3s; }
                .v4-input:focus { border-bottom-color: var(--v4-cyan); text-shadow: 0 0 10px rgba(0, 240, 255, 0.5); }
                .pin-entry { font-family: 'Orbitron'; font-size: 2rem; letter-spacing: 20px; text-align: center; }
                
                .warning-text { font-family: 'Rajdhani'; color: var(--v4-red); font-size: 1rem; text-align: center; margin: 0; }
                
                .terminal-footer { display: flex; gap: 15px; padding: 20px 30px; background: #0a0a0d; border-top: 1px solid #222; }

                /* BRUTALIST ALERTS */
                .v4-alert-box { width: 400px; background: var(--v4-card); border: 1px solid #333; padding: 40px; text-align: center; position: relative; }
                .alert-deco-line { position: absolute; top: 0; left: 0; width: 100%; height: 3px; }
                .error-alert .alert-deco-line { background: var(--v4-red); box-shadow: 0 0 20px var(--v4-red); }
                .success-alert .alert-deco-line { background: var(--v4-cyan); box-shadow: 0 0 20px var(--v4-cyan); }
                .alert-title { font-family: 'Syncopate'; font-size: 1.2rem; margin-bottom: 15px; }
                .alert-msg { font-family: 'Rajdhani'; font-size: 1.1rem; color: var(--v4-muted); margin-bottom: 30px; }
                .alert-btn { width: 100%; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                @media (max-width: 1000px) {
                    .v4-container { grid-template-columns: 1fr; padding: 20px; }
                    .v4-stats-grid { grid-template-columns: 1fr; }
                    .v4-nav { flex-direction: column; gap: 15px; }
                }
            `}</style>
        </div>
    );
};

export default Profile;