import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { MessageSquareHeart, Send, Sparkles, User, Users, Plus, Heart, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RollingPaperView = () => {
  const { rollingPapers, sendRollingPaper, guests, host, currentUser, triggerConfetti } = useSocket();
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Form states
  const [receiverId, setReceiverId] = useState('all');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Target options: 'all', host, and all guests
  const allTargets = [
    { id: 'all', name: '🎉 파티원 전체' },
    { id: host?.id || 'host_001', name: `👑 ${host?.name || '호스트 루카스'}` },
    ...guests.filter((g) => g.id !== currentUser?.id).map((g) => ({ id: g.id, name: `👤 ${g.name} (${g.mbti})` })),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const targetObj = allTargets.find((t) => t.id === receiverId);

    await sendRollingPaper({
      senderId: isAnonymous ? 'anon' : currentUser?.id,
      senderName: isAnonymous ? '익명의 파티원 🤫' : currentUser?.name || '익명',
      receiverId,
      receiverName: targetObj?.name || '파티원',
      message,
      isAnonymous,
    });

    setIsSent(true);
    triggerConfetti({ particleCount: 90, spread: 70 });
    setTimeout(() => {
      setIsSent(false);
      setMessage('');
      setIsWriteModalOpen(false);
    }, 1200);
  };

  return (
    <div className="flex-1 pb-24 px-4 pt-3 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
            <span>파티 롤링페이퍼</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-bold border border-sky-200">
              💌 훈훈 VIBE
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            고마운 파티원에게 칭찬과 따뜻한 한마디를 남겨보세요!
          </p>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-sky-200 flex items-center gap-1 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>메시지 남기기</span>
        </button>
      </div>

      {/* Rolling Papers Wall */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {rollingPapers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <MessageSquareHeart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">첫 번째 롤링페이퍼를 작성해보세요!</h4>
            <p className="text-xs text-slate-400 mt-1">
              익명으로도 부담 없이 마음을 전할 수 있어요 ✨
            </p>
          </div>
        ) : (
          rollingPapers.map((paper) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-3xl p-4 border shadow-xs transition-all ${paper.color || 'bg-pink-50 text-pink-900 border-pink-200'}`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[11px] px-2 py-0.5 rounded-full bg-white/70 shadow-2xs">
                    To. {paper.receiverName}
                  </span>
                  {paper.isAnonymous && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-white font-semibold">
                      익명 🤫
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {paper.createdAt || '방금 전'}
                </span>
              </div>

              <p className="text-xs font-medium leading-relaxed my-1">
                "{paper.message}"
              </p>

              <div className="text-right text-[11px] font-bold text-slate-500 mt-2">
                From. {paper.senderName}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Write Modal */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquareHeart className="w-4 h-4 text-begins-pink" />
                  <span>롤링페이퍼 작성하기</span>
                </h3>
                <button
                  onClick={() => setIsWriteModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  닫기
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    받는 사람 선택
                  </label>
                  <select
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-begins-pink/30"
                  >
                    {allTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    메시지 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="칭찬, 감사, 응원 한마디를 적어보세요! (예: 오늘 덕분에 너무 즐거웠어요!)"
                    className="w-full text-xs p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-begins-pink/30 resize-none h-24"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonCheck"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-begins-pink rounded"
                    />
                    <label htmlFor="anonCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                      익명으로 보내기 🤫
                    </label>
                  </div>
                </div>

                {isSent ? (
                  <div className="text-center py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
                    메시지가 파티 보드에 등록되었습니다! 💌
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>보내기</span>
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
