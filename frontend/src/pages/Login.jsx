  import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🚀 THE REAL BACKEND CONNECTION (Untouched)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        const endpoint = isLogin ? '/api/login' : '/api/register';
        const payload = isLogin 
            ? { email: formData.email, password: formData.password } 
            : formData;

        try {
            const response = await fetch(`https://scrims-s.onrender.com${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                setErrorMsg(data.message || 'Authentication failed');
            }
        } catch (err) {
            setErrorMsg('Server offline. Tactical uplink failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-viewport">
            {/* 🌌 Cinematic Background */}
            <div className="auth-bg-image"></div>
            <div className="auth-vignette"></div>
            <div className="scanline-overlay"></div>

            {/* Top Navigation */}
            <nav className="auth-nav">
                <div className="nav-brand" onClick={() => navigate('/')}>
                    SCRIMS<span className="cyan-text">S</span>
                </div>
                <button className="back-btn" onClick={() => navigate('/')}>
                    <span>←</span> RETURN TO BASE
                </button>
            </nav>

            <main className="auth-center">
                <div className="auth-container fade-in-up">
                    
                    {/* 🗡️ LEFT PANEL: BRANDING & TEXT */}
                    <div className="auth-branding">
                        <div className="branding-content">
                            <div className="live-pulse">
                                <span className="pulse-dot"></span>
                                SECURE TERMINAL
                            </div>
                            
                            <h1 className="brand-title">
                                {isLogin ? 'WELCOME BACK,' : 'JOIN THE'} <br />
                                <span className="cyan-text text-glow">
                                    {isLogin ? 'COMMANDER.' : 'ELITE.'}
                                </span>
                            </h1>
                            
                            <p className="brand-desc">
                                {isLogin 
                                    ? "Authorize your credentials to access the war room. Daily high-stakes lobbies and instant extractions await."
                                    : "Create your tactical profile. Build your squad, dominate the leaderboards, and secure your vault."
                                }
                            </p>

                            <div className="feature-list">
                                <div className="f-item"><span>🛡️</span> Military-Grade Anti-Cheat</div>
                                <div className="f-item"><span>⚡</span> Instant UPI Payouts</div>
                                <div className="f-item"><span>🎮</span> Daily Verified Scrims</div>
                            </div>
                        </div>
                    </div>

                    {/* 🔐 RIGHT PANEL: FORM */}
                    <div className="auth-form-section">
                        <div className="form-header">
                            <h2 className="form-title">{isLogin ? 'SYSTEM LOGIN' : 'ENLISTMENT FORM'}</h2>
                            <p className="form-subtitle">
                                {isLogin ? 'Enter your parameters to sync.' : 'Initialize your new identity.'}
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="error-box">
                                <span className="error-icon">⚠️</span>
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            {!isLogin && (
                                <div className="input-group">
                                    <label>OPERATIVE DESIGNATION</label>
                                    <input 
                                        type="text" name="username" placeholder="Enter Gamer Tag" 
                                        onChange={handleChange} required={!isLogin} 
                                        className="cyber-input"
                                    />
                                </div>
                            )}
                            
                            <div className="input-group">
                                <label>COMMUNICATION LINK (EMAIL)</label>
                                <input 
                                    type="email" name="email" placeholder="agent@squad.com" 
                                    onChange={handleChange} required 
                                    className="cyber-input"
                                />
                            </div>
                            
                            <div className="input-group">
                                <label>SECURITY ENCRYPTION (PASSWORD)</label>
                                <input 
                                    type="password" name="password" placeholder="••••••••" 
                                    onChange={handleChange} required 
                                    className="cyber-input"
                                />
                            </div>

                            <button type="submit" className="cyber-btn-solid" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="loader-text">SYNCING DATA...</span>
                                ) : (
                                    <>
                                        <span className="btn-text">{isLogin ? 'AUTHORIZE ACCESS' : 'INITIALIZE ACCOUNT'}</span>
                                        <span className="btn-arrow">➔</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-toggle">
                            <p>
                                {isLogin ? "No active profile? " : "Already enlisted? "}
                                <span className="toggle-link" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
                                    {isLogin ? 'Register here.' : 'Login here.'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&family=Syncopate:wght@700&display=swap');

                :root {
                    --cyan: #00d2ff;
                    --cyan-glow: rgba(0, 210, 255, 0.4);
                    --glass-dark: rgba(10, 10, 15, 0.8);
                    --glass-light: rgba(22, 24, 31, 0.6);
                    --border-color: rgba(255, 255, 255, 0.08);
                    --red-alert: #ff4655;
                }

                body { margin: 0; padding: 0; background: #030305; overflow-x: hidden; }

                .auth-viewport {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    color: #fff;
                    font-family: 'Rajdhani', sans-serif;
                }

                /* 🖼️ BACKGROUND EFFECTS */
                .auth-bg-image { position: absolute; inset: 0; background: url('/background_homepage.jpeg') center/cover no-repeat; z-index: 0; opacity: 0.5; filter: grayscale(0.5) contrast(1.2); }
                .auth-vignette { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(3,3,5,0.4) 0%, rgba(3,3,5,0.95) 100%); z-index: 1; }
                .scanline-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.2) 50%); background-size: 100% 4px; z-index: 2; pointer-events: none; opacity: 0.5; }

                /* 🛸 NAV */
                .auth-nav { position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 20px 5%; }
                .nav-brand { font-family: 'Syncopate', sans-serif; font-size: 1.5rem; font-weight: 700; letter-spacing: 2px; cursor: pointer; text-shadow: 0 0 20px rgba(0,0,0,0.8); }
                .cyan-text { color: var(--cyan); }
                .text-glow { text-shadow: 0 0 20px var(--cyan-glow); }
                
                .back-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: #aaa; padding: 8px 20px; border-radius: 4px; font-family: 'Orbitron'; font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: 0.3s; display: flex; gap: 8px; align-items: center; }
                .back-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

                /* ⚔️ CENTER CONTENT */
                .auth-center { position: relative; z-index: 10; flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
                
                .auth-container { 
                    display: flex; 
                    width: 100%; 
                    max-width: 1000px; 
                    background: var(--glass-light); 
                    backdrop-filter: blur(20px); 
                    border: 1px solid var(--border-color); 
                    border-radius: 20px; 
                    overflow: hidden; 
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5); 
                }

                /* 🗡️ LEFT PANEL (BRANDING) */
                .auth-branding { flex: 1; background: var(--glass-dark); padding: 50px 40px; display: flex; flex-direction: column; justify-content: center; border-right: 1px solid var(--border-color); }
                
                .live-pulse { display: flex; align-items: center; gap: 10px; font-family: 'Orbitron'; font-size: 0.7rem; color: var(--cyan); letter-spacing: 3px; margin-bottom: 30px; }
                .pulse-dot { width: 6px; height: 6px; background: var(--cyan); border-radius: 50%; box-shadow: 0 0 10px var(--cyan); animation: blink 1.5s infinite; }
                
                .brand-title { font-family: 'Syncopate', sans-serif; font-size: 2.2rem; font-weight: 700; line-height: 1.2; margin: 0 0 20px 0; }
                .brand-desc { font-family: 'Rajdhani'; font-size: 1.1rem; color: #aaa; line-height: 1.6; margin-bottom: 40px; }
                
                .feature-list { display: flex; flex-direction: column; gap: 15px; }
                .f-item { display: flex; align-items: center; gap: 12px; font-family: 'Orbitron'; font-size: 0.8rem; color: #ddd; letter-spacing: 1px; }

                /* 🔐 RIGHT PANEL (FORM) */
                .auth-form-section { flex: 1; padding: 50px 40px; display: flex; flex-direction: column; justify-content: center; background: rgba(0,0,0,0.2); }
                
                .form-header { margin-bottom: 30px; }
                .form-title { font-family: 'Orbitron'; font-size: 1.5rem; margin: 0 0 5px 0; letter-spacing: 2px; }
                .form-subtitle { font-family: 'Rajdhani'; font-size: 1rem; color: #888; margin: 0; }

                .error-box { display: flex; align-items: center; gap: 10px; background: rgba(255, 70, 85, 0.1); border-left: 3px solid var(--red-alert); color: var(--red-alert); padding: 12px 15px; font-family: 'Orbitron'; font-size: 0.8rem; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
                
                .auth-form { display: flex; flex-direction: column; gap: 20px; }
                .input-group { display: flex; flex-direction: column; gap: 8px; }
                .input-group label { font-family: 'Orbitron'; font-size: 0.65rem; color: #888; letter-spacing: 2px; }
                
                .cyber-input { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); color: #fff; padding: 15px; border-radius: 6px; font-family: 'Rajdhani'; font-size: 1.1rem; outline: none; transition: 0.3s; box-sizing: border-box;}
                .cyber-input:focus { border-color: var(--cyan); box-shadow: 0 0 15px rgba(0, 210, 255, 0.1); background: rgba(0, 210, 255, 0.02); }

                .cyber-btn-solid { display: flex; justify-content: center; align-items: center; gap: 10px; background: var(--cyan); color: #000; border: none; padding: 16px; border-radius: 6px; font-family: 'Orbitron'; font-weight: 900; font-size: 1rem; letter-spacing: 2px; cursor: pointer; transition: 0.3s; margin-top: 10px; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
                .cyber-btn-solid:hover:not(:disabled) { background: #fff; transform: translateY(-2px); box-shadow: 0 10px 20px var(--cyan-glow); }
                .cyber-btn-solid:disabled { background: #444; color: #888; cursor: not-allowed; }
                
                .btn-arrow { transition: 0.3s; }
                .cyber-btn-solid:hover:not(:disabled) .btn-arrow { transform: translateX(5px); }
                .loader-text { animation: pulseOpacity 1s infinite; }

                .auth-toggle { margin-top: 30px; text-align: center; font-family: 'Rajdhani'; font-size: 1rem; color: #888; border-top: 1px solid var(--border-color); padding-top: 20px;}
                .toggle-link { color: var(--cyan); font-family: 'Orbitron'; font-weight: 700; cursor: pointer; transition: 0.3s; margin-left: 5px; }
                .toggle-link:hover { color: #fff; text-shadow: 0 0 10px var(--cyan); }

                /* ✨ ANIMATIONS */
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
                @keyframes pulseOpacity { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

                /* 📱 MOBILE RESPONSIVE */
                @media (max-width: 900px) {
                    .auth-container { flex-direction: column; }
                    .auth-branding { padding: 40px 30px; border-right: none; border-bottom: 1px solid var(--border-color); }
                    .brand-title { font-size: 1.8rem; }
                    .auth-form-section { padding: 40px 30px; }
                }
                
                @media (max-width: 480px) {
                    .auth-nav { padding: 15px; }
                    .auth-center { padding: 20px 15px; }
                    .feature-list { display: none; /* Hide features on very small phones to save space */ }
                }
            `}</style>
        </div>
    );
};

export default Login;