import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useWallet from './hooks/useWallet';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import SwapPage from './components/swap/SwapPage';
import PoolPage from './components/pool/PoolPage';
import StatsPage from './components/stats/StatsPage';
import './styles/cyber.css';

function MainLayout({ wallet, signer, provider, connect }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Inisialisasi Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000508');
      tg.setBottomBarColor('#000508');

      // LOGIKA TOMBOL TELEGRAM (Satu Klik)
      if (!wallet) {
        tg.MainButton.setText("CONNECT TEQOIN WALLET");
        tg.MainButton.show();
        tg.MainButton.onClick(() => {
          // Arahkan ke bot untuk proses pairing
          tg.openTelegramLink("https://t.me/TeQoin_Wallet_Bot?start=connect_teqswap");
        });
      } else {
        tg.MainButton.hide();
      }
    }
  }, [wallet]); // Efek ini jalan setiap kali status 'wallet' berubah

  const currentPath = location.pathname.replace(/^\/|\/$/g, '');
  const activeTab = currentPath === '' ? 'swap' : currentPath;

  return (
    <div className="app-container">
      <TopBar 
        wallet={wallet} 
        onConnect={connect} 
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
  const { wallet, signer, provider, connect } = useWallet();

  return (
    <Router>
      <MainLayout 
        wallet={wallet} 
        signer={signer} 
        provider={provider} 
        connect={connect} 
      />
    </Router>
  );
}