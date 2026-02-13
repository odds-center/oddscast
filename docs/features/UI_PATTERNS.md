# WebApp 공용 UI 디자인 패턴

> 모든 페이지에서 일관된 디자인을 위해 공용 컴포넌트·스타일을 사용합니다.

---

## 테마·레이아웃

### 테마 (라이트)

| 구분    | 값                   |
| ------- | -------------------- |
| 배경    | `#fafafa`            |
| 카드    | `#ffffff`            |
| Primary | `#c9a227` (골드)     |
| 텍스트  | `#18181b`, `#52525b` |
| 테두리  | `#e4e4e7`            |

### 콘텐츠 최대 너비

- **1200px** — 헤더, 메인, 푸터 동일 적용
- `lg:max-w-[1200px] mx-auto`

### 스크롤바

- **크기**: 6px (가로·세로)
- **Firefox**: `scrollbar-width: thin`
- **WebKit**: track/thumb hover·active 상태

---

## 하단 네비게이션 (Bottom Nav)

### 구성

- **5개 고정**: 홈 / 경주 / 종합 / 결과 / 내 정보
- **모바일·데스크톱 동일**: 플로팅 바 (`nav-mobile-bar`)
- **추가 메뉴**: 랭킹·알림·구독·설정 → 내 정보(프로필) → 메뉴에서 진입

| 메뉴 | 경로 | 비고 |
|------|------|------|
| 홈 | `/` | 메인 |
| 경주 | `/races` | 전체 경주 목록 |
| 종합 | `/predictions/matrix` | 종합 예상표 |
| 결과 | `/results` | 경주 결과 |
| 내 정보 | `/profile` | 예측권, 포인트, 구독 + 메뉴(랭킹·알림·구독 플랜·설정 등) |

### 스타일

- `globals.css`: `.nav-mobile-bar`, `.nav-mobile-item`, `.nav-mobile-item-active`
- 활성 탭: primary 색상, 골드 그라데이션 배경

### 모바일 최적화

- **main 패딩**: 모바일 `1rem` (16px) + safe-area, 데스크 `2rem` (32px)
- **콘텐츠**: `py-4` (상하 16px), `pb-[200px]` (nav/푸터 가림 방지). 가로 패딩은 main에서 처리
- **네비 아이템**: `min-height: 48px` (터치 영역 44px 이상)
- **푸터**: 모바일 `text-[11px]`, `gap-x-3` (공간 절약)

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

### 적용 페이지

| 페이지                             | 용도                                         |
| ---------------------------------- | -------------------------------------------- |
| 경주 목록 (/)                      | 경주 테이블                                  |
| 경주 결과 (/results)               | 결과 테이블 (같은 경기 1·2·3위 한 행에 묶음) |
| 경주 상세 (/races/[id])            | 경주 결과, 출전마 (compact)                  |
| 종합예상표 (PredictionMatrixTable) | 매트릭스 표                                  |
| 포인트, 예측권, 알림               | 목록 테이블                                  |
| 랭킹                               | 랭킹 테이블                                  |

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
| 경주 목록 | `/races?date=today&page=3` | O |
| 경주 결과 | `/results?date=2026-02-13&page=2` | O |
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

## 필터·날짜 (FilterDateBar)

필터 칩 + 날짜 선택을 묶은 공용 컴포넌트. 필터/날짜 변경 시 페이지는 1로 초기화합니다.

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
- **적용**: backHref 있는 페이지 (내 정보, 알림, 경주, 설정 등)

---

## 뒤로가기 (BackLink)

뒤로가기 링크 — ChevronLeft 아이콘 포함:

```tsx
<BackLink href={routes.profile.index} label='내 정보로' className='mt-6' />
```

### 규칙

- **커스텀 `← 텍스트` 링크 사용 금지** → `BackLink` 사용
- **내 정보 하위 페이지**: "내 정보로" BackLink 제거 (CompactPageTitle 뒤로가기로 충분)

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

---

## 페이지 레이아웃

```tsx
<Layout title="페이지명 — GOLDEN RACE">
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

## 컴포넌트 요약

| 구분  | 컴포넌트                                           | 경로                 |
| ----- | -------------------------------------------------- | -------------------- |
| page/ | PageHeader, SectionCard, DataFetchState, FormInput | `@/components/page/` |
| page/ | BackLink, FilterDateBar, FilterChips, Pagination   | `@/components/page/` |
| ui/   | TabBar, LinkBadge, StatusBadge, RankBadge          | `@/components/ui`    |
| ui/   | Card, Badge, Toggle, Dropdown, SectionTitle        | `@/components/ui`    |
