# 📦 데이터 저장 구조

## 🗄️ 데이터베이스 정보

### MySQL 데이터베이스

Golden Race는 **MySQL 8.0** 데이터베이스를 사용하여 모든 데이터를 저장합니다.

#### 연결 정보

```
호스트: localhost (Docker 내부: mysql)
포트: 3307 (외부) → 3306 (내부)
데이터베이스: goldenrace
사용자: goldenrace_user
비밀번호: goldenrace_password
```

#### Docker 볼륨

```
볼륨 이름: goldenrace_mysql_data
드라이버: local
영구 저장: ✅ (컨테이너 삭제 시에도 데이터 유지)
```

## 📊 저장되는 데이터

### 1. 경주 관련 테이블

#### `races` - 경주 기본 정보

```sql
id, meet, meet_name, rc_date, rc_no, rc_name, rc_dist,
rc_grade, rc_prize, rc_track_condition, race_status, ...
```

**용도**: 경주 메타데이터, AI 특징 추출 기반

#### `results` - 경주 결과

```sql
result_id, race_id, meet, rc_date, rc_no, ord (순위),
hr_name (말), hr_no, jk_name (기수), tr_name (조교사),
rc_time (기록), rc_prize (상금), ...
```

**용도**: AI 학습 레이블 (정답 데이터)

#### `race_plans` - 경주 계획

```sql
plan_id, meet, rc_date, rc_no, rc_name, rc_dist,
rc_grade, rc_prize, rc_condition, expected_entries, ...
```

**용도**: 예정 경주 정보, 사용자 예측 대상

#### `dividend_rates` - 확정 배당율

```sql
dividend_id, meet, rc_date, rc_no, pool (승식),
odds (배당률), chul_no (번호), winning_combinations, ...
```

**용도**: 베팅 시장 분석, 인기도 지표

#### `entry_details` - 출전표 상세

```sql
entry_id, race_id, hr_no, hr_name, jk_name, tr_name,
hr_weight, hr_rating, total_starts, total_wins,
year_win_rate, ...
```

**용도**: 경주마 상세 정보, AI 특징 데이터

### 2. 사용자 관련 테이블

#### `users` - 사용자 정보

```sql
id, email, name, avatar, auth_provider,
total_bets, won_bets, win_rate, total_winnings,
betting_level, achievements, ...
```

#### `user_social_auth` - 소셜 인증

```sql
id, user_id, provider (google), provider_id,
access_token, refresh_token, ...
```

#### `refresh_tokens` - JWT 토큰

```sql
id, user_id, token, expires_at, is_revoked, ...
```

### 3. 게임 관련 테이블

#### `bets` - 베팅 기록

```sql
id, user_id, race_id, bet_type, bet_amount,
bet_status, bet_result, selections (JSON),
actual_win, odds, ...
```

**용도**: 외부에서 구매한 마권 기록 관리

#### `favorites` - 즐겨찾기

```sql
id, user_id, type (HORSE/JOCKEY/TRAINER),
target_id, target_name, target_data (JSON),
priority, tags (JSON), ...
```

#### `user_point_balances` - 포인트 잔액

```sql
id, user_id, current_balance, total_earned,
total_spent, total_bonus, ...
```

#### `user_points` - 포인트 거래 내역

```sql
id, user_id, transaction_type, amount,
balance_after, description, status, ...
```

#### `notifications` - 알림

```sql
id, user_id, title, message, type, priority,
status, data (JSON), ...
```

## 💾 데이터 저장 위치

### Docker 볼륨 (영구 저장)

```
Docker Volume: goldenrace_mysql_data
위치: /var/lib/docker/volumes/goldenrace_mysql_data/_data
```

### 데이터 접근 방법

#### 1. Docker 컨테이너를 통해

```bash
# MySQL CLI 접속
docker-compose exec mysql mysql -u goldenrace_user -pgoldenrace_password goldenrace

# 테이블 목록 확인
SHOW TABLES;

# 데이터 개수 확인
SELECT COUNT(*) FROM results;
SELECT COUNT(*) FROM races;
SELECT COUNT(*) FROM race_plans;
```

#### 2. 외부 MySQL 클라이언트

```
호스트: localhost
포트: 3307
사용자: goldenrace_user
비밀번호: goldenrace_password
데이터베이스: goldenrace
```

**추천 도구**:

- MySQL Workbench
- DBeaver
- TablePlus
- DataGrip

## 📈 데이터 크기 예상

### 테이블별 예상 크기 (1년 기준)

| 테이블           | 레코드 수 | 크기       | 설명                    |
| ---------------- | --------- | ---------- | ----------------------- |
| `races`          | ~18,000   | ~50MB      | 경주 기본 정보          |
| `results`        | ~216,000  | ~500MB     | 경주 결과 (경주당 12마) |
| `race_plans`     | ~18,000   | ~40MB      | 경주 계획               |
| `dividend_rates` | ~108,000  | ~200MB     | 배당율 (경주당 6승식)   |
| `entry_details`  | ~216,000  | ~800MB     | 출전표 상세             |
| **총계**         | ~576,000  | **~1.6GB** | 1년치 데이터            |

### 3년 데이터 (AI 학습용)

