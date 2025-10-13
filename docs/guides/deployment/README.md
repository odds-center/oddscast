# 🚀 배포 가이드

Golden Race 프로젝트의 프로덕션 배포를 위한 종합 가이드입니다.

---

## 📚 문서 목록

### 🏗️ 인프라 선택

| 문서                                                | 설명                       | 난이도 | 추천도     |
| --------------------------------------------------- | -------------------------- | ------ | ---------- |
| [Railway 상세 가이드](RAILWAY_DETAILED_GUIDE.md) ⭐ | Railway 완벽 설정 (필수!)  | ⭐     | ⭐⭐⭐⭐⭐ |
| [Railway vs EC2](RAILWAY_VS_EC2.md)                 | Railway와 EC2 실전 비교    | ⭐⭐   | ⭐⭐⭐⭐⭐ |
| [Cloudflare 가이드](CLOUDFLARE_GUIDE.md)            | Cloudflare 설정 및 활용법  | ⭐⭐   | ⭐⭐⭐⭐⭐ |
| [인프라 비교](INFRASTRUCTURE_COMPARISON.md)         | 모든 인프라 옵션 상세 비교 | ⭐⭐⭐ | ⭐⭐⭐⭐   |

### 📱 모바일 앱 배포

| 문서                     | 설명                       | 대상          |
| ------------------------ | -------------------------- | ------------- |
| [모바일 배포](mobile.md) | iOS/Android 앱 스토어 배포 | 모바일 개발자 |

### 🖥️ 서버 배포

| 문서                                      | 설명                     | 대상          |
| ----------------------------------------- | ------------------------ | ------------- |
| [자체 호스팅 서버](SELF_HOSTED_SERVER.md) | EC2/VPS 직접 배포 가이드 | 백엔드 개발자 |

---

## 🎯 빠른 선택 가이드

### "어떤 인프라를 선택해야 하나요?"

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 초기 스타트업 (0~1,000명) - 지금!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥇 Railway.app
├─ 비용: ₩54,160/월
├─ 난이도: ⭐ (매우 쉬움)
├─ 관리: 거의 없음
└─ 추천도: ⭐⭐⭐⭐⭐

→ [Railway vs EC2 비교 보기](RAILWAY_VS_EC2.md)
→ [인프라 비교 보기](INFRASTRUCTURE_COMPARISON.md)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 성장기 (1,000~5,000명) - 6개월 후
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥈 Railway (스케일 업)
또는
AWS ECS Fargate
├─ 비용: ₩100,000~₩150,000/월
├─ 난이도: ⭐⭐ (중간)
└─ 관리: 적음

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 확장기 (5,000명+) - 1년 후
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥉 AWS EC2 + RDS
또는
Kubernetes (EKS)
├─ 비용: ₩250,000+/월
├─ 난이도: ⭐⭐⭐⭐ (어려움)
├─ 관리: 많음
└─ DevOps 팀 필요

→ [자체 호스팅 가이드 보기](SELF_HOSTED_SERVER.md)
```

---

## 🌟 추천 구성

### 최적의 조합: Railway + Cloudflare

```
┌─────────────────────────────────────────┐
│  사용자 (모바일 앱)                      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Cloudflare (무료) ⭐                    │
│  ├─ DNS                                  │
│  ├─ DDoS 보호                            │
│  ├─ CDN                                  │
│  └─ SSL                                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Railway.app (₩54,160/월) ⭐            │
│  ├─ NestJS API                          │
│  ├─ MySQL                               │
│  └─ Redis                               │
└─────────────────────────────────────────┘

