# 📊 Admin 가이드

Golden Race Admin Panel 개발 가이드 문서입니다.

---

## 📚 문서 목록

| 문서                                       | 설명                   | 상태    |
| ------------------------------------------ | ---------------------- | ------- |
| [Admin Panel 가이드](ADMIN_PANEL_GUIDE.md) | Admin 개발 완벽 가이드 | ✅ 완료 |

---

## 🚀 빠른 시작

### 1. Admin 패널 실행

```bash
cd admin
pnpm install
pnpm dev
```

→ http://localhost:3001 접속

### 2. 로그인

기본 관리자 계정:

- Email: admin@goldenrace.com
- Password: (서버 설정 확인)

---

## 🎯 주요 기능

### 사용자 관리

- 회원 목록 조회
- 회원 상세 정보
- 회원 통계 (가입, 활동, 구독)

### 베팅 관리

- 베팅 내역 조회
- 승률 및 ROI 분석
- 베팅 취소/환불

### 경주 관리

- 경주 일정 조회
- 경주 결과 입력
- 경주 통계

### 구독 관리

- 구독 플랜 설정 (Light, Premium)
- 개별 구매 설정
- 구독 현황 조회
- 가격 조정

### AI 설정

- LLM Provider 선택 (OpenAI, Claude)
- 모델 선택 (GPT-4 Turbo, GPT-4o 등)
- 비용 최적화 전략
- 캐싱 설정 (99% 비용 절감)
- 배치 예측 스케줄
- 자동 업데이트 설정

### 알림 발송

- Push Notification 전송
- 사용자 타겟팅 (전체, 개별, 그룹)
- 알림 이력 조회

---

## 🛠️ 기술 스택

- **Next.js 14** - React 프레임워크 (Pages Router)
- **TypeScript** - 타입 안정성
- **TanStack Query** - 서버 상태 관리
- **React Hook Form** - 폼 관리
- **Zod** - 스키마 검증
- **React Hot Toast** - 토스트 알림
- **Tailwind CSS** - 스타일링
- **Axios** - HTTP 클라이언트

---

## 📖 관련 문서

### 서버

- [Admin Module](../../../server/src/admin/) - NestJS Admin 모듈
- [Admin Controllers](../../../server/src/admin/controllers/) - API 컨트롤러

### 배포

- [Railway 가이드](../deployment/RAILWAY_DETAILED_GUIDE.md) - Admin 배포
- [Cloudflare 가이드](../deployment/CLOUDFLARE_GUIDE.md) - CDN 설정

### 개발 일지

- [2025-10-14 Admin Panel 완전 구축](../../daily/2025-10-14-admin-panel-complete.md)

---

**마지막 업데이트**: 2025년 10월 14일
