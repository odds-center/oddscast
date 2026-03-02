# 📡 API 명세서 (API Specification)

> **서버 Controller 엔드포인트 ↔ WebApp/Admin API 호출의 1:1 매핑 문서**
>
> Global Prefix: `/api` (모든 라우트 앞에 자동 추가)
>
> **클라이언트:** WebApp (`webapp/lib/api/`) — 메인 클라이언트. Mobile은 WebView로 WebApp 로드. Admin (`admin/src/lib/api/`).

**Last updated:** 2026-03-02

### Admin 전용 Base URL

Admin은 `/api/admin` prefix로 별도 base URL 사용:

- **Env:** `NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3001/api/admin`
- **경로:** `/auth/login`, `/users`, `/statistics/dashboard` 등 (base에 `/api/admin` 포함)
- **Auth:** `admin-auth.controller.ts` — `/api/admin/auth/login`, `/api/admin/auth/me`, `/api/admin/auth/refresh`

---

## 공통 규칙

### 응답 포맷

```json
{
  "data": "<실제 데이터>",
  "status": 200,
  "message": "optional message"
}
```

### 인증

- `🔓` = 인증 불필요 (Public)
- `🔐` = JWT Bearer Token 필요 (`Authorization: Bearer <token>`)

### 페이지네이션 (공통)

```
?page=1&limit=20
```

---

## 0. Health (헬스체크) — prefix 제외

> 서버: `server/src/health/health.controller.ts`  
> **Global prefix 제외:** `main.ts`에서 `api` prefix를 적용하지 않음. LB/모니터링(UptimeRobot 등)에서 사용.

| Method | Route              | 설명                    | Auth |
| ------ | ------------------ | ----------------------- | ---- |
| `GET`  | `/health`          | 간단 헬스 (status, timestamp, service, version) | 🔓   |
| `GET`  | `/health/detailed` | 상세 (uptime, memory, nodeVersion, platform 등) | 🔓   |

- 응답은 `{ data }` 래핑 없이 JSON 객체 직접 반환.
- **업타임 모니터링:** [guides/MONITORING_SETUP.md](../guides/MONITORING_SETUP.md) §2 참고.

---

## 1. Auth (인증) — `/api/auth`

> Server: `server/src/auth/auth.controller.ts` WebApp: `webapp/lib/api/authApi.ts`

| Method   | Route                       | 설명                | Auth | Server 파일        |
| -------- | --------------------------- | ------------------- | ---- | ------------------ |
| `POST`   | `/auth/register`            | 회원가입            | 🔓   | auth.controller.ts |
| `POST`   | `/auth/login`               | 로그인 (이메일/비밀번호) | 🔓   | auth.controller.ts |
| `POST`   | `/auth/admin/login`        | 관리자 로그인 (구)   | 🔓 | auth.controller.ts |
| `POST`   | `/admin/auth/login`        | 관리자 로그인 (Admin 전용) | 🔓 | admin-auth.controller.ts |
| `GET`    | `/admin/auth/me`           | 관리자 내 정보       | 🔐   | admin-auth.controller.ts |
| `POST`   | `/admin/auth/refresh`      | 관리자 토큰 갱신     | 🔐   | admin-auth.controller.ts |
| `POST`   | `/auth/logout`              | 로그아웃            | 🔐   | auth.controller.ts |
| `POST`   | `/auth/refresh`             | 토큰 갱신           | 🔐   | auth.controller.ts |
| `GET`    | `/auth/me`                  | 내 정보 조회        | 🔐   | auth.controller.ts |
| `GET`    | `/auth/profile`             | 프로필 조회 (alias) | 🔐   | auth.controller.ts |
| `PUT`    | `/auth/profile`             | 프로필 수정         | 🔐   | auth.controller.ts |
| `PUT`    | `/auth/password`            | 비밀번호 변경       | 🔐   | auth.controller.ts |
| `POST`   | `/auth/forgot-password`     | 비밀번호 찾기       | 🔓   | auth.controller.ts |
| `POST`   | `/auth/reset-password`      | 비밀번호 재설정     | 🔓   | auth.controller.ts |
| `POST`   | `/auth/verify-email`        | 이메일 인증         | 🔓   | auth.controller.ts |
| `POST`   | `/auth/resend-verification` | 인증 메일 재발송    | 🔓   | auth.controller.ts |
| `GET`    | `/auth/check`               | 인증 상태 확인      | 🔐   | auth.controller.ts |
| `DELETE` | `/auth/account`             | 계정 삭제 (body: `{ password }`) | 🔐   | auth.controller.ts |

### 요청/응답 DTO

```typescript
// 회원가입
RegisterDto { email, password, name, nickname } — nickname 필수
→ { accessToken, user: SanitizedUser }

// 로그인
LoginDto { email, password }
→ { accessToken, user: SanitizedUser, loginBonus?: LoginBonusResult }
// loginBonus: 일일 보너스·연속 로그인 처리 결과 (dailyBonusGranted, dailyBonusPoints, consecutiveDays, consecutiveRewardGranted)

// 프로필 수정
UpdateProfileDto { name?, nickname?, avatar? }
→ User

// 비밀번호 변경
ChangePasswordDto { oldPassword, newPassword }
→ { message }
```

