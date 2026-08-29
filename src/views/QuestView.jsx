import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Zap, CheckCircle2, Gift, Ticket, Flame, Trophy, Sparkles, ChevronRight, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const QuestView = () => {
  const {
    missions,
    currentUser,
    completeMission,
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

                  {!isCompleted && (
                    <button
                      onClick={() => completeMission(mission.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-sm shadow-sky-200 active:scale-95 flex items-center gap-1"
                    >
                      <span>미션 완료 인증</span>
                      <Sparkles className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
