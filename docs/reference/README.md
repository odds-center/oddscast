# 📚 한국 경마 레퍼런스

Golden Race 개발을 위한 한국 경마 완벽 레퍼런스 가이드입니다.

---

## 📖 레퍼런스 문서 목록

### 🏢 시스템 및 조직

| 문서                                     | 설명                   | 중요도     |
| ---------------------------------------- | ---------------------- | ---------- |
| [KRA 시스템 가이드](KRA_SYSTEM_GUIDE.md) | 한국마사회 전체 시스템 | ⭐⭐⭐⭐⭐ |

**주요 내용:**

- 한국마사회 소개 및 역할
- 경마장 상세 정보 (서울/부산/제주)
- 경주마 등급 시스템
- 상금 체계
- 경주 일정

---

### 🎫 베팅 시스템

| 문서                                                  | 설명              | 중요도     |
| ----------------------------------------------------- | ----------------- | ---------- |
| [베팅 시스템 완벽 가이드](BETTING_SYSTEM_DETAILED.md) | 모든 승식 및 전략 | ⭐⭐⭐⭐⭐ |

**주요 내용:**

- 7가지 베팅 승식 상세
- 베팅 전략 (안정/균형/공격)
- 배당률 분석
- 실전 팁

---

### 📖 용어 사전

| 문서                                            | 설명                | 중요도   |
| ----------------------------------------------- | ------------------- | -------- |
| [경마 용어 가이드](HORSE_RACING_TERMINOLOGY.md) | 기초 용어 완벽 정리 | ⭐⭐⭐⭐ |

**주요 내용:**

- 승률/승식 관련 용어
- 각질 (경주 스타일) 용어
- 말의 종류
- 레이팅 및 부담중량
- 경주 종류

---

## 🎯 사용 가이드

### 역할별 필독 문서

#### 백엔드 개발자

```
필수:
1. KRA 시스템 가이드
   → API 연동을 위한 기본 이해
   → 경주마 등급, 상금 체계 구현

2. 베팅 시스템 가이드
   → 베팅 로직 구현
   → 배당 계산 알고리즘

3. 경마 용어 가이드
   → API 응답 필드명 이해
   → 데이터베이스 스키마 설계
```

#### 프론트엔드 개발자

```
필수:
1. 경마 용어 가이드
   → UI 텍스트 작성
   → 사용자 이해를 돕는 설명

2. 베팅 시스템 가이드
   → 베팅 화면 설계
   → 사용자 경험 최적화

3. KRA 시스템 가이드
   → 경마장 정보 표시
   → 경주 일정 UI
```

#### 기획자/PM

```
필수:
1. 모든 문서 정독
   → 전체 시스템 이해
   → 기능 기획
   → 사용자 시나리오 작성
```

---

## 🚀 빠른 참조

### 경마장 코드

```typescript
const RACE_PARKS = {
  SEOUL: '1',
  BUSAN: '2',
  JEJU: '3',
};
```

### 베팅 승식 코드

```typescript
const BET_TYPES = {
  WIN: '단승식',
  PLACE: '연승식',
  SHOW: '복승식',
  EXACTA: '쌍승식',
  QUINELLA: '복연승식',
  TRIFECTA_BOX: '삼복승식',
  TRIFECTA: '삼쌍승식',
};
```

### 경주마 등급

```typescript
const HORSE_GRADES = {
  GRADE_1: { min: 95, max: 140, name: '1등급' },
  GRADE_2: { min: 85, max: 94, name: '2등급' },
  GRADE_3: { min: 75, max: 84, name: '3등급' },
  GRADE_4: { min: 65, max: 74, name: '4등급' },
  GRADE_5: { min: 55, max: 64, name: '5등급' },
  GRADE_6: { min: 0, max: 54, name: '6등급' },
};
```

---

## 📊 데이터베이스 스키마 참고

### 경주 테이블

```sql
CREATE TABLE races (
  race_id VARCHAR(50) PRIMARY KEY,
  meet CHAR(1) NOT NULL,           -- 경마장 (1:서울, 2:부산, 3:제주)
  rc_date DATE NOT NULL,            -- 경주일
  rc_no INT NOT NULL,               -- 경주번호
  rc_name VARCHAR(100),             -- 경주명
  rc_dist INT,                      -- 경주거리 (m)
  rc_grade INT,                     -- 경주등급 (1~5)
  rc_track CHAR(1),                 -- 주로 (1:잔디, 2:모래)
  INDEX idx_meet_date (meet, rc_date)
);
```

