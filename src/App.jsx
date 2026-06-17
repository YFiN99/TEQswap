import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConnectButton, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// Import konfigurasi yang kita buat tadi
import { config } from './config/wagmi';

import BottomNav from './components/BottomNav';
import SwapPage from './components/swap/SwapPage';
import PoolPage from './components/pool/PoolPage';
import StatsPage from './components/stats/StatsPage';
import './styles/cyber.css';

const queryClient = new QueryClient();

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor(tg.themeParams.secondary_bg_color || "#000000");
    }
  }, []);

  const activeTab = location.pathname.replace(/^\/|\/$/g, '') || 'swap';

  return (
    <div className="app-container">
      <header className="top-bar">
        <ConnectButton accountStatus="address" showBalance={false} />
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Router>
            <MainLayout />
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}