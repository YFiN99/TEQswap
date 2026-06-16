import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit'; // Gunakan ini untuk tombol connect
import { useAccount } from 'wagmi'; // Hooks untuk deteksi wallet
import BottomNav from './components/BottomNav';
import SwapPage from './components/swap/SwapPage';
import PoolPage from './components/pool/PoolPage';
import StatsPage from './components/stats/StatsPage';
import './styles/cyber.css';

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount(); // Menggantikan state wallet manual

  useEffect(() => {
    // Logika Telegram WebApp tetap bisa jalan di sini
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
  }, []);

  const activeTab = location.pathname.replace(/^\/|\/$/g, '') || 'swap';

  return (
    <div className="app-container">
      <header className="top-bar">
        {/* Tombol RainbowKit otomatis menangani semua wallet (Rabby, MetaMask, dll) */}
        <ConnectButton /> 
      </header>
      
      <main className="content">
        <Routes>
          <Route path="/" element={<SwapPage />} />
          <Route path="/pool" element={<PoolPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
      
      <BottomNav 
        active={activeTab} 
        onChange={(id) => navigate(id === 'swap' ? '/' : `/${id}`)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}