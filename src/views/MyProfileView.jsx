'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import { Sparkles, Edit3, Check, Crown, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMyProfile } from '../lib/supabase/useMyProfile';
import { updateMyProfile } from '../lib/supabase/profile';

export const MyProfileView = () => {
  const { currentUser, updateGuestProfile, triggerConfetti, isHostMode, setIsHostControlOpen } = useSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // PROF-02: 실제 Supabase profiles.id를 QR 값으로 쓰고, 부트스트랩 실패 시
  // 기존 Socket.IO currentUser.id 기반 표시로 폴백한다.
  const { profile: myQrProfile, ready: myQrReady, error: profileError } = useMyProfile(currentUser);
  const qrValue = myQrReady && myQrProfile ? myQrProfile.id : `party_guest:${currentUser?.id || 'guest'}`;
  const shownUser = currentUser
    ? {
        ...currentUser,
        name: myQrProfile?.name || currentUser.name,
        mbti: myQrProfile?.mbti || currentUser.mbti,
        bio: myQrProfile?.intro || currentUser.bio,
        avatar: myQrProfile?.avatar_url || currentUser.avatar,
      }
    : myQrProfile
      ? {
          id: myQrProfile.id,
          name: myQrProfile.name,
          mbti: myQrProfile.mbti || '',
          bio: myQrProfile.intro || '',
          avatar: myQrProfile.avatar_url || 'https://api.dicebear.com/9.x/thumbs/svg?seed=BeatTheIce',
          tags: [myQrProfile.mbti].filter(Boolean),
          icebreakerQuestion: '오늘 가장 기대되는 순간은?',
          icebreakerAnswer: '새로운 사람과 편하게 대화하는 순간',
        }
      : null;

  // Edit fields
  const [name, setName] = useState(currentUser?.name || '');
  const [mbti, setMbti] = useState(currentUser?.mbti || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [job, setJob] = useState(currentUser?.job || '');
  const [age, setAge] = useState(currentUser?.age || '만 25세');
  const [drinkStyle, setDrinkStyle] = useState(currentUser?.drinkStyle || '소주 1병');
  const [smoking, setSmoking] = useState(currentUser?.smoking || '비흡연');
  const [iceQ, setIceQ] = useState(currentUser?.icebreakerQuestion || '내가 요즘 제일 꽂혀있는 것은?');
  const [iceA, setIceA] = useState(currentUser?.icebreakerAnswer || '주말 카페 투어');

  useEffect(() => {
    if (!currentUser || isEditing) return;
    setName(currentUser.name || '');
    setMbti(currentUser.mbti || '');
    setBio(currentUser.bio || '');
    setJob(currentUser.job || '');
    setAge(currentUser.age || '만 25세');
    setDrinkStyle(currentUser.drinkStyle || '소주 1병');
    setSmoking(currentUser.smoking || '비흡연');
    setIceQ(currentUser.icebreakerQuestion || '내가 요즘 제일 꽂혀있는 것은?');
    setIceA(currentUser.icebreakerAnswer || '주말 카페 투어');
  }, [currentUser, isEditing]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shownUser) return;

    const updatedTags = [age, mbti, drinkStyle, smoking, job];

    setSaveError('');
    setIsSaving(true);
    const payload = {
      name: name.trim(),
      mbti: mbti.trim().toUpperCase(),
      bio: bio.trim(),
      job: job.trim(),
      age: age.trim(),
      drinkStyle: drinkStyle.trim(),
      smoking: smoking.trim(),
      tags: updatedTags.filter(Boolean),
      icebreakerQuestion: iceQ.trim(),
      icebreakerAnswer: iceA.trim(),
    };
    let result = { success: true };
    if (currentUser) result = await updateGuestProfile(payload);
    if (myQrReady) {
      try {
        await updateMyProfile({ ...payload, avatar: shownUser.avatar });
      } catch (error) {
        setIsSaving(false);
        setSaveError(`Supabase 저장 실패: ${error.message}`);
        return;
      }
    }
    setIsSaving(false);
    if (!result?.success) {
      setSaveError(result?.message || '저장하지 못했습니다.');
      return;
    }
    setIsEditing(false);
    triggerConfetti({ particleCount: 60, spread: 60 });
  };

  if (!shownUser) {
    return <div className="flex flex-1 items-center justify-center text-sm font-bold text-slate-500">실제 프로필을 불러오는 중...</div>;
  }

  return (
    <div className="flex-1 pb-24 px-4 pt-3 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
            <span>MY 프로필 & QR 명함</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            상대방에게 보여줄 내 프로필과 QR 코드입니다.
          </p>
        </div>

        <button
          onClick={() => {
            setSaveError('');
            setIsEditing(!isEditing);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
        >
          {isEditing ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>취소</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>프로필 편집</span>
            </>
          )}
        </button>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3.5 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">이름 / 닉네임</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">MBTI</label>
              <input
                type="text"
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                placeholder="예: ENFP"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">직업 / 하는 일</label>
              <input
                type="text"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">주량 / 음주 스타일</label>
              <input
                type="text"
                value={drinkStyle}
                onChange={(e) => setDrinkStyle(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">흡연 여부</label>
              <input
                type="text"
                value={smoking}
                onChange={(e) => setSmoking(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">한 줄 소개문</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">아이스브레이킹 질문</label>
            <input
              type="text"
              value={iceQ}
              onChange={(e) => setIceQ(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-1.5"
            />
            <input
              type="text"
              value={iceA}
              onChange={(e) => setIceA(e.target.value)}
              placeholder="내 답변"
              className="w-full text-xs p-2.5 bg-pink-50/50 rounded-xl border border-pink-200 text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-200 transition-all disabled:opacity-50"
          >
            {isSaving ? '프로필 저장 중...' : '프로필 변경사항 저장'}
          </button>
          {saveError && <p className="text-center text-xs font-bold text-red-500">{saveError}</p>}
        </form>
      ) : (
        /* My Card Display */
        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Main QR Card */}
          <div className="bg-white rounded-3xl p-6 border border-begins-cardBorder shadow-mobile-card text-center">
            <div className="relative w-20 h-20 mx-auto mb-2">
              <img
                src={shownUser.avatar}
                alt={shownUser.name}
                className="w-full h-full rounded-full object-cover border-2 border-sky-200 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold shadow-xs">
                {shownUser.mbti}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">{shownUser.name}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">"{shownUser.bio}"</p>

            {/* Tags (Begins Style) */}
            <div className="flex flex-wrap justify-center gap-1.5 my-3.5">
              {currentUser.tags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-100"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Big QR Code */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block my-2 shadow-inner">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="H"
                fgColor="#0EA5E9"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              상대방에게 이 QR 코드를 보여주세요 🧊
            </p>
          </div>

          {/* Icebreaker Card Preview */}
          <div className="bg-white rounded-3xl p-4 border border-begins-cardBorder shadow-xs">
            <div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>나의 아이스브레이킹 대화 주제</span>
            </div>
            <div className="text-xs font-bold text-slate-800">
              Q. {currentUser.icebreakerQuestion}
            </div>
            <div className="text-xs text-slate-700 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 mt-1.5">
              A. {currentUser.icebreakerAnswer}
            </div>
          </div>
          {isHostMode && (
            <button type="button" onClick={() => setIsHostControlOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-black text-white shadow-md">
              <Crown className="h-4 w-4 text-amber-300" /> 호스트 컨트롤 열기
            </button>
          )}
        </div>
      )}
    </div>
  );
};
