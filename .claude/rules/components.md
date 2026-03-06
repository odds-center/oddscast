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
│   ├── BackLink.tsx
│   ├── CompactPageTitle.tsx
│   ├── RequireLogin.tsx
│   ├── AuthCard.tsx
│   ├── PageContent.tsx
│   ├── MenuList.tsx
│   └── LegalFooter.tsx
│
├── ui/                     # Reusable generic UI
│   ├── DataTable.tsx
│   ├── TabBar.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── LinkBadge.tsx
│   ├── LinkCard.tsx
│   ├── StatusBadge.tsx
│   ├── RankBadge.tsx
│   ├── SectionTitle.tsx
│   ├── Toggle.tsx
│   ├── Dropdown.tsx
│   ├── Tooltip.tsx
│   ├── DatePicker.tsx
│   └── NetworkStatusBanner.tsx
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
│   ├── RankingPreviewSection.tsx
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
