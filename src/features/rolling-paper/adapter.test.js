import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLocalRollingPaperAdapter,
  normalizeRollingMessage,
  validateRollingMessage,
} from './adapter.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test('anonymous messages never expose the sender identity after normalization', () => {
  const normalized = normalizeRollingMessage({
    id: 'message_1',
    sender_id: 'sender_1',
    sender_name: '숨겨져야 하는 이름',
    receiver_id: 'receiver_1',
    body: '반가웠어요',
    is_anonymous: true,
  });

  assert.equal(normalized.senderId, null);
  assert.equal(normalized.senderName, '익명의 파티원');
});

test('rolling messages reject self delivery and bodies longer than 500 characters', () => {
  assert.throws(
    () =>
      validateRollingMessage({
        partyId: 'party_1',
        senderId: 'guest_1',
        receiverId: 'guest_1',
        body: '안녕',
      }),
    /자기 자신/
  );

  assert.throws(
    () =>
      validateRollingMessage({
        partyId: 'party_1',
        senderId: 'guest_1',
        receiverId: 'guest_2',
        body: 'a'.repeat(501),
      }),
    /500자/
  );
});

test('local adapter persists a message and lists only the receiver messages', async () => {
  const adapter = createLocalRollingPaperAdapter({
    partyId: 'party_1',
    storage: createMemoryStorage(),
    profiles: [
      { id: 'guest_1', name: '지우' },
      { id: 'guest_2', name: '민재' },
    ],
  });

  await adapter.createMessage({
    partyId: 'party_1',
    senderId: 'guest_1',
    receiverId: 'guest_2',
    body: '  오늘 반가웠어요!  ',
    isAnonymous: false,
  });

  assert.equal((await adapter.listReceived('guest_1')).length, 0);
  const received = await adapter.listReceived('guest_2');
  assert.equal(received.length, 1);
  assert.equal(received[0].body, '오늘 반가웠어요!');
  assert.equal(received[0].senderName, '지우');
});

test('local adapter merges newly received seed messages without duplicating stored messages', async () => {
  const storage = createMemoryStorage();
  const firstMessage = {
    id: 'message_1',
    partyId: 'party_1',
    senderId: 'guest_1',
    receiverId: 'guest_2',
    body: '첫 번째 메시지',
  };
  const secondMessage = {
    id: 'message_2',
    partyId: 'party_1',
    senderId: 'guest_1',
    receiverId: 'guest_2',
    body: '두 번째 메시지',
  };

  const initial = createLocalRollingPaperAdapter({
    partyId: 'party_1',
    storage,
    seedMessages: [firstMessage],
  });
  await initial.listReceived('guest_2');
  const refreshed = createLocalRollingPaperAdapter({
    partyId: 'party_1',
    storage,
    seedMessages: [firstMessage, secondMessage],
  });

  const received = await refreshed.listReceived('guest_2');
  assert.deepEqual(
    received.map((message) => message.id).sort(),
    ['message_1', 'message_2']
  );
});
