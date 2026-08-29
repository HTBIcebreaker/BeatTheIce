'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Heart,
  Loader2,
  LockKeyhole,
  MessageSquareHeart,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const MAX_BODY_LENGTH = 500;

function formatCreatedAt(value) {
  if (!value) return '방금 전';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function RollingPaperFeature({ adapter, party, currentProfile, profiles, onCelebrate }) {
  const [activePanel, setActivePanel] = useState('WRITE');
  const [receiverId, setReceiverId] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isPartyEnded = String(party?.status || '').toUpperCase() === 'ENDED';
  const recipients = useMemo(
    () => profiles.filter((profile) => profile.id !== currentProfile.id),
    [currentProfile.id, profiles]
  );

  useEffect(() => {
    if (!recipients.some((profile) => profile.id === receiverId)) {
      setReceiverId(recipients[0]?.id || '');
    }
  }, [receiverId, recipients]);

  const loadReceivedMessages = useCallback(async () => {
    if (!isPartyEnded) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const received = await adapter.listReceived(currentProfile.id);
      setMessages(received);
    } catch (error) {
      setErrorMessage(error.message || '받은 메시지를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [adapter, currentProfile.id, isPartyEnded]);

  useEffect(() => {
    loadReceivedMessages();
    return adapter.subscribe(loadReceivedMessages);
  }, [adapter, loadReceivedMessages]);

  const selectedRecipient = recipients.find((profile) => profile.id === receiverId);
  const remainingCharacters = MAX_BODY_LENGTH - body.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await adapter.createMessage({
        partyId: party.id,
        senderId: currentProfile.id,
        senderName: currentProfile.name,
        receiverId,
        receiverName: selectedRecipient?.name,
        body,
        isAnonymous,
      });
      setBody('');
      setIsAnonymous(false);
      setSuccessMessage(`${selectedRecipient?.name || '파티원'}님에게 따뜻한 마음을 남겼어요.`);
      onCelebrate?.();
    } catch (error) {
      setErrorMessage(error.message || '메시지를 저장하지 못했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex flex-1 flex-col px-4 pb-28 pt-4">
      <header className="mb-5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-black tracking-[0.16em] text-sky-500">
          <MessageSquareHeart className="h-4 w-4" />
          AFTER PARTY MEMORY
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">롤링페이퍼</h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              오늘 만난 사람에게 기억에 남을 한마디를 전해보세요.
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <Heart className="h-5 w-5 fill-current" />
          </div>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {[
          { id: 'WRITE', label: '메시지 남기기', icon: Send },
          { id: 'RECEIVED', label: '받은 메시지', icon: MessageSquareHeart },
        ].map((panel) => {
          const Icon = panel.icon;
          const isActive = activePanel === panel.id;
          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => {
                setActivePanel(panel.id);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {panel.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activePanel === 'WRITE' ? (
          <motion.form
            key="write"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">FROM</p>
                <p className="text-sm font-black text-slate-900">{currentProfile.name}</p>
              </div>
            </div>

            <label className="mb-2 block text-xs font-black text-slate-700" htmlFor="rolling-receiver">
              받는 사람
            </label>
            <select
              id="rolling-receiver"
              value={receiverId}
              onChange={(event) => setReceiverId(event.target.value)}
              disabled={recipients.length === 0 || isSubmitting}
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-50"
            >
              {recipients.length === 0 ? (
                <option value="">메시지를 보낼 파티원이 없어요</option>
              ) : (
                recipients.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.role === 'HOST' ? '👑 ' : ''}
                    {profile.name}{profile.mbti ? ` · ${profile.mbti}` : ''}
                  </option>
                ))
              )}
            </select>

            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-black text-slate-700" htmlFor="rolling-body">
                전하고 싶은 말
              </label>
              <span className={`text-[11px] font-bold ${remainingCharacters < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {body.length}/{MAX_BODY_LENGTH}
              </span>
            </div>
            <textarea
              id="rolling-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="오늘 나눈 대화, 고마웠던 순간을 적어보세요."
              rows={5}
              disabled={isSubmitting}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:opacity-50"
            />

            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs font-black text-slate-800">익명으로 남기기</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">받는 사람에게 이름을 숨겨요</span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) => setIsAnonymous(event.target.checked)}
                disabled={isSubmitting}
                className="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
              />
            </label>

            <div aria-live="polite" className="mt-4 min-h-5">
              {errorMessage && <p className="text-xs font-bold text-rose-600">{errorMessage}</p>}
              {successMessage && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> {successMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !receiverId || !body.trim() || body.length > MAX_BODY_LENGTH}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? '저장하는 중' : '롤링페이퍼 남기기'}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="received"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-1 flex-col"
          >
            {!isPartyEnded ? (
              <div className="rounded-[28px] border border-sky-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <LockKeyhole className="h-6 w-6" />
                </div>
                <h2 className="text-base font-black text-slate-900">파티가 끝나면 열려요</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  받은 메시지는 호스트가 파티를 종료한 뒤부터 확인할 수 있어요.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex flex-1 items-center justify-center py-16 text-sky-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center">
                <MessageSquareHeart className="mx-auto mb-3 h-11 w-11 text-slate-300" />
                <h2 className="text-sm font-black text-slate-700">아직 받은 메시지가 없어요</h2>
                <p className="mt-1 text-xs text-slate-400">누군가가 남긴 따뜻한 마음이 여기에 모여요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-bold text-slate-500">받은 마음 {messages.length}개</p>
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> 나에게 온 메시지만 표시
                  </p>
                </div>
                {messages.map((message, index) => (
                  <motion.article
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-[26px] border p-5 shadow-sm ${message.color}`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-black shadow-sm">
                        {message.isAnonymous ? '익명 🤫' : `From. ${message.senderName}`}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Clock3 className="h-3 w-3" /> {formatCreatedAt(message.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm font-semibold leading-6">{message.body}</p>
                  </motion.article>
                ))}
              </div>
            )}

            {errorMessage && (
              <p aria-live="polite" className="mt-3 text-center text-xs font-bold text-rose-600">
                {errorMessage}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
