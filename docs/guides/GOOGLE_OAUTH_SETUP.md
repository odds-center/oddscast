# Google OAuth 로그인 설정 가이드

> 회원이 아니면 자동 회원가입, 기존 회원이면 로그인 처리

---

## 동작 방식

| 상황 | 동작 |
|------|------|
| **신규 사용자** (해당 이메일 없음) | 구글 프로필(이메일·이름·프로필 이미지)으로 자동 회원가입 후 로그인 |
| **기존 사용자** (해당 이메일 있음) | 즉시 로그인, 프로필 이미지 갱신 |

---

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 **새 프로젝트** 생성

### 1.2 OAuth 동의 화면 설정

1. **APIs & Services** → **OAuth consent screen**
2. **User Type**: External 선택 후 생성
3. **앱 정보**: 앱 이름, 사용자 지원 이메일, 개발자 연락처 입력
4. **Scope**: 이메일, 프로필, 프로필 사진 (기본값 그대로 사용)

### 1.3 OAuth 2.0 클라이언트 ID 발급

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. **Application type**: **Web application**
3. **Name**: `Golden Race Web` (또는 원하는 이름)
4. **Authorized JavaScript origins**:
   - 개발: `http://localhost:3000`, `http://127.0.0.1:3000`
   - 프로덕션: `https://your-domain.com`
5. **Authorized redirect URIs** (선택):
   - Google GSI는 팝업 방식이라 대부분 비워둠
6. **Create** 클릭 후 **Client ID** 복사

---

## 2. 환경 변수 설정

### 2.1 WebApp (`webapp/.env`)

```env
# Google Sign-In (웹) — Web Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

### 2.2 Server (`server/.env`)

```env
# Google OAuth — Web Client ID (WebApp .env의 NEXT_PUBLIC_GOOGLE_CLIENT_ID와 동일)
# idToken 검증에 사용. 미설정 시 구글 로그인 API 호출 시 에러 발생
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

> **중요**: WebApp과 Server는 **동일한 Web Client ID**를 사용합니다.  
> WebApp `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 값을 그대로 `GOOGLE_CLIENT_ID`로 복사하세요.  
> iOS/Android용은 별도 Client ID가 필요하므로, 여기서는 웹만 설정합니다.

---

## 3. 구글 로그인 표시 여부 (Admin)

Admin 대시보드 **AI Config** 또는 **GlobalConfig**에서 `show_google_login` 설정 가능:

- `true`: 로그인/회원가입 페이지에 구글 버튼 표시
- `false`: 구글 버튼 숨김

DB seed 기본값: `true`

```sql
-- seed.sql
INSERT INTO global_config (key, value, updated_at) VALUES
('show_google_login', 'true', NOW());
```

---

## 4. 관련 파일

| 구분 | 경로 |
|------|------|
| 서버 로직 | `server/src/auth/auth.service.ts` — `googleLogin()` |
| API 엔드포인트 | `POST /api/auth/google` — Body: `{ idToken: string }` |
| 웹 컴포넌트 | `webapp/components/GoogleSignInButton.tsx` |
| 로그인 페이지 | `webapp/pages/auth/login.tsx` |
| 회원가입 페이지 | `webapp/pages/auth/register.tsx` |

---

## 5. 테스트

실제 구글 로그인 후 서버 `POST /auth/google`가 idToken을 검증하고 회원가입/로그인 처리.
