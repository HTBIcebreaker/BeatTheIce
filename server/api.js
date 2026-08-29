import express from 'express';
import { partyData } from './store.js';

// REST API router for the party app. Takes the shared Socket.IO server so
// mutations can broadcast realtime events to connected clients.
export function createApiRouter(io) {
  const router = express.Router();

  // 1. Party Overview & Stats
  router.get('/party', (req, res) => {
    res.json({
      success: true,
      data: {
        ...partyData.party,
        host: partyData.host,
        totalGuests: partyData.guests.length,
        totalMissions: partyData.missions.length,
        activePopups: partyData.popups.length,
      },
    });
  });

  // 2. Guests
  router.get('/guests', (req, res) => {
    res.json({ success: true, data: partyData.guests });
  });

  router.get('/guests/:id', (req, res) => {
    const guest = partyData.guests.find((g) => g.id === req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, message: '게스트를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: guest });
  });

  router.post('/guests', (req, res) => {
    const { name, mbti, age, height, job, bio, drinkStyle, smoking, hobby, avatar, tags, icebreakerQuestion, icebreakerAnswer } = req.body;
    const newGuest = {
      id: `guest_${Date.now()}`,
      name: name || '익명 파티원',
      mbti: mbti || 'ENFP',
      age: age || '만 26세',
      height: height || '172cm',
      job: job || '파티 러버',
      bio: bio || '오늘 밤 신나게 놀아봐요! 🥳',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      drinkStyle: drinkStyle || '적당히 1병',
      smoking: smoking || '비흡연',
      hobby: hobby || '음악, 여행',
      tags: tags || [age || '만 26세', height || '172cm', mbti || 'ENFP', drinkStyle || '적당히 1병', smoking || '비흡연'],
      icebreakerQuestion: icebreakerQuestion || '오늘 가장 기대되는 것은?',
      icebreakerAnswer: icebreakerAnswer || '새로운 사람들과 맛있는 칵테일 마시기 🍹',
      completedMissions: [],
      points: 100,
      scannedGuests: [],
    };

    partyData.guests.push(newGuest);
    io.emit('guest_joined', newGuest);

    res.status(201).json({ success: true, data: newGuest });
  });

  // 3. Scan QR & Connect
  router.post('/guests/scan', (req, res) => {
    const { scannerId, targetId } = req.body;
    const scanner = partyData.guests.find((g) => g.id === scannerId);
    const target = partyData.guests.find((g) => g.id === targetId);

    if (!target) {
      return res.status(404).json({ success: false, message: '인식된 상대방 정보를 찾을 수 없습니다.' });
    }

    if (scanner) {
      if (!scanner.scannedGuests.includes(targetId)) {
        scanner.scannedGuests.push(targetId);
        scanner.points += 30; // 30 points for scanning new guest
      }
    }

    io.emit('scan_matched', {
      scannerId,
      scannerName: scanner?.name || '새 파티원',
      targetId,
      targetName: target.name,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        target,
        isNewDiscovery: scanner ? !scanner.scannedGuests.includes(targetId) : true,
        pointsEarned: 30,
      },
    });
  });

  // 4. Missions
  router.get('/missions', (req, res) => {
    res.json({ success: true, data: partyData.missions });
  });

  router.post('/missions', (req, res) => {
    const { title, description, reward, points, category, isUrgent } = req.body;
    const newMission = {
      id: `quest_${Date.now()}`,
      title,
      description,
      reward: reward || '하이볼 1잔 교환권 🍹',
      points: Number(points) || 100,
      category: category || '게릴라 미션',
      badge: '도전의 달인',
      targetCount: 1,
      completedBy: [],
      isUrgent: !!isUrgent,
    };

    partyData.missions.unshift(newMission);
    io.emit('mission_created', newMission);

    // Automatically trigger a popup for new mission
    const missionPopup = {
      id: `popup_${Date.now()}`,
      type: 'mission',
      title: isUrgent ? '🚨 긴급 퀘스트 발동!' : '🎯 새로운 파티 퀘스트!',
      message: `${title} (${reward})`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      highlight: `보상: ${reward} (+${points || 100}P)`,
      actionText: '퀘스트 도전하기',
    };
    partyData.popups.unshift(missionPopup);
    io.emit('host_broadcast', missionPopup);

    res.status(201).json({ success: true, data: newMission });
  });

  router.post('/missions/:id/complete', (req, res) => {
    const { guestId } = req.body;
    const mission = partyData.missions.find((m) => m.id === req.params.id);
    const guest = partyData.guests.find((g) => g.id === guestId);

    if (!mission) {
      return res.status(404).json({ success: false, message: '미션을 찾을 수 없습니다.' });
    }

    if (!mission.completedBy.includes(guestId)) {
      mission.completedBy.push(guestId);
    }

    if (guest) {
      if (!guest.completedMissions.includes(mission.id)) {
        guest.completedMissions.push(mission.id);
        guest.points += mission.points;
      }
    }

    // Create Reward Coupon
    const rewardCoupon = {
      id: `rew_${Date.now()}`,
      guestId,
      title: mission.reward,
      questTitle: mission.title,
      code: `HIGH-${Math.floor(1000 + Math.random() * 9000)}`,
      isUsed: false,
      issuedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    partyData.rewards.unshift(rewardCoupon);

    io.emit('mission_completed', {
      mission,
      guestId,
      guestName: guest?.name || '파티원',
      rewardCoupon,
    });

    res.json({
      success: true,
      data: {
        mission,
        rewardCoupon,
        guestPoints: guest?.points || 0,
      },
    });
  });

  // 5. Popups & Host Broadcasts
  router.get('/popups', (req, res) => {
    res.json({ success: true, data: partyData.popups });
  });

  router.post('/popups', (req, res) => {
    const { type, title, message, highlight, actionText } = req.body;
    const newPopup = {
      id: `popup_${Date.now()}`,
      type: type || 'general', // general, mission, result
      title: title || '📢 호스트 루카스의 알림',
      message,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      highlight: highlight || '파티 분위기 HIGH!',
      actionText: actionText || '확인',
    };

    partyData.popups.unshift(newPopup);
    io.emit('host_broadcast', newPopup);

    res.status(201).json({ success: true, data: newPopup });
  });

  // 6. Rolling Papers
  router.get('/rolling-papers', (req, res) => {
    res.json({ success: true, data: partyData.rollingPapers });
  });

  router.post('/rolling-papers', (req, res) => {
    const { senderId, senderName, receiverId, receiverName, message, isAnonymous } = req.body;
    const colors = [
      'bg-pink-50 text-pink-900 border-pink-200',
      'bg-purple-50 text-purple-900 border-purple-200',
      'bg-amber-50 text-amber-900 border-amber-200',
      'bg-emerald-50 text-emerald-900 border-emerald-200',
      'bg-sky-50 text-sky-900 border-sky-200',
      'bg-rose-50 text-rose-900 border-rose-200',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newEntry = {
      id: `rp_${Date.now()}`,
      senderId: isAnonymous ? 'anon' : senderId || 'guest_001',
      senderName: isAnonymous ? '익명의 파티원 🤫' : senderName || '익명',
      receiverId: receiverId || 'all',
      receiverName: receiverName || '파티원 전체 🎉',
      message,
      color: randomColor,
      createdAt: '방금 전',
      isAnonymous: !!isAnonymous,
    };

    partyData.rollingPapers.unshift(newEntry);
    io.emit('rolling_paper_created', newEntry);

    res.status(201).json({ success: true, data: newEntry });
  });

  // 7. Rewards
  router.get('/rewards/:guestId', (req, res) => {
    const userRewards = partyData.rewards.filter((r) => r.guestId === req.params.guestId);
    res.json({ success: true, data: userRewards });
  });

  router.post('/rewards/:id/use', (req, res) => {
    const reward = partyData.rewards.find((r) => r.id === req.params.id);
    if (!reward) {
      return res.status(404).json({ success: false, message: '쿠폰을 찾을 수 없습니다.' });
    }
    reward.isUsed = true;
    res.json({ success: true, data: reward });
  });

  return router;
}
