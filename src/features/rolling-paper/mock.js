export const MOCK_ROLLING_PARTY = {
  id: 'party_demo',
  status: 'ENDED',
};

export const MOCK_ROLLING_PROFILES = [
  {
    id: 'guest_001',
    name: '이지우',
    mbti: 'ENFP',
  },
  {
    id: 'guest_002',
    name: '김민재',
    mbti: 'INTJ',
  },
  {
    id: 'guest_003',
    name: '박서연',
    mbti: 'ESFJ',
  },
  {
    id: 'host_001',
    name: '루카스',
    mbti: 'ENFJ',
    role: 'HOST',
  },
];

export const MOCK_ROLLING_MESSAGES = [
  {
    id: 'rolling_demo_001',
    partyId: MOCK_ROLLING_PARTY.id,
    senderId: 'guest_003',
    senderName: '박서연',
    receiverId: 'guest_001',
    receiverName: '이지우',
    body: '오늘 먼저 말 걸어줘서 고마웠어요. 덕분에 파티가 훨씬 편했어요! 💌',
    isAnonymous: false,
    createdAt: '2026-08-29T07:00:00.000Z',
  },
  {
    id: 'rolling_demo_002',
    partyId: MOCK_ROLLING_PARTY.id,
    senderId: null,
    senderName: '익명의 파티원',
    receiverId: 'guest_001',
    receiverName: '이지우',
    body: '밝게 웃는 모습 덕분에 분위기가 더 좋아졌어요 ✨',
    isAnonymous: true,
    createdAt: '2026-08-29T07:05:00.000Z',
  },
];
