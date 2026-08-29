import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Sparkles, Crown, Users, SlidersHorizontal, RefreshCw, UserCheck } from 'lucide-react';

export const Header = () => {
  const { party, host, guests, currentUser, setCurrentUserId, isHostMode, setIsHostMode, setIsHostControlOpen, connected } = useSocket();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-begins-cardBorder px-4 py-3 flex items-center justify-between">
      {/* Brand / Logo */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => window.location.reload()}>
          <span className="text-2xl font-black tracking-tight text-sky-500 flex items-center gap-1">
            <span>BeattheIce</span>
            <span className="text-lg">🧊</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200">
            Party
          </span>
        </div>
      </div>

      {/* Center status / Live indicator */}
      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-xs text-slate-600 font-medium">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-sky-500" />
          {guests.length}명 참여중
        </span>
      </div>

      {/* Right Controls: Host Control & User Switcher */}
      <div className="flex items-center gap-1.5">
        {/* Host Control Trigger */}
        <button
          onClick={() => {
            setIsHostMode(!isHostMode);
            if (!isHostMode) {
              setIsHostControlOpen(true);
            }
          }}
          className={`p-2 rounded-full transition-all flex items-center gap-1 text-xs font-semibold ${
            isHostMode
              ? 'bg-sky-600 text-white shadow-md shadow-sky-200'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="호스트 모드 전환"
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span className="hidden sm:inline">{isHostMode ? '호스트' : '게스트'}</span>
        </button>

        {/* Quick User Switcher dropdown for testing */}
        <div className="relative group">
          <button
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="테스트 유저 변경"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              게스트 전환 (테스트용)
            </div>
            {guests.map((g) => (
              <button
                key={g.id}
                onClick={() => setCurrentUserId(g.id)}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-sky-50 transition-colors ${
                  currentUser?.id === g.id ? 'font-bold text-sky-600 bg-sky-50/70' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img src={g.avatar} alt={g.name} className="w-5 h-5 rounded-full object-cover" />
                  <span>{g.name}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">
                  {g.mbti}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
