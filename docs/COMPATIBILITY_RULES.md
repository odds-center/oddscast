# Project Compatibility & Coding Standards

To ensure maintainability and seamless communication between the Server (NestJS) and Mobile App
(React Native/Expo), the following rules must be strictly observed.

## 1. File Naming Conventions

### General Rules

- **camelCase**: Use `camelCase` for all file names, variables, and function names.
- **PascalCase**: Use `PascalCase` for Class names, Interface names, Type aliases, and React
  Components.
- **kebab-case**: RESTRICTED. Do not use `kebab-case` for file names unless mandated by specific
  configuration files (e.g., `package.json`, `docker-compose.yml`).

### Specific File Types

- **API Files**: `mobile/lib/api/<entity>Api.ts` (e.g., `userApi.ts`, `raceApi.ts`).
- **DTOs/Types**: `server/src/<module>/dto/<entity>.dto.ts` (e.g., `createRace.dto.ts`).
- **React Components**: `mobile/components/<ComponentName>.tsx` (e.g., `RaceCard.tsx`).

## 2. Directory Structure & Exports

### No Barrel Files

- **Avoid `index.ts`**: Do not create `index.ts` files solely for re-exporting modules. Import
  directly from the specific file.
  - ❌ `import { UserApi } from '@/lib/api';`
  - ✅ `import UserApi from '@/lib/api/userApi';`

### Default Exports

- **Classes & Components**: Use `export default` for main classes (Services, API clients) and React
  Components.
- **Types & Interfaces**: Use named exports (`export interface User ...`).

## 3. Server-Client Compatibility

### API Response Format

All API responses must follow the standardized wrapper:

```typescript
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}
```

### Type Synchronization

- **Shared Types**: When updating a DTO on the Server, the corresponding Type definition in the
  Mobile App MUST be updated immediately.
- **Enums**: Ensure Enums (e.g., `RaceStatus`, `UserRole`) are identical in both `schema.prisma`
  (Server) and `types/<entity>.ts` (Mobile).

## 4. Mobile App Refactoring (Specifics)

- **API Clients**: Must be Singleton classes with a `getInstance()` method.
- **HTTP Client**: Use the configured `axiosInstance` from `@/lib/utils/axios`.

## 5. Environment Variables

- **Client**: Prefix with `EXPO_PUBLIC_` for variables exposed to the mobile app.
- **Server**: Use standard `.env` variables safely accessed via `ConfigService`.
