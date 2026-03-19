# Workflow & Documentation Rules

## Before Starting Any Task

1. Read `docs/TODO_CONTINUE.md` for current priorities and context
2. Read relevant docs based on task type (see CLAUDE.md table)
3. Understand existing code before modifying
4. Check `docs/WEBAPP_ADMIN_GAPS.md` for known issues

## Documentation Update (MANDATORY)

When changing features/API/schema/business logic, update ALL relevant docs:

| Change Type | Update These Docs |
|-------------|-------------------|
| New API endpoint | `docs/architecture/API_SPECIFICATION.md` |
| DB schema change | `docs/architecture/DATABASE_SCHEMA.md` + `docs/db/schema.sql` |
| Business rule change | `docs/architecture/BUSINESS_LOGIC.md` |
| Feature completed | `docs/TODO_CONTINUE.md` (status -> completed) |
| New feature planned | `docs/FEATURE_ROADMAP.md` + `docs/SERVICE_SPECIFICATION.md` |
| UI component/pattern | `docs/features/UI_PATTERNS.md` (if new pattern) |
| Gap fixed | `docs/WEBAPP_ADMIN_GAPS.md` (status -> applied) |
| KRA data change | `docs/DATA_LOADING.md` + relevant `docs/specs/KRA_*.md` |
| Server module added | `docs/architecture/PROJECT_STRUCTURE.md` |
| New shared type | `shared/types/` + update barrel export in `index.ts` |

### Docs Update Checklist After Any Change
- [ ] Status updated (completed/in-progress)
- [ ] Last updated date set
- [ ] New endpoints/fields/response formats documented
- [ ] Policy changes reflected
- [ ] Related docs cross-referenced

## Commit Conventions

- Language: **English only** (no Korean)
- Format: `type: short description`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`, `style`
- Keep message concise (1-2 lines)
- Examples:
  ```
  feat: add matrix ticket purchase flow
  fix: resolve race status not updating on result load
  docs: update API spec with new analysis endpoint
  refactor: extract race serialization to shared util
  test: add auth service unit tests
  ci: add webapp build step to CI pipeline
  ```

## Code Comments

- **All comments in English** (no Korean)
- JSDoc: only for public APIs and complex logic
- Inline: purpose-driven `// Native WebView: prevent duplicate header`
- No obvious comments like `// increment counter`

## Planning Workflow

1. Check `docs/TODO_CONTINUE.md` for priorities (section 5 "recommended order")
2. Check `docs/FEATURE_ROADMAP.md` for roadmap alignment
3. Check `docs/WEBAPP_ADMIN_GAPS.md` for known gaps
4. Implement with docs reference
5. Update ALL affected docs after completion
6. Update TODO_CONTINUE.md status

## Key Business Constraints (Always Remember)

- **No gambling** (sageun-seong removed) - AI analysis content only
- **Picks excluded** from UI (API exists but unused, `CONFIG.picksEnabled = false`)
- **Favorites**: RACE type only, WebApp UI removed, server API only
- **Email notifications**: none (push only, mobile WebView only)
- **Race COMPLETED**: only via KRA result loading, never by date
- **Preview visibility**: `previewApproved=true` AND `status=COMPLETED`
- **MATRIX ticket**: 1 per day per date, 1,000won each
- **Target audience**: 40-60대 (larger fonts, clear UI, simple navigation)

## File Organization Rules

- **Prefer editing existing files** over creating new ones
- New types: `shared/types/` (add to barrel export)
- New API clients: `webapp/lib/api/` or `admin/src/lib/api/`
- New components:
  - Generic UI: `webapp/components/ui/`
  - Page building blocks: `webapp/components/page/`
  - Domain-specific: `webapp/components/<domain>/`
  - Home sections: `webapp/components/home/`
- No barrel files (index.ts) for re-exports except `shared/types/index.ts`
- Import directly from specific files

## Shared Types Workflow

When adding/modifying types that both server and clients use:
1. Define in `shared/types/<domain>.types.ts`
2. Export from `shared/types/index.ts`
3. Build shared: `cd shared && pnpm run build`
4. Import: `import type { RaceDto } from '@oddscast/shared'`

### Shared Types Files (14)
`api.types.ts`, `auth.types.ts`, `favorite.types.ts`,
`kra.types.ts`, `kra-api.types.ts`, `notification.types.ts`,
`prediction-ticket.types.ts`, `prediction.types.ts`, `race.types.ts`,
`result.types.ts`, `subscription.types.ts`, `user.types.ts`, `index.ts`

### Shared DTOs (5)
`dto/api.dto.ts`, `dto/race.dto.ts`, `dto/result.dto.ts`, `dto/favorite.dto.ts`, `dto/index.ts`

## Deployment Context

- Current priority: Railway deployment (server + DB)
- CD pipeline: `.github/workflows/deploy.yml` (needs RAILWAY_TOKEN)
- Monitoring: Sentry (SENTRY_DSN env var)
- Health check: `GET /health`, `GET /health/detailed` (no /api prefix)
- WebApp deploy target: Vercel
- Mobile: React Native CLI (iOS/Android native build)

## Mobile Bridge Reference

When modifying webapp features that affect mobile:
- `window.__IS_NATIVE_APP__` detection for mobile-only features
- `useIsNativeApp()` hook for conditional rendering
- Push notifications: mobile only (`pushEnabled` toggle hidden on web)
- Auth bridge: `AUTH_READY`, `AUTH_LOGOUT` messages between native and web
- Deep linking: notification `deepLink` passed as WebView initialUrl
- Mobile config: `mobile/src/config.ts` has webapp URLs per environment

## Environment Variables Reference

### Server (.env)
```
DATABASE_URL, PORT(3001), JWT_SECRET, GEMINI_API_KEY, KRA_SERVICE_KEY,
SENTRY_DSN, REDIS_URL, DEV_RETURN_RESET_TOKEN
```

### WebApp (.env)
```
NEXT_PUBLIC_API_URL (default: http://localhost:3001/api)
NEXT_PUBLIC_WEBAPP_URL (default: http://localhost:3000)
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY
```

### Admin (.env)
```
NEXT_PUBLIC_ADMIN_API_URL (proxied via next.config.js rewrites)
```
