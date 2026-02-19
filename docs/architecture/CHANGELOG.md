# 아키텍처 변경 이력 (Changelog)

> 2026-02-19 작업 내역

---

## 2026-02-19 (목) — 종합 예측권 구매/지급 확장 + 구독 플랜 MATRIX 포함 + 말 이름 표시

### 1. 구독 플랜 종합 예측권 포함 (5,000원당 1장)

- `SubscriptionPlan` 모델에 `matrixTickets Int @default(0)` 필드 추가
- 라이트(4,900원) → 0장, 스탠다드(9,900원) → 1장, 프리미엄(14,900원) → 2장
- 구독 활성화(`activate`) 시 `RACE` + `MATRIX` 타입 예측권 동시 발급
- seed.sql 업데이트 (matrixTickets 컬럼 포함)
- 구독 플랜 UI(`subscriptions.tsx`)에 "종합 N장" 표시

### 2. 종합 예측권 별도 구매 페이지

- **경로**: `/mypage/matrix-ticket-purchase`
- **구매**: 1~10장 (1,000원/장), 30일 유효
- **서버 API**: `POST /prediction-tickets/matrix/purchase`, `GET /prediction-tickets/matrix/price`
- **UI**: 상품 안내, 보유 현황, 수량 ±선택, 결제 버튼, 이용안내
- `routes.ts`에 `matrixTicketPurchase` 추가

### 3. 어드민: 종합 예측권 지급 지원

- `grantTickets()` 서비스: `type` 파라미터 추가 (RACE/MATRIX)
- Admin controller: `body.type` 수신
- Admin API client: `type` 파라미터 전달
- Admin 사용자 모달: **경주 예측권 / 종합 예측권** 타입 선택 버튼 UI

### 4. 예측 매트릭스 말 이름 표시 (마번 → 말 이름)

- 서버 `getMatrix()`: `entries { hrNo, hrName }` select, `horseNames` 매핑 반환
- `MatrixRowDto`: `entries`, `horseNames` 필드 추가
- `PredictionMatrixTable`: `GateBadge` → `HorseBadge` (마번 배지 + 말 이름 텍스트)
- `RaceInfoCell`: 출전마 이름 목록 표시 (`entryNames.join(' · ')`)
- 홈 프리뷰(`PredictionMatrixPreviewSection`): 동일하게 말 이름 표시
- 클라이언트 fallback builder: `horseNames` 매핑 지원

### 5. 아이콘 추가

- `icons.tsx`: `Plus`, `Minus`, `ShoppingCart` 아이콘 추가

---

## 2026-02-19 (목) — KRA 스타일 UI 전면 개편 + 종합 예측권 시스템 + 일일 종합 가이드

### 1. 컬러 팔레트 전면 개편 — 다크 골드 테마

- **Primary**: `#c9a227` → `#92702A` (다크 골든로드, 차분하고 격조 있는 톤)
- **로고/포인트**: `#d4a942` (골드 포인트)
- **배경**: `#f5f5f4` (warm stone gray)
- **전체 색상 계열**: `slate-*`, `blue-*`, `emerald-*`, `amber-*` → `stone-*` 계열 통일 (warm gray)
- **다크 헤더**: `#1c1917` (KRA 사이트 참고)
- **활성 네비게이션**: 골드 컬러 (`#d4a942`)
- **적용 파일**: `globals.css` 전면 재작성, 전 컴포넌트 색상 통일

### 2. KRA 사이트 참고 UI 요소

- **다크 테이블 헤더** (`.data-table-kra`): `#292524` 배경 + 연한 텍스트 — 경마 정보 사이트 스타일
- **KRA 섹션 헤더** (`.section-header-kra`): 다크 배경 + 골드 포인트
- **히어로 배너** (`.home-hero`): 다크 배경, 골드 그래디언트 오른쪽 장식
- **border-radius 축소**: 전반적으로 직선적 느낌 (rounded-xl → rounded)
- **shadow 최소화**: flat 디자인 지향

### 3. nowrap 전면 적용

- `globals.css`의 `.data-table th, td, a, span, p` → `white-space: nowrap`
- 개별 컴포넌트(`StatusBadge`, `Badge`, `LinkBadge`, `RaceHeaderCard`, `FilterChips`, `SectionCard`, `DateHeader` 등)에 `whitespace-nowrap` 명시

### 4. 홈페이지 보강 — KRA 스타일 일일 가이드

- **히어로 배너** (`DateHeader`): 다크 배경 + 날짜/경주일 표시 + "오늘의 경주", "종합 예상" 바로가기
- **퀵 메뉴 바**: 발매경주, 경주성적, 종합예상, 예측랭킹 바로가기 (KRA 상단 네비 스타일)
- **퀵 스탯** (`HomeQuickStats`): 오늘/금주 경주 수 + 경마장별 분류

### 5. 종합 예상 페이지 전면 재설계 (`predictions/matrix.tsx`)

- **페이지 목적**: "일일 종합 가이드" — 하루의 모든 경주 AI 예상을 한눈에
- **히어로 헤더**: 날짜, 총 경주 수, 경마장별 경주 수, 종합 예측권 상태 표시
- **탭**: 종합 예상표 | AI 코멘트
- **잠금 모드**: 종합 예측권 없으면 3경주 미리보기 + 나머지 잠금 오버레이
- **구매 CTA**: 보유 예측권 있으면 "사용" 버튼, 없으면 "구매" 링크

### 6. PredictionMatrixTable 리디자인 — 용산종합지 스타일

- **다크 헤더 라벨**: `#292524` 배경 + 경주 수 + "AI GOLDEN RACE"
- **다크 컬럼 헤더**: `#1c1917` 배경 + AI 종합 컬럼 골드 하이라이트
- **경주 정보 셀**: 경주번호 + 경마장 + 출발시간 + 거리 + 등급 + 출전두수 모두 표시
- **게이트 색상 번호 배지**: KRA 게이트 색상 반영
- **잠금 모드 지원**: `locked`, `previewCount` props
- **MatrixRowDto 확장**: `rcDist`, `rank`, `entryCount` 필드 추가

### 7. 종합 예측권 시스템 (신규)

#### Prisma 스키마 변경
- `TicketType` enum 추가: `RACE` (기존 경주별) | `MATRIX` (종합)
- `PredictionTicket` 모델: `type TicketType @default(RACE)`, `matrixDate String?` 추가

#### 서버 API (`prediction-tickets.controller.ts`)
- `GET /prediction-tickets/matrix/access?date=` — 해당 날짜 접근 권한 확인
- `POST /prediction-tickets/matrix/use` — 종합 예측권 사용 (1일 1장)
- `GET /prediction-tickets/matrix/balance` — 종합 예측권 잔액

#### 서비스 로직 (`prediction-tickets.service.ts`)
- `checkMatrixAccess(userId, date)` — 날짜별 접근 권한 확인
- `useMatrixTicket(userId, date)` — 예측권 사용 (중복 사용 방지)
- `getMatrixBalance(userId)` — 종합 예측권 잔액

#### 프론트엔드 (`predictionTicketApi.ts`)
- `checkMatrixAccess(date)` — API 호출
- `useMatrixTicket(date)` — 종합 예측권 사용
- `getMatrixBalance()` — 잔액 조회

### 8. 컴포넌트 업데이트 요약

