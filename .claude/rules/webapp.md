---
paths:
  - "webapp/pages/**"
  - "webapp/components/**"
  - "webapp/lib/**"
  - "webapp/**/*.{ts,tsx}"
---

# WebApp (Next.js) Development Rules

## Tech Stack

- Next.js 16.1.6 (Pages Router), React 19.2.3, TypeScript 5
- State: Zustand 5.0.11 (auth, accessibility stores)
- Data: TanStack React Query 5.90.21
- Forms: react-hook-form 7.53.0
- HTTP: axios 1.13.5
- Icons: Lucide React 0.563.0
- Dates: date-fns 4.1.0, react-day-picker 9.13.2
- Utils: es-toolkit 1.38.0, qs 6.14.2
- Fonts: Pretendard (body), Outfit + Syne (display)
- Styling: Tailwind CSS 4.1.18
- Shared types: @oddscast/shared (workspace)
- next.config.ts: `transpilePackages: ['@oddscast/shared']`

## All Pages (40+)

### Root
- `_app.tsx` - QueryClient, auth hydrate, accessibility, GA4, activity tracking, native app detection
- `_document.tsx` - `<Html lang='ko'>`, fonts, favicon
- `index.tsx` - Home (today races, matrix preview, fortune, rankings, results)
- `404.tsx` - Custom not found
- `500.tsx` - Server error page
- `_error.tsx` - Error boundary
- `welcome.tsx` - New user welcome/onboarding page

### Auth (`/auth/`)
- `login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`

### Races (`/races/`)
- `index.tsx` - Race list (filters, URL sync, pagination)
- `schedule.tsx` - Race calendar (react-day-picker)
- `[id]/index.tsx` - Race detail (entries, results, predictions, analysis)
- `[id]/simulator.tsx` - Custom prediction simulator

### Results & Predictions
- `results.tsx` - Results list (1-2-3 grouped by race)
- `predictions/matrix.tsx` - Daily comprehensive guide (lock/unlock)
- `predictions/accuracy.tsx` - Prediction accuracy dashboard

### Profile & Settings
- `profile/index.tsx` - Profile view (tickets, subscription summary)
- `profile/edit.tsx` - Edit name, nickname
- `settings/index.tsx` - Settings menu
- `settings/notifications.tsx` - Notification preferences (push mobile only)
- `settings/delete-account.tsx` - Account deletion

### My Page (`/mypage/`)
- `index.tsx` - Menu hub
- `subscriptions.tsx` - Subscription plans + current status
- `subscription-checkout.tsx` - TossPayments checkout (`?planId=`)
- `subscription-checkout/success.tsx`, `fail.tsx` - Payment result
- `matrix-ticket-purchase.tsx` - MATRIX ticket purchase (1,000won/ticket)
- `ticket-history.tsx` - Ticket usage history
- `prediction-history.tsx` - Viewed predictions
- ~~`point-transactions.tsx`~~ - Removed (Points module deleted)
- `notifications.tsx` - Notification list
- `picks.tsx` - (PICKS_ENABLED=false, hidden)

### Detail Pages
- `horses/[hrNo].tsx` - Horse profile + race history
- `jockeys/[jkNo].tsx` - Jockey profile + history
- `trainers/[trName].tsx` - Trainer profile + history

### Other
- `ranking.tsx` - User rankings
- `weekly-preview.tsx` - Weekly race preview
- `legal/terms.tsx`, `privacy.tsx`, `refund.tsx` - Legal pages

## Route Management

All routes centrally defined in `webapp/lib/routes.ts`:
```typescript
export const routes = {
  home: '/',
  results: '/results',
  ranking: '/ranking',
  auth: { login: '/auth/login', register: '/auth/register', ... },
  profile: { index: '/profile', edit: '/profile/edit' },
  mypage: { index: '/mypage', subscriptions: '/mypage/subscriptions', ... },
  races: { index: '/races', detail: (id) => `/races/${id}`, ... },
  horses: { detail: (hrNo) => `/horses/${hrNo}` },
  predictions: { matrix: '/predictions/matrix', accuracy: '/predictions/accuracy' },
  legal: { terms: '/legal/terms', ... },
};
```
**Never hardcode route paths. Always use `routes.*`**

