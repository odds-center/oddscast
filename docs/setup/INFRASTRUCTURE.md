# 인프라 구성 가이드

## 개요

| 구성요소 | 용도 | 포트 |
|----------|------|------|
| **Google Analytics (GA4)** | CTA·페이지뷰 추적 | - |
| **Health Check** | nginx/LB 헬스체크 | NestJS `/health` |
| **nginx** | 리버스 프록시 | 80 |
| **Redis** | API 캐시 (경주 상세 등) | 6379 |
| **n8n** | 워크플로우 자동화 | 5678 |

---

## 1. Google Analytics

- **위치**: webapp (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- **설정**: `.env`에 `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` 추가
- **프로덕션**에서만 이벤트 전송 (NODE_ENV=production)

---

## 2. Health Check

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"...","service":"Golden Race API","version":"1.0.0"}
```

- nginx가 `/health`를 백엔드 `/health`로 프록시
- LB/모니터링에서 주기적으로 호출

---

## 3. nginx

```bash
# 서버·웹앱 실행 후
cd nginx
nginx -c $(pwd)/nginx.conf -p $(pwd)
# 또는 Docker: docker run -d -p 80:80 -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine
```

---

## 4. Redis

```bash
# Docker Compose
docker compose up -d redis

# 서버 .env
REDIS_URL=redis://localhost:6379
```

- 미설정 시 인메모리 캐시 사용
- 경주 상세(`/api/races/:id`) 등 5분 TTL 캐시

---

## 5. n8n

```bash
docker compose up -d n8n
# http://localhost:5678 (admin/changeme)
```

- 웹훅, 스케줄, 외부 API 연동
- 비밀번호는 `.env` 또는 `docker-compose.override.yml`에서 변경 권장
