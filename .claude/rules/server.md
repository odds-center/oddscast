# Server (NestJS) Development Rules

## Bootstrap (main.ts)

- Global prefix: `/api` (health endpoints excluded)
- ValidationPipe: `whitelist: true`, `transform: true`, `enableImplicitConversion: true`
- CORS: enabled with credentials
- Swagger: `/docs` with Bearer Auth
- Sentry: conditional via `SENTRY_DSN` env (10% trace sampling)
- Port: 3001 (default)

## Module Structure

Every feature module follows this pattern:
```
server/src/<module>/
├── <module>.module.ts        # @Module({ imports, controllers, providers, exports })
├── <module>.controller.ts    # HTTP routing + validation
├── <module>.service.ts       # Business logic + DB access
└── dto/
    └── <entity>.dto.ts       # class-validator + @ApiProperty
```

## All Server Modules (25+)

### Core (P0)
- `auth/` - JWT auth, login, register, password reset, email verify
- `races/` - Race CRUD, filters, schedule, calendar, search
- `results/` - Race results, bulk create/update, validation
- `predictions/` - AI predictions, Python + Gemini pipeline, accuracy
- `analysis/` - KRA race analysis (jockey scores, horse scores)

### Features (P1)
- `users/` - User management, profile, stats
- `favorites/` - Favorites toggle (RACE only)
- `prediction-tickets/` - RACE + MATRIX tickets, balance, history
- `picks/` - User picks (service excluded, API only)
- `horses/` - Horse profile, race history
- `jockeys/` - Jockey profile, history
- `trainers/` - Trainer profile, history

### Monetization (P2)
- `points/` - Point balance, purchase tickets, transactions
- `subscriptions/` - Plans, subscribe, cancel, billing cycle
- `payments/` - Billing key, subscribe payment, purchase, history
- `single-purchases/` - One-time ticket purchase
- `rankings/` - User rankings by correctCount
- `notifications/` - Push notifications, preferences, FCM

