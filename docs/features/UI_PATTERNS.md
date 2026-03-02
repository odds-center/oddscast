# WebApp 공용 UI 디자인 패턴

> 모든 페이지에서 일관된 디자인을 위해 공용 컴포넌트·스타일을 사용합니다.

---

## 테마·레이아웃

### 테마 — 다크 골드 (KRA 참고)

| 구분 | 값 | 비고 |
|------|-----|------|
| 배경 | `#f5f5f4` | warm stone gray |
| 카드 | `#ffffff` | 흰 배경 |
| Primary | `#92702A` | 다크 골드 (세련된 톤) |
| Primary Dark | `#7A5D1F` | hover/active |
| 로고/포인트 | `#d4a942` | 골드 포인트 |
| 헤더 | `#1c1917` | 다크 헤더 (KRA 스타일) |
| 섹션 헤더 | `#292524` | KRA 테이블 헤더 |
| 텍스트 (주) | `#1c1917` | foreground |
| 텍스트 (보조) | `#57534e` | text-secondary |
| 텍스트 (약) | `#a8a29e` | text-tertiary |
| 테두리 | `#e7e5e4` | stone-200 |
| Accent 라인 | `var(--primary)` | 좌측 3px 골드 |
| 색상 계열 | `stone-*` | warm gray 통일 (slate/gray 미사용) |

### nowrap 규칙

- 테이블 `th`, `td`, `a`, `span`, `p` → `white-space: nowrap` (globals.css)
- 설명문 외 모든 텍스트 요소에 `whitespace-nowrap` 적용
- 배지, 상태, 링크, 날짜 등 한 줄 요소는 반드시 nowrap

### 콘텐츠 최대 너비

- **1200px** — 헤더, 메인, 푸터 동일 적용
- `lg:max-w-[1200px] mx-auto`

### 스크롤바

- **크기**: 6px (가로·세로)
- **Firefox**: `scrollbar-width: thin`
- **WebKit**: track/thumb hover·active 상태

---

## 앱 바 (App Bar / Bottom Nav)

### 구성

- **5개 고정**: 홈 / 경주 / 종합 / 결과 / 정보
- **추가 메뉴**: 랭킹·알림·구독·설정 → 정보(프로필) → 메뉴에서 진입

| 메뉴 | 경로 | 비고 |
|------|------|------|
| 홈 | `/` | 메인 |
| 경주 | `/races` | 전체 경주 목록 |
| 종합 | `/predictions/matrix` | 종합 예상표 |
| 결과 | `/results` | 경주 결과 |
| 정보 | `/profile` | 예측권, 포인트, 구독 + 메뉴(랭킹·알림·구독 플랜·설정 등) |

### 모바일 vs 데스크톱 동작 차이

| 환경 | 동작 |
|------|------|
| **모바일** (< 768px) | 화면 하단 완전 고정, `safe-area-inset-bottom` 반영, 드래그·방향 전환 없음 |
| **데스크톱** (≥ 768px) | 플로팅 앱 바 — 드래그 이동, 모서리 스냅, 가로/세로 전환 |

### 구현 위치

- **`FloatingAppBar`** 컴포넌트: `Layout.tsx`에서 정의, `_app.tsx`에서 렌더
- `_app.tsx`에서 한 번만 마운트하므로 페이지 전환 시 깜빡임 없음
- **모바일**: `nav-mobile-bar-fixed` 클래스 — `fixed bottom-0 left-0 right-0`, `justify-between`
- **데스크톱**: localStorage에 위치/방향 저장 (`readStoredPosition`, `readStoredOrientation`)
- 드래그 핸들: `Grip` 아이콘(9점 그리드), 방향 전환: `PanelLeft`/`PanelBottom`

### 스타일

- `globals.css`: `.nav-mobile-bar`, `.nav-mobile-bar-fixed`, `.nav-mobile-item`, `.nav-mobile-item-active`
- `.nav-mobile-bar-vertical`, `.nav-mobile-item-vertical` (데스크톱 세로 모드)
- 활성 탭: primary 색상, 아이콘 배경 `primary-muted`

### 모바일 레이아웃 최적화

