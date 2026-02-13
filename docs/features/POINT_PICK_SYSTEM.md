# 포인트 & 승식 기획안 (Point & Pick Type System)

> 한국마사회(KRA) 방식에 따른 승식 기반 "내가 고른 말" 기록 및 포인트 적중 지급 시스템

---

## 1. 개요

### 1.1 목적

- **베팅 금지**: 실제 돈을 걸고 배당을 받는 사행성 시스템 없음
- **기록 저장**: "내가 어디에 걸었는지" 승식별로 저장 및 확인
- **포인트 지급**: 적중 시 포인트 지급 (승식 난이도에 따라 차등)
- **포인트 → 예측권**: 포인트로 예측권 구매 (현금 구매와 별도 가격)

### 1.2 참조 문서

- [경마 기초 용어 가이드](../reference/HORSE_RACING_TERMINOLOGY.md) — 승식 정의
- [비즈니스 로직](../architecture/BUSINESS_LOGIC.md)

---

## 2. 승식 (Pick Type) 정의

| 코드 | 한글명 | 선택 마 수 | 적중 조건 | 난이도 |
|------|--------|------------|-----------|--------|
| `SINGLE` | 단승식 | 1마리 | 1등 | 중 |
| `PLACE` | 복승식 | 1마리 | 1~3등 | 낮음 |
| `QUINELLA` | 연승식 | 2마리 | 1·2등 (순서 무관) | 중 |
| `EXACTA` | 쌍승식 | 2마리 | 1·2등 (순서 유관) | 높음 |
| `QUINELLA_PLACE` | 복연승식 | 2마리 | 3등 이내 | 중 |
| `TRIFECTA` | 삼복승식 | 3마리 | 1·2·3등 (순서 무관) | 높음 |
| `TRIPLE` | 삼쌍승식 | 3마리 | 1·2·3등 (순서 유관) | 최고 |

### 2.1 적중 판정 로직

```
SINGLE:    results[rcRank=1].hrNo === hrNos[0]
PLACE:     results[rcRank in (1,2,3)].hrNo includes hrNos[0]
QUINELLA:  {1등, 2등} 마番 set === {hrNos[0], hrNos[1]} set
EXACTA:    1등 === hrNos[0] && 2등 === hrNos[1]
QUINELLA_PLACE: 1~3등 중 2마리 모두 포함
TRIFECTA:  {1,2,3등} set === {hrNos[0], hrNos[1], hrNos[2]} set
TRIPLE:    1등 === hrNos[0] && 2등 === hrNos[1] && 3등 === hrNos[2]
```

---

## 3. 포인트 지급 규칙

### 3.1 베이스 포인트 & 승식별 배율

| 승식 | 배율 | 예시 (베이스 100pt) |
|------|------|---------------------|
| SINGLE | 1x | 100pt |
| PLACE | 0.5x | 50pt |
| QUINELLA | 3x | 300pt |
| EXACTA | 6x | 600pt |
| QUINELLA_PLACE | 2x | 200pt |
| TRIFECTA | 10x | 1,000pt |
| TRIPLE | 20x | 2,000pt |

- **베이스 포인트**: 100pt (config 가능)
- **배율**: PointConfig 테이블에서 관리

### 3.2 지급 시점

- 경주 결과(`RaceResult`) 등록 완료 후
- Race.status = COMPLETED 인 시점
- 배치(Cron) 또는 결과 등록 API 호출 시 트리거

---

## 4. 포인트 → 예측권 구매

### 4.1 가격 정책

| 구매 방식 | 1장 가격 | 비고 |
|----------|----------|------|
| 현금 구매 | 1,000원 | 기존 단건 구매 |
| 포인트 구매 | 1,200pt | 현금 대비 약간 높은 교환비 |

- 포인트 구매는 별도 가격 테이블(`PointTicketPrice`)로 관리
- 예측권 1장 = 1,200pt (기본값, config 가능)

### 4.2 구매 플로우

1. 사용자: `POST /points/purchase-ticket` { quantity: 1 }
2. 서버: 잔액 확인 → 부족 시 400
3. 서버: PointTransaction(SPENT) + PredictionTicket 발급
4. 응답: { ticket, remainingPoints }

