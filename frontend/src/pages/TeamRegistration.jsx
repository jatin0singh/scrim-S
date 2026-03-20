 import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TeamRegistration = () => {
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    
    const [teamName, setTeamName] = useState('');
    const [players, setPlayers] = useState([
        { id: 1, name: '', label: 'SQUAD LEADER' },
        { id: 2, name: '', label: 'PLAYER 2' },
        { id: 3, name: '', label: 'PLAYER 3' },
        { id: 4, name: '', label: 'PLAYER 4' },
    ]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return navigate('/login');
        const user = JSON.parse(storedUser);
        
        // Auto-fill leader name from account
        setPlayers(prev => prev.map(p => p.id === 1 ? { ...p, name: user.username } : p));
    }, [navigate]);

    const handlePlayerChange = (id, value) => {
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, name: value } : p));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        
        // 🛡️ STRICTOR VALIDATION
        if (!teamName.trim()) return alert("Please enter a Squad Name.");
        
        const emptyPlayers = players.filter(p => !p.name.trim());
        if (emptyPlayers.length > 0) return alert("All 4 player IGNs are required.");

        const teammatesString = players.map(p => p.name).join(', ');

        try {
            const res = await fetch('http://localhost:5000/api/register-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    lobbyId: lobbyId,
                    teamName: teamName,
                    teammates: teammatesString
                })
            });

            if (res.ok) {
                // SUCCESS: Now the database has a team_name for this match
                navigate(`/match/${lobbyId}`);
            } else {
                const data = await res.json();
                alert(data.message || "Failed to register squad.");
            }
        } catch (err) {
            alert("Sync error. Please check your connection.");
        }
    };

    return (
        <div className="reg-viewport">
            <div className="ambient-glow"></div>
            <div className="reg-container">
                <header className="reg-header">
                    <div className="header-left">
                        <span className="live-tag">FINALIZING DEPLOYMENT</span>
                        <h1>SQUAD <span>REGISTRATION</span></h1>
                    </div>
                    <div className="lobby-tag">LOBBY #{lobbyId}</div>
                </header>

                <form onSubmit={handleSubmit} className="reg-form">
                    <div className="glass-section identity-box">
                        <div className="input-group">
                            <label>SQUAD NAME</label>
                            <input 
                                type="text" 
                                className="cyber-input"
                                placeholder="ENTER TEAM NAME..." 
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <h3 className="section-title">ROSTER IDENTIFICATION (IGNs)</h3>
                    <div className="roster-grid">
                        {players.map((player) => (
                            <div key={player.id} className="player-card">
                                <div className="card-content">
                                    <span className="player-label">{player.label}</span>
                                    <input 
                                        type="text" 
                                        placeholder="IGN REQUIRED"
                                        value={player.name}
                                        onChange={(e) => handlePlayerChange(player.id, e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="form-footer">
                        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                            CANCEL & GO BACK
                        </button>
                        <button type="submit" className="finalize-btn">
                            LOCK SQUAD & ENTER ROOM
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Rajdhani:wght@500;700&family=Syncopate:wght@700&display=swap');
                .reg-viewport { min-height: 100vh; background: #030305; color: #fff; font-family: 'Rajdhani', sans-serif; padding: 60px 20px; display: flex; justify-content: center; position: relative; overflow-x: hidden; }
                .ambient-glow { position: fixed; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(0, 210, 255, 0.08), transparent 50%); pointer-events: none; }
                .reg-container { width: 100%; max-width: 850px; position: relative; z-index: 2; }
                .reg-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
                .live-tag { font-family: 'Orbitron'; font-size: 0.6rem; color: #00d2ff; letter-spacing: 4px; display: block; margin-bottom: 10px; }
                h1 { font-family: 'Syncopate'; font-size: 1.8rem; margin: 0; letter-spacing: 1px; }
                h1 span { color: #00d2ff; text-shadow: 0 0 15px rgba(0,210,255,0.3); }
                .lobby-tag { background: rgba(0,210,255,0.1); color: #00d2ff; border: 1px solid #00d2ff; padding: 10px 20px; font-family: 'Orbitron'; font-size: 0.7rem; border-radius: 4px; font-weight: 900; }
                .section-title { font-family: 'Orbitron'; font-size: 0.8rem; color: #555; letter-spacing: 4px; margin: 50px 0 20px 0; text-align: center; }
                .glass-section { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); padding: 40px; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
                .input-group label { display: block; font-size: 0.7rem; color: #888; margin-bottom: 12px; font-family: 'Orbitron'; letter-spacing: 2px; }
                .cyber-input { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid #334155; padding: 20px; color: #fff; font-size: 1.3rem; border-radius: 4px; font-family: 'Orbitron'; transition: 0.3s; outline: none; }
                .cyber-input:focus { border-color: #00d2ff; box-shadow: 0 0 15px rgba(0,210,255,0.2); }
                .roster-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .player-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 8px; transition: 0.3s; }
                .player-card:hover { border-color: #00d2ff; transform: translateY(-3px); background: rgba(0, 210, 255, 0.02); }
                .player-label { font-family: 'Orbitron'; font-size: 0.6rem; color: #475569; display: block; margin-bottom: 15px; letter-spacing: 2px; }
                .player-card input { width: 100%; background: transparent; border: none; border-bottom: 1px solid #1e293b; padding: 10px 0; color: #fff; font-family: 'Orbitron'; font-size: 1rem; transition: 0.3s; outline: none; }
                .player-card input:focus { border-color: #00d2ff; }
                .form-footer { display: flex; gap: 20px; margin-top: 60px; }
                .finalize-btn { flex: 2; background: #00d2ff; color: #000; border: none; padding: 20px; font-family: 'Orbitron'; font-weight: 900; font-size: 0.9rem; border-radius: 4px; cursor: pointer; transition: 0.3s; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0% 100%); }
                .finalize-btn:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 0 20px rgba(0,210,255,0.4); }
                .back-btn { flex: 1; background: transparent; color: #475569; border: 1px solid #1e293b; padding: 20px; font-family: 'Orbitron'; font-weight: 900; font-size: 0.7rem; border-radius: 4px; cursor: pointer; transition: 0.3s; }
                .back-btn:hover { color: #fff; border-color: #fff; }
                @media (max-width: 600px) { .roster-grid { grid-template-columns: 1fr; } .form-footer { flex-direction: column-reverse; } h1 { font-size: 1.3rem; } }
            `}</style>
        </div>
    );
};

export default TeamRegistration;