---
paths:
  - "webapp/components/**"
  - "webapp/pages/**/*.tsx"
---

# Component Catalog & Usage Patterns

## WebApp Component Architecture

```
webapp/components/
├── Layout.tsx              # Main layout + FloatingAppBar
├── RaceCard.tsx            # Race preview card (link to detail)
├── HorsePickPanel.tsx      # Horse selection panel
├── LoadingSpinner.tsx      # Spinner with label
├── EmptyState.tsx          # Icon + title + description + CTA
├── icons.tsx               # Lucide wrapper with IconName union type
│
├── page/                   # Page-level building blocks
│   ├── PageHeader.tsx
│   ├── SectionCard.tsx
│   ├── DataFetchState.tsx
│   ├── FormInput.tsx
│   ├── FilterDateBar.tsx
│   ├── FilterChips.tsx
│   ├── Pagination.tsx
│   ├── CompactPageTitle.tsx
│   ├── RequireLogin.tsx
│   ├── AuthCard.tsx
│   ├── PageContent.tsx
│   ├── MenuList.tsx
│   └── LegalFooter.tsx
│
├── ui/                     # shadcn/ui primitives + custom domain components
│   ├── index.ts            # Barrel export (shadcn + custom)
│   ├── button.tsx          # shadcn Button
│   ├── badge.tsx           # shadcn Badge
│   ├── card.tsx            # shadcn Card (CardHeader, CardContent, etc.)
│   ├── input.tsx           # shadcn Input
│   ├── tooltip.tsx         # shadcn Tooltip (Radix-based)
│   ├── switch.tsx          # shadcn Switch
│   ├── select.tsx          # shadcn Select
│   ├── dialog.tsx          # shadcn Dialog
│   ├── alert-dialog.tsx    # shadcn AlertDialog
│   ├── tabs.tsx            # shadcn Tabs
│   ├── label.tsx           # shadcn Label
│   ├── separator.tsx       # shadcn Separator
│   ├── alert.tsx           # shadcn Alert
│   ├── skeleton.tsx        # shadcn Skeleton
│   ├── table.tsx           # shadcn Table
│   ├── DataTable.tsx       # Custom — column-based table
│   ├── TabBar.tsx          # Custom — segment tabs
│   ├── LinkBadge.tsx       # Custom — in-table link
│   ├── LinkCard.tsx        # Custom — card link
│   ├── StatusBadge.tsx     # Custom — race status
│   ├── RankBadge.tsx       # Custom — 1st/2nd/3rd
│   ├── SectionTitle.tsx    # Custom — section heading
│   ├── SimpleTooltip.tsx   # Custom — CSS tooltip (lightweight)
│   ├── Toggle.tsx          # Custom — toggle switch
│   ├── DatePicker.tsx      # Custom — react-day-picker
│   └── NetworkStatusBanner.tsx  # Custom — offline banner
│
├── home/                   # Home page sections
│   ├── DateHeader.tsx
│   ├── TodayRacesSection.tsx
│   ├── AllRacesSection.tsx
│   ├── WeekRacesSection.tsx
│   ├── RecentRacesSection.tsx
│   ├── RecentResultsSection.tsx
│   ├── PredictionMatrixPreviewSection.tsx
│   ├── RacePredictionsPreviewSection.tsx
│   ├── AccuracyPreviewSection.tsx
│   ├── AIPredictionSection.tsx
│   ├── WhyOddsCastSection.tsx
│   ├── TodaysFortuneCard.tsx
│   ├── HomeQuickStats.tsx
│   ├── QuickLinks.tsx
│   └── HomeSection.tsx
│
├── race/                   # Race domain
│   ├── HorseEntryTable.tsx
│   ├── RaceHeaderCard.tsx
│   └── PredictionSymbol.tsx
│
├── results/                # Result domain
│   └── ResultCard.tsx
│
├── predictions/            # Prediction domain
│   ├── PredictionMatrixTable.tsx
│   ├── CommentaryFeed.tsx
│   ├── HitRecordBanner.tsx
│   ├── HorseScoresBarChart.tsx
│   ├── BetTypePredictionsSection.tsx
│   └── PredictionResultComparison.tsx
│
└── onboarding/             # First-time user tutorial
    └── OnboardingTutorial.tsx
```

## Page Components (page/)

### PageHeader
```tsx
<PageHeader icon="ClipboardList" title="Race List" description="View upcoming races" />
```
- `icon`: IconName from lucide-react
- `title`: Page heading (h1)
- `description`: Optional subtitle

