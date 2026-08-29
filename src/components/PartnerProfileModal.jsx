'use client';

import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Heart, MessageSquareHeart, Sparkles, Beer, CheckCircle2, UserCheck, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PartnerProfileModal = ({ partner, onClose }) => {
  const { currentUser, sendRollingPaper, triggerConfetti, setActiveTab } = useSocket();
  const [showCheerAnim, setShowCheerAnim] = useState(false);
  const [cheered, setCheered] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [showMsgInput, setShowMsgInput] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  if (!partner) return null;

  const handleCheers = () => {
    setCheered(true);
    setShowCheerAnim(true);
    triggerConfetti({ particleCount: 100, spread: 80 });
    setTimeout(() => setShowCheerAnim(false), 2000);
  };

  const handleSendRollingPaper = async (e) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    await sendRollingPaper({
      senderId: currentUser?.id,
      senderName: currentUser?.name,
      receiverId: partner.id,
      receiverName: partner.name,
      message: customMsg,
      isAnonymous: false,
    });

    setMsgSent(true);
    setCustomMsg('');
    triggerConfetti();
    setTimeout(() => {
      setShowMsgInput(false);
      setMsgSent(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col"
        >
          {/* Header Image / Background banner */}
          <div className="relative h-44 bg-gradient-to-tr from-sky-500 via-sky-400 to-blue-600 flex items-end justify-center p-4">
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <div className="relative -bottom-8">
              <div className="w-24 h-24 rounded-full p-1 bg-white shadow-xl">
                <img
                  src={partner.avatar}
                  alt={partner.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold shadow-md border-2 border-white">
                {partner.mbti}
              </span>
            </div>
          </div>

          {/* Content Area */}
          <div className="pt-10 px-5 pb-6 overflow-y-auto flex-1 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h2 className="text-xl font-bold text-slate-900">{partner.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {partner.job || '파티 게스트'}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-4 px-2">
              "{partner.bio}"
            </p>

            {/* Tag Chips matching reference design */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
              {partner.tags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-100"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Icebreaker Question & Answer Box */}
            {partner.icebreakerQuestion && (
              <div className="bg-gradient-to-br from-sky-50/70 to-blue-50/70 rounded-2xl p-3.5 border border-sky-100/90 text-left mb-4 text-xs">
                <div className="flex items-center gap-1.5 text-sky-600 font-bold mb-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>아이스브레이킹 대화 팁 🧊</span>
                </div>
                <div className="font-semibold text-slate-800 mb-0.5">
                  Q. {partner.icebreakerQuestion}
                </div>
                <div className="text-slate-600 font-normal bg-white/80 rounded-xl p-2 mt-1 border border-sky-100">
                  A. {partner.icebreakerAnswer}
                </div>
              </div>
            )}

            {/* Quick Rolling Paper Message Input */}
            {showMsgInput ? (
              <form onSubmit={handleSendRollingPaper} className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-4 text-left">
                <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span>💌 {partner.name}님에게 롤링페이퍼 남기기</span>
                  <button
                    type="button"
                    onClick={() => setShowMsgInput(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    취소
                  </button>
                </div>
                <textarea
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="따뜻한 칭찬이나 응원 한마디를 남겨보세요!"
                  className="w-full text-xs p-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none h-16"
                  autoFocus
                />
                {msgSent ? (
                  <div className="text-emerald-600 text-xs font-bold text-center py-1">
                    메시지가 성공적으로 전달되었습니다! ✨
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!customMsg.trim()}
                    className="w-full mt-2 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-200 transition-all disabled:opacity-50"
                  >
                    메시지 보내기
                  </button>
                )}
              </form>
            ) : null}

            {/* Interactive Actions */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={handleCheers}
                className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  cheered
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <Beer className="w-4 h-4 text-amber-600" />
                <span>{cheered ? '건배 완료! 짠 🍻' : '건배하기 🥂'}</span>
              </button>

              <button
                onClick={() => setShowMsgInput(!showMsgInput)}
                className="py-3 px-4 rounded-2xl font-bold text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <MessageSquareHeart className="w-4 h-4 text-sky-500" />
                <span>롤링페이퍼 남기기</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