| 컴포넌트 | 변경 내용 |
|---------|----------|
| `StatusBadge` | 진행=골드 배경, 예정=흰 배경, 종료=연회색, stone 계열 |
| `Badge` | 모든 variant stone 계열, primary=골드 |
| `RankBadge` | 1등=골드, 2등=중회색, 3등=연회색 |
| `PredictionSymbol` | 기호별 골드~stone 명도 단계 |
| `Card` | accent=좌측 골드 3px 라인 |
| `FilterChips` | 활성 `#292524`, stone 계열 |
| `SectionTitle` | 아이콘 골드, 배지 골드 |
| `LinkBadge` | hover=골드 |
| `SectionCard` | 더보기 링크 hover=골드 |
| `BetTypePredictionsSection` | 단승=골드, 연승=다크, 삼쌍=미디엄 |
| `PredictionMatrixTable` | 전면 재설계 (위 항목 참조) |
| `DateHeader` | 다크 히어로 배너 + 바로가기 |
| `HomeQuickStats` | 골드 포인트 텍스트 |
| `Layout` | theme-color `#1c1917` |
| `icons.tsx` | Lock, Unlock 아이콘 추가 |
| `analytics.ts` | `MATRIX_TICKET_USE` 이벤트 추가 |

### 9. 마이그레이션 안내

```bash
cd server && npx prisma db push
# 또는 마이그레이션 파일 생성:
cd server && npx prisma migrate dev --name add-matrix-ticket-type
```

---

## 2026-02-19 (목) — 경주 상세 탭 제거·단일 뷰 + 예측 UI 리뉴얼 + ko-KR 포맷 통일

### 1. 경주 상세 페이지 탭 제거 → 단일 플로우 (`webapp/pages/races/[id].tsx`)

- "기록정보" / "예상정보" `TabBar` 완전 제거
- 모든 정보를 하나의 스크롤 흐름으로 표시:
  - 경주 헤더 → 경주 결과(있으면) → AI 예측 → 출전마 → 기수·말 통합 분석
- `TabBar`, `SectionTitle`, `Tooltip` import 제거 (코드 경량화)

### 2. 예측 정보 UI 리뉴얼 (`PredictionFullView`, `PredictionLockedView`)

- `PredictionFullView`: pill 형태 예측 기록 탭, 1분 쿨다운 카운트다운, 컴팩트 말별 순위
- `PredictionLockedView`: 블러 + 그라데이션 오버레이, 아이콘 중심 CTA
- `useCooldown` 훅: lastUsedAt 기준 실시간 카운트다운

### 3. 3가지 추천식 카드 (`BetTypePredictionsSection.tsx`)

- 핵심 3개 승식(단승/연승/삼쌍)을 컬러 카드로 상단 배치 (amber/blue/purple)
- 나머지 4개 승식은 접기/펼치기 테이블
- `NumberBadge` 아토믹 컴포넌트로 마번 표시

### 4. 경주 결과 UI 컴팩트화

- 1-3위: 금/은/동 하이라이트 카드 (가로 3열)
- 4위+: `<details>` 접기로 공간 절약
- 배당 상세: 그리드 카드 접기

### 5. 서버: 예측권 1분 쿨다운 (`prediction-tickets.service.ts`)

- `useTicket()`: 같은 경주에 60초 이내 재사용 시 `BadRequestException`
- 남은 초를 에러 메시지에 포함 ("N초 후 다시 예측할 수 있습니다")

### 6. ko-KR 날짜/시간 포맷 통일 (`webapp/lib/utils/format.ts`)

- `formatTime(date)` → "오후 3:05" (Asia/Seoul 타임존)
- `formatDateTime(date)` → "2025. 2. 15. 오후 3:05"
- `formatDateOnly(date)` → "2025. 2. 15."
- `formatNumber(n)` → "1,234" / `formatWon(n)` → "1,234원" / `formatPoint(n)` → "1,234pt"
- 기존 로컬 `formatDate()` 함수들 → 공용 유틸로 통합 (ticket-history, point-transactions, notifications, RaceHeaderCard)

### 7. 경주 결과 목록 출전마 전체 표시 (`webapp/pages/results.tsx`)

- 기존: `ord > 3` 필터로 1-3위만 표시
- 변경: 전체 출전마·기수 표시, 1-3위 하이라이트 + "전체 출전마" 접기
- 데스크톱 테이블: "출전마" 컬럼 추가 (N마리)

### 8. 경주 상세 출전마 표시 보완 (`webapp/pages/races/[id].tsx`)

- entries가 비어있어도 raceResults에서 출전마 목록 자동 추출 (fallback)
- 완료된 경주에서도 출전마 섹션 표시 (접힌 상태)
- `showPickPanel` 분리: Pick 기능은 경주 전 + entries 있을 때만

### 9. 아토믹 디자인 패턴 정리

- `RaceHeaderCard.tsx` 로컬 `formatRcDate()` 중복 → `@/lib/utils/format` import으로 통일
- `formatNumber()` 공용 유틸 도입으로 `.toLocaleString()` 직접 호출 제거
- 모든 날짜/시간/숫자 포맷을 `format.ts`에서 관리 (Single Source of Truth)

### 10. PredictionHorseScore 타입 확장 (`webapp/lib/types/predictions.ts`)

- `strengths?: string[]`, `weaknesses?: string[]`, `confidence?: 'high' | 'medium' | 'low'` 추가

---

## 2026-02-19 (목) — WebApp·Admin 전면 UI/UX 개선

### 1. Tooltip 공용 컴포넌트 추가 (`webapp/components/ui/Tooltip.tsx`)

- CSS 기반 경량 툴팁 (외부 라이브러리 없음)
- `?` 아이콘 + hover 시 설명 표시, `top/bottom/left/right` 위치, `inline` 모드
- `webapp/components/ui/index.ts`에 export 등록

### 2. HorseEntryTable 경마 용어 툴팁 (`webapp/components/race/HorseEntryTable.tsx`)

- 테이블 헤더 10개 컬럼에 Tooltip 적용: 마령, 부담, 마체중, 레이팅, 통산, 최근, 장구
- 기존 HTML `title` 속성 → Tooltip 컴포넌트로 교체

### 3. 경주 상세 결과 테이블 용어 툴팁 (`webapp/pages/races/[id].tsx`)

- 기록("출발~결승 소요 시간"), 착차("1위와의 마신 차이"), 단승/복승 배당 설명
- 마칠기삼 가중치 분석 용어 Tooltip
- 배당 상세 영역에 설명 텍스트 추가

### 4. 승식별 AI 추천 툴팁 (`webapp/components/predictions/BetTypePredictionsSection.tsx`)

- 7개 승식(단승~삼쌍승) 각각에 쉬운 한글 설명 Tooltip 적용
- PICK_TYPE_DESCRIPTIONS 활용

### 5. 결과 페이지 컬럼 헤더 개선 (`webapp/pages/results.tsx`)

- 1위(경주기록), 2위(착차), 3위(착차) 헤더 명시

### 6. SectionCard description prop 추가 (`webapp/components/page/SectionCard.tsx`)

- `description?: string` prop 추가 → 제목 아래 한 줄 설명
- HomeSection에도 전파, 7개 홈 섹션에 description 적용

### 7. 홈 DateHeader 경주일 안내 (`webapp/components/home/DateHeader.tsx`)

- 금·토·일 경주일 → `RACE DAY` 배지 + "오늘은 경주일입니다"
- 비경주일 → "다음 경주일: X요일 (M/D)" 표시

### 8. HomeQuickStats 빈 상태 개선 (`webapp/components/home/HomeQuickStats.tsx`)

- 경주 0건 시 "경주는 보통 금·토·일에 진행됩니다" 안내

### 9. 프로필 페이지 개선 (`webapp/pages/profile/index.tsx`)

- 예측권·포인트 SectionCard에 description 추가
- Tooltip으로 "받는 방법", "사용 방법" 설명
- 포인트 부족 시 필요/보유 금액 상세 표시

### 10. 랭킹 페이지 적중 기준 설명 (`webapp/pages/ranking.tsx`)

- Tooltip으로 적중 기준 안내: "AI 추천마가 실제 1~3위에 들면 적중"

