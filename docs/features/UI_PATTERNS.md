# WebApp 공용 UI 디자인 패턴

> 모든 페이지에서 일관된 디자인을 위해 공용 컴포넌트·스타일을 사용합니다.

---

## 테마·레이아웃

### 테마 (라이트)

| 구분 | 값 |
|------|-----|
| 배경 | `#fafafa` |
| 카드 | `#ffffff` |
| Primary | `#c9a227` (골드) |
| 텍스트 | `#18181b`, `#52525b` |
| 테두리 | `#e4e4e7` |

### 콘텐츠 최대 너비

- **1200px** — 헤더, 메인, 푸터 동일 적용
- `lg:max-w-[1200px] mx-auto`

### 스크롤바

- **크기**: 6px (가로·세로)
- **Firefox**: `scrollbar-width: thin`
- **WebKit**: track/thumb hover·active 상태

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

| 페이지 | 용도 |
|--------|------|
| 경주 목록 (/) | 경주 테이블 |
| 경주 결과 (/results) | 결과 테이블 (같은 경기 1·2·3위 한 행에 묶음) |
| 경주 상세 (/races/[id]) | 경주 결과, 출전마 (compact) |
| 종합예상표 (PredictionMatrixTable) | 매트릭스 표 |
| 포인트, 예측권, 알림 | 목록 테이블 |
| 랭킹 | 랭킹 테이블 |

### 테이블 내 링크

경주/결과 링크는 `LinkBadge` 사용:

```tsx
<LinkBadge href={routes.races.detail(race.id)} icon="Flag" iconSize={14}>
  {meetName} {rcNo}경
</LinkBadge>
```

---

## 페이지네이션 (Pagination)

### 사용 규칙

- **목록 페이지**는 `Pagination` 컴포넌트 필수
- `totalPages <= 1` 이면 자동 숨김

```tsx
import Pagination from '@/components/page/Pagination';

<Pagination
  page={page}
  totalPages={totalPages}
  onPrev={() => setPage((p) => Math.max(1, p - 1))}
  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
  className="mt-4"
/>
```

### 적용 페이지

| 페이지 | 비고 |
|--------|------|
| 경주 목록 (/) | 20개/페이지 |
| 경주 결과 (/results) | 250개/페이지 |
| 포인트 거래 | |
| 예측권 이력 | |
| 알림 | |

---

## 필터·날짜 (FilterDateBar)

필터 칩 + 날짜 선택을 묶은 공용 컴포넌트:

```tsx
<FilterDateBar
  filterOptions={[
    { value: '', label: '전체' },
    { value: 'today', label: '오늘' },
  ]}
  filterValue={dateFilter}
  onFilterChange={(v) => { setDateFilter(v); setPage(1); }}
  dateValue={dateFilter}
  onDateChange={(v) => { setDateFilter(v); setPage(1); }}
  dateId="race-date"
/>
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
  variant="filled"   // 'filled' | 'subtle'
  size="md"          // 'sm' | 'md'
  className="mb-6"
/>
```

### Props

| Prop | 설명 | 기본값 |
|------|------|--------|
| variant | `filled`: primary 배경 / `subtle`: neutral 배경 | `subtle` |
| size | `sm`: compact / `md`: 더 큰 패딩 | `sm` |

### 적용 페이지

| 페이지 | variant | size |
|--------|---------|------|
| 프로필 수정 | filled | md |
| 경주 상세 (경주 결과 \| AI 예상) | subtle | sm |
| 종합예상표 (종합 예상표 \| AI/전문가 코멘트) | subtle | md |

---

## 뒤로가기 (BackLink)

뒤로가기 링크 — ChevronLeft 아이콘 포함:

```tsx
<BackLink href={routes.profile.index} label="내 정보로" className="mt-6" />
```

### 규칙

- **커스텀 `← 텍스트` 링크 사용 금지** → `BackLink` 사용

---

## 배지 (Badge)

| 컴포넌트 | 용도 |
|----------|------|
| **StatusBadge** | 경주 상태 (START, END, CANCEL 등) |
| **RankBadge** | 순위 1·2·3등 (금·은·동 스타일) |
| **badge-muted** (CSS) | 거리, 출발시각 등 보조 정보 |

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

| 구분 | 컴포넌트 | 경로 |
|------|----------|------|
| page/ | PageHeader, SectionCard, DataFetchState, FormInput | `@/components/page/` |
| page/ | BackLink, FilterDateBar, FilterChips, Pagination | `@/components/page/` |
| ui/ | TabBar, LinkBadge, StatusBadge, RankBadge | `@/components/ui` |
| ui/ | Card, Badge, Toggle, Dropdown, SectionTitle | `@/components/ui` |
