# 한국마사회 API 연동 가이드

## 환경변수 설정

### 1. Supabase 프로젝트에서 환경변수 설정

Supabase 대시보드에서 다음 환경변수를 설정해야 합니다:

```bash
# 한국마사회 API 키 (Encoding된 키 사용)
KRA_API_KEY=yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D
```

### 2. Supabase CLI로 환경변수 설정

```bash
# Supabase CLI 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref YOUR_PROJECT_ID

# 환경변수 설정
supabase secrets set KRA_API_KEY=yyRDa%2FaXc9SsDdY67IqkdXJmZgZXOzsKqnf%2BR%2FSZjR6iAxYLzKiq%2BgXTmdUj%2FFe%2BFtEsMXnMYrLaiX6PZ%2FemsQ%3D%3D
```

## API 정보

- **엔드포인트**: `https://apis.data.go.kr/B551015/API72_2`
- **서비스**: 전국 경마공원 경주계획표
- **일일 트래픽**: 10,000회
- **데이터포맷**: JSON/XML

## 배포 방법

### 1. Supabase CLI로 배포

```bash
# Edge Function 배포
supabase functions deploy fetch-race-data

# 데이터베이스 마이그레이션 적용
supabase db push
```

### 2. 수동 실행

```bash
# Edge Function 직접 호출
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/fetch-race-data \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 자동화 설정

### 1. Supabase Cron Jobs (권장)

Supabase 대시보드에서 Cron Job을 설정하여 매일 자동으로 실행:

```sql
-- 매일 오전 6시에 실행
SELECT cron.schedule(
  'fetch-race-data-daily',
  '0 6 * * *',
  'SELECT net.http_post(
    url:=''https://YOUR_PROJECT_ID.supabase.co/functions/v1/fetch-race-data'',
    headers:=''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}''
  );'
);
```

### 2. 외부 Cron 서비스 사용

GitHub Actions, Vercel Cron, 또는 다른 서비스에서 매일 실행:

```yaml
# GitHub Actions 예시
name: Fetch Race Data
on:
  schedule:
    - cron: '0 6 * * *' # 매일 오전 6시

jobs:
  fetch-data:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch race data
        run: |
          curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/fetch-race-data \
            -H "Authorization: Bearer YOUR_ANON_KEY"
```

## API 응답 구조

한국마사회 API는 다음과 같은 구조로 응답합니다:

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL SERVICE"
    },
    "body": {
      "items": {
        "item": [
          {
            "rc_year": "2024",
            "rc_month": "12",
            "rc_day": "25",
            "rc_no": "1",
            "meet": "서울",
            "rc_name": "경주명"
          }
        ]
      }
    }
  }
}
```

## 문제 해결

### 1. API 키 오류

- Encoding된 키를 사용했는지 확인
- API 키가 올바르게 설정되었는지 확인

### 2. CORS 오류

- Supabase Edge Function은 자동으로 CORS를 처리합니다

### 3. 데이터베이스 오류

- 마이그레이션이 올바르게 적용되었는지 확인
- 테이블 구조가 올바른지 확인

## 개발 모드

API 호출이 실패하면 자동으로 모의 데이터를 생성하여 개발을 계속할 수 있습니다.