## Page Structure Pattern

```tsx
import Layout from '@/components/Layout';
import { PageHeader, DataFetchState, BackLink } from '@/components/page';
import { routes } from '@/lib/routes';

export default function RacesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['races', filters],
    queryFn: () => RaceApi.getRaces(filters),
  });

  return (
    <Layout title="Races - OddsCast">
      <PageHeader icon="ClipboardList" title="Race List" description="..." />
      <DataFetchState isLoading={isLoading} error={error} isEmpty={!data?.length}>
        {/* Content */}
      </DataFetchState>
      <BackLink href={routes.home} label="Back to Home" />
    </Layout>
  );
}
```

## API Client Pattern (28 clients)

Location: `webapp/lib/api/`

```typescript
// Singleton class with static methods
export default class RaceApi {
  private static instance: RaceApi;

  static async getRaces(filters?: RaceFilters): Promise<RaceListResponseDto> {
    const response = await axiosInstance.get('/races', { params: filters });
    return handleApiResponse(response);
  }

  static async getRace(id: string): Promise<RaceDetailDto> {
    const response = await axiosInstance.get(`/races/${id}`);
    return handleApiResponse(response);
  }
}
```

### All API Clients
`authApi.ts`, `raceApi.ts`, `resultApi.ts`, `predictionApi.ts`, `predictionMatrixApi.ts`,
`predictionTicketApi.ts`, `analysisApi.ts`, `horseApi.ts`, `jockeyApi.ts`, `trainerApi.ts`,
`userApi.ts`, `favoriteApi.ts (unused)`, `notificationApi.ts`, `subscriptionApi.ts`,
`subscriptionPlansApi.ts`, `paymentApi.ts`, `singlePurchaseApi.ts`,
`rankingApi.ts`, `fortuneApi.ts`, `weeklyPreviewApi.ts`,
`configApi.ts`, `activityApi.ts`, `picksApi.ts (unused)`, `betApi.ts (unused)`,
`serverFetch.ts` (SSR helper)

### Axios Configuration (lib/api/axios.ts)
- Base URL: `CONFIG.api.server.baseURL` (default `http://localhost:3001/api`)
- Timeout: 10000ms
- Request interceptor: adds JWT from localStorage
- Response interceptor: auto-retry on 502/503/504 (max 3, exponential backoff 1s->2s->4s)
- 401: emits unauthorized event -> authStore logout
- `handleApiResponse<T>(response)`: extracts `response.data.data` or `response.data`
- `handleApiError(error)`: standardizes to `{ status, message }`

## TanStack Query Patterns

```typescript
// _app.tsx defaults
{
  staleTime: 0,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: (count, error) => {
    // Network/502/503/504: max 5 retries with exponential backoff
    // Other errors: max 1 retry
  }
}

// Query key convention: domain-first
queryKey: ['races']
queryKey: ['races', id]
queryKey: ['rankings', 'me']
queryKey: ['predictions', 'matrix', { date, meet }]

// Auth-dependent queries
enabled: isLoggedIn

// Mutation + invalidation
const mutation = useMutation({
  mutationFn: (data) => Api.update(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domain'] }),
});
```

## Auth Store (Zustand)

```typescript
// lib/store/authStore.ts
interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  setAuth(token, user?): void;
  logout(): void;
  hydrate(): void;  // Load from localStorage on mount
}
// Storage keys: 'jwt_token', 'jwt_user'
// 401 response -> auto logout via event emitter
```

## Styling & Theme

### CSS Architecture (20 stylesheet files)
`globals.css` imports: `theme.css`, `accessibility.css`, `base.css`, `buttons.css`,
`tables.css`, `header.css`, `nav-mobile.css`, `cards.css`, `badges.css`, `messages.css`,
`links.css`, `nav-items.css`, `form.css`, `page.css`, `home-hero.css`, `section-kra.css`,
`mobile.css`, `rdp.css`