### 11. Admin KRA 페이지 전면 재설계 (`admin/src/pages/kra.tsx`)

- **자동 동기화 현황**: 5개 Cron 스케줄 시각 카드
- **단계별 구조 (Step 1~3)**: 출전표 → 결과 → 부가정보
- **HelpBox**: info/warning/success 3종 안내 상자 + "언제 사용하나요?" 가이드
- **공통 날짜 선택**: 모든 동기화에 한 곳에서 적용
- **개발·백업용**: `details/summary`로 접어서 정리
- **로그 테이블**: 상태 한글화(성공/실패), 아이콘, 빈 상태 안내, racePlan 필터 추가

### 12. Admin 대시보드 개선 (`admin/src/pages/index.tsx`)

- 통계 카드 디자인 개선 (아이콘 위치, 라운딩, 호버)
- 빠른 링크 10개 확장 (결과, AI 분석, 수익, 알림, 설정)
- 각 링크에 2줄 설명

### 13. Admin 전체 페이지 설명 개선 (11개 페이지)

- PageHeader `description`을 구체적·실용적 안내로 변경
- 대상: 회원관리, 결제내역, 경주관리, 경기결과, 구독관리, 통계, AI설정, AI분석, 수익대시보드, 알림관리

### 14. Admin Card 컴포넌트 확장 (`admin/src/components/common/Card.tsx`)

- `title` prop: `string` → `ReactNode` (JSX 지원, StepBadge 등)

### 15. Admin 경주 관리 동기화 패널 정리 (`admin/src/pages/races/index.tsx`)

- 각 버튼 역할 한 줄 요약 추가
- KRA 관리 페이지 링크 제공

### 문서 업데이트

- `docs/features/UI_PATTERNS.md`: Tooltip 섹션, SectionCard description, DateHeader, 컴포넌트 요약 확장
- `docs/architecture/PROJECT_STRUCTURE.md`: Tooltip.tsx 추가
- `docs/guides/ADMIN_GUIDE.md`: KRA 페이지 단계별 가이드, 주요 페이지 테이블 확장
- `docs/architecture/CHANGELOG.md`: 이 항목

---

## 2026-02-19 (목) — 예측 분석 공식 v2 (정규화·변수보강·토큰최적화)

### Python 분석 전면 개편 (`server/scripts/analysis.py`)

- **모든 sub-score 0~100 정규화**: v1의 스케일 불균형(-2~15, 0~5 등) 완전 제거
- **6요소 가중합 (W_HORSE, 합=1.0)**: rating 0.33, form 0.26, condition 0.14, experience 0.10, suitability 0.10, trainer 0.07
- **신규 변수 추가**:
  - `_condition_score`: 마체중 변화(±2kg 최적), 연령(4~5세 전성기), 부담중량(55kg 기준), 성별(거세마 안정)
  - `_suitability_score`: 각질×거리 매칭, 주로불량 시 선행 불리/추입 유리
- **개선된 공식**:
  - `_rating_score`: sigmoid 상대비교(55%) + 로그 절대구간(45%) → 상위/하위 분리력 강화
  - `_form_score`: 비선형 착순→점수(1등=100, 2등=85...), 추이(-6~+8), 레이팅 추이
  - `_experience_score`: 로그 스케일 출전(0~50) + 승률 구간(0~50), 신인×0.6
  - `_trainer_score`: 승률×2.0(max 35) + 복승률×0.7(max 25)
- **낙마 리스크 감점 적용**: risk50+ → ×0.88, 30+ → ×0.94, 20+ → ×0.97
- **softmax 승률 확률(winProb%)**: T=15 → 상위마 분리, 하위마 저확률
- **compact tags/reason 출력**: Gemini 토큰 최적화용

### NestJS 프롬프트 토큰 최적화 (`predictions.service.ts`)

- **`constructPrompt` 전면 리팩토링**: ~3000+ → ~1200 토큰 (~60% 절감)
- **compact 입력 형식**: n(번호), h(마명), j(기수), fs(통합점수), wp(승률%), sub([6요소]), risk, t(태그)
- **raw 데이터 전송 제거**: Python이 처리한 equipment, chaksun, ratingHistory 등 중복 전송 없음
- **`computeWinProbabilities`**: NestJS에서 finalScore(말+기수 통합) 기반 softmax 산출
- **점수 해석 가이드/작성 원칙 섹션 제거**: Python 결과에 이미 반영, 축약된 규칙만 유지

### 타입 업데이트 (`prediction-internal.types.ts`)

- `HorseAnalysisItem`: sub(6요소), risk, winProb, tags, recentRanks 추가

### 문서 업데이트

- `docs/specs/ANALYSIS_SPEC.md`: v2 전면 재작성
- `docs/architecture/BUSINESS_LOGIC.md`: §1.2, §1.3, §1.6 업데이트
- `docs/specs/KRA_ANALYSIS_STRATEGY.md`: §8 v2 업데이트

---

## 2026-02-19 (목) — 경주 결과 테이블·Mock 제거·일러스트 제거

### 경주 결과 페이지 (`/results`)

- **셀 크기 축소**: `DataTable compact` 적용, 경주 `w-24`, 날짜 `w-20`, 1·2·3위 `min-w-[100px]`, 전체 `text-[13px]`
- **기록 가로 표기**: 세로형(`flex-col`) → 가로형(`inline-flex items-center gap-1.5`) — `[마번] 마명(기수) 기록` 한 줄
- **경주마별 기록 노출**: 1위=rcTime(경주기록), 2·3위=diffUnit(착차)
- **서버**: `results.service.ts` findAll select에 `diffUnit` 추가
- **타입**: `RaceResult`에 `diffUnit` 추가

### Mock 데이터·설정 제거

- **config.ts**: `USE_MOCK`, `CONFIG.useMock` 제거
- **mocks 폴더 삭제**: `webapp/lib/mocks/data.ts`, `matrixData.ts`, `index.ts` 전체 삭제
- **API 분기 제거**: 14개 API 파일에서 `CONFIG.useMock` 분기 제거 (resultApi, authApi, raceApi, predictionApi, predictionMatrixApi, predictionTicketApi, notificationApi, subscriptionApi, pointApi, paymentApi, subscriptionPlansApi, rankingApi, configApi, picksApi)
- **페이지**: `subscription-checkout.tsx`, `auth/login.tsx`에서 mock UI(데모 안내, mock 결제 분기) 제거
- **환경 변수**: `webapp/.env.example`, `.env.local`에서 `NEXT_PUBLIC_USE_MOCK` 제거
- **문서**: `.cursorrules`(MOCK_PREFIX), `webapp/README.md`에서 Mock 관련 규칙·설명 제거

### 시각 요소 제거

- **RaceTrackIllustration.tsx**: 경기장 일러스트 SVG 컴포넌트 삭제
- **적용 제거**: DateHeader, HomeQuickStats, RaceHeaderCard, PredictionMatrixTable에서 배경/인라인 일러스트 제거
- **ui/index.ts**: RaceTrackIllustration export 제거

### KRA 출전마(Entries) — 경기 종료 시 섹션 숨김

- **출전마**: KRA 출전표 API(API26_2)에서 경주 **전** 받는 "출전 예정 말" 정보 (마명, 기수, 부담중량, 레이팅 등)
- **경기 종료 시**: 출전마 섹션·출전마 선택 패널 숨김 (`status=COMPLETED` 또는 `view=result`). 경주 결과 테이블만 표시

### Admin 미래 경주 스케줄 적재 — API72_2 경주계획표 연동

