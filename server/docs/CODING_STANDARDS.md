# 코딩 표준 및 규칙

## 개요

Golden Race Server 프로젝트의 일관성 있는 코드 품질을 위해 TypeScript 코딩 표준을 정의합니다.

## TypeScript 설정

### 컴파일러 옵션

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## 네이밍 규칙

### 파일명

- **PascalCase**: 클래스, 인터페이스 파일
- **camelCase**: 함수, 변수 파일
- **kebab-case**: 컴포넌트 파일

```typescript
// ✅ 올바른 예시
Race.ts;
DataController.ts;
kraApiService.ts;
data - sync.ts;
```

### 변수명

```typescript
// ✅ 올바른 예시
const raceData: Race[] = [];
const isToday: boolean = true;
const apiKey: string = process.env.KRA_API_KEY;

// ❌ 잘못된 예시
const racedata: Race[] = [];
const is_today: boolean = true;
const APIKEY: string = process.env.KRA_API_KEY;
```

### 함수명

```typescript
// ✅ 올바른 예시
async function fetchRaceData(): Promise<Race[]> {}
async function syncDataByDate(date: Date): Promise<void> {}
function isValidDate(dateString: string): boolean {}

// ❌ 잘못된 예시
async function fetch_race_data(): Promise<Race[]> {}
async function SyncDataByDate(date: Date): Promise<void> {}
function isvaliddate(dateString: string): boolean {}
```

### 클래스명

```typescript
// ✅ 올바른 예시
export class Race {}
export class DataSyncService {}
export class SupabaseRaceRepository {}

// ❌ 잘못된 예시
export class race {}
export class dataSyncService {}
export class supabaseRaceRepository {}
```

### 인터페이스명

```typescript
// ✅ 올바른 예시
export interface IRaceRepository {}
export interface ApiResponse<T> {}
export interface SyncResult {}

// ❌ 잘못된 예시
export interface raceRepository {}
export interface apiResponse<T> {}
export interface sync_result {}
```

## 코드 구조

### 클래스 구조

```typescript
export class ExampleClass {
  // 1. 정적 속성
  private static readonly DEFAULT_TIMEOUT = 5000;

  // 2. 인스턴스 속성
  private readonly logger: ILogger;
  private readonly apiKey: string;

  // 3. 생성자
  constructor(logger: ILogger, apiKey: string) {
    this.logger = logger;
    this.apiKey = apiKey;
  }

  // 4. 정적 메서드
  public static create(config: Config): ExampleClass {
    return new ExampleClass(config.logger, config.apiKey);
  }

  // 5. 공개 메서드
  public async fetchData(): Promise<Data[]> {
    try {
      return await this.performFetch();
    } catch (error) {
      this.logger.error('Failed to fetch data:', error);
      throw error;
    }
  }

  // 6. 비공개 메서드
  private async performFetch(): Promise<Data[]> {
    // 구현
  }
}
```

### 함수 구조

```typescript
// ✅ 올바른 예시
export async function fetchRaceData(
  date: Date,
  venue?: string
): Promise<Race[]> {
  try {
    const races = await apiService.fetchRaces(date, venue);
    return races.filter(race => race.isValid());
  } catch (error) {
    logger.error('Failed to fetch race data:', error);
    throw new Error('Failed to fetch race data');
  }
}

// ❌ 잘못된 예시
export async function fetchRaceData(
  date: Date,
  venue?: string
): Promise<Race[]> {
  try {
    const races = await apiService.fetchRaces(date, venue);
    return races.filter(race => race.isValid());
  } catch (error) {
    logger.error('Failed to fetch race data:', error);
    throw new Error('Failed to fetch race data');
  }
}
```

## 타입 정의

### 인터페이스 정의

```typescript
// ✅ 올바른 예시
export interface Race {
  readonly id: string;
  readonly raceNumber: number;
  readonly raceName: string;
  readonly date: Date;
  readonly venue: string;
  readonly horses: Horse[];
}

// ❌ 잘못된 예시
export interface Race {
  id: string;
  raceNumber: number;
  raceName: string;
  date: Date;
  venue: string;
  horses: Horse[];
}
```

### 타입 별칭

```typescript
// ✅ 올바른 예시
export type RaceId = string;
export type Venue = '서울' | '부산' | '제주' | '광주' | '대구';
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ❌ 잘못된 예시
export type raceId = string;
export type venue = '서울' | '부산' | '제주' | '광주' | '대구';
```

## 에러 처리

### 에러 클래스 정의