총 비용: ₩54,160/월
관리 시간: 주 10분
난이도: ⭐ (매우 쉬움)
추천도: ⭐⭐⭐⭐⭐
```

→ [Cloudflare 설정 가이드](CLOUDFLARE_GUIDE.md)

---

## 📖 학습 경로

### 초급: 인프라 이해하기

1. ✅ [Railway 상세 가이드](RAILWAY_DETAILED_GUIDE.md) 읽기 (20분) ⭐ 신규

   - Railway 완벽 설정 방법
   - Redis, MySQL 추가
   - CI/CD 자동화
   - Nginx 불필요 이유

2. ✅ [Railway vs EC2](RAILWAY_VS_EC2.md) 읽기 (10분)

   - 실전 비교
   - 실제 작업 시간 비교
   - ROI 계산

3. ✅ [Cloudflare 가이드](CLOUDFLARE_GUIDE.md) 읽기 (10분)

   - Cloudflare 역할 이해
   - 필수 기능 파악
   - 설정 방법 학습

4. ✅ [인프라 비교](INFRASTRUCTURE_COMPARISON.md) 읽기 (15분)
   - 모든 옵션 개요 파악
   - 비용 구조 이해
   - 자신에게 맞는 선택 찾기

### 중급: 실제 배포하기

1. 🚀 Railway 배포 (30분)

   ```bash
   # Railway CLI 설치
   npm install -g @railway/cli

   # 로그인
   railway login

   # 프로젝트 생성
   railway init

   # 배포
   git push
   ```

2. 🌐 Cloudflare 설정 (30분)

   - 계정 생성
   - 도메인 추가
   - DNS 설정
   - SSL 설정

3. 📱 모바일 앱 배포 (2시간)
   - [모바일 배포 가이드](mobile.md) 참고
   - iOS/Android 빌드
   - 앱 스토어 제출

### 고급: 최적화 및 확장

1. ⚡ 성능 최적화

   - Cloudflare Workers 활용
   - 캐싱 전략 수립
   - CDN 최적화

2. 🔒 보안 강화

   - WAF 규칙 설정
   - Rate Limiting 구현
   - 모니터링 설정

3. 📈 스케일링
   - 리소스 모니터링
   - 자동 스케일링 설정
   - 데이터베이스 최적화

---

## 💰 비용 가이드

### 초기 (0~1,000명)

```
Railway: ₩54,160/월
Cloudflare: ₩0/월 (무료)
━━━━━━━━━━━━━━━━━━━
총: ₩54,160/월

월 수익 (500명 × ₩1,940): ₩970,000
순이익: ₩915,840
마진율: 94.4%
```

### 성장기 (1,000~5,000명)

```
Railway Team: ₩100,000/월
또는
AWS ECS: ₩150,000/월

Cloudflare Pro: ₩27,000/월 (선택)
━━━━━━━━━━━━━━━━━━━
총: ₩100,000~₩177,000/월

월 수익 (2,500명 × ₩1,940): ₩4,850,000
순이익: ₩4,673,000+
마진율: 96%+
```

---

## 🛠️ 실행 체크리스트

### Phase 1: 인프라 설정 (1일)

```
□ Railway 계정 생성
□ 프로젝트 생성
□ MySQL/Redis 추가
□ 환경변수 설정
□ 첫 배포 완료
□ Cloudflare 계정 생성
□ 도메인 연결
□ DNS 설정
□ SSL 설정
```

### Phase 2: 앱 배포 (3일)

```
□ iOS 앱 빌드
□ Android 앱 빌드
□ App Store 제출
□ Play Store 제출
□ 베타 테스트
```

### Phase 3: 모니터링 (1일)

```
□ Railway 대시보드 확인
□ Cloudflare Analytics 설정
□ 에러 추적 설정
□ 알림 설정
□ 백업 자동화
```

---

## 🔧 문제 해결

### "Railway가 너무 비싸요"

```
→ 초기에는 Railway가 가장 저렴합니다!
  (인건비 포함 시 EC2보다 39배 저렴)

→ [Railway vs EC2 비교](RAILWAY_VS_EC2.md) 참고
```

### "EC2가 더 좋지 않나요?"

```
→ 대규모 (5,000명+)에서만 EC2가 유리합니다

→ [인프라 비교](INFRASTRUCTURE_COMPARISON.md) 참고
```

### "Cloudflare는 꼭 필요한가요?"

```
→ 네! DDoS 보호, SSL, CDN이 모두 무료입니다

→ [Cloudflare 가이드](CLOUDFLARE_GUIDE.md) 참고
```

---

## 📞 지원

### Railway 관련

- Discord: https://discord.gg/railway
- 이메일: team@railway.app
- 문서: https://docs.railway.app

### Cloudflare 관련

- Discord: https://discord.cloudflare.com
- Community: https://community.cloudflare.com
- 문서: https://developers.cloudflare.com

### AWS 관련

- Support (유료)
- 문서: https://docs.aws.amazon.com

---

## 🎓 추가 리소스

### 공식 문서

- [Railway 문서](https://docs.railway.app)
- [Cloudflare 문서](https://developers.cloudflare.com)
- [AWS 문서](https://docs.aws.amazon.com)
- [Expo EAS 문서](https://docs.expo.dev/eas/)

### 커뮤니티

- Railway Discord
- Cloudflare Discord
- AWS Community
- Stack Overflow

---

<div align="center">

**🚀 배포를 시작하세요!**

Railway + Cloudflare로  
30분 만에 프로덕션 준비 완료

**Golden Race Team** 🏇

**마지막 업데이트**: 2025년 10월 12일

</div>