- **문서**: [`docs/specs/KRA_RACE_PLAN_SPEC.md`](../specs/KRA_RACE_PLAN_SPEC.md) 신규 작성
- **배경**: 출전표(API26_2)는 경주 2~3일 전에만 데이터 제공. 멀리 미래 날짜는 빈 응답
- **경주계획표 API72_2 연동**: `fetchRacePlanSchedule(date)` — `racePlan_2`로 미래 일정 조회 가능
- **공식 파라미터**: meet, rc_year, rc_month, rc_date (경주일자 YYYYMMDD)
- **syncUpcomingSchedules 개편**: 1) 경주계획표 → 2) 출전표 순 적재
- **Cron 추가**: `syncFutureRacePlans` 매주 월 03:00 — 1년 내 금·토·일 전체 적재
- **Cron 수정**: `syncWeeklySchedule` (수·목 18:00) — 경주계획표 선 호출 후 출전표
- **Admin syncSchedule**: date 지정 시 `syncScheduleForDate` (경주계획표→출전표), 미지정 시 `syncUpcomingSchedules`
- **Admin kra.tsx**: KRA 동기화 실패 시 `getErrorMessage(err)`로 실제 오류 메시지 toast 표시

---

## 2025-02-19 (목) — UI/UX 개선 (접근성·터치 영역·브랜드 일관성)

### FilterChips

- **활성 칩**: `bg-slate-700` → `bg-primary` (브랜드 골드) + `text-primary-foreground`
- **터치 영역**: 모바일 `min-h-[44px]` (UI_PATTERNS 권장)
- **접근성**: `focus-visible:ring-2`, `aria-pressed`, `aria-label`, `role='group'`

### LinkBadge

- **호버**: `hover:border-primary/30` 추가
- **포커스**: `focus-visible:ring-2 focus-visible:ring-primary/40`
- **터치**: `min-h-[36px]`, `py-1.5` (터치 영역 확대)

### 버튼 (globals.css)

- **모바일 터치**: `.btn-primary`, `.btn-secondary` → `min-height: 44px` (768px 미만)
- **포커스**: `focus-visible` 링 추가 (키보드 네비게이션)

### Pagination

- **터치**: `min-h-[44px]` (모바일), `focus-visible` 링
- **버튼**: `min-w-[2.5rem]` 확대

### 카드·섹션

- **card-hover**: `:active` 시 `scale(0.995)` 탭 피드백
- **SectionCard viewAll**: `focus-visible` 링, 패딩 확대

### TodayRacesSection

- **로딩**: 텍스트 → `LoadingSpinner` 컴포넌트 통일
- **링크**: `Link` → `LinkBadge` (rcNo, 거리, 상세 컬럼)

### DataFetchState

- **다시 시도 버튼**: `aria-label`, 패딩 확대

---

## 2025-02-19 (수) — 법적 문서 확장, 경주 결과 UI 강화, 구글 로그인 활성화

### 법적 문서

- **서비스 이용약관** (`/legal/terms`): 제1~14조 + 부칙, 결제·환불·면책·회사정보·통지 등 전자상거래법·콘텐츠산업진흥법 반영
- **개인정보처리방침** (`/legal/privacy`): 개인정보보호법 준수, 수집·이용·보관·파기·제3자·위탁·정보주체 권리·책임자·쿠키 등 14조 구성
- **환불 및 결제 정책** (`/legal/refund`): 신규 페이지, 구독·개별 구매 환불 기준, 전자상거래법 소비자 보호

### 경주 결과·경주 상세 UI

- **경주 결과 테이블**: 착차(diffUnit), 단승(winOdds), 복승(plcOdds) 컬럼 추가, ordType(낙마/실격/기권) 표시
- **경주 헤더**: rcDate(날짜), rcPrize(1착상금) 표시
- **배당 섹션**: 카드 그리드 레이아웃, 접기/펼치기
- **결과 페이지**: 모바일 카드형 + 데스크톱 테이블, rcTime·rcDist 표시
- **서버 API**: `getRaceResult`, `findAll(results)`에 rcTime, diffUnit, winOdds, plcOdds, rcDist 반환

### 구글 로그인

- **활성화**: 신규 → 자동 회원가입, 기존 → 로그인 (auth.service.googleLogin)
- **회원가입 페이지**: `text='continue_with'` (Google로 계속하기)
- **Mock 모드**: AuthApi.googleLogin Mock 응답 지원
- **가이드**: `docs/guides/GOOGLE_OAUTH_SETUP.md` 신규 작성

### 문서

- `.cursorrules`: 구글 로그인/OAuth 참조 문서 추가
- `LEGAL_NOTICE.md`: 약관·개인정보·환불정책 링크 갱신

### 종합 예상표·경주 목록

- **predictions/matrix**: 날짜(오늘/어제/날짜 선택), 경마장 필터, URL 동기화
- **URL 동기화**: `?date=`, `?meet=`, `?tab=` 쿼리로 필터·탭 상태 유지
- **API**: `GET /predictions/matrix`, `GET /predictions/commentary`, `GET /predictions/hit-record`
- **서버**: getMatrix — horseScores 1·2위 → AI 종합 컬럼에 복승 형식([top1, top2]) 표시
- **commentary**: meet 파라미터 추가, 경마장별 코멘트 필터
- **코멘트 탭**: DataFetchState 로딩·빈 상태 처리
- **경주 목록** (`/races`): 어제 필터 추가
- **경주 결과** (`/results`): 오늘/어제 필터 추가
- **CommentaryFeed**: rcNo 숫자만 있으면 "1R" 형식 표시

---

## 2026-02-13 (금) — TypeScript `any` 타입 제거 & 규칙 강화

### 변경 사항

- **any 금지 규칙**: `.cursorrules`, `docs/CURSOR_RULES.md`, `docs/COMPATIBILITY_RULES.md`에 **각각의 구체적 타입 필수** 규칙 추가
- **webapp**: `handleApiResponse`/`handleApiError`(axios), API 클라이언트, 페이지(`catch (err: unknown)` + `getErrorMessage`), 타입 정의(`[key: string]: unknown` 등) 수정
- **admin**: `handleApiError(error: unknown)`, `getErrorMessage` 유틸, Table `T extends object`, mutation `onError`/`onSuccess` 타입 수정
- **에러 처리**: `catch (err: any)` → `catch (err: unknown)` + `getErrorMessage(err)` (webapp/lib/utils/error.ts, admin/src/lib/utils.ts)
- **인덱스 시그니처**: `[key: string]: any` → `[key: string]: unknown`
- **타입 단언**: `as any` 금지, 필요한 경우 `as unknown as Type` 사용
- **문서**: CURSOR_RULES, COMPATIBILITY_RULES, WEBAPP_DEVELOPMENT에 타입 안전성 섹션 추가

---

## 2026-02-13 (금) — 구독 플랜 3종 (라이트/스탠다드/프리미엄)

### 변경 사항

- **subscription_plans**: LIGHT, PREMIUM → **LIGHT, STANDARD, PREMIUM** 3플랜
- **표시명**: 라이트 / 스탠다드 / 프리미엄
- **seed.sql**: LIGHT(10장/4,900원), STANDARD(20장/9,900원), PREMIUM(30장 27+3/14,900원), 개별구매 500원/장(550원 VAT포함)
- **webapp mock**: 3플랜 mockSubscriptionPlans
- **admin**: grid md:grid-cols-3 (3열)
- **문서**: PREDICTION_TICKET_PRICING_SIMULATION, DATABASE_SCHEMA, BUSINESS_LOGIC 반영

---

## 2026-02-13 (금) — main·header 패딩 조정

### 변경 사항

- **main 패딩**: 모바일 `1rem` (16px) + safe-area, 데스크 `2rem` (32px) 가로, `1.5rem` 세로
- **내부 div**: `px-0`, `py-4` (모바일) — 가로 패딩은 main에서만 처리
- **CompactPageTitle**: `-mt-4` (div의 py 상쇄), `pt-[max(0.75rem,env(safe-area-inset-top))]`, `mb-3`

---

