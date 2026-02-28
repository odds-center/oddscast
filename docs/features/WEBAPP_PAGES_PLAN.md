# WebApp 전체 페이지 계획표

> 모든 페이지에 대한 완성도 기준·현황·실행 순서를 한 문서에서 관리합니다.  
> 기준: [WEBAPP_COMPLETENESS.md](WEBAPP_COMPLETENESS.md), [UI_PATTERNS.md](UI_PATTERNS.md)

---

## 목차

1. [공통 체크리스트](#1-공통-체크리스트)
2. [페이지 목록 (도메인별)](#2-페이지-목록-도메인별)
3. [페이지별 상세 계획](#3-페이지별-상세-계획)
4. [실행 순서 (순서대로 진행)](#4-실행-순서-순서대로-진행)

---

## 1. 공통 체크리스트

각 페이지 점검 시 아래 항목을 기준으로 합니다.

| # | 항목 | 적용 대상 | 설명 |
|---|------|-----------|------|
| C1 | **Layout + title** | 전 페이지 | `Layout` 감싸기, `title` 설정 (예: `경주 목록 — OddsCast`) |
| C2 | **Loading** | 데이터 페칭 페이지 | 스피너/스켈레톤, 일관 문구("준비 중..." 등) |
| C3 | **Error** | 데이터 페칭 페이지 | 사용자 메시지 + "다시 시도" 버튼(refetch) |
| C4 | **Empty** | 목록/데이터 페이지 | 빈 상태 안내 문구, 필요 시 CTA |
| C5 | **DataFetchState** | 목록/상세 | 가능한 경우 `DataFetchState`로 로딩/에러/빈 통일 |
| C6 | **상단 헤더** | 전 페이지 | PageHeader 또는 CompactPageTitle (제목·설명·뒤로가기) |
| C7 | **BackLink** | 하위 페이지 | 하단 "돌아가기" (정보 하위는 생략 가능) |
| C8 | **routes.ts** | 전 페이지 | 경로 하드코딩 금지, `lib/routes.ts` 사용 |
| C9 | **폼** | 폼 있는 페이지 | react-hook-form, FormInput, getErrorMessage(mutation.error) |
| C10 | **접근성** | 전 페이지 | 스킵 링크·main 랜드마크는 Layout에서, 버튼/링크 aria-label 필요 시 |

---

## 2. 페이지 목록 (도메인별)

| 순번 | 라우트 | 파일 | 도메인 |
|------|--------|------|--------|
| 1 | `/` | `index.tsx` | 홈 |
| 2 | `/races` | `races/index.tsx` | 경주 |
| 3 | `/races/schedule` | `races/schedule.tsx` | 경주 |
| 4 | `/races/[id]` | `races/[id]/index.tsx` | 경주 |
| 5 | `/races/[id]/simulator` | `races/[id]/simulator.tsx` | 경주 |
| 6 | `/results` | `results.tsx` | 결과 |
| 7 | `/predictions/matrix` | `predictions/matrix.tsx` | 예측 |
| 8 | `/predictions/accuracy` | `predictions/accuracy.tsx` | 예측 |
| 9 | `/ranking` | `ranking.tsx` | 랭킹 |
| 10 | `/weekly-preview` | `weekly-preview.tsx` | 콘텐츠 |
| 11 | `/horses/[hrNo]` | `horses/[hrNo].tsx` | 프로필(말) |
| 12 | `/jockeys/[jkNo]` | `jockeys/[jkNo].tsx` | 프로필(기수) |
| 13 | `/trainers/[trName]` | `trainers/[trName].tsx` | 프로필(조교사) |
| 14 | `/profile` | `profile/index.tsx` | 정보(프로필) |
| 15 | `/profile/edit` | `profile/edit.tsx` | 정보(프로필) |
| 16 | `/mypage` | `mypage/index.tsx` | 마이페이지 |
| 17 | `/mypage/ticket-history` | `mypage/ticket-history.tsx` | 마이페이지 |
| 18 | `/mypage/prediction-history` | `mypage/prediction-history.tsx` | 마이페이지 |
| 19 | `/mypage/point-transactions` | `mypage/point-transactions.tsx` | 마이페이지 |
| 20 | `/mypage/subscriptions` | `mypage/subscriptions.tsx` | 마이페이지 |
| 21 | `/mypage/subscription-checkout` | `mypage/subscription-checkout.tsx` | 마이페이지 |
| 22 | `/mypage/subscription-checkout/success` | `mypage/subscription-checkout/success.tsx` | 마이페이지 |
| 23 | `/mypage/subscription-checkout/fail` | `mypage/subscription-checkout/fail.tsx` | 마이페이지 |
| 24 | `/mypage/matrix-ticket-purchase` | `mypage/matrix-ticket-purchase.tsx` | 마이페이지 |
| 25 | `/mypage/notifications` | `mypage/notifications.tsx` | 마이페이지 |
| 26 | `/mypage/picks` | `mypage/picks.tsx` | 마이페이지 (미노출) |
| 27 | `/auth/login` | `auth/login.tsx` | 인증 |
| 28 | `/auth/register` | `auth/register.tsx` | 인증 |
| 29 | `/auth/forgot-password` | `auth/forgot-password.tsx` | 인증 |
| 30 | `/auth/reset-password` | `auth/reset-password.tsx` | 인증 |
| 31 | `/settings` | `settings/index.tsx` | 설정 |
| 32 | `/settings/notifications` | `settings/notifications.tsx` | 설정 |
| 33 | `/settings/delete-account` | `settings/delete-account.tsx` | 설정 |
| 34 | `/legal/terms` | `legal/terms.tsx` | 법적 |
| 35 | `/legal/privacy` | `legal/privacy.tsx` | 법적 |
| 36 | `/legal/refund` | `legal/refund.tsx` | 법적 |
| 37 | 404 | `404.tsx` | 기타 |

---

## 3. 페이지별 상세 계획

### 3.1 홈

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **홈** | `/` | DateHeader, 퀵메뉴, 오늘/금주 경주, 최근 결과, 예상지·랭킹 프리뷰, (로그인 시) 오늘의 운세·내 예측 | C1,C6,C8,C10 | ✅ | 홈 섹션 6개 에러+재시도 반영 완료 |

---

### 3.2 경주

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **경주 목록** | `/races` | 날짜/경마장 필터, 경주 카드 목록, 페이지네이션 | C1~C8 | ✅ DataFetchState | URL 동기화·빈 메시지 확인 |
| **시행일** | `/races/schedule` | 달력형 시행일 목록 | C1,C2,C5,C6,C7,C8 | ✅ | isEmpty=false 등 로직 점검 |
| **경주 상세** | `/races/[id]` | 출전마, 결과, 예측 미리보기/전체, 예측권 사용, 경주 후 분석 | C1~C8 | ✅ 로딩/에러/재시도 | 탭/섹션 접근성 점검 |
| **시뮬레이터** | `/races/[id]/simulator` | 가중치 조절·재순위 시뮬레이션 | C1,C2,C3,C6,C7,C8,C9 | ✅ | 경주 없음/에러/예측 없음 처리, 다시 시도 |

---

### 3.3 결과

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **경주 결과** | `/results` | 1·2·3위 묶음 테이블, 날짜 필터, 페이지네이션 | C1~C8 | ✅ DataFetchState | URL 동기화·emptyMessage |

---

### 3.4 예측

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **종합 예상표** | `/predictions/matrix` | 날짜/경마장 필터, 탭(종합/코멘트), 잠금 모드, lazy load | C1~C8 | ✅ DataFetchState | 첫 방문 배너·빈 메시지 |
| **예측 정확도** | `/predictions/accuracy` | 전체/월별/경마장별 정확도 차트·테이블 | C1~C8 | ✅ DataFetchState | 빈 데이터 문구 |

---

### 3.5 랭킹·콘텐츠

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **예측 랭킹** | `/ranking` | 적중 횟수 순위, 내 랭킹(로그인 시) | C1~C8 | ✅ DataFetchState | 빈 목록 메시지 |
| **주간 프리뷰** | `/weekly-preview` | 주간 요약 콘텐츠 | C1,C2,C5,C6,C7,C8 | ✅ | 에러 시 재시도 유무 확인 |

---

### 3.6 프로필(말·기수·조교사)

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **마필 프로필** | `/horses/[hrNo]` | 통산·최근 폼·경주 이력 | C1~C8 | ✅ DataFetchState | 404(id 없음) 처리 |
| **기수 프로필** | `/jockeys/[jkNo]` | 통산·경마장별·경주 이력 | C1~C8 | ✅ DataFetchState | 동일 |
| **조교사 프로필** | `/trainers/[trName]` | 통산·경마장별·경주 이력 | C1~C8 | ✅ DataFetchState | 동일 |

---

### 3.7 정보(프로필)·마이페이지

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **내 정보** | `/profile` | 포인트·예측권·구독 요약, 메뉴(프로필 수정·예측권 이력 등) | C1,C5,C6,C8,C10 | ✅ DataFetchState | 로그인 필수·RequireLogin |
| **프로필 수정** | `/profile/edit` | 이름·닉네임, 비밀번호 변경 탭 | C1,C6,C7,C8,C9 | ✅ | 로딩 시 폼 비어있다가 채워짐 처리 |
| **마이페이지** | `/mypage` | 메뉴 리스트(내 정보, 예측권 이력, 구독 등) | C1,C6,C7,C8 | ✅ | 로그인 필수 |
| **예측권 이력** | `/mypage/ticket-history` | 사용/미사용 필터, 테이블 | C1~C8 | ✅ DataFetchState | emptyMessage |
| **내가 본 예측** | `/mypage/prediction-history` | 열람한 예측 목록, 경주 링크 | C1~C8 | ✅ DataFetchState | emptyMessage |
| **포인트 거래 내역** | `/mypage/point-transactions` | 거래 목록 테이블 | C1~C8 | ✅ DataFetchState | 빈 목록 |
| **구독 플랜** | `/mypage/subscriptions` | 플랜 목록·현재 구독·결제/취소 | C1,C2,C5,C6,C7,C8,C9 | ✅ | 로딩/에러/빈, BackLink |
| **구독 결제** | `/mypage/subscription-checkout` | 플랜 선택·PG 연동 | C1,C6,C8,C9 | ✅ | 실패/성공 라우트와 일관 |
| **구독 결제 성공** | `/mypage/subscription-checkout/success` | 성공 안내·다음 액션 | C1,C6,C7,C8 | ✅ | BackLink(정보로) |
| **구독 결제 실패** | `/mypage/subscription-checkout/fail` | 실패 안내·재시도 링크 | C1,C6,C7,C8 | ✅ | BackLink |
| **종합 예측권 구매** | `/mypage/matrix-ticket-purchase` | 매트릭스 티켓 구매 플로우 | C1,C6,C7,C8,C9 | ✅ | 로딩/에러/다시 시도, BackLink |
| **알림** | `/mypage/notifications` | 알림 목록 | C1~C8 | ✅ DataFetchState | emptyMessage |
| **내가 고른 말** | `/mypage/picks` | (서비스 제외, 미노출) | — | 미노출 | 메뉴에서 제거 유지 |

---

### 3.8 인증

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **로그인** | `/auth/login` | 이메일/비밀번호, 로그인 후 리다이렉트 | C1,C6,C8,C9 | 점검 | 에러 메시지·폼 검증 |
| **회원가입** | `/auth/register` | 이메일/비밀번호/이름, 가입 후 로그인 | C1,C6,C8,C9 | 점검 | 동일 |
| **비밀번호 찾기** | `/auth/forgot-password` | 이메일 입력·재설정 메일 발송 | C1,C6,C7,C8,C9 | 점검 | 성공/실패 안내 |
| **비밀번호 재설정** | `/auth/reset-password` | 토큰·새 비밀번호 | C1,C6,C7,C8,C9 | 점검 | 토큰 만료 안내 |

---

### 3.9 설정

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **설정** | `/settings` | 메뉴(알림 설정, 회원탈퇴 등) | C1,C6,C7,C8 | ✅ | BackLink(프로필로) |
| **알림 설정** | `/settings/notifications` | 푸시 등 채널별 토글 (네이티브에서만 노출) | C1,C6,C7,C8,C9 | ✅ | useIsNativeApp |
| **회원탈퇴** | `/settings/delete-account` | 확인 절차·탈퇴 API | C1,C6,C7,C8,C9 | ✅ | 동의 체크박스 후 제출 가능 |

---

### 3.10 법적

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **이용약관** | `/legal/terms` | 정적 약관 본문 | C1,C6,C8 | ✅ | BackLink(정보로) |
| **개인정보처리방침** | `/legal/privacy` | 정적 방침 본문 | C1,C6,C8 | ✅ | BackLink(정보로) |
| **환불정책** | `/legal/refund` | 정적 환불 정책 | C1,C6,C8 | ✅ | BackLink(정보로) |

---

### 3.11 기타

| 페이지 | 라우트 | 목적 | C1~C10 체크 | 현황 | 비고/계획 |
|--------|--------|------|-------------|------|-----------|
| **404** | (Not Found) | 친절한 메시지, 홈/경주 목록 링크 | C1,C8 | ✅ | 링크 2개 반영 완료 |

---

## 4. 실행 순서 (순서대로 진행)

아래 순서대로 페이지를 점검·보완하면 됩니다. 한 번에 한 도메인씩 진행해도 됩니다.

### Phase A — 핵심 플로우 (1~10)

| 순서 | 페이지 | 라우트 | 작업 요약 |
|------|--------|--------|-----------|
| 1 | 홈 | `/` | C1,C6,C8,C10 최종 확인, 섹션 에러/재시도 확인 |
| 2 | 경주 목록 | `/races` | C2~C5,C7, URL 동기화, emptyMessage |
| 3 | 시행일 | `/races/schedule` | C2,C5,C7, 빈 데이터 처리 |
| 4 | 경주 상세 | `/races/[id]` | C2~C7, 에러 재시도·BackLink 확인 |
| 5 | 시뮬레이터 | `/races/[id]/simulator` | C2,C3,C6,C7, 경주 없음/에러 처리 |
| 6 | 경주 결과 | `/results` | C2~C7, URL·emptyMessage |
| 7 | 종합 예상표 | `/predictions/matrix` | C2~C7, 빈 메시지·필터 상태 |
| 8 | 예측 정확도 | `/predictions/accuracy` | C2~C7, 빈 데이터 문구 |
| 9 | 예측 랭킹 | `/ranking` | C2~C7, 빈 목록 |
| 10 | 주간 프리뷰 | `/weekly-preview` | C2,C5,C7, 에러 재시도 |

### Phase B — 프로필·마필/기수/조교사 (11~13)

| 순서 | 페이지 | 라우트 | 작업 요약 |
|------|--------|--------|-----------|
| 11 | 마필 프로필 | `/horses/[hrNo]` | C2~C7, 잘못된 hrNo 시 안내 |
| 12 | 기수 프로필 | `/jockeys/[jkNo]` | 동일 |
| 13 | 조교사 프로필 | `/trainers/[trName]` | 동일 |

### Phase C — 정보·마이페이지 (14~26)

| 순서 | 페이지 | 라우트 | 작업 요약 |
|------|--------|--------|-----------|
| 14 | 내 정보 | `/profile` | C5,C6, RequireLogin·DataFetchState |
| 15 | 프로필 수정 | `/profile/edit` | C6,C7,C9, 로딩 시 폼 채우기 |
| 16 | 마이페이지 | `/mypage` | C6,C7, 메뉴 링크 |
| 17 | 예측권 이력 | `/mypage/ticket-history` | C2~C7, emptyMessage |
| 18 | 내가 본 예측 | `/mypage/prediction-history` | C2~C7 |
| 19 | 포인트 거래 내역 | `/mypage/point-transactions` | C2~C7 |
| 20 | 구독 플랜 | `/mypage/subscriptions` | C2,C5,C7,C9 |
| 21 | 구독 결제 | `/mypage/subscription-checkout` | C2,C6,C9 |
| 22 | 구독 성공/실패 | success, fail | C1,C6,C7 |
| 23 | 종합 예측권 구매 | `/mypage/matrix-ticket-purchase` | C2,C6,C7,C9 |
| 24 | 알림 | `/mypage/notifications` | C2~C7, emptyMessage |
| 25 | (picks 미노출) | `/mypage/picks` | 메뉴 미노출 유지만 확인 |

### Phase D — 인증 (27~30)

| 순서 | 페이지 | 라우트 | 작업 요약 |
|------|--------|--------|-----------|
| 26 | 로그인 | `/auth/login` | C1,C6,C8,C9, 에러 메시지 |
| 27 | 회원가입 | `/auth/register` | C1,C6,C8,C9 |
| 28 | 비밀번호 찾기 | `/auth/forgot-password` | C1,C6,C7,C9 |
| 29 | 비밀번호 재설정 | `/auth/reset-password` | C1,C6,C7,C9 |

### Phase E — 설정·법적·기타 (31~37)

| 순서 | 페이지 | 라우트 | 작업 요약 |
|------|--------|--------|-----------|
| 30 | 설정 | `/settings` | C1,C6,C7 |
| 31 | 알림 설정 | `/settings/notifications` | C1,C6,C7,C9, 네이티브 분기 |
| 32 | 회원탈퇴 | `/settings/delete-account` | C1,C6,C7,C9, 확인 UI |
| 33 | 이용약관 | `/legal/terms` | C1,C6,C7 |
| 34 | 개인정보처리방침 | `/legal/privacy` | C1,C6,C7 |
| 35 | 환불정책 | `/legal/refund` | C1,C6,C7 |
| 36 | 404 | 404 | C1,C8 최종 확인 |

---

## 5. 문서 참조

| 문서 | 용도 |
|------|------|
| [WEBAPP_COMPLETENESS.md](WEBAPP_COMPLETENESS.md) | 완성도 기준·현황 요약 |
| [UI_PATTERNS.md](UI_PATTERNS.md) | 테이블, 탭바, 페이지네이션, 스타일 |
| [RACE_DETAIL_UI_SPEC.md](RACE_DETAIL_UI_SPEC.md) | 경주 상세 UI |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | 접근성 체크리스트 |
| [SERVICE_SPECIFICATION.md](../SERVICE_SPECIFICATION.md) | 기능 정의 |
| [FEATURE_ROADMAP.md](../FEATURE_ROADMAP.md) | 기능 로드맵 |

---

_이 문서는 페이지 추가·라우트 변경 시 함께 갱신합니다._