---

## Config (글로벌 설정) — `/api/config`

> Server: `server/src/config/config.controller.ts` WebApp: `webapp/lib/api/configApi.ts`

| Method   | Route         | 설명                  | Auth | 비고              |
| -------- | ------------- | --------------------- | ---- | ----------------- |
| `GET`    | `/config`     | 전체 설정 조회 (key-value) | 🔓   | |
| `PUT`    | `/config/:key` | 설정 값 변경          | 🔐 Admin | body: { value: string } |

---

## 2. Races (경기) — `/api/races`

> Server: `server/src/races/races.controller.ts` WebApp: `webapp/lib/api/raceApi.ts`

| Method   | Route                     | 설명             | Auth | 비고                                                                   |
| -------- | ------------------------- | ---------------- | ---- | ---------------------------------------------------------------------- |
| `GET`    | `/races`                  | 경주 목록 조회   | 🔓   | filters: meet, date, month, year, grade, distance, status, page, limit |
| `GET`    | `/races/today`            | 오늘 경주 목록   | 🔓   |                                                                        |
| `GET`    | `/races/by-date/:date`    | 날짜별 경기 목록 | 🔓   | date: YYYYMMDD 또는 YYYY-MM-DD                                          |
| `GET`    | `/races/schedule`         | 경주 일정 조회   | 🔓   | dateFrom, dateTo, meet                                                 |
| `GET`    | `/races/schedule-dates`  | 경마 시행일 목록 | 🔓   | dateFrom, dateTo, meet — 날짜별·경마장별 경주 수 (KRA 동기화 DB 기준)   |
| `GET`    | `/races/calendar`         | 경주 달력        | 🔓   | year, month                                                            |
| `GET`    | `/races/search`           | 경주 검색        | 🔓   | q, meet, grade, distance, status, page, limit                          |
| `GET`    | `/races/statistics`       | 경주 통계        | 🔓   | meet, date, month, year                                                |
| `GET`    | `/races/:id`              | 경주 상세 조회   | 🔓   |                                                                        |
| `GET`    | `/races/:id/results`      | 경주 결과        | 🔓   |                                                                        |
| `GET`    | `/races/:id/entries`      | 출전마 목록      | 🔓   |                                                                        |
| `GET`    | `/races/:id/dividends`    | 배당률           | 🔓   |                                                                        |
| `GET`    | `/races/:id/analysis`     | AI 분석          | 🔓   |                                                                        |
| `POST`   | `/races`                  | 경주 생성        | 🔐   | Admin                                                                  |
| `PUT`    | `/races/:id`              | 경주 수정        | 🔐   | Admin                                                                  |
| `DELETE` | `/races/:id`              | 경주 삭제        | 🔐   | Admin                                                                  |
| `POST`   | `/races/:id/entries`      | 출전마 등록      | 🔐   | Admin                                                                  |
| `POST`   | `/races/:id/entries/bulk` | 출전마 일괄 등록 | 🔐   | Admin                                                                  |

### 요청 DTO

```typescript
RaceFilterDto { meet?, date?, month?, year?, grade?, distance?, status?, page?, limit? }
CreateRaceDto { raceName?, meet, meetName?, rcDate, rcNo, rcDist?, rcGrade?, rcCondition?, rcPrize?, weather?, trackState? }
CreateRaceEntryDto { hrNo, hrName, jkName, trName?, owName?, weight?, recentRanks? }
```

### 경주 결과 응답 (`GET /races/:id/results`)

```typescript
RaceResultDto[] {
  id, raceId, ord, ordType?, chulNo?, hrNo, hrName, jkName?, trName?,
  wgBudam?, wgHr?, rcTime?, diffUnit?,  // 착차
  winOdds?, plcOdds?                    // 단승/복승 배당율
}
```

### 구글 로그인 동작

- **신규**: 이메일·이름·프로필 이미지로 자동 회원가입
- **기존**: 즉시 로그인, avatar 갱신

---

## 3. Results (결과) — `/api/results`

> Server: `server/src/results/results.controller.ts` WebApp: `webapp/lib/api/resultApi.ts`