### Theme Colors (turf green + warm amber)
```css
--color-primary: #16a34a;        /* turf green */
--color-primary-dark: #15803d;
--color-accent: #d97706;         /* warm amber */
--color-background: #f8faf8;
--color-foreground: #0f1a0f;
--color-card: #ffffff;
--color-border: #e2e8e2;
--color-error: #b91c1c;
--color-success: #15803d;
--color-warning: #a16207;
```

### Tailwind Config (tailwind.config.ts)
- Colors mapped to CSS variables: `primary`, `secondary`, `accent`, `success`, `warning`, `error`
- Custom: `text-secondary`, `text-tertiary`, `border-gold`, `border-focus`, `card-hover`
- Font: `font-display` and `font-sans` both use Pretendard

### Style Rules
- Base font: 16px, all px values even numbers (40-60대 readability)
- Buttons: `btn-primary`, `btn-secondary`, mobile min-height 44px, active feedback
- Cards: border-radius 10px, padding mobile 0.875rem / desktop 1.125rem
- Tables: `DataTable` component, mobile `overflow-x: auto` + `min-width: max-content`
- Tabs: `TabBar` component (variant: filled|subtle, size: sm|md)
- Touch: `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`
- Responsive: mobile-first, breakpoints `sm:`, `lg:`
- Mobile buttons: `w-full`, flex-col on narrow screens

### Typography Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-[10px]` | 10px | Radar chart labels, micro annotations only |
| `text-xs` | 12px | Meta info, badges, secondary labels, table secondary columns |
| `text-sm` | 14px | Body text, table primary cells, form labels, jockey/trainer name |
| `text-base` | 16px | Primary names (horse, race), important UI labels, card titles |
| `text-lg` | 18px | Section headings within cards |
| `text-xl`+ | 20px+ | Page-level headings, hero text |

**Font weight conventions:**
- `font-bold` — primary entity names (horse name, race name, page title)
- `font-semibold` — jockey name, section sub-titles, key stats
- `font-medium` — odds, numbers that need slight emphasis
- `font-normal` (default) — secondary text, descriptions

**Never use `text-[10px]` for actionable or critical data.** Reserve it for decorative/reference-only annotations.

### Spacing Scale

**Flex gap within components:**
- `gap-1` / `gap-1.5` — badge clusters, inline chips
- `gap-2` — tight items (icon+label, badge row)
- `gap-3` — normal item spacing (card rows, nav items)
- `gap-4` — relaxed spacing (form fields, section items)

**Card internal padding:**
- `p-3` / `p-3.5` — compact mobile cards
- `p-4` — standard cards and sections
- `p-5` — spacious cards (profile, info panels)

**Vertical section spacing (home page):**
- `mb-6` — between all home page sections
- `mb-7` — after quick nav (needs more breathing room before main content)
- `mt-5 mb-5` — stats/login row above quick nav

