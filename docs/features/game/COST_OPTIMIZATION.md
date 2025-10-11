# 💰 Golden Race 비용 최적화 전략

## 📋 개요

초기 스타트업 단계에서 **AWS 비용을 최소화**하면서도 안정적인 서비스를 제공하는 방법을 제시합니다.

---

## 🎯 비용 절감 목표

### 기존 구성 (과도한 인프라)

```
월간 AWS 비용: ₩305,638
- EC2 2대 (API + Admin): ₩62,285
- RDS Multi-AZ: ₩134,430
- ElastiCache: ₩14,890
- ALB: ₩40,620
- CloudFront: ₩18,285
- 기타: ₩35,128
```

### 최적화 목표

```
월간 AWS 비용: ₩50,000 이하 (83% 절감!)
```

---

## 🚀 최적화 전략 1: 단일 인스턴스 구성 (추천) ⭐

### 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│              단일 EC2 인스턴스 (t3.medium)               │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Nginx (Reverse Proxy)                             │ │
│  │  - Port 80/443                                     │ │
│  │  - SSL 종료 (Let's Encrypt 무료)                  │ │
│  └────────────────────────────────────────────────────┘ │
│                      ↓                                   │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │  NestJS API         │  │  Next.js Admin          │  │
│  │  Port 3002          │  │  Port 3001              │  │
│  └─────────────────────┘  └─────────────────────────┘  │
│                      ↓                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  MySQL (Docker Container)                          │ │
│  │  Port 3306                                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Redis (Docker Container)                          │ │
│  │  Port 6379                                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 비용 계산

| 항목              | 사양             | 월간 비용   | 비고             |
| ----------------- | ---------------- | ----------- | ---------------- |
| **EC2 t3.medium** | 2 vCPU, 4GB RAM  | **₩30,660** | 모든 서비스 통합 |
| **EBS 스토리지**  | 100GB SSD        | **₩13,540** | OS + DB + 백업   |
| **Elastic IP**    | 고정 IP 1개      | **₩0**      | 인스턴스 연결 시 |
| **Route 53**      | DNS              | **₩1,218**  | 도메인 관리      |
| **S3**            | 정적 파일 (10GB) | **₩1,000**  | 이미지, 백업     |
| **데이터 전송**   | 100GB/월         | **₩10,000** | 트래픽 예상      |
| **CloudWatch**    | 기본 모니터링    | **₩0**      | 무료 티어        |
| **총 비용**       |                  | **₩56,418** | **83% 절감!**    |

---

## 🔧 최적화 전략 2: AWS Lightsail (더욱 간단!)

### Lightsail 플랜

```
┌─────────────────────────────────────────────┐
│     Lightsail 인스턴스 ($20/월 플랜)        │
│                                              │
│  - 2 vCPU, 4GB RAM                          │
│  - 80GB SSD                                 │
│  - 4TB 데이터 전송 포함                     │
│  - 고정 IP 무료                             │
│  - 자동 백업 (추가 $4/월)                   │
└─────────────────────────────────────────────┘
```

### 비용 계산

| 항목               | 월간 비용   | 비고                  |
| ------------------ | ----------- | --------------------- |
| **Lightsail $20**  | **₩27,080** | 2 vCPU, 4GB RAM, 80GB |
| **자동 백업**      | **₩5,416**  | 선택 사항             |
| **Route 53**       | **₩1,218**  | DNS                   |
| **S3 (정적 파일)** | **₩1,000**  | 이미지 저장           |
| **총 비용**        | **₩34,714** | **88% 절감!** ⭐      |

> **Lightsail 장점**:
>
> - 간단한 관리 콘솔
> - 고정 가격 (예측 가능)
> - 데이터 전송 4TB 포함
> - 초보자 친화적

---

## 💾 데이터베이스 최적화

### 옵션 1: Docker MySQL (내장)

**장점**:

- ✅ 추가 비용 없음
- ✅ 빠른 로컬 연결
- ✅ 간단한 백업 (mysqldump)

**단점**:

- ❌ 인스턴스 재시작 시 다운타임
- ❌ 수동 백업 관리 필요

**적합한 시기**: **구독자 1,000명 미만**

### 옵션 2: RDS MySQL (t3.micro)

**비용**: 월 약 ₩40,000

**장점**:

- ✅ 자동 백업
- ✅ 고가용성
- ✅ 자동 패치

**적합한 시기**: **구독자 1,000명 이상**

---

## 🚦 단계별 인프라 전략

### Phase 1: MVP 단계 (0~500명)

```
┌─────────────────────────────────────────┐
│   Lightsail $20 플랜                     │
│   - NestJS API + Admin                  │
│   - MySQL (Docker)                      │
│   - Redis (Docker)                      │
│                                          │
│   월간 비용: ₩35,000                    │
└─────────────────────────────────────────┘
```

### Phase 2: 성장 단계 (500~2,000명)

```
┌─────────────────────────────────────────┐
│   EC2 t3.medium                         │
│   - NestJS API + Admin                  │
│   - Redis (Docker)                      │
│                                          │
│   RDS t3.micro                          │
│   - MySQL (외부 관리)                   │
│                                          │
│   월간 비용: ₩90,000                    │
└─────────────────────────────────────────┘
```

### Phase 3: 확장 단계 (2,000명~)

```
┌─────────────────────────────────────────┐
│   EC2 t3.medium × 2 (Auto Scaling)      │
│   - NestJS API                          │
│   - Admin                               │
│                                          │
│   ALB (로드 밸런서)                     │
│   RDS t3.medium (Multi-AZ)              │
│   ElastiCache Redis                     │
│                                          │
│   월간 비용: ₩305,000                   │
└─────────────────────────────────────────┘
```

---

## 🛠️ 구체적인 구성 방법

### 1. Nginx 리버스 프록시 설정

```nginx
# /etc/nginx/sites-available/goldenrace

# API 서버
server {
    listen 80;
    server_name api.goldenrace.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin 패널
server {
    listen 80;
    server_name admin.goldenrace.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Docker Compose 설정

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: goldenrace-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: goldenrace
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --max_connections=200

  redis:
    image: redis:7-alpine
    container_name: goldenrace-redis
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  mysql_data:
  redis_data:
```

### 3. PM2로 Node.js 앱 관리

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api-server',
      cwd: './server',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      instances: 1,
      exec_mode: 'cluster',
    },
    {
      name: 'admin-panel',
      cwd: './admin',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
```

### 4. 자동 백업 스크립트

```bash
#!/bin/bash
# backup.sh - 매일 새벽 3시 실행 (cron)

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
S3_BUCKET="s3://goldenrace-backups"

# MySQL 백업
docker exec goldenrace-mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  goldenrace > ${BACKUP_DIR}/db_${DATE}.sql

# 압축
gzip ${BACKUP_DIR}/db_${DATE}.sql

# S3 업로드
aws s3 cp ${BACKUP_DIR}/db_${DATE}.sql.gz ${S3_BUCKET}/

# 7일 이상 된 백업 삭제
find ${BACKUP_DIR} -name "db_*.sql.gz" -mtime +7 -delete
```

---

## 📊 최적화 결과 비교

### 비용 비교 (구독자 1,000명 기준)

| 항목        | 기존 구성    | 최적화 (Lightsail) | 절감액       | 절감률  |
| ----------- | ------------ | ------------------ | ------------ | ------- |
| AWS 인프라  | ₩305,638     | **₩34,714**        | ₩270,924     | 88%     |
| LLM API     | ₩324,960     | ₩324,960           | -            | -       |
| 기타 운영   | ₩40,674      | ₩40,674            | -            | -       |
| **총 비용** | **₩671,272** | **₩400,348**       | **₩270,924** | **40%** |

### 마진 비교

| 항목        | 기존 구성       | 최적화 (Lightsail) |
| ----------- | --------------- | ------------------ |
| 월간 수익   | ₩19,800,000     | ₩19,800,000        |
| 월간 비용   | ₩671,272        | ₩400,348           |
| **순 마진** | **₩19,128,728** | **₩19,399,652**    |
| **마진율**  | **96.6%**       | **98.0%**          |

**추가 마진**: 월 **₩270,924** 증가! 💰

---

## 🎯 추천 구성 (단계별)

### 🥉 브론즈: 초기 테스트 (0~100명)

```
Lightsail $10 플랜
- 1 vCPU, 2GB RAM, 60GB SSD
- API + Admin + MySQL + Redis
- 월간 비용: ₩13,540

적합 시기: 베타 테스트, MVP 검증
```

### 🥈 실버: 본격 시작 (100~1,000명) ⭐ **추천**

```
Lightsail $20 플랜
- 2 vCPU, 4GB RAM, 80GB SSD
- API + Admin + MySQL + Redis
- 월간 비용: ₩34,714

적합 시기: 정식 오픈, 마케팅 시작
```

### 🥇 골드: 성장 단계 (1,000~5,000명)

```
EC2 t3.medium
- 2 vCPU, 4GB RAM
- API + Admin + Redis

RDS t3.micro
- MySQL 외부 관리

월간 비용: ₩90,000

적합 시기: 안정적 성장, 트래픽 증가
```

### 💎 플래티넘: 대규모 (5,000명~)

```
EC2 Auto Scaling
ALB 로드 밸런서
RDS Multi-AZ
ElastiCache

월간 비용: ₩305,000

적합 시기: 대규모 서비스, 고가용성 필요
```

---

## 💡 추가 비용 절감 팁

### 1. SSL 인증서

```
❌ ACM (CloudFront 필요): $0 (하지만 CloudFront 비용 발생)
✅ Let's Encrypt: $0 (완전 무료!)

# Certbot 설치
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.goldenrace.com -d admin.goldenrace.com
```

### 2. CDN 최적화

**초기 단계 (1,000명 미만)**:

- CloudFront 사용 안 함
- Nginx로 정적 파일 직접 서빙
- S3에 이미지만 저장

**성장 단계 (1,000명 이상)**:

- CloudFront 도입 고려
- 또는 Cloudflare Free (무료 CDN) ⭐

### 3. 모니터링

```
무료 도구 활용:
- Uptime Robot: 무료 (5분 간격)
- Grafana + Prometheus: 오픈소스
- PM2 내장 모니터링: 무료
```

### 4. 로그 관리

```
❌ CloudWatch Logs: 유료
✅ Logrotate + S3: 거의 무료
✅ ELK Stack (자체 호스팅): 무료
```

---

## 📈 스케일링 가이드

### 언제 업그레이드 해야 할까?

#### Lightsail → EC2 전환 시점

```
✅ CPU 사용률 70% 이상 지속
✅ 메모리 사용률 80% 이상
✅ 구독자 1,000명 이상
✅ 동시 접속 200명 이상
```

#### RDS 도입 시점

```
✅ 데이터베이스 크기 20GB 이상
✅ 일일 트랜잭션 100만 건 이상
✅ 백업 자동화 필요
✅ Multi-AZ 고가용성 필요
```

#### Auto Scaling 도입 시점

```
✅ 구독자 5,000명 이상
✅ 피크 시간대 부하 집중
✅ 트래픽 변동 심함
✅ 다운타임 허용 불가
```

---

## 🚨 주의사항

### 단일 인스턴스 리스크

1. **단일 장애점 (SPOF)**

   - 인스턴스 다운 시 전체 서비스 중단
   - **대응**: 정기 백업, 신속한 복구 절차 마련

2. **리소스 경쟁**

   - CPU/메모리를 여러 서비스가 공유
   - **대응**: PM2 클러스터 모드, 리소스 모니터링

3. **확장성 제한**
   - 수직 확장만 가능 (인스턴스 크기 증가)
   - **대응**: 초기부터 마이크로서비스 아키텍처 고려

### 권장 사항

```
✅ 정기 백업 자동화 (매일)
✅ 모니터링 알림 설정 (CPU/메모리/디스크)
✅ 스냅샷 주기적 생성 (주 1회)
✅ 로그 로테이션 설정
✅ 보안 그룹 최소 권한 원칙
```

---

## 🎯 최종 추천

### 초기 6개월

```
🏆 Lightsail $20 플랜

월간 비용: ₩35,000
- 2 vCPU, 4GB RAM
- 모든 서비스 통합
- 자동 백업

👍 장점:
- 매우 저렴
- 간단한 관리
- 예측 가능한 비용

👎 단점:
- 단일 장애점
- 제한적 확장성

💡 결론: 구독자 1,000명까지 충분!
```

### 6개월 이후

```
트래픽과 수익에 따라 점진적 확장

구독자 500명 → Lightsail $40 플랜 (₩54,160)
구독자 1,000명 → EC2 + Docker (₩70,000)
구독자 2,000명 → EC2 + RDS (₩110,000)
구독자 5,000명 → 완전한 AWS 구성 (₩305,000)
```

---

## 📊 최종 비용 요약

### 시나리오: Lightsail로 시작 (구독자 1,000명)

| 항목                | 월간 비용    |
| ------------------- | ------------ |
| **Lightsail $20**   | ₩27,080      |
| **백업**            | ₩5,416       |
| **Route 53**        | ₩1,218       |
| **S3**              | ₩1,000       |
| **LLM API**         | ₩324,960     |
| **도메인/앱스토어** | ₩12,674      |
| **모니터링**        | ₩20,000      |
| **백업**            | ₩8,000       |
| **총 비용**         | **₩400,348** |

### 재무 지표

```
월간 수익 (1,000명):  ₩19,800,000
월간 비용:            ₩400,348
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
순 마진:              ₩19,399,652
마진율:               98.0% 🎉

손익분기점: 21명 (18명 → 21명으로 소폭 증가)
```

---

<div align="center">

**💰 비용 최적화로 더 높은 마진! 💰**

Lightsail로 시작하면  
AWS 비용 88% 절감 + 마진율 98% 달성!

초기에는 단순하게, 성장하면서 점진적으로 확장!

**Golden Race Team** 🏇

**작성일**: 2025년 10월 11일  
**버전**: 1.0.0

</div>
