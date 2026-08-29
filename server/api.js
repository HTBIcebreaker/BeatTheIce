import express from 'express';
import { partyData } from './store.js';

// REST API router for the party app. Takes the shared Socket.IO server so
// mutations can broadcast realtime events to connected clients.
export function createApiRouter(io) {
  const router = express.Router();

  const issueReward = (mission, guest) => {
    const existing = partyData.rewards.find(
      (reward) => reward.guestId === guest.id && reward.missionId === mission.id
    );
    if (existing) return existing;

    if (!mission.completedBy.includes(guest.id)) mission.completedBy.push(guest.id);
    if (!guest.completedMissions.includes(mission.id)) {
      guest.completedMissions.push(mission.id);
      guest.points += mission.points;
    }

    const rewardCoupon = {
      id: `rew_${Date.now()}`,
      missionId: mission.id,
      guestId: guest.id,
      title: mission.reward,
      questTitle: mission.title,
      code: `HIGH-${Math.floor(1000 + Math.random() * 9000)}`,
      isUsed: false,
      issuedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    partyData.rewards.unshift(rewardCoupon);
    return rewardCoupon;
  };

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

  router.patch('/guests/:id', (req, res) => {
    const guest = partyData.guests.find((item) => item.id === req.params.id);
    if (!guest) {
      return res.status(404).json({ success: false, message: '게스트를 찾을 수 없습니다.' });
    }

    const allowedFields = [
      'name', 'mbti', 'bio', 'job', 'age', 'drinkStyle', 'smoking',
      'avatar', 'tags', 'icebreakerQuestion', 'icebreakerAnswer',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) guest[field] = req.body[field];
    });
    guest.updatedAt = new Date().toISOString();
    io.emit('guest_updated', guest);
    res.json({ success: true, data: guest });
  });

  // 3. Scan QR & Connect
  router.post('/guests/scan', (req, res) => {
    const { scannerId, targetId } = req.body;
    const scanner = partyData.guests.find((g) => g.id === scannerId);
    const target = partyData.guests.find((g) => g.id === targetId);

    if (!target) {
      return res.status(404).json({ success: false, message: '인식된 상대방 정보를 찾을 수 없습니다.' });
    }

    const isNewDiscovery = scanner ? !scanner.scannedGuests.includes(targetId) : true;
    if (scanner) {
      if (isNewDiscovery) {
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
        isNewDiscovery,
        pointsEarned: 30,
      },
    });
  });

  // 4. Missions
  router.get('/missions', (req, res) => {
    res.json({ success: true, data: partyData.missions });
  });

  router.post('/missions', (req, res) => {
    const { title, description, reward, points, category, isUrgent, submissionType } = req.body;
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
      submissionType: submissionType === 'PHOTO' ? 'PHOTO' : 'TEXT',
      status: 'ACTIVE',
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

  router.get('/mission-submissions', (req, res) => {
    const { missionId, guestId } = req.query;
    const submissions = partyData.missionSubmissions.filter((submission) => {
      if (missionId && submission.missionId !== missionId) return false;
      if (guestId && submission.guestId !== guestId) return false;
      return true;
    });
    res.json({ success: true, data: submissions });
  });

  router.post('/missions/:id/submissions', (req, res) => {
    const mission = partyData.missions.find((item) => item.id === req.params.id);
    const guest = partyData.guests.find((item) => item.id === req.body.guestId);

    if (!mission || !guest) {
      return res.status(404).json({ success: false, message: '미션 또는 게스트를 찾을 수 없습니다.' });
    }
    if (mission.status !== 'ACTIVE') {
      return res.status(409).json({ success: false, message: '현재 제출할 수 없는 미션입니다.' });
    }

    const text = String(req.body.text || '').trim();
    const photoDataUrl = String(req.body.photoDataUrl || '');
    if (mission.submissionType === 'PHOTO' && !photoDataUrl.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: '사진 인증이 필요한 미션입니다.' });
    }
    if (mission.submissionType === 'TEXT' && !text) {
      return res.status(400).json({ success: false, message: '텍스트 인증 내용을 입력해 주세요.' });
    }

    const previous = partyData.missionSubmissions.find(
      (item) => item.missionId === mission.id && item.guestId === guest.id
    );
    if (previous && previous.status !== 'REJECTED') {
      return res.status(409).json({ success: false, message: '이미 제출한 미션입니다.' });
    }

    const submission = previous || {
      id: `submission_${Date.now()}`,
      missionId: mission.id,
      guestId: guest.id,
      guestName: guest.name,
      createdAt: new Date().toISOString(),
    };
    Object.assign(submission, {
      text,
      photoDataUrl: mission.submissionType === 'PHOTO' ? photoDataUrl : '',
      status: 'SUBMITTED',
      reviewedAt: null,
    });
    if (!previous) partyData.missionSubmissions.unshift(submission);

    io.emit('mission_submission_created', submission);
    res.status(previous ? 200 : 201).json({ success: true, data: submission });
  });

  router.patch('/mission-submissions/:id', (req, res) => {
    const submission = partyData.missionSubmissions.find((item) => item.id === req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: '제출 결과를 찾을 수 없습니다.' });
    }
    if (!['APPROVED', 'REJECTED'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: '승인 또는 반려 상태만 사용할 수 있습니다.' });
    }
    if (submission.status !== 'SUBMITTED') {
      return res.status(409).json({ success: false, message: '이미 판정된 제출입니다.' });
    }

    const mission = partyData.missions.find((item) => item.id === submission.missionId);
    const guest = partyData.guests.find((item) => item.id === submission.guestId);
    submission.status = req.body.status;
    submission.reviewNote = String(req.body.reviewNote || '').trim();
    submission.reviewedAt = new Date().toISOString();

    let rewardCoupon = null;
    if (submission.status === 'APPROVED' && mission && guest) {
      rewardCoupon = issueReward(mission, guest);
      const resultPopup = {
        id: `popup_${Date.now()}`,
        type: 'result',
        title: '🏆 미션 결과 발표!',
        message: `${guest.name}님이 '${mission.title}' 미션에 성공했습니다!`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        highlight: `보상: ${mission.reward}`,
        actionText: '보상 확인하기',
      };
      partyData.popups.unshift(resultPopup);
      io.emit('host_broadcast', resultPopup);
    }

    const payload = { submission, mission, guest, rewardCoupon };
    io.emit('mission_submission_reviewed', payload);
    res.json({ success: true, data: payload });
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
