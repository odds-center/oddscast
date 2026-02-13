import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as path from 'path';

// 환경변수 로드
config({ path: path.join(__dirname, '../../.env') });
config({ path: path.join(__dirname, '../../.env.local') });

const configService = new ConfigService();

// DATABASE_URL 우선 사용, 없으면 개별 환경변수로 조합
const dbUrl =
  configService.get('DATABASE_URL') ||
  `postgresql://${configService.get('SUPABASE_DB_USER')}:${configService.get('SUPABASE_DB_PASSWORD')}@${configService.get('SUPABASE_DB_HOST')}:${configService.get('SUPABASE_DB_PORT')}/${configService.get('SUPABASE_DB_NAME')}?sslmode=require`;

const isDevelopment = configService.get('NODE_ENV') !== 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: dbUrl,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../migrations/**/*{.ts,.js}'],
  synchronize: false, // 마이그레이션 사용 시 항상 false
  logging: configService.get('DB_LOGGING') === 'true' ? ['query', 'error'] : false,
  ssl: {
    rejectUnauthorized: false,
  },
  extra: {
    max: 20,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  },
};

// TypeORM CLI에서 사용할 DataSource 인스턴스
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;

