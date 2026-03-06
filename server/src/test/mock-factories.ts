/**
 * Shared mock factories for unit tests.
 * Eliminates boilerplate when mocking TypeORM repos, cache, config, etc.
 */

/** Chainable QueryBuilder mock. Terminal methods return jest.fn() with sensible defaults. */
export function createMockQueryBuilder(overrides?: Record<string, unknown>) {
  const qb: Record<string, jest.Mock> = {};

  // Chainable methods
  const chainable = [
    'where',
    'andWhere',
    'orWhere',
    'orderBy',
    'addOrderBy',
    'select',
    'addSelect',
    'innerJoin',
    'innerJoinAndSelect',
    'leftJoinAndSelect',
    'skip',
    'take',
    'limit',
    'groupBy',
    'addGroupBy',
    'subQuery',
  ];
  for (const m of chainable) {
    qb[m] = jest.fn().mockReturnThis();
  }

  // Terminal methods
  qb.getOne = jest.fn().mockResolvedValue(null);
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getRawOne = jest.fn().mockResolvedValue(null);
  qb.getCount = jest.fn().mockResolvedValue(0);
  qb.getQuery = jest.fn().mockReturnValue('');

  if (overrides) {
    Object.assign(qb, overrides);
  }

  return qb;
}

/** Mock TypeORM Repository with common methods. */
export function createMockRepository() {
  const qb = createMockQueryBuilder();
  return {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation((entity) => entity),
    save: jest
      .fn()
      .mockImplementation((entity) => Promise.resolve({ id: 1, ...entity })),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    upsert: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    _qb: qb,
  };
}

/** Mock @nestjs/cache-manager CACHE_MANAGER. */
export function createMockCache() {
  return {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
}

/** Mock ConfigService with optional defaults map. */
export function createMockConfigService(defaults?: Record<string, string>) {
  return {
    get: jest
      .fn()
      .mockImplementation((key: string) => defaults?.[key] ?? undefined),
  };
}

/** Mock DataSource with transaction callback. Manager has save/update/delete/getRepository. */
export function createMockDataSource() {
  const mockManager = {
    save: jest
      .fn()
      .mockImplementation((_entity, data) =>
        Promise.resolve({ id: 1, ...data }),
      ),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    getRepository: jest.fn().mockReturnValue(createMockRepository()),
  };
  return {
    transaction: jest
      .fn()
      .mockImplementation(
        (cb: (manager: typeof mockManager) => Promise<unknown>) =>
          cb(mockManager),
      ),
    _manager: mockManager,
  };
}

/** Mock JwtService. */
export function createMockJwtService() {
  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest
      .fn()
      .mockReturnValue({ sub: 1, email: 'test@test.com', role: 'USER' }),
  };
}