### DataFetchState
```tsx
<DataFetchState
  isLoading={isLoading}
  error={error}
  isEmpty={!data?.length}
  emptyTitle="No races found"
  emptyDescription="Try different filters"
>
  {/* Render only when data is loaded and non-empty */}
</DataFetchState>
```
- Handles all three states: loading (spinner), error (message + retry), empty (EmptyState)
- Always wrap data-dependent UI with this

### FilterDateBar
```tsx
<FilterDateBar
  selectedDate={date}
  onDateChange={setDate}
  meetFilter={meet}
  onMeetChange={setMeet}
  meetOptions={['all', 'SEOUL', 'JEJU', 'BUSAN']}
/>
```
- Combines date picker + filter chips in one bar
- Used on races, results, matrix pages

### FilterChips
```tsx
<FilterChips
  options={[{ value: 'all', label: 'All' }, { value: 'SEOUL', label: 'Seoul' }]}
  selected={selected}
  onChange={setSelected}
/>
```
- Min height 44px for touch targets

### Pagination
```tsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={(p) => router.replace({ query: { ...router.query, page: p } })}
/>
```
- Format: `< 1 ... 2 3 4 ... 5 >`
- Always sync with URL via `router.query`

### BackLink
```tsx
<BackLink href={routes.races.index} label="Back to Races" />
```
- ChevronLeft icon + label
- Not used on Info sub-pages (CompactPageTitle handles back nav)

### CompactPageTitle
```tsx
<CompactPageTitle title="Notification Settings" />
```
- Mobile: `sticky top-0` GNB style (back button + title)
- Used for settings sub-pages

### RequireLogin
```tsx
{!isLoggedIn && <RequireLogin message="Login to view predictions" />}
```
- Shows login prompt with link to auth page

### FormInput
```tsx
<FormInput
  label="Email"
  type="email"
  error={errors.email?.message}
  {...register('email', { required: 'Email is required' })}
/>
```
- Integrates with react-hook-form register

### SectionCard
```tsx
<SectionCard title="Race Information" className="mb-4">
  {/* Card content */}
</SectionCard>
```
- Titled card container

### LegalFooter
- Terms, privacy, refund links
- **Only on profile page** (`/profile`)

## UI Components (ui/)

### DataTable
```tsx
<DataTable
  columns={[
    { key: 'name', label: 'Name', render: (row) => <span>{row.name}</span> },
    { key: 'score', label: 'Score', align: 'right' },
  ]}
  data={items}
  emptyMessage="No data"
/>
```
- Column-based with custom render functions
- Mobile: horizontal scroll (`overflow-x: auto`, `min-width: max-content`)
- CSS class: `data-table`, `data-table-wrapper`

### TabBar
```tsx
<TabBar
  tabs={[
    { key: 'scores', label: 'Scores' },
    { key: 'analysis', label: 'Analysis' },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="filled"  // or "subtle"
  size="md"         // or "sm"
/>
```

### Card
```tsx
<Card variant="hover">{/* content */}</Card>
```
- Variants: `default`, `hover` (hover effect), `accent` (primary border)

### Badge / StatusBadge / RankBadge / LinkBadge
```tsx
<Badge>Label</Badge>
<StatusBadge status="COMPLETED" />      // Green for completed, etc.
<RankBadge rank={1} />                  // Gold medal for 1st, etc.
<LinkBadge href={`/races/${id}`} label="R5" />  // In-table clickable link
```

### Toggle
```tsx
<Toggle checked={enabled} onChange={setEnabled} label="Push Notifications" />
```

### Tooltip
```tsx
<Tooltip content="Speed Index explanation">
  <span>SI</span>
</Tooltip>
```
- CSS-based lightweight tooltip (hover)

### DatePicker
- Wraps react-day-picker
- Used on schedule page

## Icon System

```tsx
import { Icon } from '@/components/icons';
<Icon name="Trophy" size={20} />
```
- `IconName` type: union of all available Lucide icon names
- `Icon` component accepts `name`, `size`, `className`
- Custom icon: `Grip` (9-dot grid)

## Props Convention

- Define interface at top of component file:
```typescript
interface RaceCardProps {
  race: RaceDto;
  showStatus?: boolean;
  className?: string;
}
```
- Use `default export` for components
- Use `named export` for types/interfaces

## Home Page Sections

Home page (`index.tsx`) is composed of modular sections from `components/home/`:
- `DateHeader` - Hero text with today's info + race count
- `TodayRacesSection` - Today's race cards
- `AllRacesSection` - All upcoming races
- `PredictionMatrixPreviewSection` - Matrix preview snippet
- `RecentResultsSection` - Recent race results
- `AccuracyPreviewSection` - AI accuracy stats
- `RankingPreviewSection` - Top rankers
- `TodaysFortuneCard` - Daily fortune (login required)
- `HomeQuickStats` - Quick stat badges

Each section is self-contained with its own data fetching.

