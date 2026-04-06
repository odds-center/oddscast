# 🗺️ OddsCast Feature Roadmap

> **AI-based horse racing prediction information service — feature plan & roadmap.**
>
> This document defines features to implement, services to enhance, and the
> overall product direction. It must be read before any planning/development
> session via `CLAUDE.md` and `.claude/rules/`.
>
> **Last updated:** 2026-04-06

---

## 0. Service Identity (Reminder)

| Principle | Detail |
|-----------|--------|
| **Core** | AI analysis content service — NOT a betting/gambling platform |
| **Revenue** | Subscription + individual ticket purchase + matrix ticket |
| **Users** | 40–60 age group, interested in horse racing analysis |
| **Legal** | Information service (like stock investment newsletters) |

---

## 1. Current Feature Status

### ✅ Implemented (Live)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Race list (today / by date) | ✅ Done | Home, `/races` |
| 2 | Race detail (entries, results, preview) | ✅ Done | `/races/[id]` |
| 3 | AI prediction (preview + full) | ✅ Done | Preview free, full via ticket |
| 4 | Race results | ✅ Done | `/results` |
| 5 | Daily matrix guide (Yongsan-style) | ✅ Done | `/predictions/matrix` |
| 6 | Race schedule calendar | ✅ Done | `/races/schedule` |
| 7 | RACE ticket system | ✅ Done | Subscribe / purchase / points |
| 8 | MATRIX ticket system | ✅ Done | ₩1,000/ticket, 1 day = 1 ticket |
| 9 | Subscription plans (3 tiers) | ✅ Done | Light / Standard / Premium |
| 10 | ~~Points system~~ | ❌ Removed | Module fully deleted — entities, API, types, UI all removed |
| 11 | Ranking | ✅ Done | `/ranking` |
| 12 | Notifications | ✅ Done | Push (mobile), in-app |
| 13 | Profile / settings | ✅ Done | Edit, password, notification prefs |
| 14 | Auth (email/password) | ✅ Done | JWT, 로그인/회원가입/로그아웃/회원탈퇴 |
| 15 | Legal pages | ✅ Done | Terms, privacy, refund |
| 16 | KRA data sync (cron) | ✅ Done | Plan, entry, results, backfill |
| 17 | Data consistency cron | ✅ Done | Orphaned race detection + backfill |
| 18 | Admin panel | ✅ Done | Users, AI config, sync, stats |
| 19 | 오늘의 경마운세 (Today's Racing Fortune) | ✅ Done | Home — 로그인 시 4항목 카드, 참고용·오락 목적 |
| 20 | 구독 PG (토스페이먼츠) | ✅ Done | 빌링키·첫 결제·정기 결제 크론, 결제창 연동 |
| 21 | 예측 정확도 대시보드 | ✅ Done | `/predictions/accuracy` — 전체/월별/경마장별 |
| 22 | 마필 프로필 (Horse Performance) | ✅ Done | `/horses/[hrNo]` — 통산·최근 폼·경주 이력 |
| 23 | 기수·조교사 프로필 (Jockey & Trainer) | ✅ Done | `/jockeys/[jkNo]`, `/trainers/[trName]` — 통산·경마장별·경주 이력 |
| 24 | Smart Race Alerts (고신뢰도 예측 알림) | ✅ Done | 예측 생성 시 winProb≥70% → predictionEnabled 사용자에게 알림 |
| 25 | 경주 상태(종료/예정) 정책 | ✅ Done | COMPLETED는 KRA 결과 적재 시에만 설정. UI는 출전번호·마명 표기(마번 미사용). [RACE_STATUS_AND_KRA.md](features/RACE_STATUS_AND_KRA.md) |
| 26 | 연속 로그인 보너스 | ✅ Done | 연속 7일: RACE 예측권 1장. 일일 포인트 보너스는 Points 모듈 제거로 삭제. [BUSINESS_LOGIC.md](architecture/BUSINESS_LOGIC.md) §2.7 |
| 27 | shadcn/ui 마이그레이션 | ✅ Done | WebApp UI 컴포넌트를 shadcn/ui(Radix UI 기반)로 마이그레이션. 14개 shadcn 컴포넌트 추가 |
| 28 | Welcome 페이지 | ✅ Done | `/welcome` — 신규 사용자 환영·온보딩 페이지 |
| 29 | 홈페이지 리디자인 | ✅ Done | AIPredictionSection, WhyOddsCastSection 추가. 섹션 UI 개선 |
| 30 | Discord 알림 | ✅ Done | 회원가입·서버 에러 Discord 채널 알림 (Bot API) |
| 31 | SEO/OG 메타 태그 | ✅ Done | 전체 페이지 OG meta + 1200x630 이미지 + per-page 설명 |
| 32 | On-demand KRA 결과 조회 | ✅ Done | 경주 상세에서 결과 없으면 KRA API on-demand fetch. Gemini 디커플링 |
| 33 | 이메일 발송 (Resend) | ✅ Done | 비밀번호 리셋·이메일 인증 Resend API 기반 |
| 34 | 온보딩 DB 저장 | ✅ Done | User.hasSeenOnboarding — localStorage에서 DB 기반으로 변경 |
| 35 | 카카오 소셜 로그인 | ✅ Done | `/auth/kakao` OAuth 2.0. passport-kakao. DB: kakaoId/provider. WebApp: 로그인·회원가입에 카카오 버튼. 회원가입 보너스 자동 지급. |

---

## 2. Short-term Roadmap (Phase 1 — 1–2 months)

### 2.1 🎯 Prediction Accuracy Dashboard — ✅ Implemented

> Users need confidence. Show them how accurate the AI is.

| Item | Detail |
|------|--------|
| **What** | Public page showing AI prediction accuracy stats |
| **Metrics** | Overall hit rate, Top-3 accuracy, monthly trends, by-meet breakdown |
| **Route** | `/predictions/accuracy` |
| **Data source** | `Prediction.accuracy` field (already calculated on result confirmation) |
| **Priority** | ⭐⭐⭐ HIGH — builds user trust |

**Implementation plan:**
- Server: `GET /api/predictions/accuracy-stats` — aggregates from Prediction table
- WebApp: Page with charts (accuracy trend line, meet-by-meet bar chart)
- Components: `AccuracyCard`, `AccuracyTrendChart`, `MeetAccuracyTable`

---

### 2.2 🏇 Race Day Live Mode — ✅ Implemented

> On race days (Fri/Sat/Sun), provide a real-time experience.

| Item | Detail |
|------|--------|
| **What** | Live race status indicator — upcoming / in-progress / finished |
| **Where** | Home page badge + race list status pills |
| **Data** | Race.status + scheduled start time (rcTime) + real-time result sync |
| **Priority** | ⭐⭐⭐ HIGH — engagement on race days |

**Implementation plan:**
- Enhance `DateHeader` with live countdown to next race
- Race card shows "Starting in 15 min" / "In Progress" / "Finished" badges
- Auto-refresh race list every 5 min on race days (react-query refetchInterval)
- Server: Existing real-time cron already syncs every 30 min on race days

---

### 2.3 📊 Horse Performance Profile — ✅ Implemented

> Users want to research individual horses before checking AI predictions.

| Item | Detail |
|------|--------|
| **What** | Horse detail page — race history, win rate, form trend, rating change |
| **Route** | `/horses/[hrNo]` (linked from race detail entry list) |
| **Data** | Aggregated from `RaceEntry` + `RaceResult` by hrNo |
| **Priority** | ⭐⭐⭐ HIGH — core research tool for users |

**Implementation plan:**
- Server: `GET /api/horses/:hrNo/profile` — aggregates last 20 races, calculates stats
- Server: `GET /api/horses/:hrNo/history` — paginated race history
- WebApp: Horse profile card (name, age, sex, total races, win rate)
- WebApp: Form chart (last 10 races finishing position line graph)
- WebApp: Rating trend (if available from KRA data)

---

### 2.4 🏆 Jockey & Trainer Profiles — ✅ Implemented

> Similar to horse profiles but for jockeys and trainers.

| Item | Detail |
|------|--------|
| **What** | Jockey/Trainer detail page — career stats, recent form, win rate |
| **Route** | `/jockeys/[jkNo]`, `/trainers/[trName]` |
| **Data** | From `RaceEntry` + `RaceResult` + `JockeyTotalResult` |
| **Priority** | ⭐⭐ MEDIUM |

**Implementation plan:**
- Server: `GET /api/jockeys/:jkNo/profile`, `GET /api/trainers/:name/profile`
- WebApp: Profile card + recent results table + meet-wise breakdown

---

### 2.5 🔔 Smart Race Alerts — ✅ Partially Implemented

> Proactive notifications about interesting races.

| Item | Detail |
|------|--------|
| **What** | Automated alerts: "High-confidence prediction ready", "Big race today" |
| **Trigger** | Post-prediction hook (generatePrediction) — confidence from top winProb |
| **Types** | `HIGH_CONFIDENCE` (winProb ≥ 70%) ✅ Done; `BIG_RACE`, `FIRST_RACE_SOON` optional later |
| **Priority** | ⭐⭐ MEDIUM |

**Implemented:**
- Server: After prediction create, if max(winProb) in scores ≥ 70%, `NotificationsService.notifyHighConfidencePrediction()` creates in-app Notification for users with `predictionEnabled: true`.
- Respects `UserNotificationPreference.predictionEnabled` (default true).

**Optional (future):**
- `BIG_RACE`: Cron or hook when race.rank is "국1등급" etc. → notify "Big race today".
- `FIRST_RACE_SOON`: Cron that finds races with stTime in ~1 hour → notify "First race starts soon".

---

### 2.6 🍀 오늘의 경마운세 (Today's Racing Fortune) — ✅ Implemented

> Home 메인에 가벼운 "오늘의 운세" 카드 — 오락·참고용, 사행성 없음.

| Item | Detail |
|------|--------|
| **What** | 한 줄 운세, 행운의 번호·색, 키워드 등 (참고용) |
| **Where** | Home (`/`) — DateHeader 근처 카드/배너 |
| **Data** | 유저별·날짜별 1건 DB 저장, 4항목(종합·경주·조언·행운 요소) 랜덤 풀 |
| **Priority** | ⭐⭐ MEDIUM — engagement, 재방문 동기 |

**Spec:** [features/TODAYS_RACING_FORTUNE.md](features/TODAYS_RACING_FORTUNE.md)

---

## 3. Mid-term Roadmap (Phase 2 — 3–4 months)

### 3.1 📈 Prediction Comparison (Before vs After) — ✅ Implemented

> Show how AI prediction matched actual results after race completion.

| Item | Detail |
|------|--------|
| **What** | Side-by-side view: AI's predicted top horses vs actual finishing order |
| **Where** | Race detail page — section "예측 vs 결과" (below 경주 결과) |
| **Value** | Users see the AI's track record per race — builds long-term trust |
| **Priority** | ⭐⭐⭐ HIGH |

**Implemented:**
- Component: `PredictionResultComparison` — predicted rank ↔ actual rank (1st/2nd/3rd)
- Green check for rank match, red X for miss; "이 경주 적중: X/3" badge
- Shown only for COMPLETED races with both prediction and results

---

### 3.2 🧮 Custom Prediction Simulator — ✅ Implemented

> Let users adjust weights and see how predictions change.

| Item | Detail |
|------|--------|
| **What** | Interactive tool: adjust rating/form/condition weights, see re-ranked horses |
| **Route** | `/races/[id]/simulator` |
| **Value** | Engagement tool — users feel like they're part of the analysis |
| **Priority** | ⭐⭐ MEDIUM |

**Implemented:**
- Page `/races/[id]/simulator` — client-side only, uses prediction preview scores
- Six sliders: 레이팅, 폼, 컨디션, 경험, 체력, 조교사 (0.5–1.5, default 1)
- Synthetic factors per horse (sum = AI score); custom score = weighted sum → re-rank
- "AI 기본값으로" reset button; "결과 공유" copies top-3 text to clipboard
- Race detail: link "가중치를 조절해 보기 → 커스텀 예측 시뮬레이터" when horseScores exist

---

### 3.3 📅 Weekly Preview Report — ✅ Implemented

> A curated weekly summary of upcoming races and AI insights.

| Item | Detail |
|------|--------|
| **What** | Auto-generated weekly content: key races, horses to watch, trends |
| **Route** | `/weekly-preview` |
| **Generation** | Cron Thursday 20:00 KST — Gemini summary for upcoming Fri/Sat/Sun races |
| **Priority** | ⭐⭐ MEDIUM |

**Implemented:**
- Server: `WeeklyPreview` model (weekLabel, content Json); GET /api/weekly-preview (latest or ?week=)
- Cron: Thu 20:00 Asia/Seoul → generate(); fetches races for next Fri–Sun, Gemini 1.5 Flash JSON (highlights, horsesToWatch, trackConditions)
- WebApp: /weekly-preview card layout — 이번 주 하이라이트, 주목할 말, 트랙·날씨; home menu link "주간프리뷰"
- Free for all users

---

### 3.4 📱 Push Notification Deep Links — ✅ Server implemented

> Tapping a push notification opens the relevant page.

| Item | Detail |
|------|--------|
| **What** | Push → opens specific race, prediction, or subscription page |
| **Platform** | Mobile (FCM push + deep link) |
| **Priority** | ⭐⭐ MEDIUM |

**Implemented (server):**
- All FCM push payloads include `data.deepLink` (WEBAPP_BASE_URL env + path)
- Admin send: `deepLink` = `/mypage/notifications`
- High-confidence prediction push: `deepLink` = `/races/{raceId}`; Smart Alert now sends FCM push (not only in-app notification) so tap opens race detail

**Remaining (mobile):** Configure RN CLI deep linking; WebView handle `data.deepLink` on notification tap and set `window.location` / navigate to path

---

### 3.5 🎁 Referral & Promotion System — ❌ Removed

> Removed from service. All code, entities, API, UI, and DB schema deleted.

---

## 4. Long-term Roadmap (Phase 3 — 5–6 months)

### 4.1 🤝 Community Predictions (Social Feature)

> Users share their own predictions and compete.

| Item | Detail |
|------|--------|
| **What** | Users submit their top-3 prediction before race starts, compare with AI |
| **Scoring** | Points for correct predictions (similar to fantasy sports) |
| **Ranking** | Weekly/monthly community leaderboard |
| **Value** | Social engagement without gambling — pure prediction competition |
| **Priority** | ⭐ FUTURE |

**Key rules (no gambling):**
- No money involved — points only
- No horse/bet selection — just pick top 3 finishing order
- Results compared after race — leaderboard updated
- Monthly prizes: bonus RACE tickets for top predictors

---

### 4.2 📊 Advanced Analytics Dashboard

> Deep analytics for power users.

| Item | Detail |
|------|--------|
| **What** | Track-level stats, horse class migration, jockey-horse combo success rates |
| **Route** | `/analytics` |
| **Audience** | Subscribed users (premium content) |
| **Priority** | ⭐ FUTURE |

**Possible features:**
- Track condition impact analysis (firm vs soft)
- Distance specialty charts per horse
- Jockey-trainer combo win rates
- Post position (gate number) advantage by meet
- Weather impact on race outcomes

---

### 4.3 🌐 Multi-language Support

> Expand to international horse racing enthusiasts.

| Item | Detail |
|------|--------|
| **What** | English + Japanese language options |
| **Approach** | `next-intl` or `next-i18next` |
| **Priority** | ⭐ FUTURE |

---

### 4.4 🎙️ AI Race Commentary

> Real-time AI-generated commentary for each race.

| Item | Detail |
|------|--------|
| **What** | Race-by-race AI commentary — pre-race analysis + post-race review |
| **Format** | Text-based, card UI, auto-generated after results |
| **Tone** | Professional sports commentary style — exciting but informative |
| **Priority** | ⭐ FUTURE |

---

## 5. UX Enhancement Backlog

### 5.1 Onboarding Flow
- [x] First-time user tutorial (swipe through key features) ✅
- [x] "Try a free prediction" — 1 complimentary RACE ticket on signup ✅
- [x] Tooltip hints on first visit to prediction matrix page ✅

**First-time tutorial (implemented):** Full-screen overlay on first visit (localStorage `oddscast_onboarding_tutorial_done`). Four slides: 경주, 종합 예측, 결과, 정보. Swipe/키보드/버튼으로 진행, 건너뛰기·시작하기로 닫기.

**Signup bonus (implemented):** Server grants 1 RACE ticket (30-day expiry) on register; failure to grant is logged but does not block signup.

**Matrix first-visit hint (implemented):** Dismissible banner on `/predictions/matrix` explaining what the page does and that one matrix ticket unlocks the full day; stored in localStorage so it shows only once.

### 5.2 Personalization
- [x] "Your recent races" section on home page ✅
- [x] Favorite meet filter saved per user ✅
- [x] Prediction history — "My past predictions" page ✅

**Recent races (implemented):** Client-side only. Visiting a race detail pushes race ID to localStorage (max 10). Home shows "최근 본 경주" section with up to 5 races; links to race detail. No server or login required.

**Favorite meet (implemented):** User.favoriteMeet (서울|제주|부산경남); GET /auth/me and PUT /auth/profile. Races list: when logged in, initial meet from favoriteMeet; on meet change, save via updateProfile.

**My past predictions (implemented):** GET /prediction-tickets/my-predictions (page, limit). WebApp `/mypage/prediction-history` — list of predictions user viewed with RACE ticket; race label, usedAt, accuracy; link to race detail.

### 5.3 Content Quality
- [x] Rich prediction cards with mini charts (bar chart of horse scores) ✅
- [x] Race replay links (external KRA video when available) ✅
- [x] Post-race analysis summary (Gemini-generated after results) ✅

**Post-race summary (implemented):** Prediction.postRaceSummary (Gemini 2–3 sentences). Triggered when results are synced (ResultsService.bulkCreate, KRA fetchRaceResults). PredictionsService.generatePostRaceSummary(raceId); race detail shows "경주 후 분석" when present.

**Race replay (implemented):** When race has results, race detail shows "경주 영상 보기 (한국마사회)" linking to KRA e오늘의경주 portal (CONFIG.kra.replayPortalUrl). Per-race URL not provided by KRA API.

**Mini bar chart (implemented):** `HorseScoresBarChart` on race detail prediction full view — horizontal bars per horse score above the ranking table.

### 5.4 Performance
- [x] ISR (Incremental Static Regeneration) for race list pages ✅
- [ ] Image optimization for race/horse photos (apply when assets added: use next/image + alt)
- [x] Lazy load prediction matrix rows ✅

**ISR (implemented):** `/races` and `/results` use getStaticProps with revalidate: 60. Default view (no query) is pre-rendered and revalidated every 60s.

**Lazy matrix (implemented):** PredictionMatrixTable shows first 12 rows when unlocked; Intersection Observer loads 12 more as user scrolls to bottom.

### 5.5 Accessibility
- [x] High contrast mode (for 40–60 age users) ✅
- [x] Font size toggle (small / medium / large) ✅
- [x] Screen reader compatibility audit (skip link, main/nav landmarks, checklist doc) ✅

**Screen reader (implemented):** Skip-to-main-content link (visible on focus). Main has id="main-content", role="main". Nav has aria-label. See docs/features/ACCESSIBILITY.md for checklist.

**High contrast & font size (implemented):** Settings → "보기 설정". Zustand + localStorage (`oddscast_accessibility`). High contrast: CSS vars for border/text. Font size: html font-size 14/16/18px. Applied via data-high-contrast, data-font-size on documentElement.

---

## 6. Technical Debt & Infrastructure

| Item | Priority | Detail |
|------|----------|--------|
| Payment gateway integration | ⭐⭐⭐ HIGH | Real PG (Toss Payments / NicePay) for subscription & purchases |
| App Store deployment | ⭐⭐⭐ HIGH | iOS App Store + Google Play Store submission |
| Monitoring & alerting | ⭐⭐ MEDIUM | Sentry for errors, Uptime monitoring, API latency tracking |
| CI/CD pipeline | ⭐⭐ MEDIUM | GitHub Actions for test + build + deploy |
| Rate limiting | ⭐⭐ MEDIUM | Prevent API abuse, protect KRA sync endpoints |
| Database backups | ⭐⭐ MEDIUM | Automated daily PostgreSQL backups |
| 보안 감사 | ✅ Done | OWASP 감사 완료. IDOR 3건, brute-force 잠금, bcrypt 강화. `docs/SECURITY_AUDIT.md` 참고. |
| Admin BI 대시보드 | ✅ Done | `GET /api/admin/analytics/dashboard` + `admin/src/pages/bi-dashboard.tsx`. 5개 섹션, 60초 자동갱신. |
| Load testing | ⭐ LOW | Simulate race day traffic spikes |
| CDN for static assets | ⭐ LOW | CloudFront / Vercel Edge for webapp |

**Rate limiting (implemented):** @nestjs/throttler. Global: 120 req/min + 2000 req/hour per IP. Health controller uses @SkipThrottle() for LB checks.

**CI (implemented):** .github/workflows/ci.yml — on push/PR to master|main: pnpm install, lint server + webapp, build shared → server → webapp → admin.

---

## 7. Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  Prediction       │  Horse Profile    │
    │  Accuracy Page    │  Page             │
    │                   │                   │
    │  Race Day Live    │  Prediction vs    │
    │  Mode             │  Result Compare   │
    │                   │                   │
LOW ├───────────────────┼───────────────────┤ HIGH
EFF │                   │                   │ EFFORT
ORT │  Smart Alerts     │  Custom Simulator │
    │                   │                   │
    │  Weekly Preview   │  Community        │
    │                   │  Predictions      │
    │  Deep Links       │                   │
    │                   │  Advanced         │
    │                   │  Analytics        │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                    LOW IMPACT
```

**Recommended execution order:**
1. Prediction Accuracy Dashboard (quick win, high trust)
2. Horse Performance Profile (core user need)
3. Race Day Live Mode (engagement)
4. Prediction vs Result Comparison (trust + engagement)
5. Jockey & Trainer Profiles (research completeness)
6. Weekly Preview Report (content marketing)
7. Smart Race Alerts (retention)

---

## 8. Non-Feature Priorities

### 8.1 Content Strategy
- Regular AI accuracy reports (monthly transparency report)
- "How to read AI predictions" educational content
- Race day highlights (auto-generated post-race summary)

### 8.2 User Retention
- Daily login bonus (small point reward)
- Streak rewards (7-day consecutive login = 1 free RACE ticket)
- Push notification timing optimization (send 30 min before first race)

### 8.3 Trust Building
- Display AI model version and analysis methodology
- Show prediction confidence level per race (low / medium / high)
- Transparent accuracy tracking visible to all users

---

## 9. Document References

| Document | Relevance |
|----------|-----------|
| [SERVICE_SPECIFICATION.md](SERVICE_SPECIFICATION.md) | Current feature definitions |
| [BUSINESS_LOGIC.md](architecture/BUSINESS_LOGIC.md) | Business rules for new features |
| [API_SPECIFICATION.md](architecture/API_SPECIFICATION.md) | API endpoints to extend |
| [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md) | Schema changes needed |
| [UI_PATTERNS.md](features/UI_PATTERNS.md) | Design patterns to follow |
| [WEBAPP_COMPLETENESS.md](features/WEBAPP_COMPLETENESS.md) | WebApp 완성도 체크리스트 (로딩/에러/빈 상태, 배포 전 점검) |
| [WEBAPP_PAGES_PLAN.md](features/WEBAPP_PAGES_PLAN.md) | WebApp 전체 페이지 계획표 (페이지별 체크·실행 순서) |

---

_This document should be reviewed and updated at the start of each development sprint._
