# Golden Race WebApp 가이드

> Next.js — Desktop/Mobile 반응형 웹앱 (port 3000)

---

## 테마 (라이트)

- **primary**: `#c9a227` (골드)
- **background**: `#fafafa`
- **폰트**: Syne (제목), Plus Jakarta Sans (본문)
- **아이콘**: Lucide React

---

## 실행

```bash
cd webapp
npm install
npm run dev
# → http://localhost:3000
```

---

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `NEXT_PUBLIC_API_URL` | Server API | `http://localhost:3001/api` |
| `NEXT_PUBLIC_WEBAPP_URL` | 배포 URL | `http://localhost:3000` |

---

## 페이지 (라우트)

| 경로 | 설명 |
|------|------|
| `/` | 경주 목록 |
| `/races/[id]` | 경주 상세 |
| `/auth/login`, `/auth/register`, `/auth/forgot-password` | 인증 |
| `/profile`, `/profile/edit` | 내 정보 |
| `/mypage/subscriptions`, `/mypage/subscription-checkout?planId=`, `/mypage/notifications`, `/mypage/ticket-history`, `/mypage/point-transactions` | 마이페이지 |
| `/settings`, `/settings/notifications` | 설정 (알림 설정 포함) |
| `/ranking`, `/results` | 기타 |

---

## 참조

**상세:** [WEBAPP_DEVELOPMENT.md](WEBAPP_DEVELOPMENT.md) — 페이지 컴포넌트, 모바일 최적화, 구독 플로우
