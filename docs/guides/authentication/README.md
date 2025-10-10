# 🔐 인증 가이드

Google OAuth 2.0 인증 구현 가이드입니다.

---

## 📚 문서 목록

| 문서                                         | 설명                   |
| -------------------------------------------- | ---------------------- |
| [Authentication.md](Authentication.md)       | Google OAuth 구현 상세 |
| [GOOGLE_AUTH_USAGE.md](GOOGLE_AUTH_USAGE.md) | Google 인증 사용 방법  |

---

## 🔑 인증 흐름

```
1. 사용자: Google 로그인 버튼 클릭
    ↓
2. 앱: Google OAuth 페이지로 이동
    ↓
3. 사용자: Google 계정 선택
    ↓
4. Google: ID Token 발급
    ↓
5. 앱: ID Token을 서버로 전송
    ↓
6. 서버: Token 검증 → JWT 발급
    ↓
7. 앱: JWT 저장 → 로그인 완료
```

---

## 🔗 관련 문서

- [Google Cloud 설정](../../setup/GOOGLE_CLOUD_SETUP.md)
- [환경변수](../../setup/ENVIRONMENT.md)

---

**마지막 업데이트**: 2025년 10월 10일