- **main 패딩**: 모바일 `1rem` (16px) + safe-area, 데스크 `2rem` (32px)
- **콘텐츠**: `pb-[200px]` (앱 바 가림 방지). 가로 패딩은 main에서 처리
- **네비 아이템**: 아이콘 22px, 라벨 `text-xs`, `min-height: 42px` (터치 영역)
- **푸터**: Layout에서 제거됨 — 정보(프로필) 페이지에만 `LegalFooter` 컴포넌트로 표시

---

## 테이블 (Table)

### 공용 컴포넌트: DataTable

- **DataTable** 사용 권장 — columns 정의로 일관된 테이블 렌더링
- `data-table-wrapper` + `data-table` 스타일 자동 적용
- 정렬: `align: 'center' | 'right'` (기본: left)
- 컴팩트: `compact={true}`

```tsx
import { DataTable } from '@/components/ui';

<DataTable
  columns={[
    { key: 'race', header: '경주', headerClassName: 'w-24', render: (row) => <LinkBadge href={...}>{row.meetName}</LinkBadge> },
    { key: 'date', header: '날짜', render: (row) => formatRcDate(row.rcDate) },
    { key: 'points', header: '포인트', align: 'center', headerClassName: 'w-20', render: (row) => row.points },
  ]}
  data={items}
  getRowKey={(row) => row.id}
  compact={false}
  emptyMessage="데이터가 없습니다"
/>
```

### 사용 규칙 (커스텀 테이블 시)

- 직접 구현 시 `data-table-wrapper` + `data-table` 클래스 사용
- 정렬: `.cell-center`, `.cell-right`
- 컴팩트: `.data-table-compact`
- nowrap: `.data-table` th/td에 `white-space: nowrap` 기본 적용

### 모바일 테이블 스크롤

- `.data-table-wrapper`에 `overflow-x: auto` + `-webkit-overflow-scrolling: touch` 적용
- `.data-table`에 `min-width: max-content` → 컬럼이 잘리지 않고, 넘치면 좌우 스크롤
- 커스텀 table 사용 시에도 부모 div에 `overflow-x-auto` 필수 적용
- 모바일(768px 이하)에서 자동으로 터치 기반 좌우 스크롤 활성화

### 적용 페이지

| 페이지                             | 용도                                         |
| ---------------------------------- | -------------------------------------------- |
| 경주 목록 (/)                      | 경주 테이블                                  |
| 경주 결과 (/results)               | 결과 테이블 (같은 경기 1·2·3위 한 행에 묶음) |
| 경주 상세 (/races/[id])            | 경주 결과, 출전마 (compact)                  |
| 종합예상표 (PredictionMatrixTable) | 매트릭스 표                                  |
| 포인트, 예측권, 알림               | 목록 테이블                                  |
| 랭킹                               | 랭킹 테이블                                  |

### 경주 결과 테이블 (`/results`) 전용 패턴

- **compact**: `compact={true}` 권장 (패딩 축소)
- **1·2·3위 셀**: 가로형 `[출전번호] 마명(기수) 기록` 한 줄 배치
- **기록 표기**:
  - 1위: rcTime (경주기록, 예: `1:12.3`)
  - 2·3위: diffUnit (착차, 예: `0.3`, `0.8`)
- **컬럼 너비**: 경주 `w-24`, 날짜 `w-20`, 1·2·3위 `min-w-[100px]`

### 빈 상태·에러 문구 톤앤매너

- **빈 상태 (Empty)**: `emptyTitle`은 "~가/이 없습니다" 형식 (예: 경주가 없습니다, 결과가 없습니다). `emptyDescription`은 다음 행동 안내 (예: "다른 날짜나 조건을 선택해보세요.").
- **에러 (Error)**: `errorTitle`은 "~를/을 확인할 수 없습니다" 또는 "~를/을 불러올 수 없습니다" 형식. 에러 시 **다시 시도** 버튼 제공 (`onRetry`).
- **로딩**: `loadingLabel`은 "~ 준비 중..." (예: 경주 정보 준비 중..., 결과 준비 중...).

DataFetchState 사용 시 위 패턴으로 `emptyTitle`, `emptyDescription`, `errorTitle`, `loadingLabel`을 페이지별로 설정합니다.