## 2026-02-13 (금) — BackLink 제거 & CompactPageTitle 모바일 sticky GNB

### 변경 사항

- **BackLink "내 정보로" 제거**: 프로필·알림·예측권 이력·포인트 거래·picks·구독·프로필 수정 등 하위 페이지에서 제거 (CompactPageTitle 뒤로가기로 충분)
- **CompactPageTitle 모바일 sticky**: `max-md:sticky max-md:top-0` — 뒤로가기+제목 상단 고정, GNB 스타일
- **모바일 스타일**: `bg-background/98 backdrop-blur-sm border-b`, safe-area 대응 `pt-[max(0.5rem,env(safe-area-inset-top))]`

---

## 2026-02-13 (금) — 모바일 친화적 UI 강화

### 변경 사항

- **Layout**: 모바일 `px-3 py-3`, `pb-[200px]` (콘텐츠 하단 여백), `pl/pr 0.75rem` (safe area)
- **하단 네비**: `min-height: 48px` 터치 영역, 모바일 패딩·라운드 조정
- **푸터**: 모바일 `text-[11px]`, `gap-x-3`, `px-2`
- **홈**: `gap-4` (모바일), `gap-6` (데스크), 섹션 `mb-5` (모바일)
- **FilterChips**: `min-h-[44px]` (모바일 터치)
- **FilterDateBar**: date input `min-h-[44px]`
- **CompactPageTitle**: 뒤로가기 `w-11 h-11` (모바일), `text-[15px]`
- **SectionTitle**: `text-[15px]` (모바일), 아이콘 `w-8 h-8`
- **BackLink**: `py-2 min-h-[44px]`
- **테이블**: `min-height: 44px` 행, `-webkit-overflow-scrolling: touch` 가로 스크롤
- **globals.css**: `@media (max-width: 768px)` 모바일 전용 스타일 확장

---

## 2026-02-13 (금) — 모바일 네비 5개로 축소 & 페이지네이션 개선

### 모바일·하단 네비 개선

- **5개 고정**: 홈 / 경주 / 종합 / 결과 / 내 정보
- **제외**: 랭킹 → 내 정보 → 메뉴에서 진입 (랭킹을 프로필 메뉴 상단에 배치)
- **라벨 변경**: "종합 예상" → "종합" (모바일 공간 절약)
- **문서**: UI_PATTERNS에 하단 네비 섹션 추가

---

## 2026-02-13 (금) — 페이지네이션 개선 & URL 동기화 (뒤로가기 시 복귀)

### 변경 사항

- **Pagination 컴포넌트**: `onPrev`/`onNext` → `onPageChange(page: number)` 단일 콜백
- **형식**: `< 1 ... 2 3 4 ... 5 >` — 여러 페이지로 직접 이동, `...`로 구간 생략
- **URL 동기화**: 경주 목록(/races), 경주 결과(/results), 내가 고른 말(/mypage/picks) — `page`를 query로 관리
- **뒤로가기 복귀**: 목록 3페이지 → 상세 → 브라우저 뒤로가기 시 3페이지로 복귀
- **적용 페이지**: races/index, results, mypage/picks — `router.replace`로 URL 갱신
- **문서**: UI_PATTERNS, WEBAPP_DEVELOPMENT, PROJECT_STRUCTURE, CHANGELOG 반영

---

## 2026-02-13 (금) — 홈 섹션 리뉴얼 & /races 페이지

### 변경 사항

- **홈 첫 화면**: QuickLinks 제거, 섹션 미리보기 중심 구성
- **섹션 구성**: 오늘의 경주(3), 금주의 경주(3), 경주 결과(3행), 종합 예상지(3행), 경주 예상지(3), 랭킹(3명), 전체 경주(5)
- **인덱스 페이지네이션 제거**: 각 섹션 소수 항목만 표시, 전체보기 링크로 상세 페이지 이동
- **전체 경주 페이지**: `/races` — 필터 + DataTable + 페이지네이션 (BackLink → 홈)
- **라우트**: `routes.races.list = '/races'` 추가
- **Layout 네비**: 홈, 경주(/races), 종합 예상, 결과, 랭킹 분리 (→ 이후 5개로 축소, CHANGELOG 하단 참조)

---

## 2026-02-13 (금) — 빌드·환경·문서 정리

### 변경 사항

