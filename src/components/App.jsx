'use client';

import React from 'react';
import { SocketProvider, useSocket } from '../context/SocketContext';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MainView } from '../views/MainView';
import { QuestView } from '../views/QuestView';
import { ScanView } from '../views/ScanView';
import { RollingPaperView } from '../views/RollingPaperView';
import { MyProfileView } from '../views/MyProfileView';
import { PartnerProfileModal } from './PartnerProfileModal';
import { QRScannerModal } from './QRScannerModal';
import { HostControlModal } from './HostControlModal';

const AppContent = () => {
  const {
    activeTab,
    scannedPartner,
    setScannedPartner,
    isScannerOpen,
    setIsScannerOpen,
    isHostControlOpen,
    setIsHostControlOpen,
  } = useSocket();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <MainView />;
      case 'quests':
        return <QuestView />;
      case 'scan':
        return <ScanView />;
      case 'rolling':
        return <RollingPaperView />;
      case 'profile':
        return <MyProfileView />;
      default:
        return <MainView />;
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-md overflow-x-hidden bg-[#F7F9FC] font-sans text-slate-900 shadow-2xl shadow-black/20 flex flex-col select-none">
      {/* Mobile Top Status / App Header */}
      <Header />

      {/* Main Viewport Content */}
      <main className="flex-1 flex flex-col">
        {renderActiveView()}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Global Modals */}
      {/* 1. Partner Profile Card Modal (Triggered when QR is scanned) */}
      <PartnerProfileModal
        partner={scannedPartner}
        onClose={() => setScannedPartner(null)}
      />

      {/* 2. QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* 3. Host Control Center Modal */}
      <HostControlModal
        isOpen={isHostControlOpen}
        onClose={() => setIsHostControlOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
