# 🔄 AI 예측 업데이트 시스템

**작성일**: 2025년 10월 15일  
**목표**: 예측권 재구매 유도 → 수익 증대

---

## 🎯 비즈니스 로직

### 핵심 아이디어

> **AI 예측을 주기적으로 업데이트하여 사용자가 예측권을 반복 사용하도록 유도**

### 수익 구조

```
예측 1회 생성 → 무제한 재열람 (❌ 수익 제한)
      ↓
예측 주기적 업데이트 → 재구매 유도 (✅ 수익 증대)
```

### 예시 시나리오

```
09:00 - 배치 예측 생성
  └─ 사용자 A: 예측권 사용 (1장 소비) ✅

09:30 - 예측 업데이트 (1위: 3번 → 7번 변경)
  └─ 사용자 A: "🆕 업데이트됨" 뱃지 표시
  └─ 사용자 A: 예측권 재사용 (1장 추가 소비) ✅

10:00 - 예측 업데이트 (변경 없음)
  └─ 업데이트 스킵

10:30 - 예측 업데이트 (2위: 5번 → 1번 변경)
  └─ 사용자 A: "🆕 업데이트됨" 뱃지 표시
  └─ 사용자 A: 예측권 재사용 (1장 추가 소비) ✅

결과: 하나의 경주에 3장 소비 (기존 1장 vs 현재 3장)
→ 예측권 소비 3배 증가 🎉
```

---

## 🏗️ 구현 아키텍처

### 1. 데이터베이스 변경

#### prediction_tickets 테이블

```sql
ALTER TABLE prediction_tickets
ADD COLUMN viewed_at DATETIME NULL COMMENT '예측을 본 시점';
```

**목적**: 사용자가 예측을 본 시점을 기록하여 업데이트 여부 비교

#### 비교 로직

```typescript
// 예측이 업데이트 되었는지 확인
if (ticket.viewedAt && prediction.updatedAt) {
  isUpdated = prediction.updatedAt > ticket.viewedAt;
}
```

### 2. Cron Job (30분마다)

```typescript
// ai-batch.service.ts
@Cron('*/30 * * * *') // 30분마다
async updateUpcomingRacePredictions() {
  // 1시간 이내 시작하는 경주만 업데이트
  const upcomingRaces = await getUpcomingRaces(60);

  for (const race of upcomingRaces) {
    // 새로운 예측 생성
    const newPrediction = await generatePrediction(race.id);

    // 기존 예측과 비교
    const hasChanged =
      old.predictedFirst !== new.predictedFirst ||
      old.predictedSecond !== new.predictedSecond ||
      old.predictedThird !== new.predictedThird;

    if (!hasChanged) {
      continue; // 변경 없으면 스킵
    }

    // 기존 예측 덮어쓰기
    old.predictedFirst = new.predictedFirst;
    old.predictedSecond = new.predictedSecond;
    old.predictedThird = new.predictedThird;
    old.updatedAt = new Date(); // 중요!

    await save(old);
  }
}
```

### 3. API 응답 (예측 미리보기)

```typescript
// GET /api/predictions/race/:raceId/preview
{
  "hasPrediction": true,
  "raceId": "20251015-01-001",
  "confidence": 0.87,
  "predictedAt": "2025-10-15T09:00:00Z",
  "updatedAt": "2025-10-15T09:30:00Z", // 마지막 업데이트

  // 사용자 상태
  "hasViewed": true,              // 이미 봤는지
  "isUpdated": true,              // 업데이트 되었는지
  "lastViewedAt": "2025-10-15T09:05:00Z",

  // 메시지
  "message": "🆕 AI 예측이 업데이트되었습니다! 최신 예측을 확인하세요"
}
```

### 4. 모바일 UI

#### PredictionStatusBadge 컴포넌트

```tsx
<PredictionStatusBadge hasViewed={preview.hasViewed} isUpdated={preview.isUpdated} />

// 3가지 상태:
// 1. 🆕 업데이트됨 (isUpdated === true)
// 2. ✅ 확인함 (hasViewed && !isUpdated)
// 3. 🤖 AI 예측 (처음)
```

#### AIPredictionPreview 컴포넌트

```tsx
<AIPredictionPreview raceId={raceId}>
  {/* 헤더 */}
  <View>
    <Text>🤖 AI 예측</Text>
    <PredictionStatusBadge /> {/* 업데이트 뱃지 */}
  </View>

  {/* 블러 처리 */}
  <BlurView>
    <Text>1위 예상: ████████</Text>
    <Text>2위 예상: ████████</Text>
  </BlurView>

  {/* 업데이트 알림 */}
  {isUpdated && <InfoBanner variant='warning'>🆕 AI 예측이 업데이트되었습니다!</InfoBanner>}

  {/* 예측권 사용 버튼 */}
  <Button>{isUpdated ? '🆕 최신 AI 예측 보기' : 'AI 예측 전체 보기'}</Button>
</AIPredictionPreview>
```