```
레코드 수: ~1,728,000건
데이터 크기: ~4.8GB
인덱스 포함: ~6-7GB
```

## 🔄 데이터 흐름

```
┌─────────────────────────────────────────┐
│         한국마사회 API (KRA)             │
│  - 경주 결과 (API4_3)                    │
│  - 출전표 (API26_2)                      │
│  - 배당율 (API160)                       │
│  - 경주 계획 (API72_2)                   │
└─────────────────────────────────────────┘
                    ↓
         (HTTP Request - Axios)
                    ↓
┌─────────────────────────────────────────┐
│      NestJS Server (Golden Race)        │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  KRA API Integration Services      │ │
│  │  - KraRaceRecordsService           │ │
│  │  - KraEntrySheetService            │ │
│  │  - KraDividendRatesService         │ │
│  │  - KraRacePlansService             │ │
│  └────────────────────────────────────┘ │
│                    ↓                     │
│  ┌────────────────────────────────────┐ │
│  │  TypeORM (ORM Layer)               │ │
│  │  - Entity Mapping                  │ │
│  │  - Query Builder                   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
           (SQL Queries)
                    ↓
┌─────────────────────────────────────────┐
│      MySQL Database (Docker)            │
│                                          │
│  Database: goldenrace                   │
│  ┌────────────────────────────────────┐ │
│  │  Tables:                            │ │
│  │  - races         (경주)             │ │
│  │  - results       (결과)             │ │
│  │  - race_plans    (계획)             │ │
│  │  - dividend_rates (배당)            │ │
│  │  - entry_details (출전)             │ │
│  │  - users         (사용자)           │ │
│  │  - bets          (베팅)             │ │
│  │  - favorites     (즐겨찾기)         │ │
│  │  - user_points   (포인트)           │ │
│  │  - notifications (알림)             │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
         (Volume Mount)
                    ↓
┌─────────────────────────────────────────┐
│    Docker Volume: mysql_data            │
│    /var/lib/mysql (영구 저장)           │
└─────────────────────────────────────────┘
```

## 🛠️ 데이터 관리

### 백업

```bash
# MySQL 데이터 백업
docker-compose exec mysql mysqldump -u goldenrace_user -pgoldenrace_password goldenrace > backup.sql

# 압축 백업
docker-compose exec mysql mysqldump -u goldenrace_user -pgoldenrace_password goldenrace | gzip > backup.sql.gz
```

### 복원

```bash
# 백업 복원
docker-compose exec -T mysql mysql -u goldenrace_user -pgoldenrace_password goldenrace < backup.sql

# 압축 파일 복원
gunzip < backup.sql.gz | docker-compose exec -T mysql mysql -u goldenrace_user -pgoldenrace_password goldenrace
```

### 데이터 초기화

```bash
# 주의: 모든 데이터 삭제!
docker-compose down -v  # 볼륨 포함 삭제
docker-compose up -d    # 재시작 (초기 스키마 생성)
```

## 📍 데이터 확인 방법

### 1. NPM 스크립트로 확인

```bash
npm run init:data:check
```

출력:

```
📊 데이터베이스 커버리지 확인

🏁 경주 데이터: 18,234건
📊 경주 결과: 218,808건
📋 경주 계획: 18,234건

📅 데이터 기간: 20240101 ~ 20241231
```

### 2. SQL 쿼리로 직접 확인

```bash
docker-compose exec mysql mysql -u goldenrace_user -pgoldenrace_password goldenrace
```

```sql
-- 테이블별 데이터 개수
SELECT
  'races' as table_name, COUNT(*) as count FROM races
UNION ALL
SELECT 'results', COUNT(*) FROM results
UNION ALL
SELECT 'race_plans', COUNT(*) FROM race_plans
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'bets', COUNT(*) FROM bets;

-- 날짜별 경주 수
SELECT rc_date, COUNT(*) as race_count
FROM results
GROUP BY rc_date
ORDER BY rc_date DESC
LIMIT 10;

-- 경주장별 통계
SELECT meet_name, COUNT(*) as total_races
FROM results
GROUP BY meet_name;
```

## 💡 최적화

### 인덱스

모든 주요 검색 필드에 인덱스가 설정되어 있습니다:

- `idx_rc_date` - 날짜별 조회
- `idx_meet` - 경주장별 조회
- `idx_race_id` - 경주 ID 조회
- `idx_user_id` - 사용자별 조회

### 쿼리 성능

- 날짜별 조회: ~10ms
- 경주 상세: ~5ms
- 통계 쿼리: ~50ms

## 🔐 데이터 보안

### 접근 제어

- 외부 접근: 포트 3307만 개방
- 내부 네트워크: Docker network 격리
- 인증: 사용자명/비밀번호 필수

### 백업 정책 (권장)

- **일일 백업**: 매일 새벽 자동 백업
- **주간 백업**: 압축하여 장기 보관
- **복제**: 프로덕션은 마스터-슬레이브 구성

---

**요약**: 모든 데이터는 Docker MySQL 컨테이너의 영구 볼륨에 저장되며, TypeORM을 통해 관리됩니다.

---

**마지막 업데이트**: 2025년 10월 10일
