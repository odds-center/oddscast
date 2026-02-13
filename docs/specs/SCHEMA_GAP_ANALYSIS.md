# 📋 DB 스키마 누락·보완 분석

> **docs/specs/** 및 **BUSINESS_LOGIC** 대비 현재 Prisma 스키마의 누락·보완 사항 정리.

---

## 1. 관계(Relation) 누락

### 1.1 BetSlip — User, Race와 관계 없음

**현재**: `raceId`, `userId`만 있고 `@relation` 없음.

```prisma
model BetSlip {
  raceId  Int
  userId  Int
  // user User @relation(...)  ← 누락
  // race Race @relation(...)  ← 누락
}
```

**영향**: 조회 시 JOIN 불가, FK 검증 없음.  
**보완**: ✅ `User`, `Race`에 `BetSlip[]` 추가, `BetSlip`에 `user`, `race` relation 추가 완료.

---

## 2. KRA API 스펙 대비 필드 누락

### 2.1 Race — 출발시각

| spec (KRA_ENTRY_SHEET) | 현재 스키마 | 비고 |
|------------------------|-------------|------|
| `stTime` (출발시각) | ❌ 없음 | 경기 시작 알림에 필요 |

**보완**: ✅ `stTime String?` 추가 완료.

---

### 2.2 Training — KRA 말훈련내역

| spec (KRA_TRAINING_SPEC) | 현재 스키마 | 비고 |
|--------------------------|-------------|------|
| `trContent` (훈련조교내용) | ❌ → `trainingData` Json에 포함 가능 | |
| `trType` (훈련종류: 발마, 조교) | `intensity`만 있음 | trType 별도 필드 권장 |
| `managerType` (관리사 종류) | ❌ 없음 | |
| `managerName` (관리사명) | ❌ 없음 | |
| `trEndTime` (훈련종료시간) | ❌ 없음 | |
| `trDuration` (훈련소요시간) | `time`에 혼재 가능 | |

**보완**: ✅ `trContent`, `trType`, `managerType`, `managerName`, `trEndTime`, `trDuration` 추가 완료.

---

## 3. 비즈니스 로직 대비 검토

### 3.1 포인트 구매 예측권 추적

**BUSINESS_LOGIC**: 포인트로 예측권 구매 (1장=1200pt).

- `PredictionTicket`: `subscriptionId`만 있고 포인트 구매 출처는 없음.
- `PointTransaction` (SPENT) + `PredictionTicket` 생성은 가능하나, 서로 연결은 metadata 수준.

**선택 사항**:  
- `PredictionTicket`에 `pointTransactionId Int?` 추가해 포인트 구매 이력 명시.

---

### 3.2 프로모션 포인트 지급 추적

- `PointTransaction`: `transactionType = PROMOTION`만 있고 `PointPromotion` 참조 없음.
- `PointPromotion.currentUses` 갱신 시, 어떤 유저가 어떤 프로모션을 썼는지 필요할 수 있음.

**선택 사항**:  
- `PointTransaction`에 `promotionId Int?` 추가, `PointPromotion`과 relation.

---

## 4. 보완 요약

| 구분 | 항목 | 우선순위 | 상태 |
|------|------|----------|------|
| Relation | BetSlip ↔ User, Race | 높음 | ✅ 적용 |
| Race | `stTime` | 중 | ✅ 적용 |
| Training | `trContent`, `trType`, `managerType`, `managerName`, `trEndTime`, `trDuration` | 중 | ✅ 적용 |
| 선택 | PointTransaction.promotionId | 낮음 | 보류 |
| 선택 | PredictionTicket.pointTransactionId | 낮음 | 보류 |

---

## 5. 참조 문서

- [KRA_ENTRY_SHEET_SPEC.md](KRA_ENTRY_SHEET_SPEC.md)
- [KRA_TRAINING_SPEC.md](KRA_TRAINING_SPEC.md)
- [KRA_ANALYSIS_STRATEGY.md](KRA_ANALYSIS_STRATEGY.md)
- [BUSINESS_LOGIC.md](../architecture/BUSINESS_LOGIC.md)
- [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md)

---

_작성일: 2026-02-13_