### Infrastructure
- `database/` - TypeORM entities, DataSource, db-enums, migrations
- `common/` - Interceptors, decorators, DTOs, utils, serializers
- `health/` - Health check (no /api prefix)
- `cache/` - Redis/in-memory caching (@nestjs/cache-manager, keyv)
- `config/` - GlobalConfig CRUD
- `kra/` - KRA API integration, Cron sync, batch schedules
- `admin/` - Admin-only endpoints (/api/admin/*)
- `fortune/` - Daily fortune (Gemini, 1 per user per day)
- `weekly-preview/` - Weekly preview (Cron Thu 20:00 KST)
- `activity-logs/` - User/admin activity tracking
- `bets/` - Legacy (unused, sageun-seong removed)

## Controller Patterns

```typescript
@ApiTags('Races')
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get race list' })
  async findAll(@Query() filters: RaceFilterDto) {
    return this.racesService.findAll(filters);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() dto: CreateRaceDto, @CurrentUser() user: JwtPayload) {
    return this.racesService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.racesService.findOne(id);
  }
}
```

### Decorator Usage
- `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()` - Swagger
- `@UseGuards(JwtAuthGuard)` - Auth required
- `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` - Admin only
- `@CurrentUser()` - Extract JwtPayload from request
- `@Param('id', ParseIntPipe)` - Auto-parse + validate params
- `@Query()` - DTO-validated query params
- `@Body()` - DTO-validated request body

## Service Patterns

```typescript
@Injectable()
export class RacesService {
  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceEntry) private readonly entryRepo: Repository<RaceEntry>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll(filters: RaceFilterDto) {
    const qb = this.raceRepo.createQueryBuilder('race')
      .leftJoinAndSelect('race.entries', 'entries')
      .orderBy('race.rcDate', 'DESC');
    // ... filter logic, pagination
    return { data: races, total, page, limit };
  }
}
```

### DI Patterns
- `@InjectRepository(Entity)` - TypeORM repository
- `@Inject(CACHE_MANAGER)` - Cache manager
- `@InjectDataSource()` - Raw DataSource (for transactions)
- Constructor injection only (no property injection)

## DTO Patterns

```typescript
export class CreateRaceDto {
  @ApiProperty({ description: 'Race venue' })
  @IsString()
  meet: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rcName?: string;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)        // class-transformer
  rcPrize: number;
}
```

- Always use `class-validator` decorators
- Always add `@ApiProperty()` for Swagger
- Optional fields: `@IsOptional()` + TypeScript `?`
- Number conversion: `@Type(() => Number)` with `@IsInt()` or `@IsNumber()`
- Pagination: extend or use `PaginationDto` (page, limit)

## Authentication Flow

### JWT Structure
```typescript
class JwtPayload {
  sub: number;      // userId (number, not string)
  email: string;
  role: UserRole;   // USER | ADMIN
}
```

- JWT expiry: 7 days
- Token extraction: Bearer token from Authorization header
- User login: `auth.controller.ts` -> `/api/auth/login`
- Admin login: `admin-auth.controller.ts` -> `/api/admin/auth/login` (separate AdminUser table)
- Password hashing: bcrypt (10 rounds)
- Signup bonus: 1 RACE ticket (30-day expiry)

### Guards
- `JwtAuthGuard` - Verifies JWT token
- `RolesGuard` - Checks user role via `@Roles()` decorator
- Applied via `@UseGuards(JwtAuthGuard)` or `@UseGuards(JwtAuthGuard, RolesGuard)`

## KRA Serialization

```typescript
// server/src/common/serializers/kra.serializer.ts
// Meet enum conversion:
// DB: '서울' | '제주' | '부산경남'  ->  API: 'SEOUL' | 'JEJU' | 'BUSAN'
serializeRace(race)       // Single race
serializeRaces(races)     // Array
serializeRaceResult(r)    // Hide results if status != COMPLETED
```

## Cron/Scheduler Jobs

- `syncDailyUpcomingRacePlans`: Daily 04:00 KST — next 7 days race plans
- `syncFutureRacePlans`: Monday 03:00 KST — next 3 months schedules
- `syncWeeklySchedule`: Wed/Thu 18:00 KST — weekend entry sheets + analysis data
- `syncRaceDayMorning`: Fri/Sat/Sun 08:00 KST — final entry sheet + analysis sync
- `generatePreRacePredictions`: Fri/Sat/Sun 06:30 KST — AI predictions for today
- `processDueBatchSchedulesCron`: Every 5 min — batch_schedules PENDING jobs + self-healing
- `syncPreviousDayResults`: Daily 06:00 KST — previous day results (Fri/Sat/Sun)
- `syncOrphanedRaceResults`: Daily 05:30 KST — backfill last 14 days missing results
- Push notifications: Fri/Sat/Sun every 15min (first race 30min before)
- Weekly preview: Thu 20:00 KST
- Subscription billing: monthly on nextBillingDate
- Race end: stTime + RACE_END_BUFFER_MINUTES(10) = finished (KRA standard)

## KRA Sync Data Preservation

- All Race/RaceEntry upsert/update methods use **conditional spread** for nullable fields
- Prevents NULL values from one API source overwriting non-NULL values from another
- Applied in: `buildRaceUpsertPayload`, `processEntrySheetItem`, `fetchRaceResults` entry update, `fetchHorseDetails`, `fetchRaceHorseRatings`, `fetchEquipmentBleeding`
- `syncAll` re-runs entry sheet after results to backfill entries created by result API
- `syncHistoricalBackfill` includes: entry sheet + results + entry re-run + dividends + syncAnalysisData + jockey totals

## Error Handling

```typescript
// Use NestJS built-in exceptions
throw new BadRequestException('Invalid input');
throw new NotFoundException('Race not found');
throw new UnauthorizedException('Invalid credentials');
throw new ConflictException('Email already exists');
// No custom exception filters needed
```

## Environment Variables

```
DATABASE_URL=postgresql://oddscast:oddscast@localhost:5432/oddscast?schema=oddscast
PORT=3001
JWT_SECRET=<32+ chars>
GEMINI_API_KEY=               # Google Gemini
KRA_SERVICE_KEY=              # KRA public data API
SENTRY_DSN=                   # Error tracking (optional)
REDIS_URL=                    # Cache (optional, falls back to in-memory)
DEV_RETURN_RESET_TOKEN=       # Dev: return password reset token in response
```

## Important Business Rules

- Race COMPLETED only when KRA results loaded (never by date alone)
- Prediction accuracy: calculated in ResultsService.bulkCreate (top 3 match)
- Preview API: only returns `previewApproved: true` AND `status: COMPLETED`
- Daily login bonus: 1/day (KST), tracked by `lastDailyBonusAt`
- Consecutive login: 7 days = 1 RACE ticket, streak resets to 0
- MATRIX ticket: 1 per day per date, `matrixDate` in YYYYMMDD
- Favorites: type restricted to RACE only via DTO `@IsIn(['RACE'])`