```typescript
// ✅ 올바른 예시
export class RaceNotFoundError extends Error {
  constructor(raceId: string) {
    super(`Race with id ${raceId} not found`);
    this.name = 'RaceNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### 에러 처리 패턴

```typescript
// ✅ 올바른 예시
async function fetchRace(id: string): Promise<Race> {
  try {
    const race = await repository.findById(id);
    if (!race) {
      throw new RaceNotFoundError(id);
    }
    return race;
  } catch (error) {
    if (error instanceof RaceNotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching race:', error);
    throw new Error('Failed to fetch race');
  }
}
```

## 비동기 처리

### Promise 사용

```typescript
// ✅ 올바른 예시
async function fetchData(): Promise<Data[]> {
  const response = await api.get('/data');
  return response.data;
}

// ❌ 잘못된 예시
function fetchData(): Promise<Data[]> {
  return api.get('/data').then(response => response.data);
}
```

### 에러 처리

```typescript
// ✅ 올바른 예시
async function syncData(): Promise<void> {
  try {
    const data = await fetchData();
    await saveData(data);
  } catch (error) {
    logger.error('Sync failed:', error);
    throw new SyncError('Data synchronization failed');
  }
}
```

## 주석 및 문서화

### JSDoc 주석

```typescript
/**
 * 경마 데이터를 가져오는 함수
 * @param date - 조회할 날짜
 * @param venue - 경마장 (선택사항)
 * @returns 경마 데이터 배열
 * @throws {ValidationError} 날짜가 유효하지 않은 경우
 * @throws {ApiError} API 호출 실패 시
 */
async function fetchRaceData(date: Date, venue?: string): Promise<Race[]> {
  // 구현
}
```

### 클래스 문서화

````typescript
/**
 * 경마 데이터 동기화 서비스
 *
 * 한국마사회 API에서 경마 데이터를 가져와 데이터베이스에 저장합니다.
 *
 * @example
 * ```typescript
 * const syncService = new DataSyncService(repository, apiService, logger);
 * await syncService.syncAllData(new Date());
 * ```
 */
export class DataSyncService {
  // 구현
}
````

## 테스트 코드

### 테스트 파일 구조

```typescript
// ✅ 올바른 예시
describe('DataSyncService', () => {
  let service: DataSyncService;
  let mockRepository: jest.Mocked<IRaceRepository>;
  let mockApiService: jest.Mocked<IKraApiService>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockApiService = createMockApiService();
    service = new DataSyncService(mockRepository, mockApiService, logger);
  });

  describe('syncRaceData', () => {
    it('should sync race data successfully', async () => {
      // Given
      const date = new Date('2024-12-25');
      const mockRaces = [createMockRace()];
      mockApiService.fetchRaceSchedule.mockResolvedValue(mockRaces);

      // When
      const result = await service.syncRaceData(date);

      // Then
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Race));
    });

    it('should handle API errors gracefully', async () => {
      // Given
      const date = new Date('2024-12-25');
      mockApiService.fetchRaceSchedule.mockRejectedValue(
        new Error('API Error')
      );

      // When & Then
      await expect(service.syncRaceData(date)).rejects.toThrow('API Error');
    });
  });
});
```

## 환경 변수

### 환경 변수 타입 정의

```typescript
// ✅ 올바른 예시
interface Environment {
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly PORT: number;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly KRA_API_KEY: string;
}

function validateEnvironment(): Environment {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'KRA_API_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    NODE_ENV:
      (process.env.NODE_ENV as Environment['NODE_ENV']) || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    KRA_API_KEY: process.env.KRA_API_KEY!,
  };
}
```

## 로깅

### 로깅 패턴

```typescript
// ✅ 올바른 예시
export class DataController {
  constructor(private readonly logger: ILogger) {}

  async syncData(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting data sync', {
        date: req.body.date,
        userId: req.user?.id,
      });

      const result = await this.dataSyncService.syncAllData();

      this.logger.info('Data sync completed', {
        duration: Date.now() - startTime,
        count: result.count,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      this.logger.error('Data sync failed', {
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
```

## 성능 최적화

### 메모리 관리

```typescript
// ✅ 올바른 예시
export class RaceService {
  private readonly cache = new Map<string, Race>();

  async getRace(id: string): Promise<Race> {
    // 캐시 확인
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // 데이터베이스에서 조회
    const race = await this.repository.findById(id);

    // 캐시에 저장 (최대 100개)
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(id, race);

    return race;
  }
}
```

### 비동기 처리 최적화

```typescript
// ✅ 올바른 예시
async function syncMultipleRaces(races: Race[]): Promise<void> {
  // 병렬 처리 (최대 5개씩)
  const batchSize = 5;
  for (let i = 0; i < races.length; i += batchSize) {
    const batch = races.slice(i, i + batchSize);
    await Promise.all(batch.map(race => syncRace(race)));
  }
}
```

## 보안

### 입력 검증

```typescript
// ✅ 올바른 예시
export function validateRaceInput(input: any): RaceInput {
  if (!input.raceNumber || typeof input.raceNumber !== 'number') {
    throw new ValidationError(
      'Race number is required and must be a number',
      'raceNumber'
    );
  }

  if (!input.raceName || typeof input.raceName !== 'string') {
    throw new ValidationError(
      'Race name is required and must be a string',
      'raceName'
    );
  }

  if (input.raceName.length > 100) {
    throw new ValidationError(
      'Race name must be less than 100 characters',
      'raceName'
    );
  }

  return {
    raceNumber: input.raceNumber,
    raceName: input.raceName,
    date: new Date(input.date),
    venue: input.venue,
  };
}
```

### SQL 인젝션 방지

```typescript
// ✅ 올바른 예시 (Supabase 사용)
async function findRacesByVenue(venue: string): Promise<Race[]> {
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .eq('venue', venue); // 자동 이스케이프

  if (error) {
    throw new DatabaseError('Failed to fetch races', error);
  }

  return data.map(row => mapToRace(row));
}
```
