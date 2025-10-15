# 🎫 AI 예측권 시스템 개념 정의

**작성일**: 2025년 10월 15일  
**중요도**: ⭐⭐⭐ 매우 중요 (핵심 비즈니스 로직)

---

## ✅ 올바른 개념

### AI 예측권이란?

> **"이미 예정된 경주에 대해 AI가 미리 예측한 결과를 열람할 수 있는 티켓"**

### 핵심 포인트

1. **AI 예측은 배치로 미리 생성**

   - 매일 09:00에 당일 모든 경주 예측 생성 (Cron Job)
   - 사용자가 요청하기 전에 이미 준비되어 있음

2. **예측권 = 열람 권한**

   - 예측권을 사용 → AI 예측 결과 확인 가능
   - 예측권 없음 → 미리보기만 가능 (블러 처리)

3. **베팅과는 별개**
   - AI 예측을 확인하고 → 사용자가 직접 베팅 (KRA 앱 등)
   - 예측권으로 베팅하는 것이 **아님**

---

## 🔄 사용자 플로우

```
1. 사용자가 경주 목록 확인
   ↓
2. 특정 경주 선택
   ↓
3. "AI 예측 미리보기" 확인 (예측권 불필요)
   - "이 경주에 대한 AI 예측이 준비되었습니다 (신뢰도: 87%)"
   - 실제 예측 내용은 블러 처리 🔒
   ↓
4. "🎫 예측권 사용하여 AI 예측 보기" 버튼 클릭
   ↓
5. 예측권 소비 확인 다이얼로그
   - "예측권 1장을 사용하여 AI 예측을 확인하시겠습니까?"
   - "남은 예측권: 5장"
   ↓
6. 확인 → 예측권 1장 소비
   ↓
7. AI 예측 결과 전체 확인 ✅
   - 1위 예상: 3번마 (확률 45%)
   - 2위 예상: 7번마 (확률 30%)
   - 3위 예상: 1번마 (확률 25%)
   - 추천 베팅: 단승 3번, 복승 3-7
   ↓
8. 사용자가 직접 베팅 (KRA 앱)
```

---

## 🛠️ 구현 상세

### 1. 배치 예측 생성 (매일 09:00)

```typescript
// ai-batch.service.ts
@Cron('0 9 * * *') // 매일 09:00
async generateDailyPredictions() {
  // 오늘 경주 조회
  const races = await getRacesToday();

  // 모든 경주에 대해 AI 예측 생성
  for (const race of races) {
    await this.predictionsService.generatePrediction({
      raceId: race.id,
    });
  }

  // Redis 캐싱
  // DB 저장
}
```

### 2. AI 예측 미리보기 (예측권 불필요)

**API**: `GET /api/predictions/race/:raceId/preview`

```json
{
  "hasPrediction": true,
  "raceId": "20251015-01-001",
  "confidence": 0.87,
  "predictedAt": "2025-10-15T09:15:00Z",
  "requiresTicket": true,
  "message": "🎫 예측권을 사용하여 AI 예측 전체를 확인하세요",
  "previewText": "이 경주에 대한 AI 예측이 준비되었습니다. (신뢰도: 87.0%)"
}
```

### 3. AI 예측 열람 (예측권 필수)

**API**: `GET /api/predictions/race/:raceId`  
**Guard**: `@UseGuards(TicketRequiredGuard)`

```typescript
// predictions.controller.ts
@Get('race/:raceId')
@UseGuards(TicketRequiredGuard)
async findByRace(@UseTicket() ticket) {
  // 1. AI 예측 확인
  const prediction = await findByRaceId(raceId);

  if (!prediction) {
    return { status: 'pending', message: '아직 생성 안됨' };
  }

  // 2. 예측권 소비
  ticket.use(raceId, prediction.id);

  // 3. AI 예측 전체 반환
  return {
    ...prediction,
    ticketUsed: true,
    message: 'AI 예측 열람 완료',
  };
}
```

### 4. 예측권 사용 처리

