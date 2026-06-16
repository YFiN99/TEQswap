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

      // Membaca wallet dari query string jika diarahkan dari bot
      const params = new URLSearchParams(window.location.search);
      const walletFromBot = params.get("wallet");
      if (walletFromBot) {
        localStorage.setItem("teqoin_wallet", walletFromBot);
      }
    }
  }, []);

  const activeTab = location.pathname.replace(/^\/|\/$/g, '') || 'swap';

  return (
    <div className="app-container">
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
  const { wallet, signer, provider, connectTelegram, connectBrowser } = useWallet();

  const handleConnectClick = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    const isTelegramMiniApp = tg && tg.initDataUnsafe?.user;

    if (isTelegramMiniApp && !wallet) {
      const useBot = window.confirm(
        "Pilih metode:\n\nOK: Gunakan TeQoin Wallet Bot\nCANCEL: Buka di Browser (MetaMask/Rabby)"
      );

      if (useBot) {
        connectTelegram();
      } else {
        // Membuka di browser eksternal agar wallet ekstensi bisa diakses
        tg.openLink("https://teqswap.vercel.app");
      }
    } else {
      // Jika di browser atau sudah terhubung, panggil connectBrowser
      if (typeof connectBrowser === 'function') {
        connectBrowser();
      }
    }
  }, [connectTelegram, connectBrowser, wallet]);

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