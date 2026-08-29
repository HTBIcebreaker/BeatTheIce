const STORAGE_PREFIX = 'beattheice-rolling-paper';
const STORAGE_EVENT = 'beattheice:rolling-paper-changed';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COLOR_CLASSES = [
  'bg-sky-50 text-sky-950 border-sky-200',
  'bg-indigo-50 text-indigo-950 border-indigo-200',
  'bg-violet-50 text-violet-950 border-violet-200',
  'bg-amber-50 text-amber-950 border-amber-200',
];

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `rolling_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function storageKey(partyId) {
  return `${STORAGE_PREFIX}:${partyId}`;
}

function readStoredMessages(partyId, storage, seedMessages) {
  if (!storage) return seedMessages;

  const key = storageKey(partyId);
  const stored = safeJsonParse(storage.getItem(key), null);
  if (Array.isArray(stored)) {
    const storedIds = new Set(stored.map((message) => message.id));
    const missingSeeds = seedMessages.filter((message) => !storedIds.has(message.id));
    if (missingSeeds.length === 0) return stored;

    const merged = [...stored, ...missingSeeds];
    storage.setItem(key, JSON.stringify(merged));
    return merged;
  }

  storage.setItem(key, JSON.stringify(seedMessages));
  return seedMessages;
}

function writeStoredMessages(partyId, storage, messages) {
  if (!storage) return;
  storage.setItem(storageKey(partyId), JSON.stringify(messages));
}

export function isUuid(value) {
  return UUID_PATTERN.test(value || '');
}

export function validateRollingMessage(message) {
  const body = message.body?.trim() || '';

  if (!message.partyId) throw new Error('파티 정보를 확인할 수 없어요.');
  if (!message.senderId) throw new Error('작성자 정보를 확인할 수 없어요.');
  if (!message.receiverId) throw new Error('받는 사람을 선택해 주세요.');
  if (message.senderId === message.receiverId) {
    throw new Error('자기 자신에게는 롤링페이퍼를 남길 수 없어요.');
  }
  if (!body) throw new Error('메시지를 입력해 주세요.');
  if (body.length > 500) throw new Error('메시지는 500자까지 작성할 수 있어요.');

  return {
    ...message,
    body,
    isAnonymous: Boolean(message.isAnonymous),
  };
}

export function normalizeRollingMessage(message, profilesById = {}) {
  const isAnonymous = Boolean(message.isAnonymous ?? message.is_anonymous);
  const senderId = message.senderId ?? message.sender_id ?? null;
  const receiverId = message.receiverId ?? message.receiver_id;
  const body = message.body ?? message.message ?? '';
  const createdAt = message.createdAt ?? message.created_at ?? new Date().toISOString();
  const senderName = isAnonymous
    ? '익명의 파티원'
    : message.senderName ?? message.sender_name ?? profilesById[senderId]?.name ?? '파티원';
  const receiverName =
    message.receiverName ?? message.receiver_name ?? profilesById[receiverId]?.name ?? '파티원';

  return {
    id: message.id,
    partyId: message.partyId ?? message.party_id,
    senderId: isAnonymous ? null : senderId,
    senderName,
    receiverId,
    receiverName,
    body,
    isAnonymous,
    createdAt,
    color:
      message.color || COLOR_CLASSES[Math.abs(String(message.id).length) % COLOR_CLASSES.length],
  };
}

export function createLocalRollingPaperAdapter({
  partyId,
  seedMessages = [],
  profiles = [],
  storage = typeof window !== 'undefined' ? window.localStorage : null,
} = {}) {
  const profilesById = Object.fromEntries(profiles.map((profile) => [profile.id, profile]));
  const normalizedSeeds = seedMessages.map((message) =>
    normalizeRollingMessage({ ...message, partyId: message.partyId || partyId }, profilesById)
  );

  const readAll = () =>
    readStoredMessages(partyId, storage, normalizedSeeds).map((message) =>
      normalizeRollingMessage(message, profilesById)
    );

  return {
    mode: 'LOCAL',
    async listReceived(profileId) {
      return readAll()
        .filter((message) => message.receiverId === profileId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async createMessage(input) {
      const message = validateRollingMessage(input);
      const created = normalizeRollingMessage(
        {
          ...message,
          id: createId(),
          createdAt: new Date().toISOString(),
        },
        profilesById
      );
      const next = [created, ...readAll()];
      writeStoredMessages(partyId, storage, next);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { partyId } }));
      }
      return created;
    },
    subscribe(onChange) {
      if (typeof window === 'undefined') return () => {};

      const handleCustomEvent = (event) => {
        if (event.detail?.partyId === partyId) onChange();
      };
      const handleStorage = (event) => {
        if (event.key === storageKey(partyId)) onChange();
      };

      window.addEventListener(STORAGE_EVENT, handleCustomEvent);
      window.addEventListener('storage', handleStorage);
      return () => {
        window.removeEventListener(STORAGE_EVENT, handleCustomEvent);
        window.removeEventListener('storage', handleStorage);
      };
    },
  };
}

export function createSupabaseRollingPaperAdapter({ supabase, partyId, profileId, profiles = [] }) {
  const profilesById = Object.fromEntries(profiles.map((profile) => [profile.id, profile]));

  return {
    mode: 'SUPABASE',
    async listReceived() {
      const { data, error } = await supabase.rpc('list_received_rolling_messages', {
        target_party_id: partyId,
      });
      if (error) throw new Error(error.message);
      return (data || []).map((message) => normalizeRollingMessage(message, profilesById));
    },
    async createMessage(input) {
      const message = validateRollingMessage(input);
      const { data, error } = await supabase
        .from('rolling_messages')
        .insert({
          party_id: message.partyId,
          sender_id: message.senderId,
          receiver_id: message.receiverId,
          body: message.body,
          is_anonymous: message.isAnonymous,
        })
        .select('id, party_id, sender_id, receiver_id, body, is_anonymous, created_at')
        .single();
      if (error) throw new Error(error.message);
      return normalizeRollingMessage(data, profilesById);
    },
    subscribe(onChange) {
      const channel = supabase
        .channel(`rolling-messages:${partyId}:${profileId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'rolling_messages',
            filter: `party_id=eq.${partyId}`,
          },
          onChange
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}
