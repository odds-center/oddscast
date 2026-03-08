# Admin Panel (Next.js) Development Rules

## Tech Stack

- Next.js 14.2.0, React 18.3.0, TypeScript
- State: Zustand 4.5.0 (auth store, persisted)
- Data: TanStack React Query 5.90.2
- Forms: react-hook-form 7.53.0
- Validation: zod 3.23.0
- HTTP: axios 1.12.2
- Charts: recharts 2.12.0
- Toast: react-hot-toast 2.6.0
- Icons: Lucide React
- Styling: Tailwind CSS 3.4.0 (base font 14px)
- Dates: dayjs 1.11.13
- Shared: @oddscast/shared (workspace)

## API Proxy

Admin uses Next.js rewrites to proxy API calls:
```javascript
// next.config.js
async rewrites() {
  return [{ source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' }];
}
```
- Admin API base: `/api/admin` (proxied to server)
- Axios base URL: `/api/admin`
- Timeout: 5 seconds
- Max content: 50MB

## All Pages (20)

| Page | Route | Description |
|------|-------|-------------|
| `login.tsx` | `/login` | Admin login (loginId + password) |
| `index.tsx` | `/` | Dashboard (stats cards + quick links) |
| `users/index.tsx` | `/users` | User list, search, activate/deactivate, grant tickets |
| `races/index.tsx` | `/races` | Race list with date/meet/status filters |
| `races/[id].tsx` | `/races/:id` | Race detail (entries, results, predictions) |
| `results/index.tsx` | `/results` | Race results management |
| `kra.tsx` | `/kra` | KRA data sync (schedule, results, details, historical) |
| `predictions.tsx` | `/predictions` | Prediction list, batch generate, ON/OFF toggle |
| `ai-config.tsx` | `/ai-config` | Gemini AI model configuration |
| `analytics.tsx` | `/analytics` | AI prediction accuracy analytics |
| `subscriptions.tsx` | `/subscriptions` | User subscription management |
| `subscription-plans.tsx` | `/subscription-plans` | Manage plans (price, tickets) |
| `single-purchase-config.tsx` | `/single-purchase-config` | Configure single purchase pricing |
| `ticket-usage.tsx` | `/ticket-usage` | Prediction ticket usage logs |
| `statistics.tsx` | `/statistics` | User growth, ticket trends |
| `revenue.tsx` | `/revenue` | Revenue dashboard |
| `notifications.tsx` | `/notifications` | Push notification management |
| `settings.tsx` | `/settings` | System and general settings |

## Authentication

### Auth Store (useAuth - Zustand)
```typescript
interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth(user, token): void;
  clearAuth(): void;
}
// Persisted to localStorage key: 'auth-storage'
```

### Auth Guard (useRequireAuth hook)
```typescript
// Applied in Layout component - checks on every page
function useRequireAuth() {
  // Checks localStorage for 'auth-storage' with accessToken
  // Also checks legacy 'admin_token' key
  // Redirects to /login if no valid token
  // Returns { isAuthenticated, isChecking }
}
```

### Auth Flow
1. Login page -> `authApi.login(loginId, password)`
2. Stores tokens in localStorage + cookie
3. Layout checks `useRequireAuth()` on every render
4. 401 response interceptor -> redirect to `/login`
5. Logout: clears localStorage and cookies

## API Client Structure

### Files
- `lib/api/auth.ts` - Login, logout, refresh, profile
- `lib/api/admin.ts` - 14 API classes with 100+ endpoints

### API Classes in admin.ts
| Class | Endpoints |
|-------|-----------|
| `AdminDashboardApi` | Dashboard statistics |
| `AdminUsersApi` | User CRUD, activate/deactivate, grant tickets |
| `AdminSubscriptionsApi` | Plan CRUD, user subscriptions, cancel/extend |
| `AdminSinglePurchaseApi` | Purchase config, price calculation |
| `AdminAIApi` | Prediction analytics, generate, batch (SSE), stats |
| `AdminPredictionTicketsApi` | Ticket usage logs |
| `AdminSystemConfigApi` | System configuration |
| `AdminAIConfigApi` | AI model config, cost estimation |
| `AdminKraApi` | KRA sync (schedule, results, details, jockeys, all, historical, stream) |
| `AdminRacesApi` | Race list, detail |
| `AdminResultsApi` | Results CRUD, groupByRace |
| `AdminNotificationsApi` | Notification list, send |
| `AdminRevenueApi` | Revenue statistics |
| `AdminStatisticsApi` | Dashboard, user growth, ticket trends, revenue |

