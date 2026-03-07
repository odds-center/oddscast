# Next Actions — OddsCast

> Last updated: 2026-03-08
> 현재 모든 서버/웹앱/어드민 빌드 정상. Railway 배포 완료.

---

## 즉시 실행 가능 (코드)

| 우선순위 | 항목 | 내용 |
|----------|------|------|
| 1 | **E2E 테스트 정리** | 제거된 `/ranking`, `/races/schedule` 페이지 테스트 삭제. `detail-pages.spec.ts` ranking describe 블록 + `api-mocks.ts` mockRankings 정리 |
| 2 | **홈 퀵메뉴 UX** | schedule·ranking 제거 후 남은 5개 링크 레이아웃 재정비. 현재 overflow-x-auto 스크롤 방식 — 필요 시 그리드로 변경 |
| 3 | **주간 프리뷰 페이지 점검** | `/weekly-preview` 실제 데이터 연동 확인, 모바일 레이아웃 점검 |
| 4 | **예측 정확도 페이지 UX** | `/predictions/accuracy` — 데이터 없을 때 empty state, 숫자 포맷 통일 |

---

## 인프라 (환경변수/설정 필요)

| 항목 | 상태 | 필요한 것 |
|------|------|-----------|
| CD 자동 배포 | 준비됨 | GitHub Secrets에 `RAILWAY_TOKEN` 추가 |
| Sentry 에러 모니터링 | 준비됨 | Railway env에 `SENTRY_DSN` 추가 |
| Vercel 웹앱 배포 | 미진행 | Vercel 프로젝트 연결 + `NEXT_PUBLIC_API_URL` 설정 |

---

## 중기 기능 (선택)

| 항목 | 내용 |
|------|------|
| 커뮤니티 예측 | 사용자 예측 제출 + 간단한 리더보드 |
| 고급 분석 대시보드 | 말/기수/조교사 통계 차트 |
| AI 경주 해설 | Gemini로 경주 결과 텍스트 해설 생성 |

---

## 작업 순서 (지금 바로)

1. E2E 테스트에서 ranking/schedule 참조 제거
2. 홈 퀵메뉴 레이아웃 정리
3. 주간 프리뷰 페이지 모바일 개선
