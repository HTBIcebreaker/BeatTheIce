import { createSupabaseBrowserClient } from './client';

// ALPHA-TODO(owner: p2p-qr, consumer: shell-profile)
// 실제로는 PARTY-01(파티 생성)/PARTY-02(참여 코드로 입장)가 partyId를 넘겨줘야 한다.
// 그 전까지는 고정된 데모 파티 하나를 찾거나 만들어서 사용한다.
// fallback: DEMO_PARTY_JOIN_CODE로 party를 찾고, 없으면 현재 세션이 host로 새로 만든다.
const DEMO_PARTY_JOIN_CODE = 'DEMO-P2PQR';

let sessionPromise = null;

export function getSupabase() {
  return createSupabaseBrowserClient();
}

export async function ensureSession() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  if (!sessionPromise) {
    sessionPromise = supabase.auth.signInAnonymously().then(({ data, error }) => {
      sessionPromise = null;
      if (error) throw error;
      return data.session;
    });
  }
  return sessionPromise;
}

export async function ensureMyProfile(defaults = {}) {
  const supabase = getSupabase();
  const session = await ensureSession();
  const userId = session.user.id;

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: defaults.name || '게스트',
      mbti: defaults.mbti || null,
      intro: defaults.intro || '',
      avatar_url: defaults.avatarUrl || null,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

// ALPHA-TODO(owner: p2p-qr, consumer: shell-profile)
// join_code로 파티를 찾는 것은 아직 멤버가 아니면 parties SELECT RLS에 막혀 불가능하다
// (parties는 "members read parties" 정책만 있음). 지금은 내가 host로 데모 파티를 직접
// 만들어서 사용하고, 이미 있으면 그 party_id로 party_members만 upsert한다.
// 진짜 "코드로 파티 참가"가 되려면 join_code 조회용 security definer RPC가 스키마에
// 추가돼야 한다 — 이건 나 혼자 결정할 스키마 변경이 아니라 팀 합의가 필요하다.
export async function ensureDemoParty() {
  const supabase = getSupabase();
  const session = await ensureSession();

  const { data: hosted } = await supabase
    .from('parties')
    .select('*')
    .eq('host_id', session.user.id)
    .eq('join_code', DEMO_PARTY_JOIN_CODE)
    .maybeSingle();

  if (hosted) return hosted;

  const { data: created, error } = await supabase
    .from('parties')
    .insert({
      host_id: session.user.id,
      name: 'BeatTheIce 데모 파티',
      description: 'P2P QR 프로필 교환 검증용 데모 파티',
      join_code: DEMO_PARTY_JOIN_CODE,
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (error) {
    // join_code 중복(이미 다른 세션이 만듦) 등은 여기서 막힌다 — 위 ALPHA-TODO 참고.
    throw error;
  }
  return created;
}

export async function ensurePartyMembership(partyId, role = 'GUEST') {
  const supabase = getSupabase();
  const session = await ensureSession();
  const profileId = session.user.id;

  const { data: existing, error: readError } = await supabase
    .from('party_members')
    .select('*')
    .eq('party_id', partyId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('party_members')
    .insert({ party_id: partyId, profile_id: profileId, role })
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

export class ScanError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// PROF-03: 상대 QR 스캔 및 프로필 확인
export async function resolveScannedProfile(qrValue, partyId) {
  const supabase = getSupabase();
  const session = await ensureSession();

  if (!qrValue) {
    throw new ScanError('INVALID_QR', '인식할 수 없는 QR입니다.');
  }
  if (qrValue === session.user.id) {
    throw new ScanError('SELF_SCAN', '내 QR은 스캔할 수 없어요.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('party_members')
    .select('profile_id')
    .eq('party_id', partyId)
    .eq('profile_id', qrValue)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) {
    throw new ScanError('NOT_PARTY_MEMBER', '같은 파티 참가자가 아닌 QR입니다.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', qrValue)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    throw new ScanError('PROFILE_NOT_FOUND', '프로필을 찾을 수 없습니다.');
  }

  return profile;
}

// Supabase profiles 행을 기존 UI(guests 배열) 카드가 기대하는 모양으로 맞춘다.
// job/tags/icebreakerQuestion 등은 스키마에 없으므로 비워둔다.
export function mapProfileToGuestView(profile) {
  return {
    id: profile.id,
    name: profile.name,
    mbti: profile.mbti || '',
    bio: profile.intro || '',
    avatar: profile.avatar_url || '',
    tags: [profile.mbti].filter(Boolean),
  };
}
