# WebApp 완성도 체크리스트

> 프론트엔드 webapp을 배포 전에 완성도 있게 맞추기 위한 기준과 현황.

---

## 1. 완성도 기준

### 1.1 데이터 페칭 페이지 (목록/상세)

| 항목 | 설명 |
|------|------|
| **Loading** | 로딩 중일 때 스피너 또는 스켈레톤, 일관된 문구(예: "준비 중...") |
| **Error** | API 실패 시 사용자용 메시지 + **다시 시도** 버튼(refetch) |
| **Empty** | 데이터 없을 때 안내 문구 + 필요 시 CTA(예: "경주 목록 보기") |

### 1.2 공통 구조 (UI_PATTERNS 기준)

| 항목 | 설명 |
|------|------|
| **Layout** | 모든 페이지 `Layout`으로 감싸기, `title` 설정 |
| **PageHeader / CompactPageTitle** | 상단 제목·설명·뒤로가기 일관 사용 |
| **BackLink** | 하위 페이지 하단 "돌아가기" 링크 (정보 하위는 생략 가능) |
| **DataFetchState** | 목록/데이터 페이지는 가능한 한 `DataFetchState`로 로딩/에러/빈 상태 통일 |

### 1.3 접근성 (ACCESSIBILITY.md)

| 항목 | 설명 |
|------|------|
| Skip link | 포커스 시 "본문으로" 링크 |
| Landmarks | `main`(id="main-content"), nav `aria-label` |
| 고대비/글자 크기 | 설정에서 토글 가능 |

### 1.4 라우트·네비게이션

| 항목 | 설명 |
|------|------|
| **routes.ts** | 하드코딩 없이 `lib/routes.ts` 사용 |
| **404** | 친절한 메시지 + 홈/경주 목록 등 복귀 링크 |

### 1.5 폼·에러 메시지

| 항목 | 설명 |
|------|------|
| **react-hook-form** | 모든 폼 `useForm` + `FormInput` |
| **에러 표시** | `getErrorMessage(mutation.error)` 또는 `formState.errors` |

---

## 2. 현재 현황 요약

| 구분 | 상태 | 비고 |
|------|------|------|
| **목록/상세 DataFetchState** | ✅ 대부분 적용 | results, races, ranking, matrix, mypage 목록, horses/jockeys/trainers 상세 |
| **경주 상세** | ✅ 적용됨 | 로딩/에러 + "다시 시도" 버튼 |
| **홈 섹션** | ✅ 적용됨 | 로딩/빈 상태, 에러 시 안내 + refetch |
| **404** | ✅ 적용됨 | 친절한 메시지 + 홈/경주 목록 복귀 링크 |
| **Layout/BackLink** | ✅ 적용 | 페이지별 일관 사용 |
| **접근성** | ✅ 스킵/랜드마크/고대비/글자크기 | ACCESSIBILITY.md 참고 |

---

## 3. 적용한 개선 (이번 정리에서 반영)

- 홈 섹션 6개: API 실패 시 에러 메시지 + "다시 시도" 버튼
- 경주 상세: 에러 시 "다시 시도" 버튼 추가
- 404: "경주 목록" 링크 추가
- 시뮬레이터: 경주 없음/API 에러/예측 없음 처리, 다시 시도
- 구독·결제: 성공/실패 BackLink, 구독 플랜·매트릭스 구매 에러·다시 시도
- 설정·법적: BackLink(정보로), 회원탈퇴 동의 체크박스
- 인증: 로그인/회원가입/비밀번호 찾기·재설정 — 에러 메시지·폼 검증·성공 안내·토큰 없음 안내 확인 완료

---

## 4. 참고 문서

- [WEBAPP_PAGES_PLAN.md](WEBAPP_PAGES_PLAN.md) — 전체 페이지 계획표 (페이지별 체크·실행 순서)
- [UI_PATTERNS.md](UI_PATTERNS.md) — 테이블, 탭바, 페이지네이션, 스타일
- [RACE_DETAIL_UI_SPEC.md](RACE_DETAIL_UI_SPEC.md) — 경주 상세 UI
- [ACCESSIBILITY.md](ACCESSIBILITY.md) — 접근성 체크리스트
- [SERVICE_SPECIFICATION.md](../SERVICE_SPECIFICATION.md) — 기능 정의
