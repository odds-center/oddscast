# Database & TypeORM Rules

## Core Setup

- PostgreSQL with TypeORM 0.3.28 (not Prisma)
- Schema: `oddscast`
- `synchronize: false` - never auto-sync
- DDL source of truth: `docs/db/schema.sql`
- Entities: `server/src/database/entities/` (36 entity files)
- DataSource: `server/src/database/data-source.ts`
- Enums: `server/src/database/db-enums.ts`
- Migrations: `server/src/database/migrations/`
- Auto-discovery: `entities/**/*.entity{.ts,.js}`

## Schema Changes Procedure

1. Modify entity in `server/src/database/entities/`
2. Update `docs/db/schema.sql`
3. Update `docs/architecture/DATABASE_SCHEMA.md`
4. Optional: `cd server && pnpm run migration:generate`
5. Apply: `./scripts/setup.sh` or `cd server && pnpm run migration:run`
6. If shared types affected: update `shared/types/`

## All Entities (33 files)

### User Management
| Entity | Table | Description |
|--------|-------|-------------|
| `User` | `users` | App users (login bonus, consecutive login tracking) |
| `AdminUser` | `admin_users` | Admin accounts (loginId, not email) |
| `PasswordResetToken` | `password_reset_tokens` | 1-hour expiry tokens |
| `EmailVerificationToken` | `email_verification_tokens` | 24-hour expiry tokens |

### Core Racing
| Entity | Table | Key Fields |
|--------|-------|------------|
| `Race` | `races` | meet, rcDate(YYYYMMDD), rcNo, status. Unique: [meet, rcDate, rcNo] |
| `RaceEntry` | `race_entries` | raceId(FK), hrNo, hrName, jkName, rating, training data |
| `RaceResult` | `race_results` | raceId(FK), ord, hrNo, hrName, winOdds, plcOdds, rcTime |
| `Prediction` | `predictions` | raceId(FK), scores(JSON), analysis(text), preview(text), accuracy |

### Tickets & Subscriptions
| Entity | Table | Key Fields |
|--------|-------|------------|
| `PredictionTicket` | `prediction_tickets` | userId(FK), type(RACE/MATRIX), status, matrixDate |
| `SubscriptionPlan` | `subscription_plans` | planName(unique), totalTickets, matrixTickets, totalPrice |
| `Subscription` | `subscriptions` | userId(FK), planId(FK), billingKey, nextBillingDate |
| `BillingHistory` | `billing_histories` | Payment records (SUCCESS/FAILED/REFUNDED) |
| `SinglePurchase` | `single_purchases` | One-time ticket purchases |

### Points & Rewards
| Entity | Table | Key Fields |
|--------|-------|------------|
| `PointTransaction` | `point_transactions` | userId, type(EARNED/SPENT/BONUS/...), amount, balance |
| `PointConfig` | `point_configs` | configKey, configValue (BASE_POINTS, etc.) |
| `PointPromotion` | `point_promotions` | type(SIGNUP_BONUS/DAILY_LOGIN/...) |
| `PointTicketPrice` | `point_ticket_prices` | pointsPerTicket, isActive |

### Social
| Entity | Table |
|--------|-------|
| `Favorite` | `favorites` | type(RACE only used), priority |

### Notifications
| Entity | Table |
|--------|-------|
| `Notification` | `notifications` | type, category, title, body |
| `PushToken` | `push_tokens` | Firebase FCM tokens |
| `UserNotificationPreference` | `user_notification_preferences` | 6 boolean flags |

### KRA & Sync
| Entity | Table |
|--------|-------|
| `Training` | `trainings` | Horse training records |
| `JockeyResult` | `jockey_results` | Jockey career stats |
| `TrainerResult` | `trainer_results` | Trainer career stats |
| `KraSyncLog` | `kra_sync_logs` | API sync audit log |
| `BatchSchedule` | `batch_schedules` | Scheduled batch jobs |
| `RaceDividend` | `race_dividends` | Confirmed payout dividends per race (7 pool types: WIN/PLC/QNL/EXA/QPL/TLA/TRI). Fetched from KRA API160 after results load. |

### Other
| Entity | Table |
|--------|-------|
| `UserDailyFortune` | `user_daily_fortunes` | Daily fortune readings |
| `WeeklyPreview` | `weekly_previews` | Weekly race previews |
| `GlobalConfig` | `global_config` | Key-value system config |
| `AdminActivityLog` | `admin_activity_logs` | Admin action audit |
| `UserActivityLog` | `user_activity_logs` | User action audit |
| `UserPick` | `user_picks` | Service excluded, API only |

