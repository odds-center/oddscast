# API 설정 관리

이 폴더는 Golden Race 앱에서 사용하는 모든 API 설정과 키값들을 관리합니다.

## 폴더 구조

```
config/api/
├── index.ts          # 통합 API 설정 관리
├── kra.ts           # KRA (한국마사회) API 설정
├── README.md        # 이 파일
└── .env.example     # 환경변수 예시 파일
```

## 설정 파일들

### 1. index.ts

- 환경별 API 설정 (development, staging, production)
- API 키 통합 관리
- 유효성 검사 함수들

### 2. kra.ts

- KRA API 엔드포인트 설정
- KRA API 응답 타입 정의
- KRA API 헬퍼 함수들

## 환경변수 설정

`.env` 파일에 다음 환경변수들을 설정해야 합니다:

```bash
# KRA API 키
KRA_API_KEY=your_kra_api_key_here
KRA_SECRET_KEY=your_kra_secret_key_here

# Supabase 설정
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 환경 설정
NODE_ENV=development
```

## 사용법

```typescript
import { KRA_API_CONFIG, API_KEYS, validateApiKeys } from '@/config/api';

// API 키 유효성 검사
if (!validateApiKeys()) {
  console.error('API 키가 설정되지 않았습니다.');
}

// KRA API 설정 사용
const kraConfig = KRA_API_CONFIG;
const apiKey = API_KEYS.kra.apiKey;
```

## 보안 주의사항

1. **API 키는 절대 코드에 하드코딩하지 마세요**
2. **`.env` 파일은 `.gitignore`에 포함되어야 합니다**
3. **프로덕션 환경에서는 환경변수를 안전하게 관리하세요**
4. **API 키는 정기적으로 로테이션하세요**

## 새로운 API 추가

새로운 API를 추가할 때는:

1. `config/api/` 폴더에 새로운 설정 파일 생성
2. `index.ts`에 새로운 API 설정 추가
3. `API_KEYS` 객체에 새로운 키 추가
4. `validateApiKeys` 함수에 새로운 키 검증 로직 추가
5. 이 README 파일 업데이트
