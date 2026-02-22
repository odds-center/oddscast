# 📊 OddsCast 월간 유지비 명세

> 서비스 운영에 필요한 한 달 유지비(cost)를 항목별로 정리합니다.  
> 예산 산정 및 비용 관리 시 이 문서를 기준으로 합니다.

---

## 1. 요약 (Summary)

### 시나리오별 월 예상 비용 (2025년 기준)

> **Railway 통합 구성**: Server(NestJS), WebApp(Next.js), Admin(Next.js), DB(PostgreSQL) 모두 Railway에서 운영. Prisma ORM으로 DB 연결.

| 시나리오 | 월 비용 (KRW) | 비고 |
|---------|---------------|------|
| **MVP/런칭 초기** | **~1~2만원** | Gemini Free, Railway Hobby (Server + WebApp + Admin + PostgreSQL) |
| **소규모 운영** | **3~5만원** | AI 유료 전환 시, Railway 사용량 기반 |
| **중규모 운영** (안정화) | **10~20만원** | Railway Pro, 결제 수수료 포함 |
| **대규모 운영** (확장) | **50만원+** | DB·서버 스케일업, 모니터링 등 |

### 개발 vs 프로덕션 구분

| 구분 | WebApp/Admin | Server | DB | 비고 |
|------|--------------|--------|-----|------|
| **개발 (Dev)** | **Vercel** 무료 | Railway 등 (과금) | Railway PostgreSQL 등 (과금) | 웹 중심 테스트용. 서버·DB는 과금 발생 |
| **프로덕션 (Prod)** | Railway | Railway | Railway | 통합 배포. **도메인 별도 구매** 필요 |

- **Dev**: WebApp·Admin을 Vercel에 올려 무료로 테스트. NestJS 서버는 Railway 등에서 운영 → 비용 발생
- **Prod**: 모든 서비스를 Railway로 통합 후, 도메인 연결

---

## 2. 항목별 상세 비용

### 2.1 AI (Gemini API)

> 상세: [`specs/COST_ANALYSIS.md`](specs/COST_ANALYSIS.md) 참조

| 구분 | 내용 | 월 비용 |
|------|------|---------|
| **Free Tier** | 하루 1,500 RPD, 분당 15 RPM | **0원** |
| **유료 구간** | 입력 $0.075/100만 토큰, 출력 $0.30/100만 토큰 | ~$0.0003/요청 |
| **예측 시나리오** | 월 200경기 × 3회 = 600회 분석 | **0원** (Free 내) |
| **채팅 추가 시** | 월 10,000건 질문 가정 | **~3,500원** |

- **핵심**: Server-Side Caching 사용 시 사용자 수와 무관하게 API 호출 고정
- **모델**: Gemini 1.5 Flash 권장 (가성비)

---

### 2.2 데이터베이스 (PostgreSQL + Prisma)

> Prisma ORM으로 PostgreSQL 연결. DB 호스팅은 **Railway PostgreSQL** add-on 사용 (Railway에서 통합 관리).

| 구분 | 월 비용 | 비고 |
|------|---------|------|
| **Railway PostgreSQL** | 사용량 기반 | CPU·메모리·스토리지·egress 종량제 |
| **idle 기준** | 약 **$0.40** (~500원) | 거의 유휴 시 최소 비용 |
| **일반 사용** | **$2~5** (~2.5~6.5천원) | 소규모 트래픽 기준 |
| **Prisma** | **$0** | ORM 라이브러리, 추가 비용 없음 |

- **연결**: `DATABASE_URL` (PostgreSQL connection string)로 Prisma 설정
- **과금**: Railway 서비스와 동일하게 프로젝트 총 사용량에 합산

---

### 2.3 Railway 호스팅 (통합)

> **Server, WebApp, Admin, PostgreSQL** 모두 Railway 한 플랫폼에서 운영.

| 서비스 | 설명 | 월 비용 |
|--------|------|---------|
| **NestJS Server** | API 서버 (port 3001) | Hobby $5 크레딧 내 |
| **Next.js WebApp** | 메인 클라이언트 (port 3000) | 동일 프로젝트 |
| **Next.js Admin** | 관리자 패널 (port 3002) | 동일 프로젝트 |
| **PostgreSQL** | DB (Prisma 연결) | add-on, 사용량 기반 |

