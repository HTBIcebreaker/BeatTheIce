'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Camera, QrCode, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyProfile } from '../lib/supabase/useMyProfile';
import { resolveScannedProfile, mapProfileToGuestView, ScanError } from '../lib/supabase/profile';

const SCAN_ERROR_MESSAGES = {
  SELF_SCAN: '내 QR은 스캔할 수 없어요.',
  NOT_PARTY_MEMBER: '같은 파티 참가자가 아닌 QR이에요.',
  PROFILE_NOT_FOUND: '프로필을 찾을 수 없어요.',
  INVALID_QR: '인식할 수 없는 QR이에요.',
};

export const QRScannerModal = ({ isOpen, onClose }) => {
  const { guests, currentUser, scanQRCode, setScannedPartner } = useSocket();
  const [scanMode, setScanMode] = useState('simulated'); // 'camera' or 'simulated'
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  // PROF-03: 카메라로 인식한 실제 Supabase QR을 검증하려면 현재 파티 id가 필요하다.
  const { party: myParty, ready: myProfileReady } = useMyProfile(currentUser);

  useEffect(() => {
    let scanner = null;
    if (isOpen && scanMode === 'camera') {
      const timer = setTimeout(() => {
        try {
          scanner = new Html5QrcodeScanner(
            'reader',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );
          scanner.render(
            async (decodedText) => {
              const cleanValue = decodedText.replace('party_guest:', '').trim();
              scanner.clear();
              setScanError('');

              // PROF-03: 실제 Supabase QR(profiles.id)이면 우선 그 값으로 검증하고,
              // 파티 부트스트랩이 아직 안 됐거나 옛 형식(레거시 guest id)이면
              // 기존 Socket.IO 스캔으로 폴백한다.
              if (myProfileReady && myParty) {
                try {
                  const profile = await resolveScannedProfile(cleanValue, myParty.id);
                  setScannedPartner(mapProfileToGuestView(profile));
                  onClose();
                  return;
                } catch (err) {
                  if (err instanceof ScanError) {
                    setScanError(SCAN_ERROR_MESSAGES[err.code] || err.message);
                    return;
                  }
                  console.warn('[p2p-qr] Supabase 스캔 검증 실패, 레거시 스캔으로 폴백:', err.message);
                }
              }

              await scanQRCode(cleanValue);
              onClose();
            },
            (error) => {
              // ignore frame read errors
            }
          );
        } catch (e) {
          console.error("Camera scanner initialization error:", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          try {
            scanner.clear();
          } catch (e) {}
        }
      };
    }
  }, [isOpen, scanMode]);

  if (!isOpen) return null;

  // Filter out current user from quick guest list
  const availableGuests = guests.filter((g) => g.id !== currentUser?.id);

  const handleSimulatedScan = async (guestId) => {
    setIsScanning(true);
    setTimeout(async () => {
      await scanQRCode(guestId);
      setIsScanning(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">상대방 QR 스캔하기 🧊</h3>
                <p className="text-[10px] text-slate-400">QR을 스캔하여 상대방의 프로필을 확인하세요</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="p-2 bg-slate-100 flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setScanMode('simulated')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                scanMode === 'simulated'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>간편 파티원 선택</span>
            </button>
            <button
              onClick={() => setScanMode('camera')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                scanMode === 'camera'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>카메라 QR 스캔</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto flex-1">
            {scanMode === 'camera' ? (
              <div className="flex flex-col items-center">
                <div id="reader" className="w-full rounded-2xl overflow-hidden border border-slate-200"></div>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  상대방 휴대폰의 MY 화면 QR 코드를 카메라 정면에 비춰주세요.
                </p>
                {scanError && (
                  <div className="mt-2 w-full flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                  <span>현장 파티원 목록 ({availableGuests.length}명)</span>
                  <span className="text-sky-600 font-semibold">탭하여 스캔 시뮬레이션</span>
                </div>

                {availableGuests.map((guest) => {
                  const isAlreadyScanned = currentUser?.scannedGuests?.includes(guest.id);

                  return (
                    <button
                      key={guest.id}
                      onClick={() => handleSimulatedScan(guest.id)}
                      disabled={isScanning}
                      className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] ${
                        isAlreadyScanned
                          ? 'bg-slate-50/80 border-slate-200 text-slate-700'
                          : 'bg-gradient-to-r from-sky-50/40 to-blue-50/40 border-sky-100 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={guest.avatar}
                          alt={guest.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{guest.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-50 text-sky-600 font-bold border border-sky-200">
                              {guest.mbti}
                            </span>
                            <span className="text-[10px] text-slate-400">{guest.job}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                            {guest.bio}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-xs">
                        {isAlreadyScanned ? (
                          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <UserCheck className="w-3 h-3" />
                            <span>도감등록</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-white bg-sky-500 px-2.5 py-1 rounded-full shadow-xs">
                            스캔 ⚡
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