### 테이블 내 링크

경주/결과 링크는 `LinkBadge` 사용:

```tsx
<LinkBadge href={routes.races.detail(race.id)} icon='Flag' iconSize={14}>
  {meetName} {rcNo}경
</LinkBadge>
```

---

## 페이지네이션 (Pagination)

### 사용 규칙

- **목록 페이지**는 `Pagination` 컴포넌트 필수
- `totalPages <= 1` 이면 자동 숨김
- **형식**: `< 1 ... 2 3 4 ... 5 >` — 여러 페이지로 직접 이동, 이전/다음 버튼 포함

```tsx
import Pagination from '@/components/page/Pagination';

<Pagination
  page={page}
  totalPages={totalPages}
  onPageChange={(p) => setPage(p)}
  className='mt-4'
/>
```

### Props

| Prop | 설명 |
|------|------|
| `page` | 현재 페이지 (1부터) |
| `totalPages` | 전체 페이지 수 |
| `onPageChange` | `(page: number) => void` — 페이지 변경 시 호출 |

### URL 동기화 (뒤로가기 시 페이지 복귀)

목록 → 상세 → **뒤로가기** 시 이전 페이지로 복귀하려면 `page`를 URL query로 관리합니다.

| 페이지 | URL 예 | 적용 |
|--------|--------|------|
| 경주 목록 | `/races?date=today&meet=서울&page=3` | O |
| 경주 결과 | `/results?date=2026-02-13&meet=제주&page=2` | O |
| 내가 고른 말 | `/mypage/picks?page=2` | O |
| 포인트·예측권·알림 | `useState`만 사용 | - |

```tsx
// page, date를 router.query에서 읽고, 변경 시 router.replace
const page = Math.max(1, parseInt(String(router.query?.page ?? 1), 10) || 1);
const updateQuery = (updates: Record<string, string | number | undefined>) => {
  const next = { ...router.query, ...updates };
  Object.keys(updates).forEach((k) => {
    if (updates[k] === undefined || updates[k] === '') delete next[k];
  });
  router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true });
};
<Pagination page={page} totalPages={totalPages} onPageChange={(p) => updateQuery({ page: p })} />
```

### 적용 페이지

| 페이지               | 비고                        |
| -------------------- | --------------------------- |
| 경주 목록 (/races)   | 20개/페이지, URL 동기화     |
| 경주 결과 (/results) | 250개/페이지, URL 동기화    |
| 내가 고른 말         | URL 동기화                  |
| 포인트 거래          |                             |
| 예측권 이력          |                             |
| 알림                 |                             |

---

## 필터·날짜·지역 (FilterDateBar)

필터 칩 + 날짜 선택 + 지역(경마장) 필터를 묶은 공용 컴포넌트. 경주·결과는 **최신날짜순**, **지역(서울/제주/부산) 필터** 지원.

**URL 동기화 사용 시** (경주 목록, 경주 결과):

```tsx
<FilterDateBar
  filterOptions={[
    { value: '', label: '전체' },
    { value: 'today', label: '오늘' },
  ]}
  filterValue={dateFilter}
  onFilterChange={(v) => updateQuery({ date: v || undefined, page: 1 })}
  dateValue={dateFilter}
  onDateChange={(v) => updateQuery({ date: v || undefined, page: 1 })}
  dateId='race-date'
  showMeetFilter
  meetValue={meetFilter}
  onMeetChange={(v) => updateQuery({ meet: v || undefined, page: 1 })}
/>
```

**단순 state 사용 시**:

```tsx
onFilterChange={(v) => { setDateFilter(v); setPage(1); }}
onDateChange={(v) => { setDateFilter(v); setPage(1); }}
```

### 적용 페이지

- 경주 목록, 경주 결과, 종합예상표

---

## 탭바 (TabBar)

세그먼트 스타일 탭 — 세그먼트 컨트롤 형태의 탭 전환:

```tsx
<TabBar
  options={[
    { value: 'profile', label: '기본 정보' },
    { value: 'password', label: '비밀번호' },
  ]}
  value={activeTab}
  onChange={(v) => setActiveTab(v)}
  variant='filled' // 'filled' | 'subtle'
  size='md' // 'sm' | 'md'
  className='mb-6'
/>
```

