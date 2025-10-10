# 데이터베이스 (Database)

본 문서는 Golden Race 앱에서 사용되는 데이터베이스의 스키마, 테이블 관계, 주요 함수 및 트리거에 대해 설명합니다.

## 1. 데이터베이스 개요

Golden Race 앱은 MySQL 데이터베이스를 사용하여 사용자 정보, 경주 데이터, 베팅 내역 등을 관리합니다.

## 2. 주요 테이블 구조

### 2.1. 사용자 관련 테이블

#### `users` 테이블

- **목적**: 사용자 기본 정보 저장
- **주요 필드**:
  - `id`: 사용자 고유 식별자 (UUID)
  - `email`: 이메일 주소 (Google 계정에서 가져옴)
  - `name`: 사용자 이름
  - `avatar`: 프로필 이미지 URL
  - `googleId`: Google 계정 ID
  - `isActive`: 계정 활성화 상태
  - `createdAt`: 계정 생성일시
  - `updatedAt`: 정보 수정일시

#### `user_profiles` 테이블

- **목적**: 사용자 추가 프로필 정보 저장
- **주요 필드**:
  - `userId`: 사용자 ID (users 테이블 참조)
  - `username`: 사용자명
  - `notificationsEnabled`: 알림 설정
  - `preferences`: 사용자 선호도 설정
  - `createdAt`: 생성일시
  - `updatedAt`: 수정일시

### 2.2. 경마 관련 테이블

#### `races` 테이블

- **목적**: 경주 정보 저장
- **주요 필드**:
  - `id`: 경주 고유 식별자
  - `raceDate`: 경주 날짜
  - `raceTime`: 경주 시간
  - `venue`: 경주장
  - `raceNumber`: 경주 번호
  - `distance`: 거리
  - `surface`: 경주로 타입
  - `status`: 경주 상태
  - `createdAt`: 생성일시

#### `horses` 테이블

- **목적**: 말 정보 저장
- **주요 필드**:
  - `id`: 말 고유 식별자
  - `name`: 말 이름
  - `age`: 나이
  - `gender`: 성별
  - `trainer`: 조교사
  - `jockey`: 기수
  - `weight`: 체중
  - `odds`: 배당률

#### `race_results` 테이블

- **목적**: 경주 결과 저장
- **주요 필드**:
  - `id`: 결과 고유 식별자
  - `raceId`: 경주 ID
  - `horseId`: 말 ID
  - `finishPosition`: 순위
  - `finishTime`: 완주 시간
  - `prizeMoney`: 상금

### 2.3. 베팅 관련 테이블

#### `bets` 테이블

- **목적**: 사용자 베팅 내역 저장
- **주요 필드**:
  - `id`: 베팅 고유 식별자
  - `userId`: 사용자 ID
  - `raceId`: 경주 ID
  - `horseId`: 말 ID
  - `betAmount`: 베팅 금액
  - `betType`: 베팅 유형
  - `odds`: 베팅 시 배당률
  - `status`: 베팅 상태
  - `createdAt`: 베팅일시

## 3. 테이블 관계

### 3.1. 주요 관계

- `users` ↔ `user_profiles`: 1:1 관계
- `races` ↔ `race_results`: 1:N 관계
- `horses` ↔ `race_results`: 1:N 관계
- `users` ↔ `bets`: 1:N 관계
- `races` ↔ `bets`: 1:N 관계

### 3.2. 외래 키 제약 조건

모든 테이블은 적절한 외래 키 제약 조건을 통해 데이터 무결성을 보장합니다.

## 4. 데이터베이스 설정

### 4.1. 환경 변수

데이터베이스 연결을 위한 환경 변수 설정이 필요합니다:

```env
DATABASE_URL=mysql://username:password@host:port/database_name
```

### 4.2. 연결 풀 설정

데이터베이스 성능 최적화를 위한 연결 풀 설정:

```typescript
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
};
```

## 5. 데이터 마이그레이션

### 5.1. 스키마 변경

데이터베이스 스키마 변경 시 마이그레이션 스크립트를 사용합니다:

```sql
-- 예시: 새로운 컬럼 추가
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

### 5.2. 데이터 백업

정기적인 데이터 백업을 통해 데이터 손실을 방지합니다.

## 6. 성능 최적화

### 6.1. 인덱스

자주 조회되는 컬럼에 인덱스를 생성하여 쿼리 성능을 향상시킵니다:

```sql
CREATE INDEX idx_races_date ON races(raceDate);
CREATE INDEX idx_bets_user ON bets(userId);
```

### 6.2. 쿼리 최적화

복잡한 쿼리는 JOIN을 최소화하고 적절한 WHERE 절을 사용하여 최적화합니다.

---

**마지막 업데이트**: 2025년 10월 10일