| Method   | Route                       | 설명                    | Auth |
| -------- | --------------------------- | ----------------------- | ---- |
| `GET`    | `/results`                  | 결과 목록               | 🔓   |
| `GET`    | `/results/statistics`       | 결과 통계               | 🔓   |
| `GET`    | `/results/export`           | 결과 내보내기           | 🔓   |
| `GET`    | `/results/search`           | 결과 검색               | 🔓   |
| `GET`    | `/results/validate/:raceId` | 결과 검증               | 🔐   |
| `GET`    | `/results/race/:raceId`     | 경주별 결과             | 🔓   |
| `GET`    | `/results/:id`              | 결과 상세               | 🔓   |
| `POST`   | `/results`                  | 결과 등록               | 🔐   |
| `POST`   | `/results/bulk`             | 결과 일괄 등록          | 🔐   |
| `POST`   | `/results/bulk-create`      | 결과 일괄 생성 (mobile) | 🔐   |
| `PUT`    | `/results/bulk-update`      | 결과 일괄 수정          | 🔐   |
| `PUT`    | `/results/:id`              | 결과 수정               | 🔐   |
| `DELETE` | `/results/:id`              | 결과 삭제               | 🔐   |

### 결과 목록 응답 (`GET /results`)

- **race**: meetName, rcNo, rcDate, **rcDist**
- **결과 항목**: ord, chulNo, hrNo, hrName, jkName, **rcTime** (1위 기록)

---

## 4. Predictions (AI 예측) — `/api/predictions`

> Server: `server/src/predictions/predictions.controller.ts` WebApp: `webapp/lib/api/predictionApi.ts`

| Method  | Route                                | 설명                  | Auth |
| ------- | ------------------------------------ | --------------------- | ---- |
| `GET`   | `/predictions`                       | 예측 목록             | 🔓   |
| `GET`   | `/predictions/dashboard`             | 예측 대시보드         | 🔓   |
| `GET`   | `/predictions/accuracy-history`      | 정확도 이력           | 🔓   |
| `GET`   | `/predictions/stats/accuracy`        | 평균 정확도           | 🔓   |
| `GET`   | `/predictions/stats/cost`            | AI 비용 합계          | 🔓   |
| `GET`   | `/predictions/analytics/dashboard`   | 분석 대시보드         | 🔓   |
| `GET`   | `/predictions/analytics/failures`    | 실패 원인 분석        | 🔓   |
| `POST`  | `/predictions/analytics/daily-stats` | 일일 통계 계산        | 🔐   |
| `GET`   | `/predictions/race/:raceId`          | 경주별 예측           | 🔓   |
| `GET`   | `/predictions/race/:raceId/preview`  | 예측 미리보기 (무료, 검수 통과만) | 🔓   |
| `GET`   | `/predictions/preview/:raceId`       | 예측 미리보기 (alias) | 🔓   |
| `GET`   | `/predictions/matrix`                | 종합 예상 매트릭스    | 🔓   | date, meet |
| `GET`   | `/predictions/commentary`            | AI 코멘트 피드        | 🔓   | date, meet, limit, offset |
| `GET`   | `/predictions/hit-record`            | 적중 내역 배너        | 🔓   | limit |
| `GET`   | `/predictions/:id`                   | 예측 상세             | 🔓   |
| `POST`  | `/predictions`                       | 예측 생성             | 🔐   |
| `PATCH` | `/predictions/:id/status`            | 예측 상태 변경        | 🔐   |

---

## 4-1. Analysis (KRA 통계·분석) — `/api/analysis`

> Server: `server/src/analysis/analysis.controller.ts`  
> KRA_ANALYSIS_STRATEGY.md 연동 — 마칠기삼, 기수 점수, 2단계 필터링

| Method | Route                              | 설명                                   | Auth |
| ------ | ---------------------------------- | -------------------------------------- | ---- |
| `GET`  | `/analysis/race/:raceId/jockey`    | 경주별 기수·말 통합 분석 (마칠기삼)    | 🔓   |

### 응답 예시

```json
{
  "entriesWithScores": [
    {
      "hrNo": "1",
      "hrName": "말1",
      "jkNo": "080103",
      "jkName": "박태종",
      "horseScore": 75.0,
      "jockeyScore": 37.0,
      "combinedScore": 56.0
    }
  ],
  "weightRatio": { "horse": 0.7, "jockey": 0.3 },
  "topPickByJockey": {
    "hrNo": "1",
    "hrName": "말1",
    "jkNo": "080103",
    "jkName": "박태종",
    "jockeyScore": 37.0
  }
}
```

---

## 4-2. Jockeys (기수) — `/api/jockeys`

> Server: `server/src/jockeys/jockeys.controller.ts` WebApp: `webapp/lib/api/jockeyApi.ts`

| Method | Route                      | 설명                         | Auth |
| ------ | -------------------------- | ---------------------------- | ---- |
| `GET`  | `/jockeys/:jkNo/profile`   | 기수 프로필 (통산·경마장별 승률, 최근 폼) | 🔓   |
| `GET`  | `/jockeys/:jkNo/history`    | 기수 경주 이력 (페이지네이션) | 🔓   | page, limit |

---

## 4-3. Trainers (조교사) — `/api/trainers`

> Server: `server/src/trainers/trainers.controller.ts` WebApp: `webapp/lib/api/trainerApi.ts`

