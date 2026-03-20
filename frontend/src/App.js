 import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Lobby from './pages/Lobby';
import MatchRoom from './pages/MatchRoom';
import HostPanel from './pages/HostPanel';
import Wallet from './pages/Wallet';
import AdminPanel from './pages/AdminPanel';
import TeamRegistration from './pages/TeamRegistration';

function App() {
  return (
    <Router>
      <Routes>
        {/* Entry & Auth */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* Main Hub */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wallet" element={<Wallet />} />
        
        {/* 🎮 Game Lobbies (Both use the same Lobby.js file) */}
        <Route path="/freefire" element={<Lobby />} />
        <Route path="/bgmi" element={<Lobby />} />
        
        {/* Match Handling */}
        <Route path="/match/:id" element={<MatchRoom />} />
        <Route path="/host/:id" element={<HostPanel />} />
        <Route path="/register-team/:lobbyId" element={<TeamRegistration />} />

        {/* Administration */}
        <Route path="/scrims-admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;