# 서비스 검증용 최소 비용 비교 (MVP)

> **목적:** 최소 비용으로 Nest(API) + Next(webapp) + PostgreSQL을 올려 서비스 검증하기.

**기준:** Nest + Python 스크립트 + Cron 동작 가능, 상시 구동(또는 무료 한도 내).

---

## 요약표

| 플랫폼 | 월 예상 비용 | 비고 |
|--------|--------------|------|
| **Railway (Hobby)** | **$5~10** | 구독 $5에 사용량 포함, 소규모면 $5로 가능 |
| **Railway (Free)** | **$0** | $1 크레딧만, 실험용·몇 일 수준 |
| **Render (Free)** | **$0** | 30일 한도, Web/DB 무료·서비스 15분 후 슬립 |
| **Render (Paid 최소)** | **$13** | Web Starter $7 + Postgres Basic $6 |
| **AWS (EC2+RDS)** | **$26~41** | MVP 기준, 설정·운영 부담 큼 |

---

## 1. Railway

- **Free:** $0/월. **$1 사용 크레딧**만 제공 → Nest + Postgres 소량이면 며칠 수준.
- **Hobby:** **$5/월**. 구독료 $5가 사용량에 포함(사용 $3이면 $5만 청구, $8 쓰면 $8 청구).
- **리소스 단가:** RAM $10/GB·월, CPU $20/vCPU·월, 스토리지 $0.15/GB·월, 이그레스 $0.05/GB.
- **PostgreSQL:** 별도 플랜 없음. 서비스처럼 CPU/RAM/스토리지만 과금. idle 소규모 DB는 약 **$0.4/월** 수준.

**서비스 검증용 추천:**  
- 짧은 실험 → Free ($1 크레딧).  
- 1~2달 검증 → **Hobby $5**로 Nest + Postgres 한 프로젝트에 올리면 대부분 $5 내로 가능.

- [Pricing](https://docs.railway.com/pricing)
- [Free Trial](https://docs.railway.com/pricing/free-trial) — 가입 시 $5 크레딧 제공(기간 한도 있음).

---

## 2. Render

- **Free (Web Service):** $0. 512MB RAM, 0.1 CPU. **15분 무활동 시 슬립**, 재요청 시 복구(지연 있을 수 있음). 월 750 인스턴스 시간.
- **Free (Postgres):** $0. **1GB, 생성 후 30일** 유효. 이후 14일 내 유료 전환 또는 삭제.
- **Paid 최소:**  
  - Web Service **Starter** $7/월 (512MB, 0.5 CPU, 상시 구동)  
  - Postgres **Basic-256mb** $6/월  
  → **합계 약 $13/월** (상시 구동 + DB 30일 제한 없음).

**서비스 검증용:**  
- **$0으로 30일** 검증 가능(Free Web + Free Postgres). 단, 슬립/재기동 감수.  
- 상시 구동이 필요하면 **$13/월**부터.

- [Pricing](https://render.com/pricing)
- [Deploy for Free](https://docs.render.com/free)

---

## 3. AWS (EC2 + RDS)

- **MVP 구성:** EC2 t3.small + RDS db.t3.micro(Free Tier 가능) + 네트워크/기타.
- **월 예상:** **약 $26~41** (Free Tier 적용 시 ~$26, 미적용 시 ~$41).
- **특징:** Nginx, PM2, 방화벽, SSL 등 직접 설정·운영 필요. 서비스 검증만 목적이면 부담 큼.

자세한 수치는 `SERVER_DEPLOYMENT_PLAN.md` §3.4 참고.

---

## 4. Vercel (참고)

- **Webapp(Next):** 무료 티어로 배포 가능.
- **Nest(API):** 서버리스로 올릴 수 있으나, 이 프로젝트는 **Python 스폰·Cron** 사용 → Vercel만으로는 검증 목적에 부적합. API는 Railway/Render 등에 두는 구성 권장.

---

## 5. 서비스 검증 단계별 추천

| 목적 | 추천 | 예상 비용 |
|------|------|-----------|
| 1~2주 실험, DB 필요 | Railway Free ($1 크레딧) 또는 Render Free | $0 |
| 1~2달 검증, 상시 구동 | **Railway Hobby** | **$5/월** |
| 1~2달 검증, $0 선호·슬립 허용 | Render Free (Web + Postgres 30일) | $0 |
| 상시 구동 + DB 무제한 (Render) | Render Starter + Postgres Basic | $13/월 |
| 본격 MVP·운영까지 고려 | AWS EC2+RDS 또는 Railway Pro | $26~41 또는 $20+ |

**정리:**  
- **최소 비용으로 검증**하려면 **Railway Hobby $5** 또는 **Render Free($0, 30일·슬립 감수)** 가 적합.  
- AWS는 비용·설정 모두 무거우므로, 검증이 끝난 뒤 규모 올릴 때 검토하는 편이 좋음.

---

*문서 기준: 2025년 2월. 각 플랫폼 요금제는 변경될 수 있으니 공식 페이지에서 최종 확인할 것.*