| Method | Route                        | 설명                           | Auth |
| ------ | ---------------------------- | ------------------------------ | ---- |
| `GET`  | `/trainers/:trName/profile`  | 조교사 프로필 (통산·경마장별 승률, 최근 폼) | 🔓   |
| `GET`  | `/trainers/:trName/history`   | 조교사 경주 이력 (페이지네이션) | 🔓   | page, limit |

---

## 4-4. Horses (마필) — `/api/horses`

> Server: `server/src/horses/horses.controller.ts` WebApp: `webapp/lib/api/horseApi.ts`

| Method | Route                       | 설명                           | Auth |
| ------ | --------------------------- | ------------------------------ | ---- |
| `GET`  | `/horses/:hrNo/profile`      | 마필 프로필 (통산 성적, 최근 폼) | 🔓   |
| `GET`  | `/horses/:hrNo/history`      | 마필 경주 이력 (페이지네이션)   | 🔓   | page, limit |

---

## 4-5. Fortune (오늘의 경마운세) — `/api/fortune`

> Server: `server/src/fortune/fortune.controller.ts` WebApp: `webapp/lib/api/fortuneApi.ts`  
> 로그인 사용자·날짜별 1건. 참고용·오락 목적.

| Method | Route           | 설명                     | Auth |
| ------ | --------------- | ------------------------ | ---- |
| `GET`  | `/fortune/today` | 오늘의 경마운세 조회/생성 | 🔐   |

---

## 5. Users (사용자) — `/api/users`

> Server: `server/src/users/users.controller.ts` WebApp: `webapp/lib/api/userApi.ts`

| Method   | Route                      | 설명                | Auth |
| -------- | -------------------------- | ------------------- | ---- |
| `GET`    | `/users`                   | 사용자 목록         | 🔐   |
| `GET`    | `/users/me`                | 내 정보             | 🔐   |
| `GET`    | `/users/me/stats`          | 내 통계             | 🔐   |
| `GET`    | `/users/search`            | 사용자 검색         | 🔐   |
| `GET`    | `/users/:id`               | 사용자 상세         | 🔐   |
| `GET`    | `/users/:id/profile`       | 프로필 조회         | 🔐   |
| `PUT`    | `/users/:id/profile`       | 프로필 수정         | 🔐   |
| `GET`    | `/users/:id/stats`         | 사용자 통계         | 🔐   |
| `GET`    | `/users/:id/statistics`    | 사용자 통계 (alias) | 🔐   |
| `GET`    | `/users/:id/achievements`  | 업적 조회           | 🔐   |
| `GET`    | `/users/:id/activities`    | 활동 내역           | 🔐   |
| `GET`    | `/users/:id/notifications` | 사용자 알림         | 🔐   |
| `GET`    | `/users/:id/preferences`   | 설정 조회           | 🔐   |
| `PUT`    | `/users/:id/preferences`   | 설정 수정           | 🔐   |
| `PUT`    | `/users/:id`               | 사용자 수정         | 🔐   |
| `DELETE` | `/users/:id`               | 사용자 삭제         | 🔐   |

---

## 6. Favorites (즐겨찾기) — `/api/favorites`

> Server: `server/src/favorites/favorites.controller.ts` WebApp: `webapp/lib/api/favoriteApi.ts`
>
> **제한**: `type`은 `RACE`(경기)만 지원. 말·기수·조교사 즐겨찾기 미지원.

| Method   | Route                    | 설명              | Auth |
| -------- | ------------------------ | ----------------- | ---- |
| `GET`    | `/favorites`             | 즐겨찾기 목록     | 🔐   |
| `GET`    | `/favorites/statistics`  | 즐겨찾기 통계     | 🔐   |
| `GET`    | `/favorites/check`       | 즐겨찾기 확인     | 🔐   |
| `GET`    | `/favorites/search`      | 즐겨찾기 검색     | 🔐   |
| `GET`    | `/favorites/export`      | 즐겨찾기 내보내기 | 🔐   |
| `GET`    | `/favorites/:id`         | 즐겨찾기 상세     | 🔐   |
| `POST`   | `/favorites`             | 즐겨찾기 생성     | 🔐   |
| `POST`   | `/favorites/toggle`      | 즐겨찾기 토글     | 🔐   |
| `POST`   | `/favorites/bulk-add`    | 일괄 추가         | 🔐   |
| `PUT`    | `/favorites/:id`         | 즐겨찾기 수정     | 🔐   |
| `DELETE` | `/favorites/:id`         | 즐겨찾기 삭제     | 🔐   |
| `DELETE` | `/favorites/bulk-delete` | 일괄 삭제         | 🔐   |
| `GET`    | `/favorites/search`      | 즐겨찾기 검색     | 🔐   |
| `GET`    | `/favorites/export`      | 즐겨찾기 내보내기 | 🔐   |
| `POST`   | `/favorites/bulk`        | 일괄 추가         | 🔐   |
| `DELETE` | `/favorites/bulk`        | 일괄 삭제         | 🔐   |

