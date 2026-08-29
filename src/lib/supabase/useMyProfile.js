'use client';

import { useEffect, useRef, useState } from 'react';
import { ensureMyProfile, ensureDemoParty, ensurePartyMembership } from './profile';

// PROF-02: 내 QR 표시. Socket.IO currentUser는 그대로 두고, QR에 쓸 실제 Supabase
// profiles.id만 별도로 확보한다. 실패하면(예: Anonymous Auth 미설정) ready=false를
// 반환하니, 호출부는 기존 currentUser.id 기반 표시로 폴백하면 된다.
export function useMyProfile(seed) {
  const [state, setState] = useState({ profile: null, party: null, ready: false, error: null });
  const seedRef = useRef(seed);
  seedRef.current = seed;

  useEffect(() => {
    if (!seed) return undefined;
    let cancelled = false;

    async function bootstrap() {
      try {
        const profile = await ensureMyProfile({
          name: seedRef.current?.name,
          mbti: seedRef.current?.mbti,
          intro: seedRef.current?.bio,
          avatarUrl: seedRef.current?.avatar,
        });
        const party = await ensureDemoParty();
        await ensurePartyMembership(party.id, 'GUEST');

        if (!cancelled) {
          setState({ profile, party, ready: true, error: null });
        }
      } catch (error) {
        console.warn('[p2p-qr] Supabase 프로필 초기화 실패, 기존 방식으로 폴백:', error.message);
        if (!cancelled) {
          setState({ profile: null, party: null, ready: false, error });
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // 최초 1회만 부트스트랩한다. seed는 초기값 용도로만 쓴다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.id]);

  return state;
}
