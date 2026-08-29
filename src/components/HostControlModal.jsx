'use client';

import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Crown, Send, Zap, Trophy, MessageCircle, PlusCircle, Users, Flame, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HostControlModal = ({ isOpen, onClose }) => {
  const { host, broadcastPopup, createMission, guests, missions, triggerConfetti } = useSocket();
  const [activeSubTab, setActiveSubTab] = useState('broadcast'); // 'broadcast', 'new_mission', 'guests_status'

  // Broadcast state
  const [msgType, setMsgType] = useState('general'); // 'general', 'mission', 'result'
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastHighlight, setBroadcastHighlight] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // New Mission state
  const [missionTitle, setMissionTitle] = useState('');
  const [missionDesc, setMissionDesc] = useState('');
  const [missionReward, setMissionReward] = useState('칵테일 1잔 교환권 🍸');
  const [missionPoints, setMissionPoints] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);
  const [missionCreated, setMissionCreated] = useState(false);

  if (!isOpen) return null;

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    let defaultTitle = '📢 호스트 루카스의 알림';
    if (msgType === 'mission') defaultTitle = '🚨 게릴라 퀘스트 시작!';
    if (msgType === 'result') defaultTitle = '🏆 미션 결과 및 우승자 발표!';

    await broadcastPopup({
      type: msgType,
      title: broadcastTitle || defaultTitle,
      message: broadcastMsg,
      highlight: broadcastHighlight || '파티 분위기 HIGH!',
      actionText: msgType === 'mission' ? '도전하기' : '확인',
    });

    setBroadcastSent(true);
    triggerConfetti({ particleCount: 80, spread: 70 });
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMsg('');
      setBroadcastTitle('');
      setBroadcastHighlight('');
    }, 1500);
  };

  const handleCreateMission = async (e) => {
    e.preventDefault();
    if (!missionTitle.trim() || !missionDesc.trim()) return;

    await createMission({
      title: missionTitle,
      description: missionDesc,
      reward: missionReward,
      points: Number(missionPoints),
      category: isUrgent ? '긴급 미션' : '호스트 퀘스트',
      isUrgent,
    });

    setMissionCreated(true);
    triggerConfetti({ particleCount: 100, spread: 80 });
    setTimeout(() => {
      setMissionCreated(false);
      setMissionTitle('');
      setMissionDesc('');
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Top Host Header */}
          <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-bold flex items-center gap-1">
                  호스트 컨트롤 센터 👑
                </h2>
                <p className="text-[10px] text-sky-100">실시간 파티 분위기 관리 & 퀘스트 제어</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 gap-1">
            <button
              onClick={() => setActiveSubTab('broadcast')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeSubTab === 'broadcast'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>멘트 방송</span>
            </button>
            <button
              onClick={() => setActiveSubTab('new_mission')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeSubTab === 'new_mission'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>미션 등록</span>
            </button>
            <button
              onClick={() => setActiveSubTab('guests_status')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeSubTab === 'guests_status'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>게스트 현황</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* 1. Broadcast Tab */}
            {activeSubTab === 'broadcast' && (
              <form onSubmit={handleSendBroadcast} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    방송할 메시지 종류
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'general', label: '💬 일반 공지', color: 'border-slate-300 text-slate-700' },
                      { id: 'mission', label: '🚨 게릴라 미션', color: 'border-amber-400 text-amber-800 bg-amber-50/50' },
                      { id: 'result', label: '🏆 결과 발표', color: 'border-purple-400 text-purple-800 bg-purple-50/50' },
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setMsgType(type.id)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                          msgType === type.id
                            ? 'ring-2 ring-purple-600 bg-purple-50 text-purple-900 border-purple-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    메시지 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder={
                      msgType === 'general'
                        ? '예: 3분 뒤 자리 셔플 타임이 시작됩니다! 🥂'
                        : msgType === 'mission'
                        ? '예: 5분 안에 나와 MBTI 같은 사람 찾아 건배하기!'
                        : '예: 1차 미션 1등 김민재님! 칵테일 증정 완료 🎉'
                    }
                    className="w-full text-xs p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none h-20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    강조 문구 (하이라이트)
                  </label>
                  <input
                    type="text"
                    value={broadcastHighlight}
                    onChange={(e) => setBroadcastHighlight(e.target.value)}
                    placeholder="예: 1등에게 샴페인 1병 🍾"
                    className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                {broadcastSent ? (
                  <div className="text-center py-2.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
                    전체 게스트에게 실시간 전송 완료! 🚀
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!broadcastMsg.trim()}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>실시간 팝업 멘트 전송하기</span>
                  </button>
                )}
              </form>
            )}

            {/* 2. New Mission Tab */}
            {activeSubTab === 'new_mission' && (
              <form onSubmit={handleCreateMission} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    퀘스트 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={missionTitle}
                    onChange={(e) => setMissionTitle(e.target.value)}
                    placeholder="예: 호스트와 셀카 찍고 스토리 올리기 📸"
                    className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    미션 설명 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={missionDesc}
                    onChange={(e) => setMissionDesc(e.target.value)}
                    placeholder="게스트가 어떤 행동을 해야 하는지 상세히 적어주세요."
                    className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none h-16"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      보상 상품
                    </label>
                    <input
                      type="text"
                      value={missionReward}
                      onChange={(e) => setMissionReward(e.target.value)}
                      placeholder="예: 데킬라 1잔 🥃"
                      className="w-full text-xs p-2 bg-slate-50 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      획득 포인트 (P)
                    </label>
                    <input
                      type="number"
                      value={missionPoints}
                      onChange={(e) => setMissionPoints(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="urgentToggle"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <label htmlFor="urgentToggle" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span>긴급 게릴라 퀘스트로 설정</span>
                  </label>
                </div>

                {missionCreated ? (
                  <div className="text-center py-2.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
                    새 퀘스트가 등록되어 게스트에게 전송되었습니다! ✨
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!missionTitle.trim()}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>파티 퀘스트 등록 & 발송</span>
                  </button>
                )}
              </form>
            )}

            {/* 3. Guests Status */}
            {activeSubTab === 'guests_status' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between">
                  <span>참여 게스트 ({guests.length}명)</span>
                  <span>포인트 순위</span>
                </div>
                {guests
                  .slice()
                  .sort((a, b) => b.points - a.points)
                  .map((guest, idx) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <img src={guest.avatar} alt={guest.name} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <span>{guest.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-begins-pinkLight text-begins-pink font-semibold">
                              {guest.mbti}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            완료 미션 {guest.completedMissions?.length || 0}개 · 스캔 {guest.scannedGuests?.length || 0}명
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-purple-700">{guest.points} P</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