## Error Handling in Components

```tsx
// In pages - use DataFetchState
<DataFetchState isLoading={isLoading} error={error} isEmpty={!data}>
  {data && <Content data={data} />}
</DataFetchState>

// In event handlers
try {
  await Api.doSomething();
} catch (err: unknown) {
  const msg = getErrorMessage(err);
  // Show toast or set error state
}

// Mutation errors
{mutation.error && (
  <p className="msg-error">{getErrorMessage(mutation.error)}</p>
)}
```

## Creating New Pages Checklist

1. Add route to `lib/routes.ts`
2. Create page in `pages/` directory
3. Wrap with `<Layout title="Page - OddsCast">`
4. Add `<PageHeader>` with icon, title, description
5. Use `DataFetchState` for data-dependent content
6. Add `BackLink` if needed (not for Info sub-pages)
7. Handle loading/error/empty states
8. Add navigation link (if needed) in AppBar or menu

## Creating New Components Checklist

1. Define `interface XxxProps` at top
2. Use `export default function Xxx(props: XxxProps)`
3. Place in correct directory: `page/`, `ui/`, or domain folder
4. Use theme CSS variables (not hardcoded colors)
5. Ensure touch targets >= 44px on mobile
6. Add `className` prop for customization
7. Use existing components (Badge, Card, etc.) instead of raw HTML

## Race Domain Component Patterns

### RaceHeaderCard (`components/race/RaceHeaderCard.tsx`)
3-tier information hierarchy:
1. **Identity** (dark bg, `py-2.5`): `meetName rcNo R` | `stTime`
2. **Key betting info** (`py-2.5`, border-b): `rcDist m` + `1착 rcPrize만원` + `rcDate` (right-aligned)
3. **Classification** (`py-2`, only rendered if any badge exists): rank, condition, budam, weather, track — all wrapped in `<ClassBadge tooltip=...>`

### HorseEntryTable (`components/race/HorseEntryTable.tsx`)
**Mobile card — 4-row layout** (`p-3.5`):
- Row 1: gate circle (w-7 h-7 bg-stone-800) + horse name (`text-base font-bold`) + rating badge + chevron
- Row 2 (pl-9): jockey (`text-sm font-semibold text-stone-700`) + trainer (`text-xs text-tertiary`)
- Row 3 (pl-9): horse weight + color-coded delta + burden + career + recent + age
- Row 4 (pl-9, conditional): odds — 단승 `text-emerald-700`, 연승 `text-teal-600`

Horse weight delta color rule:
- `+N` → `text-rose-500`
- `-N` → `text-blue-500`
- `0` → `text-stone-400`

**Desktop table — column visibility:**
- Always visible: 번호, 마명, 기수/조교사, 마령, 부담, 마체중, 레이팅, 통산, 최근
- `hidden md:table-cell`: 장구 (equipment)
- `hidden xl:table-cell`: 마주 (owner) — not useful for prediction decisions
- 단승/연승 columns: only when `showOdds === true` (completed races)

**Expandable radar panel:** triggered by tap/click on row. Shows HorseRadarChart (160px) + 6 sub-score mini bars (rat/frm/cnd/exp/trn/suit) + win probability badge.

### RecentResultsSection (`components/home/RecentResultsSection.tsx`)
**Always show jockey name for ALL placements (1st, 2nd, AND 3rd).**
Format: `[medal] [hrName] ([jkName])`
Previously had a bug where `ord !== '3'` condition excluded 3rd place jockey — this is fixed.

## Home Page Quick Nav (`pages/index.tsx`)
Inline in `index.tsx` — NOT a separate component.
Card layout: `inline-flex flex-col items-center gap-2 px-5 py-4 rounded-2xl bg-white border border-stone-200`
Icon container: `w-10 h-10 rounded-xl` with section-specific color class (see webapp.md Color Semantics)
Label: `text-xs font-semibold text-stone-700`
Nav items (fixed order): 발매경주 (emerald) | 경주성적 (blue) | 종합예상 (violet) | 정확도 (amber) | 주간프리뷰 (rose)

## BugReport Components (`components/BugReportButton.tsx`, `components/BugReportModal.tsx`)
- `BugReportButton`: fixed floating `bottom-24 right-4 z-40`, hidden on `/welcome` page
- `BugReportModal`: Dialog with pre-filled description template (location / steps / actual / expected)
- Description textarea `rows={9}` + `font-mono` for template readability
- Categories: UI | PREDICTION | PAYMENT | LOGIN | NOTIFICATION | OTHER
- On submit: POST `/api/bug-reports`, captures `window.location.href` as pageUrl
- Discord notification via `DISCORD_BUG_WEBHOOK_URL` env var