### Props

| Prop    | 설명                                            | 기본값   |
| ------- | ----------------------------------------------- | -------- |
| variant | `filled`: primary 배경 / `subtle`: neutral 배경 | `subtle` |
| size    | `sm`: compact / `md`: 더 큰 패딩                | `sm`     |

### 적용 페이지

| 페이지                                       | variant | size |
| -------------------------------------------- | ------- | ---- |
| 프로필 수정                                  | filled  | md   |
| 경주 상세 (경주 결과 \| AI 예상)             | subtle  | sm   |
| 종합예상표 (종합 예상표 \| AI/전문가 코멘트) | subtle  | md   |

---

## 페이지 헤더 (CompactPageTitle) — 모바일 sticky

- **모바일**: `sticky top-0`, 상단 고정 GNB 스타일 (뒤로가기 + 제목)
- **데스크**: 일반 인라인
- **적용**: backHref 있는 페이지 (정보, 알림, 경주, 설정 등)

---

## 뒤로가기 (BackLink)

뒤로가기 링크 — ChevronLeft 아이콘 포함:

```tsx
<BackLink href={routes.profile.index} label='정보로' className='mt-6' />
```

### 규칙

- **커스텀 `← 텍스트` 링크 사용 금지** → `BackLink` 사용
- **정보 하위 페이지**: "정보로" BackLink 제거 (CompactPageTitle 뒤로가기로 충분)

---

## 배지 (Badge)

| 컴포넌트              | 용도                              |
| --------------------- | --------------------------------- |
| **StatusBadge**       | 경주 상태 (START, END, CANCEL 등) |
| **RankBadge**         | 순위 1·2·3등 (금·은·동 스타일)    |
| **badge-muted** (CSS) | 거리, 출발시각 등 보조 정보       |

---

## 버튼·스타일

- `btn-primary`: 메인 액션
- `btn-secondary`: 보조 액션, 취소
- `msg-error`, `msg-success`: 폼 피드백

### 접근성·터치 (Accessibility & Touch)

- **터치 영역**: 모바일(768px 미만)에서 버튼·칩·페이지네이션 등 **min-height 44px** 적용 (UI_PATTERNS 권장)
- **포커스**: `focus-visible:ring-2 focus-visible:ring-primary/40` — 키보드 네비게이션 시 링 표시
- **FilterChips**: 활성 칩 `bg-primary` (브랜드 골드), `aria-pressed`, `aria-label` 적용
- **LinkBadge**: `focus-visible` 링, `hover:border-primary/30`

---

## 페이지 레이아웃

```tsx
<Layout title="페이지명 — OddsCast">
  <PageHeader icon="IconName" title="제목" description="설명" />
  <FilterDateBar {...} />  {/* 필요 시 */}
  <DataFetchState isLoading={...} error={...} isEmpty={...}>
    {/* data-table-wrapper + data-table */}
    <Pagination {...} />
  </DataFetchState>
  <BackLink href={...} label="돌아가기" />
</Layout>
```

---

## 툴팁 (Tooltip)

경마 용어를 처음 접하는 사용자에게 맥락 설명을 제공하는 CSS 기반 경량 툴팁.

```tsx
import { Tooltip } from '@/components/ui';

<Tooltip content='산지(한/미/일) + 연령 + 성별(수/암/거)' inline>마령</Tooltip>
<Tooltip content='1위를 맞추는 배당. 높을수록 고배당' inline position='right'>단승</Tooltip>
```

### Props

| Prop     | 설명                                           | 기본값 |
| -------- | ---------------------------------------------- | ------ |
| content  | 툴팁에 표시될 설명 텍스트                      | 필수   |
| children | 감싸는 자식 요소                               | 필수   |
| position | `top` \| `bottom` \| `left` \| `right`         | `top`  |
| inline   | `th`, `span` 등에 적용 시 `true` (인라인 래핑) | false  |

### 적용 위치

