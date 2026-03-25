Create a new Next.js webapp page for "$ARGUMENTS" following OddsCast conventions.

## Steps

1. Add route constant to `webapp/lib/routes.ts` under appropriate section

2. Create page file at `webapp/pages/[path].tsx`:
   ```tsx
   import Layout from '@/components/Layout';
   import { PageHeader, DataFetchState } from '@/components/page';

   export default function PageName() {
     return (
       <Layout title="페이지명 | OddsCast">
         <PageHeader icon="IconName" title="..." description="..." />
         <DataFetchState isLoading={...} error={...} isEmpty={...}>
           {/* content */}
         </DataFetchState>
       </Layout>
     );
   }
   ```

3. API client: add static method to `webapp/lib/api/[domain]Api.ts` if new endpoint needed

4. Data fetching with TanStack Query:
   - queryKey convention: `['domain', ...params]`
   - Auth-gated: `enabled: isLoggedIn`
   - staleTime: 0 (project default)

5. Mobile considerations:
   - Touch targets: min-height 44px
   - Responsive: mobile-first (sm:, lg: breakpoints)
   - Use `useIsNativeApp()` for push-only features

## Mandatory conventions
- Never hardcode route strings — always `routes.*`
- No `any` types
- Page title format: `'페이지명 | OddsCast'` (pipe separator), root exception: `'OddsCast'`
- Back navigation: use `CompactPageTitle` (not BackLink — component removed)
- Import order: React/Next → external libs → internal components → types

Reference: .claude/rules/webapp.md + .claude/rules/components.md
