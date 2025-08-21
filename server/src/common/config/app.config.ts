export interface AppConfig {
  port: number;
  environment: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  kra: KraConfig;
  cache: CacheConfig;
  queue: QueueConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  charset: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface KraConfig {
  apiKey: string;
  timeout: number;
  maxRetries: number;
  dailyLimit: number;
  rateLimit: number;
}

export interface CacheConfig {
  ttl: number;
  max: number;
  checkPeriod: number;
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
  };
}

export const getAppConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'goldenrace_user',
    password: process.env.DB_PASSWORD || 'goldenrace_password',
    database: process.env.DB_DATABASE || 'goldenrace',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    charset: 'utf8mb4',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  kra: {
    apiKey:
      process.env.KRA_API_KEY ||
      'yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D',
    timeout: parseInt(process.env.KRA_TIMEOUT || '10000', 10),
    maxRetries: parseInt(process.env.KRA_MAX_RETRIES || '3', 10),
    dailyLimit: parseInt(process.env.KRA_DAILY_LIMIT || '10000', 10),
    rateLimit: parseInt(process.env.KRA_RATE_LIMIT || '100', 10),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    max: parseInt(process.env.CACHE_MAX || '100', 10),
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),
  },
  queue: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  },
});