---

## 6.5 Picks (내가 고른 말) — `/api/picks` — ⚠️ 서비스에서 제외 (UI 미노출)

> Server: `server/src/picks/picks.controller.ts` WebApp: `webapp/lib/api/picksApi.ts` (존재하나 사용 안 함)
>
> **제외**: 승식별 기록·적중 포인트 기능. WebApp/Mobile에서 메뉴·페이지 미노출.

| Method   | Route                    | 설명                  | Auth |
| -------- | ------------------------ | --------------------- | ---- |
| `POST`   | `/picks`                 | 내가 고른 말 저장     | 🔐   |
| `GET`    | `/picks`                 | 내가 고른 말 목록     | 🔐   |
| `GET`    | `/picks/race/:raceId`    | 해당 경주에 대한 선택 | 🔐   |
| `DELETE` | `/picks/race/:raceId`    | 선택 삭제             | 🔐   |

```typescript
CreatePickDto { raceId, pickType, hrNos[], hrNames? }
→ UserPick (include race)
// pickType: SINGLE, PLACE, QUINELLA, EXACTA, QUINELLA_PLACE, TRIFECTA, TRIPLE
```

---

## 7. Notifications (알림) — `/api/notifications`

> Server: `server/src/notifications/notifications.controller.ts` WebApp:
> `webapp/lib/api/notificationApi.ts`

| Method   | Route                             | 설명                 | Auth |
| -------- | --------------------------------- | -------------------- | ---- |
| `GET`    | `/notifications`                  | 알림 목록            | 🔐   |
| `GET`    | `/notifications/unread-count`     | 읽지 않은 수         | 🔐   |
| `GET`    | `/notifications/preferences`      | 알림 설정 조회       | 🔐   |
| `PUT`    | `/notifications/preferences`      | 알림 설정 수정       | 🔐   |
| `GET`    | `/notifications/templates`        | 알림 템플릿 (관리자) | 🔐   |
| `GET`    | `/notifications/:id`              | 알림 상세            | 🔐   |
| `POST`   | `/notifications`                  | 알림 생성            | 🔐   |
| `POST`   | `/notifications/bulk-send`        | 일괄 발송            | 🔐   |
| `POST`   | `/notifications/push-subscribe`   | 푸시 구독            | 🔐   |
| `POST`   | `/notifications/push-unsubscribe` | 푸시 해제            | 🔐   |
| `PATCH`  | `/notifications/:id/read`         | 읽음 처리            | 🔐   |
| `PATCH`  | `/notifications/read-all`         | 모두 읽음            | 🔐   |
| `PUT`    | `/notifications/:id`              | 알림 수정            | 🔐   |
| `DELETE` | `/notifications/all`              | 모두 삭제            | 🔐   |
| `DELETE` | `/notifications/:id`              | 알림 삭제            | 🔐   |

### 알림 설정 (Preferences)

```
GET /notifications/preferences → UserNotificationPreference
PUT /notifications/preferences → body: { pushEnabled?, raceEnabled?, predictionEnabled?, subscriptionEnabled?, systemEnabled?, promotionEnabled? }
```

- `pushEnabled`: 푸시 (mobile 앱에서만 UI 노출)
- `raceEnabled`, `predictionEnabled`, `subscriptionEnabled`, `systemEnabled`, `promotionEnabled`: 알림 유형별 on/off

---

## 8. Subscriptions (구독) — `/api/subscriptions`

> Server: `server/src/subscriptions/subscriptions.controller.ts` WebApp:
> `webapp/lib/api/subscriptionApi.ts`

| Method  | Route                         | 설명                | Auth |
| ------- | ----------------------------- | ------------------- | ---- |
| `GET`   | `/subscriptions/plans`        | 구독 플랜 목록      | 🔓   |
| `GET`   | `/subscriptions/status`       | 구독 상태 조회      | 🔐   |
| `GET`   | `/subscriptions/history`      | 구독 이력 조회      | 🔐   |
| `POST`  | `/subscriptions`              | 구독 신청           | 🔐   |
| `POST`  | `/subscriptions/subscribe`    | 구독 신청 (alias)   | 🔐   |
| `POST`  | `/subscriptions/cancel`       | 구독 취소           | 🔐   |
| `PATCH` | `/subscriptions/:id/activate` | 구독 활성화         | 🔐   |
| `POST`  | `/subscriptions/:id/activate` | 구독 활성화 (alias) | 🔐   |
| `PATCH` | `/subscriptions/:id/cancel`   | 구독 취소 (by ID)   | 🔐   |

---

## 9. Payments (결제) — `/api/payments`

> Server: `server/src/payments/payments.controller.ts` WebApp: `webapp/lib/api/paymentApi.ts`