```typescript
// prediction-tickets.service.ts
async useTicket(userId: string, dto: UseTicketDto) {
  // 1. 사용 가능한 예측권 조회
  const ticket = await getAvailableTicket(userId);

  if (!ticket) {
    throw new BadRequestException('예측권 없음');
  }

  // 2. AI 예측 확인
  const prediction = await findByRaceId(dto.raceId);

  if (!prediction) {
    throw new NotFoundException('AI 예측이 아직 생성되지 않음');
  }

  // 3. 예측권 소비 (열람 권한)
  ticket.use(dto.raceId, prediction.id);
  await save(ticket);

  // 4. AI 예측 결과 반환
  return {
    prediction: predictionDetail,
    ticketUsed: true,
    ticket: {
      id: ticket.id,
      usedAt: ticket.usedAt,
      expiresAt: ticket.expiresAt,
    },
  };
}
```

---

## ❌ 잘못된 개념 (수정 전)

### 수정 전 로직

```typescript
// ❌ 잘못됨
if (existingPrediction) {
  // 이미 예측이 있으면 예측권 소모하지 않음
  return {
    prediction: existingPrediction,
    ticketUsed: false, // ❌
  };
}
```

### 왜 잘못되었나?

- **예측권 = 열람 권한**이므로 예측이 있든 없든 소비해야 함
- 예측권 없이 AI 예측을 볼 수 있으면 수익 모델 붕괴
- 같은 경주를 다시 보려면 예측권이 또 필요함 (재열람 = 재소비)

---

## 💰 비즈니스 모델

### 구독 플랜

| 플랜        | 가격       | 예측권 | 유효기간 |
| ----------- | ---------- | ------ | -------- |
| **Light**   | ₩9,900/월  | 30장   | 30일     |
| **Premium** | ₩29,900/월 | 100장  | 30일     |

### 개별 구매

- **₩3,000** → 예측권 10장 (30일 유효)

### 예측권 사용 시나리오

```
월 100명 구독 (Light 70명 + Premium 30명)
= Light: 70명 × 30장 = 2,100장/월
= Premium: 30명 × 100장 = 3,000장/월
= 총 5,100장/월

하루 평균 170장 사용
→ 170개 경주의 AI 예측 열람
→ 실제 AI API 호출은 1회만 (배치 + 캐싱)
```

---

## 🎯 모바일 UI 구현 (Week 4)

### 경주 상세 화면

```tsx
// RaceDetailScreen.tsx
function RaceDetailScreen({ raceId }) {
  const { data: preview } = useQuery(['preview', raceId], () => api.getPredictionPreview(raceId));

  return (
    <View>
      {/* AI 예측 미리보기 (블러) */}
      <BlurView intensity={80}>
        <Text>신뢰도: {preview.confidence * 100}%</Text>
        <Text>1위 예상: ███████</Text>
        <Text>2위 예상: ███████</Text>
      </BlurView>

      {/* 예측권 사용 버튼 */}
      <Button onPress={handleUseTicket}>🎫 예측권 사용하여 AI 예측 보기</Button>

      <Text>남은 예측권: {ticketBalance}장</Text>
    </View>
  );
}

async function handleUseTicket() {
  const confirmed = await showConfirm('예측권 1장을 사용하여 AI 예측을 확인하시겠습니까?');

  if (confirmed) {
    const result = await api.usePredictionTicket(raceId);
    // AI 예측 전체 화면으로 이동
    navigation.navigate('PredictionDetail', { prediction: result });
  }
}
```

---

## 📊 장점

### 1. 비용 효율성 99%

- 배치로 1회 생성 → 무제한 열람 (예측권 소비)
- 사용자당 AI API 호출 0회
- 월 ₩7,500 비용으로 5,000명 서비스 가능

### 2. 빠른 응답 속도

- Redis 캐싱 → 0.1초 응답
- 사용자 대기 시간 0초

### 3. 명확한 수익 모델

- 예측권 = 유료 상품
- 구독/개별 구매로 예측권 획득
- 사용할수록 재구매 유도

---

## 🚀 다음 단계 (Week 4)

### 모바일 UI 개발

- [ ] 경주 상세 화면
- [ ] AI 예측 미리보기 (블러)
- [ ] 예측권 사용 확인 다이얼로그
- [ ] AI 예측 상세 화면
- [ ] 예측권 잔액 표시

### API 테스트

- [ ] 배치 예측 생성 테스트
- [ ] 예측권 사용 플로우 테스트
- [ ] 미리보기 API 테스트
- [ ] 예측권 소진 시나리오 테스트

---

**✅ AI 예측권 개념 정의 완료!**

이제 이 개념을 바탕으로 Week 4 개발을 진행합니다. 🎉
