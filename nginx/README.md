# nginx 설정

NestJS API + Next.js WebApp 리버스 프록시 및 헬스체크.

## 경로 매핑

| 경로 | 대상 |
|------|------|
| `/health` | NestJS `/health` — LB/모니터링 헬스체크 |
| `/api/*` | NestJS API 서버 (기본 3001) |
| `/*` | Next.js WebApp (기본 3000) |

## 사용법

### 로컬 테스트

```bash
# 서버·웹앱 먼저 실행
cd server && npm run start:dev   # 3001
cd webapp && npm run dev         # 3000

# nginx 실행 (포트 80)
nginx -c $(pwd)/nginx/nginx.conf -p $(pwd)

# 또는 Docker
docker run -d -p 80:80 -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine
```

### 포트 변경

`nginx.conf` 내 `upstream` 서버 주소 수정:

- `api_backend`: `127.0.0.1:3001` → 실제 API 포트
- `webapp_backend`: `127.0.0.1:3000` → 실제 WebApp 포트

### 헬스체크 확인

```bash
curl http://localhost/health
# {"status":"ok","timestamp":"...","service":"Golden Race API","version":"1.0.0"}
```