---

## 5. DB 스키마 변경

### 5.1 UserPick

```prisma
model UserPick {
  id        String   @id @default(uuid())
  userId    String
  raceId    String
  pickType  PickType @default(SINGLE)  // 신규
  hrNos     String[] // [1, 5] or [1, 5, 7] — 신규 (기존 hrNo 대체)
  hrNames   String[]? // 표시용 — 신규
  pointsAwarded Int? @default(0)  // 적중 시 지급된 포인트 — 신규
  createdAt DateTime @default(now())

  @@unique([userId, raceId])
}

enum PickType {
  SINGLE
  PLACE
  QUINELLA
  EXACTA
  QUINELLA_PLACE
  TRIFECTA
  TRIPLE
}
```

### 5.2 PointConfig (포인트 지급 설정)

```prisma
model PointConfig {
  id          String   @id @default(uuid())
  configKey   String   @unique  // "BASE_POINTS", "SINGLE_MULTIPLIER" 등
  configValue String   // "100", "1", "6" 등
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 5.3 PointTicketPrice (포인트 예측권 가격)

```prisma
model PointTicketPrice {
  id          String   @id @default(uuid())
  pointsPerTicket Int   // 1장당 포인트 (예: 1200)
  isActive    Boolean  @default(true)
  effectiveFrom DateTime @default(now())
  effectiveTo  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 6. API 명세

### 6.1 Picks API 확장

| Method | Route | 변경 |
|--------|-------|------|
| POST | /picks | pickType, hrNos[], hrNames[] 지원 |
| GET | /picks | pickType, pointsAwarded 포함 |
| GET | /picks/race/:raceId | 동일 |

### 6.2 Points API

| Method | Route | 설명 |
|--------|-------|------|
| GET | /points/me/balance | 내 포인트 잔액 (JWT) |
| POST | /points/purchase-ticket | 포인트로 예측권 구매 |
| GET | /points/ticket-price | 예측권 포인트 가격 조회 |

### 6.3 포인트 지급 (내부)

- `PointsService.awardPickPoints(userId, pickId)` — PicksService 또는 결과 등록 시 호출

---

## 7. 마이그레이션 전략

### 7.1 기존 UserPick 호환

- 기존 `hrNo` 단일값 → `hrNos: [hrNo]` 로 마이그레이션
- `pickType` 기본값: SINGLE

### 7.2 시드 데이터

- PointConfig: BASE_POINTS=100, SINGLE_MULTIPLIER=1, PLACE_MULTIPLIER=0.5, ...
- PointTicketPrice: 1200pt/장

---

## 8. WebApp UI

### 8.1 경주 상세 — 내가 고른 말

- 승식 선택 드롭다운 (단승식, 복승식, 연승식, ...)
- 승식별 마 선택 UI (1마리 / 2마리 / 3마리)
- 저장 버튼

### 8.2 내가 고른 말 목록

- pickType, hrNos 표시
- pointsAwarded (적중 시) 표시

### 8.3 포인트 & 예측권

- 프로필/내 정보: 포인트 잔액 표시
- "포인트로 예측권 구매" 버튼 → 모달/페이지
- 1장 = 1,200pt 안내

---

## 9. 구현 완료 (2025-02-12)

- [x] 기획안 문서
- [x] DB 스키마 (schema.prisma) — 마이그레이션 없이 설계 단계
- [x] PicksService: pickType, hrNos 지원
- [x] 포인트 적중 지급 로직 (awardPickPointsForRace)
- [x] PointsService: purchaseTicket
- [x] 결과 bulkCreate 시 포인트 지급 트리거
- [x] WebApp: 승식 선택 UI (경주 상세)
- [x] WebApp: 포인트 표시 및 예측권 구매 (프로필)

### DB 동기화 (초기 설계 단계 — migrate 없음)

```bash
cd server && npx prisma db push
```

시드 데이터 (PointConfig, PointTicketPrice):

```bash
# PostgreSQL 직접 실행 시
npm run db:seed  # 또는 prisma db execute --file prisma/seed.sql
```
