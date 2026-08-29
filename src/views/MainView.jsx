'use client';

import React from 'react';
import { useSocket } from '../context/SocketContext';
import { HostPopupBanner } from '../components/HostPopupBanner';
import {
  ArrowRight,
  Gift,
  MessageCircleMore,
  QrCode,
  ScanLine,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMyProfile } from '../lib/supabase/useMyProfile';

const ProfileCopy = ({ eyebrow, profile, empty = false }) => (
  <div className="min-w-0 flex-1">
    <span className="text-[10px] font-black tracking-[0.18em] text-sky-500 uppercase">
      {eyebrow}
    </span>
    {empty ? (
      <>
        <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">
          아직 만난 사람이 없어요
        </h2>
        <p className="mt-2 max-w-[190px] text-xs font-medium leading-5 text-slate-500">
          상대방의 QR을 스캔하고 프로필을 대화의 첫 소재로 사용해 보세요.
        </p>
      </>
    ) : (
      <>
        <div className="mt-2 flex items-center gap-2">
          <h2 className="truncate text-xl font-black tracking-tight text-slate-900">
            {profile?.name || '게스트'}
          </h2>
          <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-600 ring-1 ring-inset ring-sky-100">
            {profile?.mbti || 'MBTI'}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 max-w-[205px] text-xs font-medium leading-5 text-slate-500">
          {profile?.bio || '한 줄 소개를 등록해 주세요.'}
        </p>
        {profile?.job && (
          <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
            {profile.job}
          </span>
        )}
      </>
    )}
  </div>
);

export const MainView = () => {
  const {
    guests,
    currentUser,
    scannedPartner,
    setIsScannerOpen,
    setActiveTab,
    missions,
  } = useSocket();

  const activeMission = missions.find(
    (mission) => !currentUser?.completedMissions?.includes(mission.id)
  );

  // PROF-02: 실제 Supabase profiles.id를 QR 값으로 쓰고, 부트스트랩 실패 시
  // 기존 Socket.IO currentUser.id 기반 표시로 폴백한다.
  const { profile: myQrProfile, ready: myQrReady } = useMyProfile(currentUser);
  const qrValue = myQrReady && myQrProfile ? myQrProfile.id : `party_guest:${currentUser?.id || 'guest'}`;

  return (
    <div className="flex flex-1 flex-col pb-28">
      <HostPopupBanner />

      <div className="space-y-4 px-4 pb-5 pt-3">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <div className="flex min-h-[188px] items-center gap-4 p-5">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name || '내 프로필'}
                className="h-16 w-16 shrink-0 rounded-[22px] border-4 border-sky-50 object-cover shadow-sm"
              />
              <ProfileCopy eyebrow="MY PROFILE" profile={currentUser} />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex h-[138px] w-[118px] shrink-0 flex-col items-center justify-center rounded-[22px] border border-sky-100 bg-sky-50/60 transition active:scale-95"
              aria-label="내 프로필 QR 자세히 보기"
            >
              <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-sky-100">
                <QRCodeSVG
                  value={qrValue}
                  size={78}
                  level="H"
                  fgColor="#0EA5E9"
                />
              </div>
              <span className="mt-2 text-[10px] font-black text-sky-600">내 QR 보여주기</span>
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
            <span className="text-[11px] font-semibold text-slate-500">
              QR을 보여주고 서로의 프로필을 교환해요
            </span>
            <QrCode className="h-4 w-4 text-sky-500" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <div className="flex min-h-[188px] items-center gap-4 p-5">
            {scannedPartner ? (
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <img
                  src={scannedPartner.avatar}
                  alt={scannedPartner.name}
                  className="h-16 w-16 shrink-0 rounded-[22px] border-4 border-violet-50 object-cover shadow-sm"
                />
                <ProfileCopy eyebrow="NEW CONNECTION" profile={scannedPartner} />
              </div>
            ) : (
              <ProfileCopy eyebrow="MEET SOMEONE" empty />
            )}

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex h-[138px] w-[118px] shrink-0 flex-col items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-lg shadow-slate-200 transition hover:bg-sky-600 active:scale-95"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <ScanLine className="h-8 w-8" />
              </span>
              <span className="mt-3 text-xs font-black">
                {scannedPartner ? '다른 사람 스캔' : 'QR 스캔하기'}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <MessageCircleMore className="h-4 w-4 text-violet-500" />
              {scannedPartner
                ? `${scannedPartner.name}님과 프로필을 소재로 대화해 보세요`
                : '처음 만난 사람과 QR로 가볍게 시작해요'}
            </span>
          </div>
        </section>

        <button
          type="button"
          onClick={() => setActiveTab('quests')}
          className="flex w-full items-center justify-between rounded-[22px] border border-sky-100 bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-sky-300 active:scale-[0.99]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
              <Gift className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <strong className="text-xs font-black text-sky-600">PICK</strong>
                <strong className="truncate text-xs font-black text-slate-900">
                  {activeMission?.title || '미션에 도전하고 보상 받으세요!'}
                </strong>
              </span>
              <span className="mt-1 block truncate text-[11px] font-medium text-slate-400">
                {activeMission?.reward
                  ? `완료 보상 · ${activeMission.reward}`
                  : '호스트가 미션을 띄우면 바로 참여할 수 있어요'}
              </span>
            </span>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>

        <div className="flex items-center justify-between px-1 pt-4">
          <span className="flex items-center gap-1.5 text-xs font-black text-slate-700">
            <Users className="h-4 w-4 text-sky-500" />
            지금 파티에 있는 사람들 ({guests.length}명)
          </span>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1 text-[11px] font-black text-sky-600"
          >
            QR 스캔하기 <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
