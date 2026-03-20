import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch('https://scrims-s.onrender.com/api/leaderboard');
                const data = await response.json();
                setPlayers(data);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="lb-viewport">
            <nav className="dash-nav">
                <h2 onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>SCRIMS<span>S</span></h2>
                <button onClick={() => navigate('/dashboard')} className="nav-link">BACK TO ARENA</button>
            </nav>

            <div className="lb-content">
                <div className="lb-header">
                    <h1 className="neon-text">HALL OF <span>FAME</span></h1>
                    <p>THE TOP 10 HIGHEST EARNERS ON SCRIMS S</p>
                </div>

                {isLoading ? (
                    <div className="loader">CALCULATING RANKINGS...</div>
                ) : (
                    <div className="lb-container glass-panel">
                        <div className="table-header">
                            <span>RANK</span>
                            <span>GAMER</span>
                            <span>TOTAL EARNINGS</span>
                        </div>

                        {players.map((player, index) => (
                            <div key={index} className={`lb-row rank-${index + 1}`}>
                                <div className="rank-col">
                                    <span className="rank-num">#{index + 1}</span>
                                    {index < 3 && <span className="medal">🏆</span>}
                                </div>
                                <div className="user-col">
                                    <div className="mini-avatar"></div>
                                    <span className="username">{player.username.toUpperCase()}</span>
                                </div>
                                <div className="prize-col">
                                    ₹{parseFloat(player.total_earnings).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .lb-viewport { min-height: 100vh; background: #050505; color: #fff; font-family: 'Rajdhani', sans-serif; }
                .dash-nav { padding: 20px 50px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
                .dash-nav span { color: #00d2ff; }
                .nav-link { background: none; border: 1px solid #444; color: #fff; padding: 10px 20px; font-family: 'Orbitron'; cursor: pointer; transition: 0.3s; }
                .nav-link:hover { border-color: #00d2ff; color: #00d2ff; }

                .lb-content { max-width: 900px; margin: 0 auto; padding: 50px 20px; }
                .lb-header { text-align: center; margin-bottom: 50px; }
                .neon-text { font-family: 'Syncopate', sans-serif; font-size: 3rem; margin: 0; letter-spacing: 5px; }
                .neon-text span { color: #00d2ff; text-shadow: 0 0 20px #00d2ff; }
                .lb-header p { font-family: 'Orbitron'; color: #666; font-size: 0.9rem; margin-top: 10px; letter-spacing: 2px; }

                .glass-panel { background: rgba(15,15,15,0.8); border: 1px solid #222; border-radius: 10px; overflow: hidden; }
                .table-header { display: flex; padding: 20px 30px; background: #000; font-family: 'Orbitron'; font-size: 0.75rem; color: #444; letter-spacing: 2px; }
                .table-header span:nth-child(1) { width: 80px; }
                .table-header span:nth-child(2) { flex: 1; }
                .table-header span:nth-child(3) { width: 150px; text-align: right; }

                .lb-row { display: flex; align-items: center; padding: 25px 30px; border-bottom: 1px solid #111; transition: 0.3s; }
                .lb-row:hover { background: rgba(255,255,255,0.02); }
                
                .rank-col { width: 80px; display: flex; align-items: center; gap: 10px; }
                .rank-num { font-family: 'Orbitron'; font-weight: 900; font-size: 1.2rem; color: #444; }
                
                .user-col { flex: 1; display: flex; align-items: center; gap: 15px; }
                .mini-avatar { width: 40px; height: 40px; background: #222; border-radius: 50%; border: 1px solid #333; }
                .username { font-family: 'Syncopate'; font-weight: bold; font-size: 1.1rem; letter-spacing: 1px; }

                .prize-col { width: 150px; text-align: right; font-family: 'Orbitron'; font-weight: 900; font-size: 1.3rem; color: #00ff00; }

                /* Rank-Specific Highlights */
                .rank-1 { border-left: 4px solid #ffae00; background: linear-gradient(90deg, rgba(255,174,0,0.05) 0%, transparent 100%); }
                .rank-1 .rank-num { color: #ffae00; }
                .rank-2 { border-left: 4px solid #c0c0c0; }
                .rank-2 .rank-num { color: #c0c0c0; }
                .rank-3 { border-left: 4px solid #cd7f32; }
                .rank-3 .rank-num { color: #cd7f32; }

                .loader { text-align: center; font-family: 'Orbitron'; color: #00d2ff; padding: 50px; letter-spacing: 5px; }

                @media (max-width: 600px) {
                    .username { font-size: 0.9rem; }
                    .prize-col { font-size: 1rem; }
                }
            `}</style>
        </div>
    );
};

export default Leaderboard;