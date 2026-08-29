'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';

const SocketContext = createContext();

const SOCKET_SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [party, setParty] = useState(null);
  const [host, setHost] = useState(null);
  const [guests, setGuests] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('guest_001'); // default to 이지우
  const [isHostMode, setIsHostMode] = useState(false);
  const [missions, setMissions] = useState([]);
  const [missionSubmissions, setMissionSubmissions] = useState([]);
  const [popups, setPopups] = useState([]);
  const [latestPopup, setLatestPopup] = useState(null);
  const [rollingPapers, setRollingPapers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [scannedPartner, setScannedPartner] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'quests', 'scan', 'rolling', 'profile'
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHostControlOpen, setIsHostControlOpen] = useState(false);

  // Trigger Confetti Effect
  const triggerConfetti = (options = {}) => {
    confetti({
      particleCount: options.particleCount || 100,
      spread: options.spread || 70,
      origin: options.origin || { y: 0.6 },
      colors: ['#0EA5E9', '#38BDF8', '#0284C7', '#67E8F9', '#93C5FD', '#FCD34D'],
    });
  };

  // Initial Fetch
  const fetchData = async () => {
    try {
      const [partyRes, guestsRes, missionsRes, submissionsRes, popupsRes, rollingRes] = await Promise.all([
        fetch('/api/party').then((r) => r.json()),
        fetch('/api/guests').then((r) => r.json()),
        fetch('/api/missions').then((r) => r.json()),
        fetch('/api/mission-submissions').then((r) => r.json()),
        fetch('/api/popups').then((r) => r.json()),
        fetch('/api/rolling-papers').then((r) => r.json()),
      ]);

      if (partyRes.success) {
        setParty(partyRes.data);
        setHost(partyRes.data.host);
      }
      if (guestsRes.success) setGuests(guestsRes.data);
      if (missionsRes.success) setMissions(missionsRes.data);
      if (submissionsRes.success) setMissionSubmissions(submissionsRes.data);
      if (popupsRes.success) {
        setPopups(popupsRes.data);
        if (popupsRes.data.length > 0) {
          setLatestPopup(popupsRes.data[0]);
        }
      }
      if (rollingRes.success) setRollingPapers(rollingRes.data);

      if (currentUserId) {
        fetchRewards(currentUserId);
      }
    } catch (err) {
      console.warn('Backend API connection warning, falling back to local sync:', err);
    }
  };

  const fetchRewards = async (guestId) => {
    try {
      const res = await fetch(`/api/rewards/${guestId}`).then((r) => r.json());
      if (res.success) setRewards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to Party Socket Server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from Party Socket Server');
      setConnected(false);
    });

    newSocket.on('host_broadcast', (newPopup) => {
      setPopups((prev) => [newPopup, ...prev]);
      setLatestPopup(newPopup);
      triggerConfetti({ particleCount: 60, spread: 60 });
    });

    newSocket.on('mission_created', (newMission) => {
      setMissions((prev) => [newMission, ...prev]);
    });

    newSocket.on('mission_submission_created', (submission) => {
      setMissionSubmissions((prev) => [
        submission,
        ...prev.filter((item) => item.id !== submission.id),
      ]);
    });

    newSocket.on('mission_submission_reviewed', ({ submission, mission, guest, rewardCoupon }) => {
      setMissionSubmissions((prev) =>
        prev.map((item) => (item.id === submission.id ? submission : item))
      );
      if (mission) {
        setMissions((prev) =>
          prev.map((item) => (item.id === mission.id ? mission : item))
        );
      }
      if (guest) {
        setGuests((prev) =>
          prev.map((item) => (item.id === guest.id ? guest : item))
        );
      }
      if (rewardCoupon?.guestId === currentUserId) {
        setRewards((prev) => [
          rewardCoupon,
          ...prev.filter((item) => item.id !== rewardCoupon.id),
        ]);
        triggerConfetti({ particleCount: 120, spread: 90 });
      }
    });

    newSocket.on('mission_completed', ({ mission, guestId, guestName, rewardCoupon }) => {
      setMissions((prev) =>
        prev.map((m) =>
          m.id === mission.id
            ? { ...m, completedBy: [...new Set([...m.completedBy, guestId])] }
            : m
        )
      );
      if (guestId === currentUserId) {
        setRewards((prev) => [rewardCoupon, ...prev]);
        triggerConfetti({ particleCount: 120, spread: 90 });
      }
    });

    newSocket.on('rolling_paper_created', (newEntry) => {
      setRollingPapers((prev) => [newEntry, ...prev]);
    });

    newSocket.on('guest_joined', (newGuest) => {
      setGuests((prev) => [...prev.filter((g) => g.id !== newGuest.id), newGuest]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [currentUserId]);

  // Current User Object
  const currentUser = guests.find((g) => g.id === currentUserId) || guests[0] || null;

  // 1. Host Broadcast Popup
  const broadcastPopup = async (popupPayload) => {
    try {
      const res = await fetch('/api/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(popupPayload),
      }).then((r) => r.json());
      return res;
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Create Mission
  const createMission = async (missionPayload) => {
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missionPayload),
      }).then((r) => r.json());
      return res;
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Complete Mission
  const completeMission = async (missionId) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/missions/${missionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: currentUser.id }),
      }).then((r) => r.json());
      
      if (res.success) {
        setGuests((prev) =>
          prev.map((g) =>
            g.id === currentUser.id
              ? {
                  ...g,
                  points: res.data.guestPoints,
                  completedMissions: [...new Set([...g.completedMissions, missionId])],
                }
              : g
          )
        );
        fetchRewards(currentUser.id);
        triggerConfetti({ particleCount: 150, spread: 80 });
      }
      return res;
    } catch (err) {
      console.error(err);
    }
  };

  // ALPHA-TODO(owner: mission, consumer: shared-data)
  // 현재 REST/Socket adapter를 Supabase mission_submissions adapter로 교체한다.
  // fallback: 기존 in-memory API가 동일한 제출/검수 계약을 제공한다.
  const submitMission = async (missionId, payload) => {
    if (!currentUser) return { success: false, message: '게스트 정보가 없습니다.' };
    try {
      const res = await fetch(`/api/missions/${missionId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: currentUser.id, ...payload }),
      }).then((response) => response.json());
      if (res.success) {
        setMissionSubmissions((prev) => [
          res.data,
          ...prev.filter((item) => item.id !== res.data.id),
        ]);
      }
      return res;
    } catch (err) {
      console.error(err);
      return { success: false, message: '미션 제출 중 오류가 발생했습니다.' };
    }
  };

  const reviewMissionSubmission = async (submissionId, status, reviewNote = '') => {
    try {
      const res = await fetch(`/api/mission-submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote }),
      }).then((response) => response.json());
      if (res.success) {
        const { submission, mission, guest, rewardCoupon } = res.data;
        setMissionSubmissions((prev) =>
          prev.map((item) => (item.id === submission.id ? submission : item))
        );
        if (mission) {
          setMissions((prev) => prev.map((item) => (item.id === mission.id ? mission : item)));
        }
        if (guest) {
          setGuests((prev) => prev.map((item) => (item.id === guest.id ? guest : item)));
        }
        if (rewardCoupon?.guestId === currentUserId) fetchRewards(currentUserId);
      }
      return res;
    } catch (err) {
      console.error(err);
      return { success: false, message: '미션 판정 중 오류가 발생했습니다.' };
    }
  };

  // 4. Scan QR & Match Partner
  const scanQRCode = async (targetId) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/guests/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scannerId: currentUser.id, targetId }),
      }).then((r) => r.json());

      if (res.success) {
        setScannedPartner(res.data.target);
        // update local scanned list
        setGuests((prev) =>
          prev.map((g) =>
            g.id === currentUser.id
              ? {
                  ...g,
                  points: g.points + (res.data.isNewDiscovery ? 30 : 0),
                  scannedGuests: [...new Set([...g.scannedGuests, targetId])],
                }
              : g
          )
        );
        triggerConfetti({ particleCount: 80, spread: 60 });
      }
      return res;
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Send Rolling Paper
  const sendRollingPaper = async (paperPayload) => {
    try {
      const res = await fetch('/api/rolling-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paperPayload),
      }).then((r) => r.json());
      return res;
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Register/Update Guest Profile
  const registerGuest = async (profilePayload) => {
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      }).then((r) => r.json());
      if (res.success) {
        setCurrentUserId(res.data.id);
        setGuests((prev) => [...prev, res.data]);
        triggerConfetti();
      }
      return res;
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Use Reward Coupon
  const useRewardCoupon = async (rewardId) => {
    try {
      const res = await fetch(`/api/rewards/${rewardId}/use`, {
        method: 'POST',
      }).then((r) => r.json());
      if (res.success) {
        setRewards((prev) =>
          prev.map((r) => (r.id === rewardId ? { ...r, isUsed: true } : r))
        );
      }
      return res;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        party,
        host,
        guests,
        currentUser,
        currentUserId,
        setCurrentUserId,
        isHostMode,
        setIsHostMode,
        missions,
        missionSubmissions,
        popups,
        latestPopup,
        setLatestPopup,
        rollingPapers,
        rewards,
        scannedPartner,
        setScannedPartner,
        activeTab,
        setActiveTab,
        isScannerOpen,
        setIsScannerOpen,
        isHostControlOpen,
        setIsHostControlOpen,
        triggerConfetti,
        broadcastPopup,
        createMission,
        completeMission,
        submitMission,
        reviewMissionSubmission,
        scanQRCode,
        sendRollingPaper,
        registerGuest,
        useRewardCoupon,
        fetchData,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