| Railway 플랜 | 월 비용 | 포함 크레딧 |
|-------------|---------|-------------|
| **Hobby** | **$5** (~6,500원) | $5 크레딧, 초과분 별도 |
| **Pro** | **$20** (~2.6만원) | $20 크레딧 포함 |

- **권장**: Hobby로 Server + WebApp + Admin + PostgreSQL 통합 배포
- **과금**: 프로젝트 내 모든 서비스 합산 사용량 기준

---

### 2.4 결제 수수료 (토스페이먼츠 등)

| 구분 | 수수료 | 비고 |
|------|--------|------|
| **신용/체크카드** | 약 2.5~3.5% | PG사·카드사에 따라 상이 |
| **간편결제** | 약 3.0~3.5% | 카카오페이, 토스 등 |
| **정기결제** | 약 2.5~3.5% | 구독 결제 시 |

- **참고**: 매출 발생 시에만 과금, 고정 비용 아님
- **예시**: 월 구독 1만원 × 100명 = 100만원 매출 → 수수료 약 2.5~3.5만원

---

### 2.5 기타

| 항목 | 월 비용 | 비고 |
|------|---------|------|
| **도메인** | ~1,000~2,000원 | .com 연 1~2만원 ÷ 12 |
| **SSL** | $0 | Railway에서 무료 제공 |
| **앱 스토어** | $0 (고정) | Apple $99/년, Google $25 1회성 |
| **이메일 (선택)** | $0~$5 | 트랜잭션 이메일용 (Resend 등) |
| **모니터링 (선택)** | $0~$10 | Sentry, LogRocket 등 |

---

## 3. 시나리오별 조합 예시 (Railway 통합)

### 3.1 MVP / 런칭 초기 (월 ~1~2만원)

| 항목 | 선택 | 월 비용 |
|------|------|---------|
| AI (Gemini) | Free Tier | 0원 |
| Railway | Hobby (Server + WebApp + Admin + PostgreSQL) | ~1~2만원 |
| **합계** | | **~1~2만원** |

- Railway Hobby $5 + PostgreSQL add-on 사용량 (idle 시 ~$0.4)
- Server-Side Caching으로 Gemini Free tier 내 운영

### 3.2 소규모 운영 (월 3~5만원)

| 항목 | 선택 | 월 비용 |
|------|------|---------|
| AI (Gemini) | Free ~ 유료 전환 | 0~3,500원 |
| Railway | Hobby ~ Pro (4개 서비스 통합) | ~2.5~4만원 |
| **합계** | | **~3~5만원** |

### 3.3 안정화 운영 (월 10~20만원)

| 항목 | 선택 | 월 비용 |
|------|------|---------|
| AI (Gemini) | 유료 | ~1만원 |
| Railway | Pro ($20) + 사용량 초과분 | ~8~15만원 |
| 기타 | 도메인, 모니터링 | ~1~2만원 |
| **합계** | | **~10~20만원** |

---

## 4. 비용 절감 원칙

1. **Server-Side Caching**: Gemini는 스케줄러로만 호출 → 사용자 수와 무관
2. **무료 티어 우선**: MVP는 Free Tier로 검증 후 유료 전환
3. **Railway 통합**: Server, WebApp, Admin, PostgreSQL 한 플랫폼에서 관리
4. **사용량 알림 설정**: 각 서비스에서 예산 알림(budget alert) 설정 권장

---

## 5. 비용 추적·모니터링

| 서비스 | 추적 방법 |
|--------|----------|
| **Gemini** | [Google AI Studio](https://aistudio.google.com/) → Usage |
| **Railway** | Project → Usage (Server, WebApp, Admin, PostgreSQL 합산) |
| **전체** | 스프레드시트 또는 노션에 월별 정리 |

---

## 6. 참조 문서

| 문서 | 내용 |
|------|------|
| [`specs/COST_ANALYSIS.md`](specs/COST_ANALYSIS.md) | Gemini API 상세, 캐싱 전략 |
| [`SERVICE_SPECIFICATION.md`](SERVICE_SPECIFICATION.md) | 서비스 개요, 수익 모델 |
| [`architecture/BUSINESS_LOGIC.md`](architecture/BUSINESS_LOGIC.md) | 예측권, 구독, 결제 비즈니스 로직 |

---

**마지막 업데이트**: 2026-02-13
