# Security Audit Report

**Date:** 2026-04-06
**Auditor:** Claude Code (automated)
**Scope:** OWASP Top 10 review of NestJS server — auth, payments, admin, notifications, favorites, users
**Environment:** Production (Railway + Vercel)

---

## Summary

| Severity | Count | Fixed | Documented / Accepted Risk |
|----------|-------|-------|---------------------------|
| CRITICAL  | 0 | — | — |
| HIGH      | 4 | 4 | — |
| MEDIUM    | 3 | 1 | 2 |
| LOW       | 4 | 0 | 4 |

---

## HIGH Severity Issues (All Fixed)

### H1 — IDOR: Notification endpoints missing ownership check
**OWASP:** A01 Broken Access Control
**File:** `server/src/notifications/notifications.controller.ts`
**Status:** ✅ FIXED

**Description:** Six endpoints — `GET /:id`, `PATCH /:id/read`, `PUT /:id`, `DELETE /:id` — did not verify that the notification belongs to the authenticated user. Any valid JWT holder could read, update, mark-read, or delete another user's notifications by guessing the integer ID.

**Fix:** All four endpoints now pass `user.sub` to the service. The service `findOne`, `update`, `remove`, and `markAsRead` methods were updated to accept an optional `userId` parameter and include it in the WHERE clause.

---

### H2 — Privilege escalation: `POST /notifications` and `POST /notifications/bulk-send` accessible to any user
**OWASP:** A01 Broken Access Control
**File:** `server/src/notifications/notifications.controller.ts`
**Status:** ✅ FIXED

**Description:** `POST /api/notifications` (create a notification for any userId) and `POST /api/notifications/bulk-send` (send to arbitrary user ID lists) were guarded only by `JwtAuthGuard`. Any authenticated regular user could create system notifications for other users or trigger bulk sends.

**Fix:** Both endpoints now require `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`.

---

### H3 — Missing brute-force lockout on admin login
**OWASP:** A07 Identification and Authentication Failures
**Files:** `server/src/auth/auth.service.ts`, `server/src/admin/admin-auth.controller.ts`
**Status:** ✅ FIXED

**Description:** The `adminLogin()` method had no in-memory lockout logic, unlike `login()` which has 5-attempt / 15-minute lockout. The `POST /api/admin/auth/login` endpoint also lacked a `@Throttle` decorator (the `POST /api/auth/admin/login` alias in `auth.controller.ts` had throttle, but the primary admin-panel route did not).

**Fix:**
- `adminLogin()` in `auth.service.ts` now calls `checkLoginLock` / `recordFailedAttempt` / `clearLoginAttempts` using a namespaced key (`admin:<loginId>`).
- `@Throttle({ short: { limit: 10, ttl: 60000 } })` added to `POST /api/admin/auth/login`.

---

### H4 — bcrypt rounds below policy minimum in password change and reset flows
**OWASP:** A02 Cryptographic Failures
**File:** `server/src/auth/auth.service.ts` (lines 375, 491 before fix)
**Status:** ✅ FIXED

**Description:** `changePassword()` and `resetPassword()` used `bcrypt.hash(newPassword, 10)` — 10 rounds — while the project security policy requires 12 rounds. Registration correctly used 12 rounds, creating an inconsistency that left passwords set via change/reset with weaker hashes.

**Fix:** Both calls changed to `bcrypt.hash(newPassword, 12)`.

---

## MEDIUM Severity Issues

### M1 — Favorites `GET /:id` missing ownership check
**OWASP:** A01 Broken Access Control
**File:** `server/src/favorites/favorites.controller.ts`, `server/src/favorites/favorites.service.ts`
**Status:** ✅ FIXED

**Description:** `GET /api/favorites/:id` returned any favorite row by numeric ID without verifying it belongs to the authenticated user. The `update` and `remove` methods already passed `userId` for ownership; `findOne` did not.

**Fix:** `findOne(id, userId)` signature updated; controller passes `user.sub`.

---

### M2 — Swagger docs accessible in staging/test environments
**OWASP:** A05 Security Misconfiguration
**File:** `server/src/main.ts`
**Status:** DOCUMENTED / ACCEPTED RISK

**Description:** Swagger is enabled when `NODE_ENV !== 'production'`. In Railway staging or local environments, the full API schema is browsable at `/docs`. This is intentional for developer convenience and poses negligible risk given no staging environment is internet-exposed. No fix applied.

---

### M3 — In-memory login lockout resets on server restart
**OWASP:** A07 Identification and Authentication Failures
**File:** `server/src/auth/auth.service.ts`
**Status:** DOCUMENTED / ACCEPTED RISK

**Description:** The `loginAttempts` Map is in-process memory. A server restart (e.g., Railway redeploy) clears all lockout state. For a single-instance Railway deployment this is acceptable; a distributed deployment would require Redis-backed counters. The existing `@Throttle` decorators (120 req/min) provide an additional layer of defense. Documented in code comments. No fix applied.

