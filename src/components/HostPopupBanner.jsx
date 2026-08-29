'use client';

import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Bell, Zap, Trophy, MessageCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HostPopupBanner = () => {
  const { popups, latestPopup, setLatestPopup, setActiveTab, setIsHostControlOpen, isHostMode } = useSocket();
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activePopups = popups.length > 0 ? popups : [
    {
      id: 'default_popup',
      type: 'mission',
      title: '새로운 미션',
      highlight: '12시, 18시, 21시',
      message: '새로운 미션이 12시, 18시, 21시에 찾아와요!',
      actionText: '미션 보기',
    }
  ];

  const current = activePopups[currentIndex % activePopups.length];

  if (isDismissed || !current) return null;

  // Type-based style configuration
  const getTypeBadge = (type) => {
    switch (type) {
      case 'mission':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />,
          bgColor: 'bg-amber-50 border-amber-200/80',
          textColor: 'text-amber-900',
          highlightColor: 'text-begins-pink font-bold',
          badge: '🚨 게릴라 미션',
        };
      case 'result':
        return {
          icon: <Trophy className="w-3.5 h-3.5 text-yellow-600 fill-yellow-500" />,
          bgColor: 'bg-purple-50 border-purple-200/80',
          textColor: 'text-purple-900',
          highlightColor: 'text-purple-700 font-bold',
          badge: '🏆 결과 발표',
        };
      default:
        return {
          icon: <Bell className="w-3.5 h-3.5 text-sky-500" />,
          bgColor: 'bg-sky-50/80 border-sky-200/90',
          textColor: 'text-slate-700',
          highlightColor: 'text-sky-600 font-bold',
          badge: '호스트 공지',
        };
    }
  };

  const config = getTypeBadge(current.type);

  const handleClickBanner = () => {
    if (current.type === 'mission') {
      setActiveTab('quests');
    } else if (current.type === 'result') {
      setActiveTab('quests');
    } else if (isHostMode) {
      setIsHostControlOpen(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="px-4 pt-3 pb-1"
      >
        <div
          onClick={handleClickBanner}
          className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl border ${config.bgColor} shadow-sm transition-all cursor-pointer hover:shadow-md`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-6">
            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-white shadow-xs">
              {config.icon}
            </div>

            <div className="text-xs text-slate-800 leading-snug truncate">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-500">
                  <span>{config.badge}</span>
                  {current.timestamp && <span className="text-[10px] text-slate-400 font-normal">· {current.timestamp}</span>}
                </div>
                <span className="truncate font-semibold text-slate-800">
                  {current.message}
                </span>
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (activePopups.length > 1) {
                setCurrentIndex((prev) => prev + 1);
              } else {
                setIsDismissed(true);
              }
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
            title="닫기 / 다음 공지"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