**Quick nav card minimum width:** `min-w-[76px]` (ensures label doesn't wrap on common phone widths)

### Color Semantics (Data Display)

**Numerical change indicators (e.g., horse weight delta):**
- `text-rose-500` — increase / positive delta (+)
- `text-blue-500` — decrease / negative delta (-)
- `text-stone-400` — no change (0)

**Rating / quality badges:**
- `bg-amber-100 text-amber-800` — horse rating (R점)
- `bg-emerald-100 text-emerald-700` — high confidence / win probability ≥70%
- `bg-amber-100 text-amber-700` — medium confidence / 50-69%
- `bg-stone-100 text-stone-600` — low confidence / <50%

**Home quick nav icon backgrounds (section color-coding):**
- Races/schedule: `text-emerald-600 bg-emerald-50`
- Results/data: `text-blue-600 bg-blue-50`
- Predictions/matrix: `text-violet-600 bg-violet-50`
- Accuracy/stats: `text-amber-600 bg-amber-50`
- Calendar/preview: `text-rose-600 bg-rose-50`

**Odds display:**
- 단승 (win): `text-emerald-700 font-semibold`
- 연승 (place): `text-teal-600 font-medium`

### Component Layout Patterns

**RaceHeaderCard — 3-tier structure:**
1. Identity header: race name + race number badge | start time (dark bg, `py-2.5`)
2. Key betting info: distance (bold) + prize + date (border-b separator, `py-2.5`)
3. Classification badges: rank + condition + budam + weather + track (only if any exist, `py-2`)

**HorseEntryTable mobile card — 4-row structure:**
1. Gate circle (w-7 h-7) + horse name (`text-base font-bold`) + rating badge + chevron
2. Jockey name (`text-sm font-semibold text-stone-700`) + trainer (`text-xs text-tertiary`)
3. Horse weight with color-coded delta + burden weight + career record + recent ranks + age/sex
4. Odds row (only when available) — 단승 emerald, 연승 teal

**Home quick nav cards — vertical layout:**
- `inline-flex flex-col items-center gap-2 px-5 py-4 rounded-2xl`
- Icon: `w-10 h-10 rounded-xl` with section color background
- Label: `text-xs font-semibold text-stone-700`
- Hover: `hover:border-stone-300 hover:shadow-sm`

**Race results inline display (races list mobile):**
- Each placement (1/2/3위) on its own line, not inline-flex wrap
- Rank badge color: 1위=amber, 2위=stone-400, 3위=stone-300
- Format: `[rank] [horse name] ([jockey name])`
- Always show jockey name for all 3 placements

### Desktop Column Visibility

When a table has too many columns (>10), use responsive hiding:
- `hidden xl:table-cell` — columns that are secondary (e.g., 마주/owner in HorseEntryTable)
- `hidden md:table-cell` — columns useful on tablet+ (e.g., 장구/equipment)
- Never hide columns that affect prediction decisions (rating, weight, jockey, odds)

## Navigation (FloatingAppBar)

- 5 fixed items: Home (Flag) | Races (ClipboardList) | Matrix (BarChart2) | Results (TrendingUp) | Profile (User)
- Mobile (< 768px): fixed bottom, safe-area-inset-bottom, no drag
- Desktop (>= 768px): floating bar, draggable, snap-to-edges, horizontal/vertical toggle
- Rendered in `_app.tsx` (not per-page) to prevent remount
- Ranking/notifications/subscription/settings: accessed from Profile/Info menu

## Mobile WebView Bridge

- Detection: `window.__IS_NATIVE_APP__ = true` injected by mobile webview
- Hook: `useIsNativeApp()` - returns boolean
- Push toggle: only shown when `useIsNativeApp() === true`
- Auth events: `AUTH_LOGOUT` bridge event for native signout
- Native messages: `{ type: 'AUTH_READY' | 'AUTH_LOGOUT' | 'ECHO', payload? }`

## Utility Functions

### Format (lib/utils/format.ts)
- `getTodayKstDate()` - KST { year, month, day, weekDay }
- `formatRcDate(YYYYMMDD)` -> "2025.02.15"
- `formatRcDateShort(YYYYMMDD)` -> "2월 15일"
- `formatNumber(n)` -> "1,234"
- `formatWon(n)` -> "1,234원"
- `formatPoint(n)` -> "1,234pt"
- `isPastRaceDate()`, `isTodayRcDate()`, `isRaceActuallyEnded()`
- All use `ko-KR` locale and `Asia/Seoul` timezone

### Error (lib/utils/error.ts)
- `getErrorMessage(err: unknown): string` - safe error extraction

### Race Terms (lib/utils/raceTerms.ts)
- `getRankTerm()`, `getRcConditionTerm()`, `getBudamTerm()`, `getWeatherTerm()`, `getTrackTerm()`
- Maps KRA codes to { label, tooltip }

## Config (lib/config.ts)

```typescript
export const CONFIG = {
  picksEnabled: false,  // Picks feature disabled
  api: { server: { baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api', timeout: 10000 } },
  webapp: { baseURL: process.env.NEXT_PUBLIC_WEBAPP_URL || 'http://localhost:3000' },
  analytics: { gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '' },
  tossPayments: { clientKey: process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY || '' },
  kra: { replayPortalUrl: 'https://todayrace.kra.co.kr/main.do' },
};
```

## Footer

- Removed from Layout (conflicts with app bar)
- `LegalFooter` component: terms/privacy/refund links
- Only placed on profile page (`/profile`)
