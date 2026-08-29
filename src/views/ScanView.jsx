'use client';

import React from 'react';
import { useSocket } from '../context/SocketContext';
import { QrCode, Sparkles, UserCheck, Users, Search, ChevronRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const ScanView = () => {
  const { guests, currentUser, setIsScannerOpen, setScannedPartner } = useSocket();

  const scannedIds = currentUser?.scannedGuests || [];
  const scannedList = guests.filter((g) => scannedIds.includes(g.id));
  const unscannedList = guests.filter((g) => g.id !== currentUser?.id && !scannedIds.includes(g.id));

  return (
    <div className="flex-1 pb-24 px-4 pt-3 flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
          <span>상대방 QR 스캔 & 파티 도감</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          파티원들의 QR을 스캔하여 상세 프로필과 대화 주제를 잠금 해제하세요!
        </p>
      </div>

      {/* Big Scanner Hero Button */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-950 rounded-3xl p-6 text-white shadow-xl mb-5 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-16 h-16 rounded-3xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-8 h-8" />
        </div>

        <h2 className="text-base font-bold mb-1">상대방 휴대폰 QR 인식 🧊</h2>
        <p className="text-xs text-slate-300 mb-4 max-w-[240px] mx-auto">
          상대방의 MY 탭에 있는 QR 코드를 비추면 즉시 인연 도감에 저장됩니다.
        </p>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <QrCode className="w-4 h-4" />
          <span>지금 QR 스캐너 열기</span>
        </button>
      </div>

      {/* Discovery Book (도감) */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3 px-1">
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>내가 스캔한 파티원 ({scannedList.length}명)</span>
          </span>
          <span className="text-[11px] text-slate-400">
            총 {guests.length - 1}명 중 {scannedList.length}명 완료
          </span>
        </div>

        {scannedList.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border border-slate-200 mb-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">아직 스캔한 파티원이 없습니다.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              위의 버튼을 눌러 첫 번째 인연을 스캔해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 mb-5">
            {scannedList.map((guest) => (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setScannedPartner(guest)}
                className="bg-white rounded-3xl p-3.5 border border-begins-cardBorder flex items-center justify-between shadow-xs hover:border-sky-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={guest.avatar}
                      alt={guest.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-100"
                    />
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500 text-white">
                      {guest.mbti}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900">{guest.name}</h4>
                      <span className="text-[10px] text-slate-400">{guest.job}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                      "{guest.bio}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] text-sky-600 font-semibold">카드보기</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Unmet Guests (아직 만나지 않은 파티원들) */}
        {unscannedList.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-400 mb-2 px-1">
              아직 만나지 않은 파티원 ({unscannedList.length}명)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {unscannedList.map((guest) => (
                <div
                  key={guest.id}
                  onClick={() => setIsScannerOpen(true)}
                  className="bg-slate-50/80 rounded-2xl p-3 border border-dashed border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-1.5 text-xs font-bold">
                    ?
                  </div>
                  <div className="text-xs font-bold text-slate-700">{guest.name}</div>
                  <span className="text-[10px] text-slate-400">{guest.mbti} · {guest.job}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
