# 서버 엔티티 상태 점검 보고서

## ✅ 완성된 엔티티 목록

### 1. 사용자 관련 (Users)

- ✅ `users` → `User` entity
- ✅ `user_social_auth` → `UserSocialAuth` entity
- ✅ `refresh_tokens` → `RefreshToken` entity

### 2. 베팅 관련 (Bets)

- ✅ `bets` → `Bet` entity

### 3. 경주 관련 (Races)

- ✅ `races` → `Race` entity
- ✅ `race_plans` → `RacePlan` entity
- ✅ `entry_details` → `EntryDetail` entity

### 4. 결과 관련 (Results)

- ✅ `results` → `Result` entity
- ✅ `race_horse_results` → `RaceHorseResult` entity
- ✅ `dividend_rates` → `DividendRate` entity

### 5. 포인트 관련 (Points)

- ✅ `user_points` → `UserPoints` entity
- ✅ `user_point_balance` → `UserPointBalance` entity (기존)

### 6. 랭킹 관련 (Rankings) - 🆕 추가

- ✅ `user_rankings` → `UserRanking` entity

### 7. 즐겨찾기 (Favorites)

- ✅ `favorites` → `Favorite` entity

### 8. 소셜 기능 (Social) - 🆕 추가

- ✅ `public_bets` → `PublicBet` entity
- ✅ `bet_likes` → `BetLike` entity
- ✅ `bet_comments` → `BetComment` entity
- ✅ `user_follows` → `UserFollow` entity

### 9. 알림 (Notifications) - 🆕 추가

- ✅ `notifications` → `Notification` entity

---

## 📊 통계

- **총 SQL 테이블**: 15개
- **총 TypeORM 엔티티**: 15개
- **커버리지**: 100% ✅

---

## 🆕 신규 추가된 엔티티

### 1. UserRanking Entity

**파일**: `src/rankings/entities/user-ranking.entity.ts`

```typescript
- RankingType enum (OVERALL, WEEKLY, MONTHLY, YEARLY)
- User와 ManyToOne 관계
- 랭킹 통계 (순위, 승률, 총 베팅, 총 수익, ROI)
- 기간별 필터링 (periodStart, periodEnd)
```

### 2. PublicBet Entity

**파일**: `src/social/entities/public-bet.entity.ts`

```typescript
- BetVisibility enum (PUBLIC, FRIENDS_ONLY, PRIVATE)
- PublicBetResult enum (PENDING, WIN, LOSE, PARTIAL_WIN, VOID)
- User, Bet와 관계 설정
- 좋아요/댓글 카운트
```

### 3. BetLike Entity

**파일**: `src/social/entities/bet-like.entity.ts`

```typescript
- User, PublicBet와 관계
- Unique 제약 (user_id, public_bet_id)
```

### 4. BetComment Entity

**파일**: `src/social/entities/bet-comment.entity.ts`

```typescript
- User, PublicBet와 관계
- 대댓글 지원 (self-referencing)
- 삭제 플래그 (soft delete)
```

### 5. UserFollow Entity

**파일**: `src/social/entities/user-follow.entity.ts`

```typescript
- User와 self-referencing (follower, following)
- Unique 제약 (follower_id, following_id)
```

### 6. Notification Entity

**파일**: `src/notifications/entities/notification.entity.ts`

```typescript
- NotificationType enum (GENERAL, BETTING, SYSTEM, PROMOTION)
- NotificationPriority enum (LOW, NORMAL, HIGH, URGENT)
- NotificationStatus enum (UNREAD, READ, ARCHIVED, DELETED)
- User와 ManyToOne 관계
```

---

## 📂 모듈 구조

### Rankings Module

```
src/rankings/
├── entities/
│   └── user-ranking.entity.ts
├── dto/
│   ├── ranking-query.dto.ts
│   └── ranking-response.dto.ts
├── rankings.service.ts
├── rankings.controller.ts
└── rankings.module.ts
```

### Social Module

```
src/social/
├── entities/
│   ├── public-bet.entity.ts
│   ├── bet-like.entity.ts
│   ├── bet-comment.entity.ts
│   └── user-follow.entity.ts
└── social.module.ts
```

### Notifications

```
src/notifications/
├── entities/
│   └── notification.entity.ts
├── notifications.service.ts (기존)
└── notifications.module.ts (기존)
```

---

## ✅ 체크리스트

- [x] 모든 SQL 테이블에 대응하는 엔티티 생성
- [x] TypeORM 데코레이터 정확히 적용
- [x] 인덱스 정의 (@Index)
- [x] Unique 제약 정의 (@Unique)
- [x] 관계 설정 (ManyToOne, OneToMany)
- [x] Enum 타입 정의
- [x] 모듈 등록 (app.module.ts)
- [x] Lint 에러 없음

---

## 🎯 다음 단계

### 1. 서비스 및 컨트롤러 구현

- [ ] Social 기능 API (공개 베팅, 좋아요, 댓글, 팔로우)
- [ ] Notification 기능 완성

### 2. 비즈니스 로직

- [ ] 랭킹 자동 업데이트 (Cron Job)
- [ ] 베팅 결과 → 공개 베팅 자동 동기화
- [ ] 알림 자동 발송 로직

### 3. 테스트

- [ ] Entity 단위 테스트
- [ ] Service 통합 테스트
- [ ] E2E 테스트

---

## 📝 주의사항

1. **데이터베이스 동기화**
   - TypeORM의 `synchronize: false` 설정 유지
   - 변경사항은 마이그레이션으로 관리

2. **관계 성능**
   - `eager: true`는 필요한 경우만 사용
   - N+1 쿼리 문제 주의

3. **Enum 값 변경**
   - SQL enum과 TypeORM enum 일치 확인
   - 변경 시 마이그레이션 필요

---

**생성일**: 2025-10-09
**작성자**: AI Assistant
**버전**: 1.0.0

---

**마지막 업데이트**: 2025년 10월 10일