| 영역            | 용어                                         |
| --------------- | -------------------------------------------- |
| HorseEntryTable | 마령, 부담, 마체중, 레이팅, 통산, 최근, 장구 |
| 경주 결과 테이블 | 기록, 착차, 단승, 복승                       |
| 승식별 AI 추천  | 단승식~삼쌍승식 7개 승식 설명                |
| 마칠기삼 분석   | 말·기수·조교사 가중치 분석 설명              |
| 랭킹 페이지     | 적중 기준 설명                               |
| 프로필          | 예측권·포인트 사용 방법                      |

### 스타일

- `?` 아이콘 (SVG) + `group-hover` 트리거
- 배경 `bg-slate-800`, 텍스트 `text-white`, 라운딩 `rounded-lg`
- 화살표 CSS border-trick
- `opacity-0 → opacity-100` + `scale-95 → scale-100` 트랜지션

---

## SectionCard description

SectionCard에 `description` prop을 지원하여 섹션 제목 아래 한 줄 설명을 표시합니다.

```tsx
<SectionCard title='예측권' icon='Ticket' description='경주별 AI 분석을 열람할 때 1장씩 사용됩니다'>
  {/* 콘텐츠 */}
</SectionCard>
```

### 홈 섹션 설명

| 섹션           | description                           |
| -------------- | ------------------------------------- |
| 발매경주       | 오늘 진행되는 경주 목록               |
| 금주의 경주    | 이번 주 금·토·일 예정 경주            |
| 종합 예상지    | 경주별 AI 추천 출전번호·말 종합표     |
| 최근 결과      | 가장 최근 완료된 경주의 1·2·3위 결과  |
| 예측 랭킹      | AI 예측 적중률 기반 사용자 순위       |
| 경주 예상지    | 각 경주별 AI 예측 요약 및 추천마      |
| 전체 경주      | 서울·부산·제주 경마장 경주 일정 및 상태 |

---

## 홈 DateHeader

- **경주일 표시**: 금·토·일에 `RACE DAY` 배지 + "오늘은 경주일입니다" 안내
- **비경주일**: "다음 경주일: X요일 (M/D)" 표시
- 경주일 판별: `[5, 6, 0]` (금, 토, 일)

---

## 공용 포맷 유틸 (`webapp/lib/utils/format.ts`)

모든 날짜·시간·숫자 포맷을 `format.ts`에서 관리합니다. 로컬 `formatDate()` 등은 사용하지 않고 반드시 공용 유틸을 import합니다.

| 함수 | 입력 | 출력 예 | 용도 |
| --- | --- | --- | --- |
| `formatRcDate(rcDate)` | `"20250215"` | `"2025.02.15"` | YYYYMMDD 날짜 |
| `formatRcDateShort(rcDate)` | `"20250215"` | `"2월 15일"` | 간략 날짜 |
| `formatTime(date)` | ISO/Date | `"오후 3:05"` | 시간 (ko-KR) |
| `formatDateTime(date)` | ISO/Date | `"2025. 2. 15. 오후 3:05"` | 날짜+시간 |
| `formatDateOnly(date)` | ISO/Date | `"2025. 2. 15."` | 날짜만 |
| `formatNumber(n)` | `1234` | `"1,234"` | 천단위 |
| `formatWon(n)` | `1234` | `"1,234원"` | 금액 |
| `formatPoint(n)` | `1234` | `"1,234pt"` | 포인트 |

> **규칙**: `toLocaleString()`, `toLocaleTimeString()` 직접 호출 금지. 반드시 공용 유틸 사용.

---

## 경주 상세 페이지 구조 (`webapp/pages/races/[id].tsx`)

탭 없이 단일 스크롤 플로우:

1. **경주 헤더** — `RaceHeaderCard` (경마장, 경주번호, 거리, 시간 등)
2. **경주 결과** — 결과 있을 때만. 1-3위 하이라이트 카드 + 4위 이하 접기 + 배당 접기
3. **AI 예측** — `PredictionFullView` (예측권 사용) 또는 `PredictionLockedView` (미사용)
4. **출전마** — `<details>` 접기. entries 없으면 raceResults에서 자동 추출
5. **기수·말 통합 분석** — `<details>` 접기

### AI 예측 3가지 추천식 (`BetTypePredictionsSection`)

- 핵심 3개 승식(단승/연승/삼쌍)을 컬러 카드로 표시 (amber/blue/purple)
- 나머지 4개 승식은 "나머지 N개 승식 보기" 접기