## All Enums (db-enums.ts)

```typescript
// User & Auth
UserRole: USER, ADMIN

// Race
RaceStatus: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

// Predictions
PredictionStatus: PENDING, PROCESSING, COMPLETED, FAILED

// Tickets
TicketType: RACE, MATRIX
TicketStatus: AVAILABLE, USED, EXPIRED

// Subscriptions
SubscriptionStatus: PENDING, ACTIVE, CANCELLED, EXPIRED

// Notifications
NotificationType: SYSTEM, RACE, PREDICTION, PROMOTION, SUBSCRIPTION
NotificationCategory: GENERAL, URGENT, INFO, MARKETING

// Favorites
FavoriteType: HORSE, JOCKEY, TRAINER, RACE, MEET
FavoritePriority: LOW, MEDIUM, HIGH

// Points
PointTransactionType: EARNED, SPENT, REFUNDED, BONUS, PROMOTION, ADMIN_ADJUSTMENT, EXPIRED, TRANSFER_IN, TRANSFER_OUT
PointStatus: ACTIVE, PENDING, EXPIRED, CANCELLED, PROCESSING
PromotionType: SIGNUP_BONUS, REFERRAL_BONUS, DAILY_LOGIN, SPECIAL_EVENT, CUSTOM

// Payments
PaymentStatus: SUCCESS, FAILED, REFUNDED

// Picks
PickType: SINGLE, PLACE, QUINELLA, EXACTA, QUINELLA_PLACE, TRIFECTA, TRIPLE

// Batch
BatchScheduleStatus: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
```

## Key Relations

```
User ->> Favorite[], Notification[], PredictionTicket[], Subscription[],
         BillingHistory[], SinglePurchase[], PointTransaction[], UserPick[]

Race ->> RaceEntry[], RaceResult[], Prediction[]
  Unique constraint: [meet, rcDate, rcNo]
  CASCADE delete on children

Prediction ->> PredictionTicket[] (unlocks)
SubscriptionPlan ->> Subscription[]
Subscription ->> PredictionTicket[] (issues)
```

## PK Conventions

| Type | Tables |
|------|--------|
| Int (auto-increment) | User, AdminUser, Race, BatchSchedule |
| UUID (string) | RaceEntry, RaceResult, Prediction, PredictionTicket, Subscription, Favorite, Notification, etc. |

## Date/Time Conventions

- `rcDate`: YYYYMMDD string (not Date)
- `matrixDate`: YYYYMMDD string
- `createdAt`, `updatedAt`: DateTime (auto)
- `expiresAt`: DateTime
- Timezone: KST (Asia/Seoul) for business logic
- `stTime`: HH:mm string (race start time)

## KRA Field Name Mapping

| KRA Field | DB Field | Description |
|-----------|----------|-------------|
| meet | meet | "서울"/"제주"/"부산경남" (DB), "1"/"2"/"3" (KRA API code) |
| hrNo | hrNo | Horse ID (KRA internal, NOT display number) |
| chulNo | chulNo | Starting gate number (display to users) |
| rcDate | rcDate | YYYYMMDD |
| rcNo | rcNo | Race number |
| wgBudam | weight / wgBudam | Burden weight |
| jkNo | jkNo | Jockey ID |
| trName | trName | Trainer name |

## Seed Data Required

Initial data for new environments:
- `PointConfig`: BASE_POINTS, DAILY_LOGIN_BONUS_POINTS(10), multipliers
- `PointTicketPrice`: 1200 points per ticket
- `SubscriptionPlan`: LIGHT(4900), STANDARD(9900), PREMIUM(14900)
- `GlobalConfig`: show_google_login, etc.
- `AdminUser`: Initial admin account (loginId + bcrypt password)

## Query Patterns

```typescript
// Repository pattern
@InjectRepository(Race) private raceRepo: Repository<Race>
const race = await this.raceRepo.findOne({ where: { id }, relations: ['entries', 'results'] });

// QueryBuilder for complex queries
const qb = this.raceRepo.createQueryBuilder('race')
  .leftJoinAndSelect('race.entries', 'entries')
  .where('race.rcDate = :date', { date })
  .orderBy('race.rcNo', 'ASC');

// Transaction
const ds = this.dataSource;
await ds.transaction(async (manager) => {
  await manager.save(Entity, data);
});
```
