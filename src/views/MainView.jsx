'use client';

import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { HostPopupBanner } from '../components/HostPopupBanner';
import { QrCode, Sparkles, Heart, Zap, ChevronRight, Gift, Users, ShieldAlert, Award, Compass } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

export const MainView = () => {
  const {
    party,
    host,
    guests,
    currentUser,
    setIsScannerOpen,
    setActiveTab,
    setScannedPartner,
    missions,
  } = useSocket();

  const [activeSlide, setActiveSlide] = useState(0); // 0: Begines Style Preferences / Mission Card, 1: My Profile & QR Card, 2: Party Live Highlight Card

  const uncompletedMissions = missions.filter(
    (m) => !currentUser?.completedMissions?.includes(m.id)
  );

  return (
    <div className="flex-1 pb-24 flex flex-col">
      {/* 1. Host Notification Banner (Replicating the screenshot's top notice) */}
      <HostPopupBanner />

      {/* 2. Main Carousel / Center Card Area (Faithfully recreating the reference photo) */}
      <div className="px-4 py-2 flex-1 flex flex-col justify-between">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl p-6 shadow-mobile-card border border-begins-cardBorder flex flex-col justify-between min-h-[440px]"
        >
          {activeSlide === 0 ? (
            /* SLIDE 0: EXACT REFERENCE CARD (선호 스타일 & 파티 취향 탐색) */
            <>
              <div className="text-center pt-2">
                <h1 className="text-[19px] font-bold text-slate-900 leading-snug">
                  선호 스타일을 설정하면<br />
                  <span className="text-slate-900">내 취향에 맞는 상대를 만날 수 있어요</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-2">
                  당신의 인연을 만날 확률이 올라가요
                </p>
              </div>

              {/* Tag Chips Grid (Faithfully matching the visual pills in the user's photo) */}
              <div className="py-6 flex flex-wrap justify-center gap-2 max-w-[310px] mx-auto">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EBF3FB] text-[#3B82F6] border border-blue-100 flex items-center gap-1">
                  만 23~28세
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FCE8F3] text-[#E0287A] border border-pink-100 flex items-center gap-1">
                  📎 178~200cm
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F1F3F5] text-slate-600 border border-slate-200 flex items-center gap-1">
                  📍 25km 이내
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EBF9F1] text-[#10B981] border border-emerald-100 flex items-center gap-1">
                  ⛪ 기독교
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FEF8E7] text-[#D97706] border border-amber-100 flex items-center gap-1">
                  🧍 보통체형
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FDF0EC] text-[#EA580C] border border-orange-100 flex items-center gap-1">
                  ♨️ 비흡연
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F3E8FF] text-[#9333EA] border border-purple-100 flex items-center gap-1">
                  🍺 친구들 만날때만
                </span>
              </div>

              {/* Primary Action Button (Vibrant Sky Blue) */}
              <div>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-4 bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-sky-200 transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  <span>상대방 QR 스캔 & 매칭하기</span>
                </button>
              </div>
            </>
          ) : activeSlide === 1 ? (
            /* SLIDE 1: MY PROFILE & MY QR CARD */
            <>
              <div className="text-center pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-bold mb-2 border border-sky-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>내 프로필 & QR 명함</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {currentUser?.name} ({currentUser?.mbti})
                </h2>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  "{currentUser?.bio}"
                </p>
              </div>

              {/* My QR Code */}
              <div className="flex flex-col items-center justify-center my-3">
                <div className="p-3.5 bg-white rounded-2xl shadow-md border-2 border-sky-100">
                  <QRCodeSVG
                    value={`party_guest:${currentUser?.id}`}
                    size={140}
                    level="H"
                    includeMargin={false}
                    fgColor="#0EA5E9"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-2 font-medium">
                  상대방이 내 QR을 스캔하면 프로필이 교환됩니다
                </span>
              </div>

              {/* My Tags */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                {currentUser?.tags?.slice(0, 4).map((t, i) => (
                  <span key={i} className="px-2.5 py-0.8 text-[11px] font-semibold bg-sky-50 text-sky-700 rounded-full border border-sky-100">
                    {t}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('profile')}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-1.5"
              >
                <span>내 프로필 수정하기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* SLIDE 2: PARTY MISSIONS & LIVE HIGHLIGHT */
            <>
              <div className="text-center pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold mb-2">
                  <Zap className="w-3.5 h-3.5 fill-sky-600" />
                  <span>파티 하이 퀘스트</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  소외 없는 파티를 위한 미션 챌린지 🔥
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  남은 퀘스트 <span className="text-sky-600 font-bold">{uncompletedMissions.length}개</span> 도전 가능!
                </p>
              </div>

              <div className="space-y-2.5 my-3">
                {missions.slice(0, 2).map((m) => {
                  const isDone = currentUser?.completedMissions?.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                        isDone ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-sky-50/50 border-sky-100'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{m.title}</span>
                        <span className="text-[10px] text-sky-600 font-semibold">보상: {m.reward}</span>
                      </div>
                      <span className="font-bold text-sky-700">+{m.points}P</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setActiveTab('quests')}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold rounded-2xl shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-1.5"
              >
                <span>전체 퀘스트 확인 & 도전하기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Carousel Pagination Dots (Matching photo's 4-dot indicator) */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((dot) => (
              <button
                key={dot}
                onClick={() => setActiveSlide(dot)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeSlide === dot ? 'w-5 bg-sky-600' : 'w-1.5 bg-slate-200'
                }`}
                title={`슬라이드 ${dot + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* 3. Bottom Promotion / Event Banner (Replicating the screenshot's bottom PICK banner) */}
        <div
          onClick={() => setActiveTab('quests')}
          className="mt-3 bg-white rounded-2xl p-3 border border-begins-cardBorder flex items-center justify-between shadow-xs cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-black text-sm">
              <Gift className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-sky-600">PICK</span>
                <span className="text-xs font-bold text-slate-800">미션에 도전하고 보상 받으세요!</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500 text-white">
                  새로 생겼어요!
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                퀘스트를 완수하면 드링크 쿠폰과 리워드가 쏟아져요
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* 4. Quick Partner Discovery Strip */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2 px-1">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              <span>지금 파티에 있는 사람들 ({guests.length}명)</span>
            </span>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="text-sky-600 hover:underline text-[11px] font-semibold"
            >
              QR 스캔하기 →
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {guests.map((guest) => {
              const isMe = guest.id === currentUser?.id;
              const isScanned = currentUser?.scannedGuests?.includes(guest.id);

              return (
                <div
                  key={guest.id}
                  onClick={() => {
                    if (!isMe) {
                      setScannedPartner(guest);
                    }
                  }}
                  className={`shrink-0 w-24 p-2 rounded-2xl border text-center transition-all cursor-pointer hover:scale-105 ${
                    isMe
                      ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-500'
                      : isScanned
                      ? 'bg-white border-slate-200'
                      : 'bg-white border-dashed border-slate-300'
                  }`}
                >
                  <div className="relative w-12 h-12 mx-auto mb-1">
                    <img
                      src={guest.avatar}
                      alt={guest.name}
                      className="w-full h-full rounded-full object-cover border border-slate-100"
                    />
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded bg-slate-800 text-white">
                      {guest.mbti}
                    </span>
                  </div>
                  <span className="block text-xs font-bold text-slate-800 truncate">
                    {guest.name} {isMe && '(나)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {guest.job}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