### 예측권 1분 쿨다운

- 서버: `useTicket()` 시 같은 경주 60초 이내 재사용 차단
- 클라이언트: `useCooldown(lastUsedAt)` 훅 → 실시간 카운트다운 표시

### 예측 기록

- 복수 예측 시 pill 형태 탭("최신", "2번째"…)으로 전환
- 각 기록에 생성 시간 표시 (`formatTime`)

---

## 경주 결과 목록 (`webapp/pages/results.tsx`)

- 모바일: 1-3위 하이라이트 카드 + "전체 출전마 (N마리)" 접기
- 데스크톱: DataTable에 "출전마" 컬럼 추가
- 전체 출전마·기수 표시 (기존 1-3위만 필터 제거)

---

## 홈페이지 패턴 (`webapp/pages/index.tsx`)

### 히어로 배너 (`DateHeader`)

- 클래스: `.home-hero` — 다크 배경(`#1c1917`) + 우측 골드 그래디언트 장식
- 날짜 표시 + 경주 진행 상태 + "오늘의 경주", "종합 예상" 바로가기
- 경주일이면 "오늘 경주가 진행됩니다" / 비경주일이면 "다음 경주: X일"

### 퀵 메뉴 바 (KRA 스타일)

- 발매경주, 경주성적, 종합예상, 예측랭킹 4개 링크
- `border-b-2 border-transparent hover:border-[#92702A]` — 하단 밑줄 hover 효과
- `overflow-x-auto` 가로 스크롤 대응

### 섹션 레이아웃

- `SectionCard` — 제목 + 설명 + "더보기" 링크
- 2열 그리드 (lg:grid-cols-2): 오늘의 경주 | 종합 예상 미리보기
- 하단: 금주 경주, 최근 결과

---

## 종합 예상 페이지 패턴 (`predictions/matrix.tsx`)

### 페이지 구조 — 일일 종합 가이드

```
히어로 헤더 (날짜 + 경주 수 + 경마장별 + 예측권 상태)
├── 날짜/경마장 필터 (FilterDateBar)
├── 종합 예측권 CTA (비열람 상태일 때)
├── 탭 (종합 예상표 | AI 코멘트)
└── PredictionMatrixTable 또는 AI 코멘트 목록
```

### 종합 예측권 상태 표시

- 열람 중: `bg-[#92702A] text-white` 배지 ("열람 중")
- 잠금: `bg-stone-200 text-stone-600` 배지 ("잠금")
- 보유 예측권 수 표시

### 종합 예측권 CTA 카드

- 비열람 상태일 때 테이블 위에 표시
- 정보: "1일 1장", "1,000원/장", "전체 N경주 예상"
- 보유 시: "종합 예측권 사용" 버튼 → `useMatrixMutation`
- 미보유 시: "종합 예측권 구매 — 1,000원" 링크

### PredictionMatrixTable — 용산종합지 스타일

- **헤더**: 다크 배경 + 골드 아이콘 + "종합 예상표" + 경주 수
- **컬럼 헤더**: `#1c1917` + AI 종합 골드 하이라이트
- **경주 정보 셀** (`RaceInfoCell`): 경주번호, 경마장, 출발시간, 거리, 등급, 출전두수
- **게이트 배지** (`GateBadge`): KRA 게이트 색상 (`w-6 h-6 text-[11px]`)
- **잠금 오버레이**: `locked=true` 시 `previewCount`경주만 노출, 나머지 블러+잠금 메시지
- **교차 행 색상**: 짝수 행 `bg-stone-50/50`

---

## 컴포넌트 색상 맵 (stone 계열)

| 컴포넌트 | 활성/강조 | 기본/비활성 | 비고 |
|---------|----------|-----------|------|
| `StatusBadge` | `#92702A` (진행) | `stone-600` (예정), `stone-500` (종료) | |
| `Badge` | `#92702A` (primary) | `stone-50/200/500` (muted) | |
| `RankBadge` | `#92702A` (1위) | `stone-200/100` (2,3위) | |
| `FilterChips` | `#292524` (활성) | `stone-200/500` (비활성) | |
| `SectionTitle` | `#92702A` (아이콘, 배지) | | |
| `LinkBadge` | `#92702A` (hover) | `stone-400` (아이콘) | |
| `PredictionSymbol` | `#92702A` (BEST), `#7A5D1F` (GOOD) | `stone-500/400/700` | |
| `BetTypePredictions` | `#92702A` (단승) | `stone-700/500` (연승/삼쌍) | |

