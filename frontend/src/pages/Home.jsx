 import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="ultimate-home-viewport">
            {/* 🌌 Background Image with dark cinematic overlay */}
            <div className="hero-bg-image"></div>
            <div className="hero-vignette"></div>

            {/* 🛸 Floating Glass Navigation */}
            <header className="floating-header fade-in-down">
                <nav className="glass-nav">
                    <div className="nav-logo" onClick={() => navigate('/')}>
                        SCRIMS<span className="cyan-text">S</span>
                    </div>
                    
                    <div className="nav-links">
                        <button className="nav-btn active" onClick={() => navigate('/')}>HOME</button>
                        <button className="nav-btn" onClick={() => navigate('/dashboard')}>DASHBOARD</button>
                        <button className="nav-btn" onClick={() => navigate('/profile')}>PROFILE</button>
                    </div>
                    
                    <button className="login-btn" onClick={() => navigate('/login')}>LOGIN</button>
                </nav>
            </header>

            {/* ⚔️ Centered Minimalist Hero */}
            <main className="hero-center">
                <div className="hero-content">
                    
                    {/* Small Trusted Tagline */}
                    <div className="trusted-tag fade-in-up delay-1">
                        <span className="live-dot"></span>
                        🇮🇳 INDIA'S NO.1 TRUSTED DAILY SCRIMS PLATFORM
                    </div>

                    {/* Massive Clean Headline */}
                    <h1 className="main-headline fade-in-up delay-2">
                        WELCOME TO <br/>
                        THE <span className="cyan-text text-glow">ARENA</span>
                    </h1>

                    {/* Motivational Call to Action */}
                    <p className="hero-subtext fade-in-up delay-3">
                        START YOUR ESPORTS JOURNEY NOW.
                    </p>

                    {/* Sexy Enter Button */}
                    <div className="action-wrapper fade-in-up delay-4">
                        <button className="enter-arena-btn" onClick={() => navigate('/login')}>
                            <span className="btn-text">ENTER MATCHMAKING</span>
                            <span className="btn-arrow">➔</span>
                        </button>
                    </div>

                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&family=Syncopate:wght@700&display=swap');

                :root {
                    --cyan: #00d2ff;
                    --cyan-glow: rgba(0, 210, 255, 0.4);
                    --glass-bg: rgba(10, 10, 15, 0.4);
                    --glass-border: rgba(255, 255, 255, 0.1);
                }

                body { margin: 0; padding: 0; background: #030305; overflow-x: hidden; }

                .ultimate-home-viewport {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    color: #fff;
                    font-family: 'Rajdhani', sans-serif;
                }

                /* 🖼️ BACKGROUND EFFECTS */
                .hero-bg-image {
                    position: absolute;
                    inset: 0;
                    background: url('/background_homepage.jpeg') center/cover no-repeat;
                    z-index: 0;
                }
                
                /* Darkens the edges to make the center text pop */
                .hero-vignette {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, rgba(3,3,5,0.2) 0%, rgba(3,3,5,0.9) 100%), 
                                linear-gradient(to bottom, rgba(3,3,5,0.4) 0%, rgba(3,3,5,0.95) 100%);
                    z-index: 1;
                }

                /* 🛸 FLOATING NAVBAR */
                .floating-header {
                    position: fixed;
                    top: 30px;
                    left: 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    z-index: 50;
                    padding: 0 20px;
                    box-sizing: border-box;
                }

                .glass-nav {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    max-width: 1000px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid var(--glass-border);
                    border-radius: 50px;
                    padding: 10px 25px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }

                .nav-logo {
                    font-family: 'Syncopate', sans-serif;
                    font-size: 1.2rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    cursor: pointer;
                }
                
                .cyan-text { color: var(--cyan); }
                .text-glow { text-shadow: 0 0 20px var(--cyan-glow); }

                .nav-links {
                    display: flex;
                    gap: 30px;
                }

                .nav-btn {
                    background: none;
                    border: none;
                    color: #aaa;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 0.8rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .nav-btn:hover, .nav-btn.active { color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5); }

                .login-btn {
                    background: transparent;
                    color: var(--cyan);
                    border: 1px solid var(--cyan);
                    padding: 8px 20px;
                    border-radius: 30px;
                    font-family: 'Orbitron', sans-serif;
                    font-weight: 700;
                    font-size: 0.8rem;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .login-btn:hover {
                    background: var(--cyan);
                    color: #000;
                    box-shadow: 0 0 15px var(--cyan-glow);
                }

                /* ⚔️ CENTERED HERO CONTENT */
                .hero-center {
                    position: relative;
                    z-index: 10;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 0 20px;
                }

                .hero-content {
                    max-width: 800px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .trusted-tag {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(0, 210, 255, 0.1);
                    border: 1px solid rgba(0, 210, 255, 0.3);
                    padding: 8px 20px;
                    border-radius: 50px;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 3px;
                    color: var(--cyan);
                    margin-bottom: 25px;
                }

                .live-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--cyan);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--cyan);
                    animation: blink 1.5s infinite;
                }

                .main-headline {
                    font-family: 'Syncopate', sans-serif;
                    font-size: clamp(2.5rem, 6vw, 5rem);
                    font-weight: 700;
                    line-height: 1.1;
                    margin: 0;
                    letter-spacing: -1px;
                }

                /* ✅ NEW SUBTEXT CLASS */
                .hero-subtext {
                    font-family: 'Orbitron', sans-serif;
                    font-size: clamp(0.9rem, 2vw, 1.2rem);
                    color: #aaa;
                    letter-spacing: 4px;
                    margin: 25px 0 45px 0;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
                }

                .enter-arena-btn {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 18px 40px;
                    border-radius: 50px;
                    font-family: 'Orbitron', sans-serif;
                    font-weight: 900;
                    font-size: 1.1rem;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: 0.3s;
                    box-shadow: 0 10px 30px rgba(255,255,255,0.2);
                }

                .enter-arena-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 40px rgba(255,255,255,0.4);
                }

                .btn-arrow {
                    transition: 0.3s;
                }
                .enter-arena-btn:hover .btn-arrow {
                    transform: translateX(5px);
                }

                /* ✨ ANIMATIONS */
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

                .fade-in-down { animation: fadeInDown 0.8s ease-out forwards; }
                .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
                
                /* ✅ UPDATED ANIMATION TIMINGS */
                .delay-1 { animation-delay: 0.2s; }
                .delay-2 { animation-delay: 0.4s; }
                .delay-3 { animation-delay: 0.6s; }
                .delay-4 { animation-delay: 0.8s; }

                /* 📱 MOBILE RESPONSIVE */
                @media (max-width: 768px) {
                    .floating-header { top: 15px; }
                    .glass-nav { 
                        flex-wrap: wrap; 
                        justify-content: center; 
                        gap: 15px; 
                        border-radius: 20px; 
                        padding: 15px;
                    }
                    .nav-links { width: 100%; justify-content: center; gap: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;}
                    .login-btn { display: none; /* Hide top login button on very small screens to save space */ }
                    .trusted-tag { font-size: 0.6rem; padding: 6px 15px; text-align: center; }
                    .main-headline { font-size: 2.2rem; }
                    .hero-subtext { font-size: 0.7rem; letter-spacing: 2px; }
                    .enter-arena-btn { width: 100%; justify-content: center; padding: 15px 20px; font-size: 0.9rem;}
                }
            `}</style>
        </div>
    );
};

export default Home;