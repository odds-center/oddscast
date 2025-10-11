# Database Migrations

## 마이그레이션 실행 방법

### 1. MySQL 접속

```bash
mysql -u goldenrace_user -p -h localhost -P 3307 goldenrace
```

### 2. 마이그레이션 실행

```bash
# 개발 환경
mysql -u goldenrace_user -p -h localhost -P 3307 goldenrace < migrations/add-device-token-to-users.sql
```

## 마이그레이션 목록

### 2025-10-11: Device Token 추가

- **파일:** `add-device-token-to-users.sql`
- **목적:** User 테이블에 푸시 알림 토큰 저장 컬럼 추가
- **변경 사항:**
  - `device_token` (TEXT) - Expo Push Token 저장
  - `device_platform` (VARCHAR(20)) - 디바이스 플랫폼 (ios/android)
  - `token_updated_at` (DATETIME) - 토큰 업데이트 시간
  - 인덱스 2개 추가

## 롤백

### Device Token 제거

```sql
ALTER TABLE `users`
DROP INDEX `idx_users_device_platform`,
DROP INDEX `idx_users_device_token`,
DROP COLUMN `token_updated_at`,
DROP COLUMN `device_platform`,
DROP COLUMN `device_token`;
```

## 주의사항

1. 프로덕션 환경에서는 반드시 백업 후 실행
2. 마이그레이션 전 TypeORM synchronize는 false로 설정
3. 테스트 환경에서 먼저 검증 후 프로덕션 적용
