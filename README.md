# 🧊 BeattheIce (파티 아이스브레이킹 & 퀘스트 웹앱)

> **파티에서 처음 만난 사람들 간의 어색함을 깨고 소외되는 사람 없이 파티 분위기 HIGH를 돕는 실시간 모바일 웹앱**

---

## ✨ 핵심 기능

### 🎭 PARTY HOST (호스트)
- **실시간 멘트 방송 (POPUP)**: 일반 공지 💬, 게릴라 미션 발동 🚨, 미션 결과 및 우승자 발표 🏆
- **파티 퀘스트 등록**: 보상(드링크 쿠폰, 선물 등) 및 획득 포인트 설정
- **게스트 실시간 랭킹 & 현황 모니터링**

### 🎉 PARTY GUEST (게스트)
- **내 프로필 & QR 명함**: 사진, MBTI, 한 줄 소개문, 취향 태그 칩 (주량, 흡연, 취미 등)
- **상대방 QR 스캔 & 인연 도감**: 카메라 또는 시뮬레이션으로 상대방 QR 스캔 시 상세 프로필 카드 오픈 및 인연 도감 자동 등록
- **아이스브레이킹 대화 팁 & 건배하기 🥂**: 어색할 때 바로 꺼내 쓸 수 있는 질문/답변 팁과 실시간 건배 인터랙션
- **미션 수행 & 드링크 보상 쿠폰함**: 퀘스트 완수 시 실시간 축하 팡파레와 바우처 쿠폰 발급
- **실시간 파티 롤링페이퍼**: 익명 🤫 또는 실명으로 따뜻한 응원/칭찬 메시지 교환

---

## 🛠️ 기술 스택

- **Framework**: Next.js (App Router), 커스텀 Node 서버로 Express + Socket.IO 통합
- **Backend**: Node.js, Express, Socket.IO (실시간 양방향 통신)
- **Frontend**: React, Tailwind CSS, Lucide Icons, Framer Motion
- **QR & Interactive**: `qrcode.react`, `html5-qrcode`, `canvas-confetti`

---

## 🚀 빠른 시작 가이드 (Getting Started)

### 1. 저장소 클론 및 패키지 설치
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
cd BeatTheIce
npm install
```

### 2. 개발 모드 실행
```bash
npm run dev
```
Next.js 페이지 렌더링, REST API(`/api/*`), Socket.IO가 모두 같은 포트(기본 `3001`)에서 함께 실행됩니다.
브라우저에서 `http://localhost:3001`으로 접속합니다.

### 3. 프로덕션 빌드 & 실행
```bash
npm run build
npm start
```
