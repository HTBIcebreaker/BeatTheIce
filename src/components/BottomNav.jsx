'use client';

import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Home, HeartHandshake, QrCode, MessageSquareHeart, User, Sparkles } from 'lucide-react';

export const BottomNav = () => {
  const { activeTab, setActiveTab, missions, rollingPapers, currentUser } = useSocket();

  // Uncompleted missions count
  const uncompletedMissions = missions.filter(
    (m) => !currentUser?.completedMissions?.includes(m.id)
  ).length;

  const tabs = [
    {
      id: 'home',
      label: '홈',
      icon: Home,
    },
    {
      id: 'quests',
      label: 'PICK/미션',
      icon: HeartHandshake,
      badge: uncompletedMissions > 0 ? `${uncompletedMissions}` : null,
      subBadge: '새로 생겼어요!',
    },
    {
      id: 'scan',
      label: 'QR 스캔',
      icon: QrCode,
      isHighlight: true,
    },
    {
      id: 'rolling',
      label: '롤링페이퍼',
      icon: MessageSquareHeart,
      badge: rollingPapers.length > 0 ? `${rollingPapers.length}` : null,
    },
    {
      id: 'profile',
      label: 'MY',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-lg border-t border-begins-cardBorder py-1.5 px-3 z-40 shadow-nav flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isHighlight) {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative -top-3 flex flex-col items-center group"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sky-300/80 ring-4 ring-sky-100'
                    : 'bg-gradient-to-tr from-sky-500 to-sky-400 text-white shadow-sky-200'
                }`}
              >
                <Icon className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span
                className={`text-[11px] font-bold mt-0.5 tracking-tight ${
                  isActive ? 'text-sky-600' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-all"
          >
            {/* Notification Badge */}
            {tab.badge && (
              <span className="absolute top-0.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-bounce">
                {tab.badge}
              </span>
            )}

            <Icon
              className={`w-5 h-5 transition-transform duration-150 ${
                isActive
                  ? 'text-sky-500 stroke-[2.4] scale-110'
                  : 'text-slate-400 group-hover:text-slate-600 stroke-[1.8]'
              }`}
            />
            <span
              className={`text-[11px] mt-1 tracking-tight ${
                isActive ? 'font-bold text-sky-600' : 'font-medium text-slate-500'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
