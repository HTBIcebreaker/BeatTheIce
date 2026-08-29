'use client';

import React, { useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Zap, CheckCircle2, Gift, Ticket, Flame, Sparkles, PlusCircle, Camera, RotateCcw, Send, Clock3, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { compressMissionPhoto } from '../features/mission/compressMissionPhoto';

const MissionSubmissionForm = ({ mission, submission, onSubmit }) => {
  const inputRef = useRef(null);
  const [text, setText] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isPhoto = mission.submissionType === 'PHOTO';
  const canRetry = submission?.status === 'REJECTED';
  const isLocked = submission && !canRetry;

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setIsCompressing(true);
    try {
      setPhotoDataUrl(await compressMissionPhoto(file));
    } catch (photoError) {
      setError(photoError.message);
    } finally {
      setIsCompressing(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if ((isPhoto && !photoDataUrl) || (!isPhoto && !text.trim())) return;
    setError('');
    setIsSubmitting(true);
    const result = await onSubmit({ text: text.trim(), photoDataUrl });
    if (!result?.success) setError(result?.message || '제출하지 못했습니다.');
    setIsSubmitting(false);
  };

  if (isLocked) {
    const status = submission.status;
    return (
      <div className={`mt-3 rounded-2xl border p-3 text-xs ${
        status === 'APPROVED'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}>
        <div className="flex items-center gap-1.5 font-black">
          {status === 'APPROVED' ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
          {status === 'APPROVED' ? '미션 승인 · 보상 지급 완료' : '제출 완료 · HOST 확인 대기'}
        </div>
        {submission.photoDataUrl && (
          <img src={submission.photoDataUrl} alt="제출한 인증" className="mt-2 h-28 w-full rounded-xl object-cover" />
        )}
        {submission.text && <p className="mt-2 font-medium">{submission.text}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
      {canRetry && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-red-600">
          <XCircle className="h-3.5 w-3.5" /> 반려됨: {submission.reviewNote || '인증 내용을 확인해 주세요.'}
        </div>
      )}
      {isPhoto ? (
        <>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          {photoDataUrl ? (
            <div className="relative overflow-hidden rounded-xl bg-slate-900">
              <img src={photoDataUrl} alt="미션 인증 미리보기" className="h-44 w-full object-contain" />
              <button type="button" onClick={() => inputRef.current?.click()} className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1.5 text-[10px] font-bold text-white">
                <RotateCcw className="h-3 w-3" /> 다시 촬영
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} disabled={isCompressing} className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-sky-300 bg-white py-7 text-sky-600 disabled:opacity-50">
              <Camera className="mb-2 h-7 w-7" />
              <span className="text-xs font-black">{isCompressing ? '사진 압축 중...' : '인증 사진 촬영 또는 선택'}</span>
              <span className="mt-1 text-[10px] font-medium text-slate-400">최대 1280px로 자동 압축돼요</span>
            </button>
          )}
        </>
      ) : (
        <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} placeholder="미션 수행 내용을 입력해 주세요." className="h-20 w-full resize-none rounded-xl border border-sky-100 bg-white p-3 text-xs outline-none focus:ring-2 focus:ring-sky-200" />
      )}
      {error && <p className="mt-2 text-[11px] font-bold text-red-500">{error}</p>}
      <button type="button" onClick={handleSubmit} disabled={isSubmitting || isCompressing || (isPhoto ? !photoDataUrl : !text.trim())} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2.5 text-xs font-black text-white shadow-sm disabled:opacity-40">
        <Send className="h-3.5 w-3.5" /> {isSubmitting ? '제출 중...' : canRetry ? '미션 다시 제출' : 'HOST에게 미션 제출'}
      </button>
    </div>
  );
};

export const QuestView = () => {
  const {
    missions,
    missionSubmissions,
    currentUser,
    submitMission,
    rewards,
    useRewardCoupon,
    isHostMode,
    setIsHostControlOpen,
  } = useSocket();

  const [activeSubTab, setActiveSubTab] = useState('missions'); // 'missions' or 'rewards'

  const completedCount = currentUser?.completedMissions?.length || 0;
  const totalCount = missions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex-1 pb-24 px-4 pt-3 flex flex-col">
      {/* Header Tabs */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
            <span>파티 퀘스트 & 보상</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-bold border border-sky-200">
              HIGH VIBE 🧊
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            어색함을 깨는 미션을 달성하고 실시간 드링크 쿠폰을 획득하세요!
          </p>
        </div>

        {isHostMode && (
          <button
            onClick={() => setIsHostControlOpen(true)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>퀘스트 등록</span>
          </button>
        )}
      </div>

      {/* Progress & Points Card */}
      <div className="bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-sky-200/50 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-sky-100 font-semibold">내 보유 파티 포인트</span>
            <div className="text-2xl font-black">{currentUser?.points || 0} P</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-sky-100 font-semibold">미션 달성률</span>
            <div className="text-lg font-bold">{progressPercent}% ({completedCount}/{totalCount})</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Sub Tabs: Quests vs My Rewards */}
      <div className="flex bg-white rounded-2xl p-1 border border-begins-cardBorder mb-3 shadow-xs">
        <button
          onClick={() => setActiveSubTab('missions')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'missions'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>도전 퀘스트 ({missions.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('rewards')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'rewards'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>내 보상 쿠폰함 ({rewards.length})</span>
        </button>
      </div>

      {/* 1. Missions List */}
      {activeSubTab === 'missions' ? (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {missions.map((mission) => {
            const isCompleted = currentUser?.completedMissions?.includes(mission.id);
            const submission = missionSubmissions.find(
              (item) => item.missionId === mission.id && item.guestId === currentUser?.id
            );

            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl p-4 border transition-all shadow-xs ${
                  isCompleted
                    ? 'border-slate-200 bg-slate-50/70'
                    : mission.isUrgent
                    ? 'border-sky-300 ring-2 ring-sky-100 bg-gradient-to-r from-sky-50/40 to-white'
                    : 'border-begins-cardBorder hover:border-sky-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {mission.isUrgent ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        <span>긴급</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold">
                        {mission.category}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-400">
                      +{mission.points} P
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {mission.submissionType === 'PHOTO' ? '📷 사진 인증' : '✍️ 텍스트 인증'}
                    </span>
                  </div>

                  {isCompleted && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>달성 완료</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{mission.title}</h3>
                <p className="text-xs text-slate-500 mb-3">{mission.description}</p>

                {/* Reward pill & Action Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600">
                    <Gift className="w-3.5 h-3.5 text-sky-500" />
                    <span>보상: {mission.reward}</span>
                  </div>

                  {!isCompleted && !submission && (
                    <span className="text-[10px] font-bold text-slate-400">아래에서 인증 제출</span>
                  )}
                </div>
                {!isCompleted && (
                  <MissionSubmissionForm
                    mission={mission}
                    submission={submission}
                    onSubmit={(payload) => submitMission(mission.id, payload)}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* 2. Rewards Wallet */
        <div className="space-y-3 flex-1 overflow-y-auto">
          {rewards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">보관된 쿠폰이 없습니다</h4>
              <p className="text-xs text-slate-400 mt-1">
                파티 퀘스트를 완수하고 맛있는 드링크 & 스낵 쿠폰을 받아보세요!
              </p>
            </div>
          ) : (
            rewards.map((reward) => (
              <div
                key={reward.id}
                className={`bg-white rounded-3xl p-4 border relative overflow-hidden shadow-xs ${
                  reward.isUsed ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-pink-200 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-begins-pinkLight text-begins-pink flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{reward.title}</h4>
                      <p className="text-[11px] text-slate-400">퀘스트: {reward.questTitle}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400">{reward.issuedAt}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {reward.code}
                  </div>

                  {reward.isUsed ? (
                    <span className="text-xs font-bold text-slate-400">사용 완료</span>
                  ) : (
                    <button
                      onClick={() => useRewardCoupon(reward.id)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                    >
                      바텐더/호스트에게 제시
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