| Method | Route                 | 설명 | Auth |
| ------ | --------------------- | ----- | ---- |
| `POST` | `/payments/billing-key` | 빌링키 발급 + 첫 결제 + 구독 활성화 (body: `subscriptionId`, `customerKey`, `authKey`) | 🔐   |
| `POST` | `/payments/subscribe` | 구독 결제 (레거시/목업) | 🔐   |
| `POST` | `/payments/purchase`  | 단건 결제 | 🔐   |
| `GET`  | `/payments/history`   | 결제 이력 | 🔐   |

---

## 10. Prediction Tickets (예측권) — `/api/prediction-tickets`

> Server: `server/src/prediction-tickets/prediction-tickets.controller.ts` WebApp:
> `webapp/lib/api/predictionTicketApi.ts`

### 10.1 경주별 예측권 (RACE)

| Method | Route                         | 설명        | Auth |
| ------ | ----------------------------- | ----------- | ---- |
| `POST` | `/prediction-tickets/use`     | 예측권 사용 | 🔐   |
| `GET`  | `/prediction-tickets/balance` | 잔여 수량   | 🔐   |
| `GET`  | `/prediction-tickets/history` | 사용 이력   | 🔐   |
| `GET`  | `/prediction-tickets/my-predictions` | 내가 본 예측 목록 (USED RACE, page, limit) | 🔐   |
| `GET`  | `/prediction-tickets/:id`     | 상세 조회   | 🔐   |

### 10.2 종합 예측권 (MATRIX) — 신규

| Method | Route                              | 설명                           | Auth |
| ------ | ---------------------------------- | ------------------------------ | ---- |
| `GET`  | `/prediction-tickets/matrix/access` | 해당 날짜 종합 예측 접근 확인  | 🔐   |
| `POST` | `/prediction-tickets/matrix/use`    | 종합 예측권 사용 (1일 1장)     | 🔐   |
| `GET`  | `/prediction-tickets/matrix/balance`| 종합 예측권 잔액               | 🔐   |
| `POST` | `/prediction-tickets/matrix/purchase` | 종합 예측권 개별 구매 (1,000원/장, 1~10장) | 🔐   |
| `GET`  | `/prediction-tickets/matrix/price`  | 종합 예측권 가격 정보          | 🔐   |

#### `GET /prediction-tickets/matrix/access`

- **Query**: `date` (YYYY-MM-DD, 기본=오늘)
- **Response**: `{ hasAccess: boolean, expiresAt?: string }`

#### `POST /prediction-tickets/matrix/use`

- **Body**: `{ date?: string }` (YYYY-MM-DD, 기본=오늘)
- **Response**: `{ ticket: PredictionTicket, alreadyUsed: boolean }`
- **규칙**: 같은 날짜에 이미 사용한 종합 예측권이 있으면 `alreadyUsed: true` 반환 (중복 사용 허용)

#### `GET /prediction-tickets/matrix/balance`

- **Response**: `{ available: number, used: number, total: number }`
- **설명**: MATRIX 타입 예측권만 집계

#### `POST /prediction-tickets/matrix/purchase`

- **Body**: `{ count?: number }` (default 1, max 10)
- **Response**: `{ purchased, totalPrice, pricePerTicket, expiresAt, tickets }`

#### `GET /prediction-tickets/matrix/price`

- **Response**: `{ pricePerTicket: 1000, currency: 'KRW', maxPerPurchase: 10 }`

---

## 11. Rankings (랭킹) — `/api/rankings`

> Server: `server/src/rankings/rankings.controller.ts` WebApp: `webapp/lib/api/rankingApi.ts`

| Method | Route          | 설명      | Auth |
| ------ | -------------- | --------- | ---- |
| `GET`  | `/rankings`    | 랭킹 조회 | 🔓   |
| `GET`  | `/rankings/me` | 내 랭킹   | 🔐   |

---

## 12. Single Purchases (개별 구매) — `/api/single-purchases`

> Server: `server/src/single-purchases/single-purchases.controller.ts` WebApp: `webapp/lib/api/singlePurchaseApi.ts`

| Method | Route                               | 설명                | Auth |
| ------ | ----------------------------------- | ------------------- | ---- |
| `POST` | `/single-purchases`                 | 예측권 구매         | 🔐   |
| `POST` | `/single-purchases/purchase`        | 예측권 구매 (alias) | 🔐   |
| `GET`  | `/single-purchases/price`           | 가격 계산           | 🔓   |
| `GET`  | `/single-purchases/calculate-price` | 가격 계산 (alias)   | 🔓   |
| `GET`  | `/single-purchases/history`         | 구매 이력           | 🔐   |
| `GET`  | `/single-purchases/total-spent`     | 총 지출             | 🔐   |
| `GET`  | `/single-purchases/config`          | 구매 설정           | 🔐   |

---

## 13. Points (포인트) — `/api/points`

> Server: `server/src/points/points.controller.ts` WebApp: `webapp/lib/api/pointApi.ts`

