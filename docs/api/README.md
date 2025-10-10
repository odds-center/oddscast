# 📡 API 문서

Golden Race 프로젝트의 모든 API 문서입니다.

---

## 📚 문서 목록

### RESTful API

| 문서                                                              | 설명                                |
| ----------------------------------------------------------------- | ----------------------------------- |
| [SERVER_MOBILE_API_MAPPING.md](rest/SERVER_MOBILE_API_MAPPING.md) | 서버-모바일 API 매핑 및 사용 가이드 |

### 한국마사회 공공 API (KRA)

| 문서                                                               | API     | 설명                   |
| ------------------------------------------------------------------ | ------- | ---------------------- |
| [한국마사회\_경주기록.md](kra/한국마사회_경주기록.md)              | API4_3  | 경주 결과 및 기록 정보 |
| [한국마사회*출전표*상세정보.md](kra/한국마사회_출전표_상세정보.md) | API26_2 | 출전마 상세 정보       |
| [한국마사회*확정*배당율.md](kra/한국마사회_확정_배당율.md)         | API160  | 확정 배당률 정보       |

---

## 🔌 API 개요

### Golden Race RESTful API

**서버**: `http://localhost:3002`  
**Swagger**: `http://localhost:3002/api`

#### 주요 엔드포인트

```http
# 인증
POST   /api/auth/google
GET    /api/auth/google/callback
POST   /api/auth/refresh

# 경주
GET    /api/races
GET    /api/races/:id
GET    /api/races/schedule

# 베팅
POST   /api/bets
GET    /api/bets
DELETE /api/bets/:id

# 포인트
GET    /api/points/balance
GET    /api/points/history
```

**상세 문서**: [rest/SERVER_MOBILE_API_MAPPING.md](rest/SERVER_MOBILE_API_MAPPING.md)

---

### 한국마사회 공공 API

**Base URL**: `http://apis.data.go.kr/B551015/`  
**인증**: ServiceKey (공공데이터 포털)

#### API 목록

| API         | 엔드포인트                  | 기능       |
| ----------- | --------------------------- | ---------- |
| **API72_2** | `/API72_2/raceSchedule_2`   | 경주계획표 |
| **API4_3**  | `/API4_3/raceResult_3`      | 경주기록   |
| **API26_2** | `/API26_2/chulLineDetail_2` | 출전표     |
| **API160**  | `/API160/lastOdds_1`        | 확정배당율 |

**상세 문서**: [kra/](kra/)

---

## 🔄 데이터 흐름

```
Mobile App
    ↓ HTTP Request
Server /api/races
    ↓ Check Local DB
Data Source Service
    ↓ If not found
KRA API Service
    ↓ HTTP Request
한국마사회 API
    ↓ Response
Process & Cache
    ↓ Return
Mobile App
```

---

## 📊 API 제한사항

### KRA API

| 항목      | 제한     |
| --------- | -------- |
| 일일 요청 | 10,000회 |
| 분당 요청 | 100회    |
| TPS       | 30       |
| 타임아웃  | 30초     |

### Golden Race API

| 항목       | 제한            |
| ---------- | --------------- |
| Rate Limit | 1000회/시간     |
| 인증       | JWT 필수        |
| CORS       | 설정된 Origin만 |

---

## 🔗 관련 문서

- [서버 개발](../../server/README.md) - 백엔드 API
- [모바일 개발](../../mobile/README.md) - API 클라이언트
- [데이터 수집](../guides/server/DATA_COLLECTION_GUIDE.md) - 데이터 수집

---

**마지막 업데이트**: 2025년 10월 10일