---

## LOW Severity Issues (All Documented, No Fix)

### L1 — Stack traces logged to Winston but not exposed in API responses
**OWASP:** A05 Security Misconfiguration
**File:** `server/src/common/filters/all-exceptions.filter.ts`
**Status:** ACCEPTED RISK

The `AllExceptionsFilter` logs `exception.stack` to Winston for 5xx errors but does NOT include it in the JSON response body (`{ data: null, status, message }`). The response only returns the sanitized `errorMessage`. Stack traces are correctly retained server-side only.

---

### L2 — Raw SQL fragment in results service
**OWASP:** A03 Injection
**File:** `server/src/results/results.service.ts` (line ~137)
**Status:** ACCEPTED RISK

`qb.where(\`EXISTS ${hasResultSubQuery}\`)` uses a TypeORM subquery string. The `hasResultSubQuery` is constructed entirely from a TypeORM `QueryBuilder` sub-select with no user input — it contains no interpolated user data. Not exploitable; documented for awareness.

---

### L3 — Python spawn path from env var without path sanitization
**OWASP:** A03 Injection
**File:** `server/src/analysis/analysis.service.ts`
**Status:** ACCEPTED RISK

`PYTHON_BIN` environment variable is used as the executable path for `spawn()`. If an attacker can control Railway environment variables, they could redirect the spawn to a malicious binary. This requires infrastructure-level access (Railway project access) which is beyond application-layer security. The script path (`this.scriptPath`) is computed at startup from `process.cwd()` and is not user-controlled. No fix applied.

---

### L4 — Password minimum length is 6 characters
**OWASP:** A07 Identification and Authentication Failures
**File:** `server/src/auth/dto/auth.dto.ts`
**Status:** ACCEPTED RISK

`@MinLength(6)` is below NIST SP 800-63B recommended minimum of 8 characters. Given the existing bcrypt-12 + account lockout + rate limiting defence-in-depth, risk is low. Raising the limit would require a client-side UI update and a user migration notice. Flagged for future consideration.

---

## Verified Secure (No Issues Found)

| Area | Check | Result |
|------|-------|--------|
| JWT secret | `config.getOrThrow('JWT_SECRET')` — no fallback | ✅ Secure |
| JWT expiry | `ignoreExpiration: false` in strategy | ✅ Secure |
| Admin endpoints | `AdminController` has class-level `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` | ✅ Secure |
| Users controller IDOR | All `/:id` routes check `user.sub !== id && role !== ADMIN` | ✅ Secure |
| Payment ownership | `issueBillingKeyAndConfirm` checks `sub.userId !== userId` → ForbiddenException | ✅ Secure |
| Subscriptions ownership | `cancel`, `activate` pass `userId` to service for ownership validation | ✅ Secure |
| Swagger in production | Disabled when `NODE_ENV === 'production'` | ✅ Secure |
| Helmet headers | `app.use(helmet())` in main.ts | ✅ Secure |
| Body size limit | `express.json({ limit: '500kb' })` | ✅ Secure |
| bcrypt registration | 12 rounds in `register()` and `reactivation` path | ✅ Secure (was already correct) |
| CORS | Explicit origin whitelist in production | ✅ Secure |
| SQL injection | All user inputs via TypeORM parameterized queries; no string interpolation of user data | ✅ Secure |
| Command injection | Python `spawn` uses fixed script path + stdin JSON; no user input in spawn args | ✅ Secure |
| Error responses | `AllExceptionsFilter` returns sanitized message only, no stack trace | ✅ Secure |
| Login lockout (users) | 5 failed attempts → 15-min lock | ✅ Secure |
| Login lockout (admins) | 5 failed attempts → 15-min lock (FIXED) | ✅ Secure (fixed in this audit) |
| Rate limiting | Global 120 req/min, 2000 req/hour + per-endpoint overrides | ✅ Secure |

---

## Files Changed in This Audit

| File | Change |
|------|--------|
| `server/src/auth/auth.service.ts` | bcrypt rounds 10→12 in `changePassword()` and `resetPassword()`; added lockout to `adminLogin()` |
| `server/src/admin/admin-auth.controller.ts` | Added `@Throttle` decorator to `POST login` |
| `server/src/notifications/notifications.controller.ts` | IDOR fixes for `findOne`, `markAsRead`, `update`, `remove`; AdminGuard on `create` and `bulkSend` |
| `server/src/notifications/notifications.service.ts` | Added optional `userId` ownership filter to `findOne`, `update`, `remove`, `markAsRead` |
| `server/src/favorites/favorites.controller.ts` | Pass `user.sub` to `findOne` |
| `server/src/favorites/favorites.service.ts` | Added optional `userId` ownership filter to `findOne` |