| Method | Route                      | 설명                  | Auth |
| ------ | -------------------------- | --------------------- | ---- |
| `GET`  | `/points/me/balance`       | 내 포인트 잔액        | 🔐   |
| `GET`  | `/points/ticket-price`    | 예측권 포인트 가격    | 🔓   |
| `POST` | `/points/purchase-ticket`  | 포인트로 예측권 구매  | 🔐   |
| `GET`  | `/points/promotions`       | 진행 중인 이벤트      | 🔓   |
| `GET`  | `/points/expiry-settings`  | 포인트 만료 설정      | 🔓   |
| `POST` | `/points/transfer`         | 포인트 이체           | 🔐   |
| `GET`  | `/points/:userId/balance`  | 포인트 잔액 (특정 유저)| 🔐   |
| `GET`  | `/points/:userId/transactions` | 포인트 거래 내역 | 🔐   |

---

## 13-1. Referrals (추천) — `/api/referrals`

> Server: `server/src/referrals/referrals.controller.ts`

| Method | Route           | 설명                     | Auth |
| ------ | --------------- | ------------------------ | ---- |
| `GET`  | `/referrals/me` | 내 추천 코드 조회/생성   | 🔐   |
| `POST` | `/referrals/claim` | 추천 코드 입력 (가입 시) | 🔐   | body: `{ code: string }` |

---

## 13-2. Weekly Preview (주간 프리뷰) — `/api/weekly-preview`

> Server: `server/src/weekly-preview/weekly-preview.controller.ts`  
> Cron(목 20:00 KST)으로 생성. 금·토·일 경주 하이라이트·주목할 말·트랙 조건 등.

| Method | Route                | 설명                     | Auth |
| ------ | -------------------- | ------------------------ | ---- |
| `GET`  | `/weekly-preview`    | 최신 주간 프리뷰 조회    | 🔓   | `?week=` 지정 시 해당 주차 |

---

## 13-3. Activity (활동 로그) — `/api/activity`

> Server: `server/src/activity-logs/activity-logs.controller.ts`  
> 클라이언트 이벤트 수집용. 인증 없이 호출 가능(미로그인 시 userId 없음).

| Method | Route             | 설명                 | Auth |
| ------ | ----------------- | -------------------- | ---- |
| `POST` | `/activity/track` | 단일 이벤트 기록     | 🔓   | body: `{ event, page?, target?, metadata?, sessionId? }` |
| `POST` | `/activity/track/batch` | 이벤트 일괄 기록 | 🔓   | body: `{ events: TrackEventDto[] }` |

---

## 14. Bets (베팅) — `/api/bets` — ⚠️ 사행성 제거로 미사용, Picks(내가 고른 말)로 대체

> Server: `server/src/bets/bets.controller.ts` (미사용)
>
> **참고:** 사행성 제거 원칙에 따라 베팅 기능은 비활성화. 대신 `Picks` API로 "내가 고른 말" 기록만 저장.

| Method | Route              | 설명            | Auth |
| ------ | ------------------ | --------------- | ---- |
| `POST` | `/bets`            | 베팅 생성       | 🔐   |
| `GET`  | `/bets`            | 베팅 목록       | 🔐   |
| `GET`  | `/bets/statistics` | 베팅 통계       | 🔐   |
| `POST` | `/bets/slip`       | 베팅 슬립 저장  | 🔐   |
| `GET`  | `/bets/:id`        | 베팅 상세       | 🔐   |
| `PUT`  | `/bets/:id`        | 베팅 수정       | 🔐   |
| `POST` | `/bets/:id/cancel` | 베팅 취소       | 🔐   |
| `POST` | `/bets/:id/result` | 결과 처리 (Dev) | 🔐   |

---

## 15. Admin (관리자) — `/api/admin` — 🔐 ADMIN 역할 필요

> Server: `server/src/admin/admin.controller.ts` Admin: `admin/src/lib/api/admin.ts`