---

## 📊 예상 효과

### 예측권 소비 증가

| 시나리오         | 기존 | 현재 | 증가율 |
| ---------------- | ---- | ---- | ------ |
| **업데이트 0회** | 1장  | 1장  | 0%     |
| **업데이트 1회** | 1장  | 2장  | +100%  |
| **업데이트 2회** | 1장  | 3장  | +200%  |
| **업데이트 3회** | 1장  | 4장  | +300%  |

### 수익 증가 시뮬레이션

```
월 100명 구독 (Light 70명 + Premium 30명)

기존:
- Light: 70명 × 30장 = 2,100장/월
- Premium: 30명 × 100장 = 3,000장/월
- 총: 5,100장/월

현재 (평균 2회 재열람):
- Light: 70명 × 30장 × 2 = 4,200장/월
- Premium: 30명 × 100장 × 2 = 6,000장/월
- 총: 10,200장/월

→ 예측권 소비 2배 증가 🎉
→ 예측권 부족 → 재구매 유도 💰
```

### 추가 개별 구매 예상

```
월 100명 중 30%가 예측권 부족으로 개별 구매

30명 × ₩3,000 = ₩90,000/월 추가 수익
```

---

## 🎯 사용자 경험 최적화

### 1. 중복 사용 방지

```typescript
if (hasViewed && !isUpdated) {
  showConfirm('이미 확인한 예측입니다. 예측권을 사용하여 다시 보시겠습니까?');
}
```

### 2. 업데이트 알림

```
🆕 AI 예측이 업데이트되었습니다!

3번마 → 7번마로 1위 예상 변경
신뢰도: 85% → 92%

[최신 예측 보기] (예측권 1장)
```

### 3. 업데이트 이력 표시

```
이 경주의 AI 예측 업데이트 이력:

09:00 - 최초 예측 (1위: 3번, 신뢰도: 85%)
09:30 - 업데이트 1 (1위: 7번, 신뢰도: 92%)
10:00 - 업데이트 2 (2위: 5번 → 1번)
```

---

## ⚙️ 설정 가능한 파라미터

### 1. 업데이트 주기

```typescript
// 현재: 30분마다
@Cron('*/30 * * * *')

// 옵션:
// - 10분마다: '*/10 * * * *' (공격적)
// - 20분마다: '*/20 * * * *' (균형)
// - 30분마다: '*/30 * * * *' (안정적)
```

### 2. 업데이트 대상

```typescript
// 현재: 1시간 이내 경주만 업데이트
const oneHourLater = moment(now).add(1, 'hour');

// 옵션:
// - 30분 이내: add(30, 'minutes') (긴급)
// - 1시간 이내: add(1, 'hour') (추천)
// - 2시간 이내: add(2, 'hours') (여유)
```

### 3. 변경 감지 기준

```typescript
// 현재: 1/2/3위 중 하나라도 변경
const hasChanged =
  old.predictedFirst !== new.predictedFirst ||
  old.predictedSecond !== new.predictedSecond ||
  old.predictedThird !== new.predictedThird;

// 옵션:
// - 1위만: old.predictedFirst !== new.predictedFirst
// - 신뢰도 5% 이상 변경: Math.abs(old.confidence - new.confidence) >= 0.05
```

---

## 📈 성과 측정

### KPI

1. **예측권 소비율**

   - 기존: 1경주당 1장
   - 목표: 1경주당 2~3장

2. **재구매율**

   - 기존: 0%
   - 목표: 월 30%

3. **평균 예측권 부족 시점**
   - 기존: 30일 (만료)
   - 목표: 15일 (재구매)

### 대시보드 (Admin)

```
🔄 AI 예측 업데이트 현황

오늘 업데이트:
- 총 경주: 12개
- 업데이트 횟수: 24회
- 평균 업데이트: 2회/경주

예측권 소비:
- 기존 대비 +187% 증가
- 재열람율: 65%
- 추가 구매: 18건 (₩54,000)
```

---

## 🚀 다음 단계

### Week 4-5

- [ ] 백엔드 배포 및 Cron Job 활성화
- [ ] 모바일 UI 적용 및 테스트
- [ ] 예측권 소비 모니터링

### Week 6

- [ ] A/B 테스트 (업데이트 주기 최적화)
- [ ] 성과 분석 및 리포트
- [ ] 추가 개선 사항 도출

---

**✅ AI 예측 업데이트 시스템 구현 완료!**

예측권 재구매 유도로 수익 2~3배 증가 예상! 🎉💰