### Axios Setup (lib/utils/axios.ts)
```typescript
const axiosInstance = axios.create({
  baseURL: '/api/admin',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});
// Request: injects accessToken from localStorage
// Response: 401 -> redirect to /login
// handleApiResponse(): unwraps { data, status } format
// handleApiError(): converts to { status, message, errors }
```

## Component Structure

### Layout Components
- `layout/Layout.tsx` - Main wrapper with useRequireAuth check
- `layout/Sidebar.tsx` - Fixed left sidebar (17 navigation items, color-coded)
- `layout/Header.tsx` - Top bar

### Common Components
| Component | Description |
|-----------|-------------|
| `Button.tsx` | Variants: primary/secondary/danger/ghost, sizes: sm/md/lg, loading state |
| `Table.tsx` | Generic table with pagination, loading, empty states |
| `Pagination.tsx` | Smart pagination (5 visible pages max) |
| `PageHeader.tsx` | Title + description + children slot |
| `Modal.tsx` | Centered modal with configurable width |
| `LoadingSpinner.tsx` | SVG spinner (sm/md/lg) with optional label |
| `Card.tsx` | Card wrapper |
| `AdminIcon.tsx` | Icon wrapper |
| `SyncProgressBar.tsx` | KRA sync progress display |
| `PageLoading.tsx` | Full-page loading state |

### Sidebar Navigation (17 items)
Dashboard, Users, Races, Results, KRA Sync, Predictions, AI Config, AI Analytics,
Subscriptions, Plans, Single Purchase, Ticket Usage, Statistics, Revenue,
Notifications, Settings

## Data Fetching Pattern

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['admin', 'users', page, search],
  queryFn: () => AdminUsersApi.getUsers({ page, search }),
  placeholderData: (previous) => previous,
  staleTime: 2 * 60 * 1000,
});

// Dashboard with auto-refresh
const { data: stats } = useQuery({
  queryKey: ['admin', 'dashboard'],
  queryFn: () => AdminDashboardApi.getStats(),
  refetchInterval: 30000, // 30 seconds
});
```

## Utility Functions (lib/utils.ts)

```typescript
cn(...classes)              // Tailwind class merge (clsx + twMerge)
formatDate(date)            // YYYY.MM.DD
formatDateTime(date)        // YYYY.MM.DD HH:mm
formatYyyyMmDd(s)           // YYYYMMDD -> YYYY-MM-DD
formatCurrency(n)           // Won formatting
formatNumber(n)             // Korean number formatting
getErrorMessage(err)        // Safe error extraction
isPastRaceDate(rcDate)      // Date comparison
isRaceActuallyEnded(...)    // Race + time + 20min buffer
getDisplayRaceStatus(...)   // Smart status display
```

## Styling

- Base font: 14px (admin-specific, smaller than webapp's 16px)
- Primary color: Red scale (#ef4444)
- Tailwind 3.4 (not 4.x like webapp)
- Minimal global styles (just @tailwind directives)
- All styling via Tailwind utility classes

## KRA Sync Page Features

- Schedule sync (year/date range)
- Result sync (by date)
- Detail sync (by date)
- Jockey sync (by meet)
- Historical bulk sync (dateFrom, dateTo)
- Full sync (all steps combined)
- Stream endpoints with SSE for real-time progress
- SyncProgressBar component for visual feedback
- Batch schedules table (pending/completed/failed) with 15s auto-refresh
- Sync log history table

## Admin-Specific Business Rules

- AdminUser table is separate from User table
- Admin JWT uses same structure but role=ADMIN
- Grant tickets: can grant RACE or MATRIX type tickets to users
- Prediction batch generate: supports SSE streaming for progress
- Dashboard auto-refreshes every 30 seconds
- KRA date defaults to KST today