| Method | Route                         | 설명                    | Auth        |
| ------ | ----------------------------- | ----------------------- | ----------- |
| `GET`  | `/admin/kra/sync-logs`       | KRA 동기화 로그 조회 (endpoint, rcDate, limit) | 🔐 Admin    |
| `GET`  | `/admin/kra/batch-schedules` | 배치 스케줄 목록 (예정/완료/실패, status?, limit?) | 🔐 Admin    |
| `POST` | `/admin/kra/sync/schedule`   | KRA 경주계획표+출전표. year=YYYY: 해당 연도 전체(월별 12회). date=YYYYMMDD: 해당일. 미지정: 1년 내 금·토·일 | 🔐 Admin    |
| `POST` | `/admin/kra/sync/results`    | KRA 경주 결과 동기화 (date: YYYYMMDD) | 🔐 Admin    |
| `POST` | `/admin/kra/sync/details`    | KRA 상세/훈련정보 동기화 (date: YYYYMMDD) | 🔐 Admin    |
| `POST` | `/admin/kra/sync/jockeys`    | KRA 기수 통산전적 동기화 (meet?: 1\|2\|3) | 🔐 Admin    |
| `POST` | `/admin/kra/sync/all`        | KRA 전체 적재 (경주계획표→출전표→결과→상세→기수, date: YYYYMMDD) | 🔐 Admin    |
| `POST` | `/admin/kra/sync/historical`  | KRA 과거 데이터 일괄 적재 (dateFrom, dateTo: YYYYMMDD) | 🔐 Admin    |
| `POST` | `/admin/kra/seed-sample`       | 샘플 경주 데이터 시드 (date?: YYYYMMDD) | 🔐 Admin    |
| `GET`  | `/admin/users`                | 사용자 목록             | 🔐 Admin    |
| `GET`  | `/admin/users/:id`            | 사용자 상세             | 🔐 Admin    |
| `PATCH`| `/admin/users/:id`            | 사용자 수정             | 🔐 Admin    |
| `PATCH`| `/admin/users/:id/activate`   | 사용자 활성화           | 🔐 Admin    |
| `PATCH`| `/admin/users/:id/deactivate` | 사용자 비활성화         | 🔐 Admin    |
| `POST` | `/admin/users/:id/grant-tickets` | 예측권 지급 (관리자 발급) | 🔐 Admin |
| `DELETE`| `/admin/users/:id`           | 사용자 삭제(비활성화)   | 🔐 Admin    |
| `GET`  | `/admin/predictions/list`    | 전체 예측 목록 (page, limit 최대 100, status?, raceId?) | 🔐 Admin    |
| `GET`  | `/admin/predictions/race/:raceId/history` | 경주별 예측 이력 전체   | 🔐 Admin    |
| `GET`  | `/admin/predictions/race/:raceId` | 경주별 예측 최신 1건   | 🔐 Admin    |
| `POST` | `/admin/predictions/generate/:raceId` | 해당 경주 AI 예측 수동 생성 | 🔐 Admin    |
| `POST` | `/admin/predictions/generate-batch` | 미생성 예측 일괄 생성 (body: dateFrom?, dateTo? YYYYMMDD, 기간 내 순차 생성) | 🔐 Admin    |
| `GET`  | `/admin/ai/config`            | AI 설정 조회 (Gemini)   | 🔐 Admin    |
| `POST` | `/admin/ai/config`            | AI 설정 저장            | 🔐 Admin    |
| `GET`  | `/admin/bets`                 | 마권 목록               | 🔐 Admin    |
| `GET`  | `/admin/bets/:id`             | 마권 상세               | 🔐 Admin    |
| `GET`  | `/admin/subscriptions/plans`  | 구독 플랜 목록          | 🔐 Admin    |
| `PATCH`| `/admin/subscriptions/plans/:id` | 구독 플랜 수정       | 🔐 Admin    |
| `GET`  | `/admin/notifications`        | 알림 목록               | 🔐 Admin    |
| `POST` | `/admin/notifications/send`   | 알림 발송               | 🔐 Admin    |
| `GET`  | `/admin/single-purchase/config` | 개별 구매 설정       | 🔐 Admin    |
| `PATCH`| `/admin/single-purchase/config` | 개별 구매 설정 수정  | 🔐 Admin    |
| `GET`  | `/admin/statistics/dashboard` | 대시보드 통계          | 🔐 Admin    |
| `GET`  | `/admin/statistics/revenue`   | 수익 통계              | 🔐 Admin    |
| `GET`  | `/admin/statistics/users-growth` | 사용자 증가 추이   | 🔐 Admin    |
| `GET`  | `/admin/statistics/ticket-usage-trend` | 예측권 사용량 추이 | 🔐 Admin    |
| `GET`  | `/admin/ai/estimate-cost`      | AI 예상 비용        | 🔐 Admin    |

---

## 16. KRA (한국마사회 API) — `/api/kra` — 🔐 ADMIN 역할 필요

> Server: `server/src/kra/kra.controller.ts`  
> Admin 패널: `/api/admin/kra/*` 사용 (AdminController). `/api/kra`는 KraController 직접 노출.
> KRA API 명세: `docs/specs/KRA_*.md`, `docs/specs/KRA_API_ANALYSIS_SPEC.md`

| Method | Route                | 설명                     | Auth     |
| ------ | -------------------- | ------------------------ | -------- |
| `GET`  | `/kra/sync-logs`     | KRA 동기화 로그 조회     | 🔐 Admin |
| `GET`  | `/kra/batch-schedules` | 배치 스케줄 목록 (status?, limit?) | 🔐 Admin |
| `POST` | `/kra/sync/schedule` | 경주계획표(API72_2)+출전표 동기화 | 🔐 Admin |
| `POST` | `/kra/sync/results`  | 경주 결과 동기화         | 🔐 Admin |
| `POST` | `/kra/sync/details`  | 상세/훈련정보 동기화     | 🔐 Admin |
| `POST` | `/kra/sync/jockeys`  | 기수 통산전적 동기화     | 🔐 Admin |
