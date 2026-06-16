import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useWallet from './hooks/useWallet';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import SwapPage from './components/swap/SwapPage';
import PoolPage from './components/pool/PoolPage';
import StatsPage from './components/stats/StatsPage';
import './styles/cyber.css';

function MainLayout({ wallet, signer, provider, onConnectWallet }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.MainButton.hide();

      const params = new URLSearchParams(window.location.search);
      const walletFromBot = params.get("wallet");
      if (walletFromBot) {
        localStorage.setItem("teqoin_wallet", walletFromBot);
        window.location.href = "/"; 
      }
    }
  }, []);

  const currentPath = location.pathname.replace(/^\/|\/$/g, '');
  const activeTab = currentPath === '' ? 'swap' : currentPath;

  return (
    <div className="app-container">
      {/* Kirim fungsi onConnectWallet langsung ke TopBar */}
      <TopBar wallet={wallet} onConnect={onConnectWallet} />

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

  // Bungkus logika koneksi dalam useCallback agar stabil
  const handleConnectClick = useCallback(() => {
    const isTelegramMiniApp = window.Telegram?.WebApp && window.Telegram.WebApp.initDataUnsafe?.user;

    if (isTelegramMiniApp) {
      const useBot = window.confirm(
        "Pilih metode koneksi:\n\n" +
        "OK: Gunakan TeQoin Wallet Bot (Telegram)\n" +
        "CANCEL: Buka di Browser (Untuk MetaMask, OKX, Rabby)"
      );

      if (useBot) {
        const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
        window.Telegram.WebApp.openTelegramLink(`https://t.me/TeQoin_Wallet_Bot?start=auth_${userId}`);
      } else {
        window.Telegram.WebApp.openLink("https://teqswap.vercel.app");
      }
    } else {
      // Pastikan 'connect' adalah fungsi dari useWallet()
      if (typeof connect === 'function') {
        connect();
      } else {
        console.error("Fungsi 'connect' tidak tersedia di useWallet()");
      }
    }
  }, [connect]);

  return (
    <Router>
      <MainLayout 
        wallet={wallet} 
        signer={signer} 
        provider={provider} 
        onConnectWallet={handleConnectClick} 
      />
    </Router>
  );
}