### 베팅 테이블

```sql
CREATE TABLE bets (
  bet_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  race_id VARCHAR(50) NOT NULL,
  bet_type VARCHAR(20) NOT NULL,   -- 승식
  selections JSON NOT NULL,         -- 선택 마번
  amount DECIMAL(10,2) NOT NULL,   -- 베팅 금액
  odds DECIMAL(10,2),               -- 배당률
  status VARCHAR(20),               -- pending/win/lose
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (race_id) REFERENCES races(race_id)
);
```

---

## 🎓 학습 경로

### 초급 (1주차)

```
1. 경마 용어 가이드 읽기
   - 기본 용어 암기
   - 승식 종류 이해

2. KRA 시스템 가이드 훑어보기
   - 경마장 위치 파악
   - 경주 시간 확인
```

### 중급 (2주차)

```
1. KRA 시스템 가이드 정독
   - 등급 시스템 이해
   - 상금 체계 파악

2. 베팅 시스템 가이드 읽기
   - 각 승식별 특징
   - 조합 계산법
```

### 고급 (3주차)

```
1. 베팅 시스템 가이드 정독
   - 전략 수립
   - 배당률 분석

2. 실전 데이터 분석
   - KRA API 데이터 해석
   - 통계 분석
```

---

## 💡 개발 팁

### API 연동 시 주의사항

```typescript
// 경마장 코드 변환
function convertMeetCode(meet: string): string {
  const map = { '1': 'SEOUL', '2': 'BUSAN', '3': 'JEJU' };
  return map[meet] || 'UNKNOWN';
}

// 날짜 형식 통일
function formatRaceDate(date: string): string {
  // KRA API: YYYYMMDD
  // DB: YYYY-MM-DD
  return date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
}

// 베팅 타입 검증
function isValidBetType(type: string): boolean {
  const validTypes = ['WIN', 'PLACE', 'SHOW', 'EXACTA', 'QUINELLA', 'TRIFECTA_BOX', 'TRIFECTA'];
  return validTypes.includes(type);
}
```

### 용어 통일

```
서버 (영문):
- WIN (단승)
- PLACE (연승)
- EXACTA (쌍승)

모바일 (한글):
- 단승식
- 연승식
- 쌍승식

API 응답:
- 영문 코드 사용
- 한글은 별도 매핑 테이블
```

---

## 🔗 외부 리소스

### 공식 사이트

- [한국마사회](https://www.kra.co.kr)
- [렛츠런파크](https://race.kra.co.kr)
- [공공데이터포털](https://www.data.go.kr)

### KRA API

- [경주기록 API](https://www.data.go.kr/data/15052651/openapi.do)
- [출전표 API](https://www.data.go.kr/data/15052660/openapi.do)
- [확정배당율 API](https://www.data.go.kr/data/15052679/openapi.do)

---

## 📝 문서 업데이트 이력

| 날짜       | 문서               | 내용      |
| ---------- | ------------------ | --------- |
| 2025-10-12 | KRA 시스템 가이드  | 신규 작성 |
| 2025-10-12 | 베팅 시스템 가이드 | 신규 작성 |
| 2025-10-12 | 레퍼런스 README    | 신규 작성 |
| 2025-10-10 | 경마 용어 가이드   | 기존 문서 |

---

## 🆘 질문/피드백

### 문서 관련 문의

```
이메일: vcjsm2283@gmail.com
제목: [Golden Race 레퍼런스] 문의사항
```

### 기여하기

```
1. 오타/오류 발견 시 이슈 등록
2. 추가 필요 내용 제안
3. 실전 경험 공유
```

---

<div align="center">

**📚 한국 경마 완벽 레퍼런스**

Golden Race 개발을 위한  
필수 지식 총정리

**총 문서 수**: 4개  
**총 페이지**: 약 100페이지

**Golden Race Team** 🏇

**최종 업데이트**: 2025년 10월 12일

</div>
