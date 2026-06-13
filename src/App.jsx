import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useWallet from './hooks/useWallet';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import SwapPage from './components/swap/SwapPage';
import PoolPage from './components/pool/PoolPage';
import StatsPage from './components/stats/StatsPage';
import './styles/cyber.css';

function MainLayout({ wallet, signer, provider, connectWallet }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Inisialisasi Telegram Mini App
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand(); // Paksa aplikasi jadi full screen
      tg.setHeaderColor('#000508'); // Warna header sesuai tema
      tg.setBottomBarColor('#000508'); // Warna bottom bar
    }
  }, []);

  const currentPath = location.pathname.replace(/^\/|\/$/g, '');
  const activeTab = currentPath === '' ? 'swap' : currentPath;

  return (
    <div className="app-container">
      <TopBar 
        wallet={wallet} 
        onConnect={connectWallet} 
      />

      <main className="content">
        <Routes>
          <Route path="/" element={<SwapPage wallet={wallet} signer={signer} provider={provider} />} />
          <Route path="/pool" element={<PoolPage wallet={wallet} signer={signer} provider={provider} />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={<SwapPage wallet={wallet} signer={signer} provider={provider} />} />
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
  const { wallet, signer, provider, connectWallet } = useWallet();

  return (
    <Router>
      <MainLayout 
        wallet={wallet} 
        signer={signer} 
        provider={provider} 
        connectWallet={connectWallet} 
      />
    </Router>
  );
}