- **Picks UI 비노출**: `CONFIG.picksEnabled = false` — 경주 상세 HorsePickPanel·출전마 선택 숨김
- **Server 빌드**: `prisma generate`를 build 스크립트에 포함
- **루트 package.json**: `pnpm run build` — server+webapp+admin 전체 빌드
- **Admin next.config.js**: API rewrite fallback `localhost:3000` → `localhost:3001/api`
- **README.md**: pnpm 기반 실행 방법, 빌드 절차 정리
- **WEBAPP_README.md**: 테마 라이트 (#fafafa, #c9a227) 반영

---

## 2026-02-13 (금) — 내가 고른 말 (Picks) 서비스에서 제외

### 변경 사항

- **내가 고른 말 제외**: WebApp/Mobile에서 메뉴·페이지 미노출
- **Server API 유지**: `POST/GET/DELETE /api/picks` 엔드포인트는 존재하나 클라이언트에서 미사용
- **문서 업데이트**: SERVICE_SPECIFICATION, API_SPECIFICATION, BUSINESS_LOGIC, PROJECT_STRUCTURE, UI_PATTERNS, WEBAPP_README, WEBAPP_DEVELOPMENT, POINT_PICK_SYSTEM, DATABASE_SCHEMA, ARCHITECTURE

---

## 2026-02-13 (금) — WebApp 라이트 테마 & UI/UX & 결과 그룹화 & Admin KRA 전용 페이지

### 1. WebApp 테마 — 다크 → 라이트 전환

- **배경**: `#050508` → `#fafafa`
- **Primary**: `#ffd700` → `#c9a227` (라이트 배경 대비 골드)
- **텍스트**: `#18181b`, `#52525b`
- **카드/테두리**: 흰색·연한 회색
- **Layout**: `theme-color` `#fafafa`, iOS 상태바 `default`
- **globals.css**: shadow, border, badge 등 라이트 대응

### 2. UI/UX 완화 (부드럽게)

- **테두리**: `border-2` → `border` (1px)
- **모서리**: radius 증가 (`radius-lg`, `radius-xl`)
- **트랜지션**: `0.2s ease`
- **버튼·카드·테이블·필터칩·TabBar**: 전반 완화

### 3. 레이아웃·스크롤바

- **콘텐츠 최대 너비**: `max-w-5xl`(1024px) → `max-w-[1200px]`
- **헤더·푸터·메인**: 1200px 통일
- **스크롤바**: 8px → 6px, `scrollbar-width: thin`, hover/active 상태

### 4. 경주 결과 테이블

- **그룹화**: 같은 경기 1·2·3위를 한 행으로 묶음
- **컬럼**: 경주 | 날짜 | 1위 (No 마명 기수) | 2위 | 3위
- **nowrap**: 경주 셀 `whitespace-nowrap`, data-table 전역 `white-space: nowrap`

### 5. Admin KRA 데이터 관리

- **새 페이지**: `/kra` — 출전표·경주 결과·상세정보 수동 동기화
- **출전표 수동 동기화**: 웹앱 출전마 없을 때 Admin에서 날짜 선택 후 실행
- **동기화 로그**: `GET /api/admin/kra/sync-logs` 조회, 최근 30건 표시
- **사이드바**: KRA 데이터 메뉴 추가
- **대시보드**: KRA 데이터 빠른 링크
- **경주 상세**: 출전마 데이터 → KRA 동기화 링크 (`/kra?date=YYYYMMDD`)

### 6. 문서

- **ADMIN_GUIDE.md**: KRA 페이지, 출전표 수동 동기화 안내
- **DATA_LOADING.md**: 출전마 보이지 않을 때 대응, sync-logs
- **UI_PATTERNS.md**: 테마·스크롤·max-width
- **API_SPECIFICATION.md**: `GET /api/admin/kra/sync-logs`

---

## 2026-02-13 (금) — @goldenrace/shared 공용 타입 패키지

### 1. shared 패키지 구성

- **package.json**: `@goldenrace/shared`, `file:../shared` 로컬 참조
- **types/**: api, auth, user, race, result, bet, favorite, point, prediction, prediction-ticket, subscription, notification
- **webapp, mobile, admin, server** package.json에 `@goldenrace/shared` 의존성 추가

### 2. 타입 파일

- `api.types.ts`: ApiResponse, PaginatedResponse, ApiError, ErrorCode
- `auth.types.ts`: AuthTokens, AuthResponse, LoginRequest, RegisterRequest, ...
- `favorite.types.ts`: Favorite, CreateFavoriteRequest (RACE만), FavoriteFilters 확장
- `point.types.ts`: PointTransactionType, PointStatus, UserPointBalance, PointTransaction
- `result.types.ts`: RaceResultItem, ResultListResponse
- `prediction-ticket.types.ts`: TicketHistoryResponse (PredictionTicket은 subscription에서)

### 3. webapp 마이그레이션

- `lib/types/api.ts`: ApiResponse 등 shared에서 재export
- `lib/types/auth.ts`: LoginRequest, RegisterRequest 등 shared + webapp AuthResponse
- `lib/types/favorite.ts`: Favorite 등 shared 기반, FavoriteStatistics/FavoriteRace 등 webapp 확장
- `lib/types/point.ts`: PointTransactionType, PointStatus, UserPointBalance, PointTransaction
- `pages/mypage/favorites.tsx`: memo만 사용 (notes 제거)
- `lib/store/authStore.ts`: User.name optional

### 4. mobile

- `types/shared.ts`: AuthResponse, AuthTokens 재export (브릿지용)

### 5. .cursorrules

- 타입(Shared) 규칙 추가: 새 타입은 `shared/types/`에 정의

---

## 2026-02-13 (금) — FavoriteApi 경로 수정 & 예측권/포인트 이력 페이지 & Server 포인트 API

### 1. WebApp FavoriteApi — 서버 bulk 엔드포인트 연동

- **bulkAddFavorites**: `POST /favorites/bulk-add` → `POST /favorites/bulk`, body를 `{ favorites }`에서 배열로 변경
- **bulkDeleteFavorites**: `DELETE /favorites/bulk-delete` → `DELETE /favorites/bulk`, body `{ favoriteIds }` → `{ ids }`

### 2. WebApp — 예측권 이력·포인트 거래 내역 페이지

- **mypage/ticket-history.tsx**: `PredictionTicketApi.getHistory()` — 예측권 구매·사용·만료 이력
- **mypage/point-transactions.tsx**: `PointApi.getMyTransactions()` — 포인트 적립·사용 거래 내역
- **routes**: `mypage.ticketHistory`, `mypage.pointTransactions` 추가
- **메뉴**: profile, mypage index에 예측권 이력·포인트 거래 내역 링크 추가

### 3. Server — 포인트 거래 내역 API

- **GET /points/me/transactions**: 로그인 사용자 본인 포인트 거래 내역 (page, limit, type 쿼리)

### 4. PointApi

- **getMyTransactions()**: `GET /points/me/transactions` 호출 메서드 추가

### 5. 문서

- **PROJECT_STRUCTURE.md**: ticket-history.tsx, point-transactions.tsx 추가

---

## 2026-02-13 (금) — 404·법적 페이지·구독 이력·설정 메뉴

### 1. 404 & 법적 페이지

- **404.tsx**: 맞춤 NotFound 페이지 (홈으로 링크)
- **legal/terms.tsx**: 서비스 이용 약관 (요약)
- **legal/privacy.tsx**: 개인정보 처리방침 (기본 템플릿)
- **routes.legal**: terms, privacy 라우트 추가
- **Layout footer** (Desktop): 이용약관, 개인정보처리방침 링크
- **Settings**: 이용약관, 개인정보처리방침 메뉴 (로그인 여부 무관)

### 2. 구독 이력

- **Subscriptions 페이지**: 로그인 시 "구독 이력" 섹션 (최근 5건)
- **SubscriptionApi.getHistory** 활용
- 취소 시 history 쿼리 무효화

---

## 2026-02-13 (금) — Server 구독 취소 & WebApp 랭킹·분석·비밀번호 재설정 & Mobile WebView 뒤로가기

### 1. Server — 구독 상태·취소

- **getStatus()**: WebApp 호환 응답 — `planId`, `monthlyTickets`, `daysUntilRenewal` 포함
- **POST /subscriptions/cancel**: 현재 유저의 활성 구독 조회 후 취소 (`cancelByUserId`)
- **파일**: `subscriptions.service.ts`, `subscriptions.controller.ts`

### 2. WebApp — 랭킹·분석·비밀번호 재설정

- **랭킹 페이지**: 로그인 시 "내 랭킹" 섹션 (`RankingApi.getMyRanking()`)
- **경주 상세**: 기수·말 통합 분석 (마칠기삼) — "분석 보기" 클릭 시 `/api/analysis/race/:raceId/jockey` 호출
- **비밀번호 재설정**: `/auth/reset-password?token=...` 페이지, `routes.auth.resetPassword`
- **AnalysisApi**: `lib/api/analysisApi.ts` — `getJockeyAnalysis(raceId)`
- **Config**: `show_google_login` 미설정 시 구글 로그인 표시 (기본 true)
- **아이콘**: Key, Mail 추가 (reset-password 페이지용)

### 3. Mobile WebView — 뒤로가기 UX

- **뒤로가기 우선순위**: WebView 내 history가 있으면 `webView.goBack()`, 없으면 `router.back()`
- **onNavigationStateChange**: `canGoBack` 상태 추적
- **아이콘**: close → arrow-back (뒤로가기 의미 명확화)
- **파일**: `mobile/app/webview.tsx`

---

## 2026-02-13 (금) — 알림 설정 & 즐겨찾기 RACE 전용 & 문서 통합

### 1. 알림 설정 (Notification Preferences)

- **UserNotificationPreference** 모델: `pushEnabled`, `raceEnabled`, `predictionEnabled`, `subscriptionEnabled`, `systemEnabled`, `promotionEnabled` (이메일 없음)
- **API**: `GET/PUT /api/notifications/preferences` — 조회·수정 (없으면 기본값 생성)
- **플랫폼별**: `pushEnabled` 토글은 mobile(native WebView)에서만 노출
- **플랫폼 감지**: Mobile WebView가 `injectedJavaScriptBeforeContentLoaded="window.__IS_NATIVE_APP__=true"` 주입
- **WebApp**: `pages/settings/notifications.tsx`, `lib/hooks/useIsNativeApp.ts`, `components/ui/Toggle.tsx`
- **문서**: [NOTIFICATION_SETTINGS.md](../features/NOTIFICATION_SETTINGS.md)

### 2. 즐겨찾기 RACE 전용

- **DTO**: `CreateFavoriteDto`, `ToggleFavoriteDto` — `@IsIn(['RACE'])` (경주만 지원)
- **서비스**: `findAll` type 기본값 `'RACE'`, `search`/`export`/`bulkAdd` RACE 필터
- **WebApp**: favorites 페이지에서 `type: 'RACE'` 고정

### 3. 문서 업데이트

- **DATABASE_SCHEMA.md**: UserNotificationPreference, Favorite RACE 전용 반영
- **API_SPECIFICATION.md**: 알림 설정 Preferences 상세, Favorites API
- **README.md**: Features 섹션 (NOTIFICATION_SETTINGS, POINT_PICK_SYSTEM)
- **WEBAPP_README.md**, **WEBAPP_DEVELOPMENT.md**: `/settings/notifications` 라우트
- **MOBILE_GUIDE.md**: `__IS_NATIVE_APP__` WebView 주입

---

## 2026-02-13 (금) — WebApp 페이지 컴포넌트 & 모바일 최적화 & 구독 플로우

### 1. 페이지 공통 컴포넌트 (`webapp/components/page/`)

- **직접 import**: barrel (`index.ts`) 제거, 각 파일에서 `export default`로 직접 import
- **컴포넌트**:
  - `PageHeader` — 아이콘 + 제목 + 설명/부제
  - `SectionCard` — 카드 섹션 (title, accent 옵션)
  - `MenuList` — 메뉴 링크 목록 (items)
  - `FilterChips` — 필터 칩 (전체, 오늘 등)
  - `FormInput` — 라벨 + 입력 + 에러 메시지
  - `Pagination` — 여러 페이지 이동 (1 … 2 3 4 … 5), `onPageChange(page)`
  - `BackLink` — "← XXX로" 링크

### 2. 모바일 레이아웃 & CSS

- **Safe Area**: `pt-[env(safe-area-inset-top)]`, `pb-[env(safe-area-inset-bottom)]`, 좌우 패딩
- **메타**: `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-*`
- **터치**: 버튼/링크 최소 44×44px, `touch-action: manipulation`, `.nav-item-mobile` 56px
- **input**: `font-size: 16px` (iOS 줌 방지)
- **globals.css**: `overflow-x: hidden`, `.touch-manipulation`, 모바일 미디어 쿼리

### 3. 구독 결제 플로우

- **경로**: `mypage/subscription-checkout/[planId]`
- **흐름**: 플랜 선택 → `subscribe` → `payments/subscribe` → `activate`
- **라우트**: `routes.mypage.subscriptionsCheckout(planId)`
- **API**: `SubscriptionApi.subscribe/activate`, `PaymentApi.processSubscription`

### 4. 디자인 시스템

- **globals.css**: 금색 그라데이션, 버튼·카드 스타일, 타이포그래피
- **폰트**: Syne (제목), Plus Jakarta Sans (본문)
- **`_document.tsx`**: Google Fonts 로드

---

## 2026-02-13 (금) — 문서·빌드 정리 & 누락 항목 보완

### 1. Admin 빌드 수정

- **Link 컴포넌트**: 대시보드 빠른 링크 `<a>` → `<Link>` (ESLint no-html-link-for-pages)
- **Bet 타입**: `lib/types/admin.ts`에 `betResult`, `potentialWin`, `odds` 등 Prisma 스키마 반영
- **bets/index.tsx**: 로컬 Bet 인터페이스 제거, `@/lib/types/admin` 사용

### 2. Server

- **`.env.example` 생성**: DATABASE_URL, PORT, GOOGLE_CLIENT_ID, GEMINI_API_KEY, JWT_SECRET
- **Admin estimate-cost**: `GET /admin/ai/estimate-cost` 엔드포인트 추가 (설정 기반 예상 비용)

### 3. API 명세서

- **클라이언트 경로**: Mobile → WebApp (Users, Favorites, Notifications, Subscriptions, Payments, Prediction Tickets, Rankings)
- **Predictions**: `GET /predictions/stats/cost` 추가
- **Admin**: `GET /admin/ai/estimate-cost` 추가
- **KRA 모듈**: 섹션 16 추가 (`/api/kra/sync-logs`, `/api/kra/sync/*`)

### 4. Mobile README 업데이트

- WebView 기반 아키텍처 반영 (lib/, components/, store 등 제거됨)
- 삭제된 문서 링크 제거 (architecture/mobile, guides/mobile, features/mobile)
- Native Bridge, WebApp URL 설정 가이드 정리

### 5. 문서 정리

- **README.md**: Mobile WebView URL (`/m` → base URL)
- **PROJECT_STRUCTURE.md**: WebApp tree 오타 수정 (Read → styles/globals.css)

---

## 2026-02-12 (목) — WebApp Mock 모드 & UI/UX 개선

### 1. Mock 데이터 시스템

- **환경 변수**: `NEXT_PUBLIC_USE_MOCK=true` 시 DB 없이 하드코딩 mock 데이터 사용
- **mock 데이터**: `webapp/lib/mocks/data.ts` — races, results, predictions, rankings, points, tickets, subscriptions, notifications, user, config
- **적용 API**: RaceApi, ResultApi, PredictionApi, RankingApi, PicksApi, FavoriteApi, NotificationApi, PointApi, PredictionTicketApi, SubscriptionApi, SubscriptionPlansApi, ConfigApi, AuthApi
- **데모 로그인**: `demo@goldenrace.com` / `demo123`
- **Config**: `webapp/lib/config.ts` — `CONFIG.useMock` 플래그

### 2. Form — react-hook-form 통일

- **규칙**: `.cursorrules` — 모든 폼은 `react-hook-form` 사용 (규칙 8)
- **패키지**: `webapp/package.json` — `react-hook-form@^7.53.0` 추가
- **적용 페이지**:
  - `login.tsx` — useForm, register, handleSubmit, setError
  - `register.tsx` — 동일 + 비밀번호 minLength 검증
  - `forgot-password.tsx` — useForm + watch
  - `profile-edit.tsx` — 프로필/비밀번호 각각 useForm, validate로 비밀번호 확인 검증

### 3. 공통 UI 컴포넌트

- **LoadingSpinner**: `webapp/components/LoadingSpinner.tsx` — size, label, className
- **EmptyState**: `webapp/components/EmptyState.tsx` — icon, title, description, action

### 4. 페이지별 UI/UX 개선

| 페이지 | 변경 내용 |
|--------|-----------|
| **Home** | 에러 처리, EmptyState, 새로고침 버튼 |
| **Results** | 날짜 필터, 페이지네이션, 에러 처리, raceId 중복 제거 |
| **Ranking** | 상위 3명 강조 스타일, 에러 처리, EmptyState |
| **Prediction** | 에러 처리, EmptyState |
| **Profile** | LoadingSpinner, 사용자 이름/닉네임 표시 |
| **Favorites** | LoadingSpinner, EmptyState, 에러 처리 |
| **Picks** | LoadingSpinner, EmptyState, 에러 처리 |
| **Notifications** | LoadingSpinner, EmptyState, 에러 처리 |
| **Subscriptions** | LoadingSpinner, EmptyState, 에러 처리 |
| **races/[id]** | LoadingSpinner 적용 |

### 5. API 연동 가이드

- **Mock 모드**: `NEXT_PUBLIC_USE_MOCK=true` 시 API 호출 없이 mock 데이터 반환
- **실제 서버**: `NEXT_PUBLIC_USE_MOCK=false` 또는 미설정 후, `NEXT_PUBLIC_API_URL`로 서버 URL 설정
- **실행**: `cd server && npm run start:dev` → `cd webapp && npm run dev`
- **Mobile WebView**: Dev Android `http://10.0.2.2:3000`, iOS `http://localhost:3000`, Prod `https://gold-race-webapp.vercel.app`

### 6. README 업데이트

- `webapp/README.md` — `NEXT_PUBLIC_USE_MOCK` 환경 변수, 서버 연동 설명 추가

---

## 2026-02-12 (목) — KRA 연동·DB 저장·Batch·Seed 통합

### 1. Python–NestJS 연결 검증 및 수정

- **문제**: `JockeyResult.meet`은 `"1"`, `"2"`, `"3"`인데 `Race.meet`은 `"Seoul"`, `"Jeju"`, `"Busan"`이라 기수 조회 실패
- **수정**: `AnalysisService.analyzeJockey`에 `meetMap` 추가 (Seoul→1, Jeju→2, Busan→3)
- **파일**: `server/src/analysis/analysis.service.ts`

### 2. Batch 스케줄 (Cron) 검증

- **KraModule**에 `ScheduleModule.forRoot()` 이미 등록됨
- **Cron 스케줄**:
  - **수·목 18:00**: `syncWeeklySchedule` — 주말 출전표 선행 동기화
  - **금·토·일 08:00**: `syncRaceDayMorning` — 당일 출전표 + 상세 분석
  - **금·토·일 10:30–18:00 (30분 간격)**: `syncRealtimeResults` — 결과 + 분석
- **파일**: `server/src/kra/kra.service.ts`

### 3. KraSyncLog 모델 및 KRA API 로깅

- **모델**: `KraSyncLog` — `endpoint`, `meet`, `rcDate`, `status`, `recordCount`, `errorMessage`, `durationMs`
- **로깅 대상**: entrySheet, raceResult, jockeyResult, trackInfo, horseWeight, equipmentBleeding, horseCancel
- **API**: `GET /api/kra/sync-logs` (Admin 전용) — 동기화 로그 조회
- **파일**: `server/prisma/schema.prisma`, `server/src/kra/kra.service.ts`, `server/src/kra/kra.controller.ts`

### 4. KRA API별 DB 저장

| API | 엔드포인트 | 저장 대상 |
|-----|-----------|-----------|
| 경주로정보 | API189_1/Track_1 | `Race.weather`, `Race.trackState` |
| 출전마 체중 | API25_1/entryHorseWeightInfo_1 | `RaceEntry.horseWeight` |
| 장구·폐출혈 | API24_1/horseMedicalAndEquipment_1 | `RaceEntry.equipment`, `RaceEntry.bleedingInfo` |
| 출전취소 | API9_1/raceHorseCancelInfo_1 | `RaceEntry.isScratched` |

- **syncAnalysisData** 흐름: 경주로정보 → 출전마 체중 → 장구·폐출혈 → 출전취소 → 훈련·상세
- **파일**: `server/src/kra/kra.service.ts`

### 5. 날짜별 경기 조회 API

- **API**: `GET /api/races/by-date/:date` — YYYYMMDD 또는 YYYY-MM-DD
- **메서드**: `RacesService.getRacesByDate(date)` — 해당 날짜의 모든 경주, 출전취소(`isScratched`) 제외
- **파일**: `server/src/races/races.service.ts`, `server/src/races/races.controller.ts`

### 6. RaceEntry 스키마 확장

- `horseWeight` (String?) — 마체중, 예: `"502(-2)"`
- `bleedingInfo` (Json?) — 폐출혈 이력 (bleCnt, bleDate, medicalInfo)
- `isScratched` (Boolean) — 출전 취소 여부
- **파일**: `server/prisma/schema.prisma`

### 7. DB 초기화 (마이그레이션 없음, Seed 기본값)

- **전략**: 마이그레이션 없음. `prisma db push`로 스키마 반영 후 `seed.sql`로 기본값 삽입
- **실행**: `npm run db:init` = `prisma db push` + `prisma db execute --file prisma/seed.sql`
- **Seed 기본값**:
  - `point_configs` — 승식별 포인트 배율
  - `point_ticket_prices` — 1장 = 1200pt
  - `subscription_plans` — LIGHT(라이트), STANDARD(스탠다드), PREMIUM(프리미엄)
  - `global_config` — show_google_login 등 기능 플래그
- **멱등성**: `ON CONFLICT DO NOTHING` / `WHERE NOT EXISTS`로 재실행 시 중복 없음
- **파일**: `server/prisma/seed.sql`, `docs/architecture/DATABASE_SCHEMA.md`

---

## 2026-02-12 (목) — KRA 분석 & 예측 저장

### 1. KRA 분석 전략 (Python + NestJS)

- **Python**: `scripts/analysis.py` — `calculate_jockey_score`, `get_weight_ratio`, `analyze_jockey` (마칠기삼)
- **NestJS**: `AnalysisService`, `AnalysisController` — `GET /api/analysis/race/:raceId/jockey`
- **PredictionsService**: Gemini 프롬프트에 기수 분석 결과 포함
- 문서: [KRA_ANALYSIS_STRATEGY.md](../specs/KRA_ANALYSIS_STRATEGY.md)

### 2. 예측 성공 시 DB 저장

- **Prediction.scores** 확장: `horseScores`(Gemini) + `analysisData`(horseScoreResult, jockeyAnalysis)
- **예측 정확도**: `ResultsService.bulkCreate` 시 `updatePredictionAccuracy` 호출 → `Prediction.accuracy` 계산·저장

### 3. Admin 빌드 수정

- `AdminController` activate/deactivate: `UpdateUserDto` 타입 명시

---

## 2026-02-12 (목)

### 1. 포인트 & 승식 시스템 (Picks, Points)

- **UserPick 확장**: `pickType`, `hrNos[]`, `hrNames[]`, `pointsAwarded` 추가
- **승식 7종**: SINGLE, PLACE, QUINELLA, EXACTA, QUINELLA_PLACE, TRIFECTA, TRIPLE
- **PointConfig**: 베이스 포인트, 승식별 배율 (시드: `prisma/seed.sql`)
- **PointTicketPrice**: 포인트 예측권 가격 (1장=1200pt)
- **적중 지급**: Results bulkCreate 시 `awardPickPointsForRace` 호출
- **포인트 구매**: `POST /points/purchase-ticket` — 포인트로 예측권 구매

### 2. WebApp 통일

- **테마**: 금색(#ffd700) & 검정(#0c0c0c) — `lib/theme.ts`, `styles/globals.css`
- **아이콘**: Lucide React (`components/icons.tsx`)
- **페이지**: picks, profile(포인트), ranking, races/[id](승식 선택)
- **API**: picksApi, pointApi (getMyBalance, getTicketPrice, purchaseTicket)

### 3. Mobile → WebApp 중심 전환

- **Mobile**: WebView만 사용 → WebApp URL 로드, Google 로그인 토큰 전달
- **제거**: lib/, components/, context/, store/, mocks/, hooks/, utils/, constants/, config/
- **\_layout.tsx**: Stack + SplashScreen만 유지 (AuthProvider, Redux, React Query, MSW 제거)
- **의존성 정리**: React Query, Redux, MSW, Toast, react-hook-form, Axios 등 제거

### 4. 사행성 제거 (기존)

- 베팅 없음: Picks(내가 고른 말)로 기록만 저장
- previewApproved: 검수 통과 예측만 preview API 반환

### 5. DB 스키마 (마이그레이션 없음)

- `prisma db push` 사용 (초기 설계 단계)

### 6. 구글 로그인 통합 (2026-02-12)

- **Server**: `POST /auth/google` — idToken 검증 후 JWT 발급 (google-auth-library)
- **WebApp (웹)**: `/login`에 Google GSI 버튼 — `GoogleSignInButton` (GSI JavaScript API)
- **WebApp (Mobile)**: Native Bridge `LOGIN_SUCCESS` 시 `AuthApi.googleLogin(idToken)` → JWT 저장
- **Mobile**: `app.config.js` webClientId → `GoogleSignin.configure` — idToken 획득 후 WebApp에 전달
- **설정**: Server `GOOGLE_CLIENT_ID`, WebApp `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, Mobile `app.config.js` — 동일 Web Client ID
- 문서: [docs/guides/authentication/GOOGLE_AUTH_SETUP.md](../guides/authentication/GOOGLE_AUTH_SETUP.md)

---

## 참조 문서

- [포인트 & 승식 기획안](../features/POINT_PICK_SYSTEM.md)
- [비즈니스 로직](BUSINESS_LOGIC.md)