---

## 컴포넌트 요약

| 구분  | 컴포넌트                                           | 경로                 |
| ----- | -------------------------------------------------- | -------------------- |
| page/ | PageHeader, SectionCard, DataFetchState, FormInput | `@/components/page/` |
| page/ | BackLink, FilterDateBar, FilterChips, Pagination   | `@/components/page/` |
| page/ | CompactPageTitle, RequireLogin, PageContent, MenuList | `@/components/page/` |
| page/ | LegalFooter (이용약관·개인정보·환불정책 푸터)      | `@/components/page/` |
| ui/   | TabBar, LinkBadge, StatusBadge, RankBadge          | `@/components/ui`    |
| ui/   | Card, Badge, Toggle, Dropdown, SectionTitle        | `@/components/ui`    |
| ui/   | Tooltip, DataTable, LinkCard                       | `@/components/ui`    |
| home/ | DateHeader, HomeQuickStats, TodayRacesSection      | `@/components/home/` |
| home/ | WeekRacesSection, RecentResultsSection             | `@/components/home/` |
| home/ | PredictionMatrixPreviewSection                     | `@/components/home/` |
| pred/ | PredictionMatrixTable, BetTypePredictionsSection   | `@/components/predictions/` |
| race/ | PredictionSymbol, HorseEntryTable                  | `@/components/race/` |
| icons | Icon (Lock, Unlock 포함)                           | `@/components/icons` |
| utils | formatRcDate, formatTime, formatDateTime, formatNumber | `@/lib/utils/format` |
| utils | getErrorMessage                                    | `@/lib/utils/error`  |
| analytics | trackCTA, GA_EVENTS (MATRIX_TICKET_USE 포함)   | `@/lib/analytics`    |

---

## 모바일 UI/UX 가이드라인

### 터치 타겟

- **버튼**: `min-height: 44px` (모바일), `border-radius: 10px`, `padding: 0 1rem`
- **폼 input**: `min-height: 44px`, `font-size: 16px` (iOS 줌 방지)
- **드롭다운 옵션**: `min-height: 44px`
- **메뉴 아이템**: `min-h-[56px]`, 아이콘 배경(`bg-stone-50`), 오른쪽 chevron(`>`) 표시

### 카드

- `border-radius: 10px`, 패딩 모바일 `0.875rem` / 데스크톱 `1.125rem`
- 클릭 가능한 카드는 `active` 피드백 (`background: #fafaf9`)
- `-webkit-tap-highlight-color: transparent`

### 버튼·링크

- `touch-action: manipulation` 적용
- `active` 상태에서 `transform: scale(0.97); opacity: 0.92`
- 모바일에서 주요 행동 버튼은 `w-full` 풀너비 권장 (예: 구매하기)
- 보조 링크·칩은 `touch-manipulation` + `active:bg-stone-50`

### 레이아웃 세로 스택

- 모바일에서 가로 나열이 좁을 때 `flex-col sm:flex-row` 패턴 사용
- 예: 프로필 예측권 구매 — 수량 선택(가로) + 구매 버튼(아래 풀너비)

### 테이블

- 넓은 테이블은 `overflow-x: auto` wrapper로 좌우 스크롤
- `.data-table { min-width: max-content }` — 컬럼 잘림 방지
- `-webkit-overflow-scrolling: touch` 적용

### SectionCard description

- 모바일에서도 description 표시 (이전: `hidden sm:inline` → 현재: 항상 표시)
- 제목 아래 별도 줄에 `text-xs text-stone-400`으로 배치

### 푸터

- Layout에서 제거됨 (앱 바와 겹치는 문제)
- 이용약관·개인정보처리방침·환불정책 → `LegalFooter` 컴포넌트로 정보(프로필) 페이지에만 표시
- 데스크톱·모바일 모두 동일
