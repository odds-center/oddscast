# Testing & CI Rules

## Server Tests

- Framework: Jest (configured in server/package.json)
- Run: `cd server && pnpm test`
- Watch: `cd server && pnpm test:watch`
- E2E: `cd server && pnpm test:e2e`
- File naming: `*.spec.ts` alongside source files

## Test Patterns

### Service Unit Test
```typescript
describe('RacesService', () => {
  let service: RacesService;
  let raceRepo: Repository<Race>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RacesService,
        { provide: getRepositoryToken(Race), useClass: Repository },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn() } },
      ],
    }).compile();
    service = module.get(RacesService);
    raceRepo = module.get(getRepositoryToken(Race));
  });

  it('should find race by id', async () => {
    jest.spyOn(raceRepo, 'findOne').mockResolvedValue(mockRace);
    const result = await service.findOne(1);
    expect(result).toBeDefined();
  });
});
```

### Controller Test
```typescript
describe('RacesController', () => {
  let controller: RacesController;
  let service: RacesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [RacesController],
      providers: [{ provide: RacesService, useValue: mockService }],
    }).compile();
    controller = module.get(RacesController);
  });
});
```

## CI Pipeline (.github/workflows/ci.yml)

- Trigger: push to master, pull requests
- Steps:
  1. Checkout code
  2. Setup Node.js (>=20)
  3. Install dependencies (pnpm)
  4. Run server tests (`cd server && pnpm test`)
  5. Build server (`cd server && pnpm build`)
  6. Build webapp (`pnpm run build:webapp`)
  7. Build admin (`pnpm run build:admin`)

## What to Test

### Priority (must test)
- Auth service: login, register, password reset, JWT generation
- Prediction pipeline: score calculation, ticket consumption
- Subscription: billing cycle, ticket issuance, cancellation
- Points: balance calculation, purchase ticket
- KRA sync: data parsing, upsert logic

### Edge Cases
- Expired tickets (should not be usable)
- Duplicate favorites (unique constraint)
- Login bonus timing (KST date boundary)
- Consecutive login streak (7-day reset)
- MATRIX ticket: same day duplicate prevention
- Race COMPLETED status (only via result load)

## Rate Limiting

- Global: @nestjs/throttler
- `short`: 120 requests per minute per IP
- `long`: 2000 requests per hour per IP
- Applied via global ThrottlerGuard

## Frontend Testing (Currently Optional)

- No mandatory frontend test framework
- Manual testing via dev servers
- Key flows to verify manually:
  - Login/register flow
  - Race list -> detail -> prediction view
  - Subscription checkout (TossPayments)
  - Matrix ticket purchase and unlock
  - Notification preferences (push mobile only)
  - Profile edit, password change
  - Admin: KRA sync, prediction batch, user management
