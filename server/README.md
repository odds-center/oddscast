# Golden Race Server

Golden Race NestJS Server for KRA API integration

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp env.example .env
# .env 파일을 편집하여 필요한 설정을 추가
```

### 3. 데이터베이스 초기화

```bash
# MySQL 컨테이너 시작
npm run docker:mysql

# 데이터베이스 완전 초기화 (모든 테이블 생성)
npm run db:complete

# 또는 단계별 초기화
npm run db:init
```

### 4. 서버 시작

```bash
# 로컬 개발 모드
npm run dev:local

# 또는 일반 개발 모드
npm run start:dev
```

## 📊 데이터베이스 관리

### 데이터베이스 초기화

```bash
# 완전한 초기화 (권장)
npm run db:complete

# 기존 데이터 유지하면서 스키마만 업데이트
npm run db:init

# 데이터베이스 완전 리셋 (주의: 모든 데이터 삭제)
npm run db:reset
```

### 데이터베이스 컨테이너 관리

```bash
# MySQL 시작
npm run docker:mysql

# MySQL 중지
npm run docker:mysql:down

# MySQL 로그 확인
npm run db:logs
```

## 🏗️ 프로젝트 구조

```
src/
├── auth/           # 인증 관련 (Google OAuth, JWT)
├── users/          # 사용자 관리
├── races/          # 경마 정보
├── bets/           # 베팅 시스템
├── points/         # 포인트 시스템
├── results/        # 경주 결과
└── shared/         # 공통 엔티티 및 유틸리티
```

## 🔐 인증 시스템

- **Google OAuth 2.0**: 소셜 로그인
- **JWT**: API 인증 토큰
- **소셜 인증**: Google, Facebook, Apple 지원 (확장 가능)

## 🗄️ 데이터베이스 스키마

### 주요 테이블

- `users`: 사용자 정보
- `user_social_auth`: 소셜 인증 정보
- `races`: 경마 정보
- `bets`: 베팅 정보
- `user_point_balances`: 포인트 잔액
- `user_points`: 포인트 거래 내역

### 스키마 초기화 파일

- `mysql/init/01_create_database.sql`: 기본 데이터베이스 생성
- `mysql/init/02_update_schema.sql`: 기존 스키마 업데이트
- `mysql/init/03_complete_schema.sql`: 완전한 스키마 (권장)

## 🐳 Docker 지원

```bash
# 개발 환경
docker-compose -f docker-compose.dev.yml up -d

# 프로덕션 환경
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 API 문서

서버 실행 후 `http://localhost:3002/api`에서 Swagger API 문서를 확인할 수 있습니다.

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

````
#

## 한국마사회 경주기록 정보 API 명세서

### **1. [cite\_start]서비스 명세** [cite: 14]

#### [cite\_start]**1.1 공공데이터 OpenAPI 조회 서비스** [cite: 15]

**가. [cite\_start]API 서비스 개요** [cite: 16]

  * [cite\_start]**API명 (영문)**: RACE RESULT [cite: 17]
  * [cite\_start]**API명 (국문)**: 한국마사회 경주기록 정보 [cite: 17]
  * [cite\_start]**API 설명**: 서울, 부산경남, 제주 경마장에서 시행된 경주정보 (경주일자, 경주번호, 경주거리, 부담구분, 상금, 순위, 출전마정보, 구간별기록, 경주기록) [cite: 17]
  * [cite\_start]**서비스 인증/권한**: ServiceKey [cite: 17]
  * [cite\_start]**메시지 레벨 암호화**: 없음 [cite: 17]
  * [cite\_start]**전송 레벨 암호화**: 없음 [cite: 17]
  * [cite\_start]**인터페이스 표준**: REST (GET) [cite: 17]
  * [cite\_start]**교환 데이터 표준**: XML, JSON [cite: 17]
  * [cite\_start]**서비스 URL**: `http://apis.data.go.kr/B551015/API4_3` [cite: 17]
  * [cite\_start]**서비스 버전**: 1.0 [cite: 17]
  * [cite\_start]**서비스 시작일**: 2024-01-01 [cite: 17]
  * [cite\_start]**메시지 교환유형**: Request-Response [cite: 17]
  * [cite\_start]**데이터 갱신주기**: 수시 [cite: 17]

-----

### **2. 상세기능**

#### **가. [cite\_start]상세기능 목록** [cite: 18]

  * [cite\_start]**API명**: 한국마사회 경주기록 정보 [cite: 19]
  * [cite\_start]**상세기능명 (영문)**: raceResult [cite: 19]
  * [cite\_start]**상세기능명 (국문)**: 전국 경주기록 정보 [cite: 19]

#### **나. [cite\_start]상세기능내역** [cite: 20]

[cite\_start]**1) 상세기능정보** [cite: 21]

  * [cite\_start]**상세기능명 (국문)**: 전국 경주기록 정보 [cite: 22]
  * [cite\_start]**상세기능 설명**: 서울, 부산경남, 제주 경마장에서 시행된 경주정보(출전마정보, 경주기록) [cite: 22]
  * [cite\_start]**Call Back URL**: `http://apis.data.go.kr/B551015/API4_3/raceResult_3` [cite: 22]

[cite\_start]**2) 요청 메시지 명세** [cite: 23]

  * **ServiceKey (서비스키)**
      * [cite\_start]항목크기: - [cite: 24]
      * [cite\_start]항목구분: 필수(1) [cite: 24]
      * [cite\_start]설명: 공공데이터포털에서 받은 인증키 [cite: 24]
  * **numOfRows (한 페이지 결과 수)**
      * [cite\_start]항목크기: 4 [cite: 24]
      * [cite\_start]항목구분: 필수(1) [cite: 24]
      * [cite\_start]샘플데이터: 10 [cite: 24]
      * [cite\_start]설명: 한 페이지 결과 수 [cite: 24]
  * **pageNo (페이지 번호)**
      * [cite\_start]항목크기: 4 [cite: 24]
      * [cite\_start]항목구분: 필수(1) [cite: 24]
      * [cite\_start]샘플데이터: 1 [cite: 24]
      * [cite\_start]설명: 페이지 번호 [cite: 24]
  * **meet (시행경마장구분)**
      * [cite\_start]항목크기: 1 [cite: 24]
      * [cite\_start]항목구분: 옵션(0) [cite: 24, 25]
      * [cite\_start]샘플데이터: 1 [cite: 24]
      * [cite\_start]설명: 시행경마장구분(1:서울 2:제주 3:부산) [cite: 24]
  * **rc\_date (경주일)**
      * [cite\_start]항목크기: 8 [cite: 24]
      * [cite\_start]항목구분: 옵션(0) [cite: 24, 25]
      * [cite\_start]샘플데이터: 20220220 [cite: 24]
      * [cite\_start]설명: 경주일(YYYYMMDD형식) [cite: 24]
  * **rc\_month (경주월)**
      * [cite\_start]항목크기: 6 [cite: 24]
      * [cite\_start]항목구분: 옵션(0) [cite: 24, 25]
      * [cite\_start]샘플데이터: 202202 [cite: 24]
      * [cite\_start]설명: 경주월(YYYYMM)형식 [cite: 24]
  * **rc\_no (경주번호)**
      * [cite\_start]항목크기: 2 [cite: 24]
      * [cite\_start]항목구분: 옵션(0) [cite: 24, 25]
      * [cite\_start]샘플데이터: 1 [cite: 24]
      * [cite\_start]설명: 경주번호 [cite: 24]
  * **rc\_year (경주년도)**
      * [cite\_start]항목크기: 4 [cite: 24]
      * [cite\_start]항목구분: 옵션(0) [cite: 24, 25]
      * [cite\_start]샘플데이터: 2022 [cite: 24]
      * [cite\_start]설명: 경주년도(YYYY)형식 [cite: 24]

[cite\_start]**3) 응답 메시지 명세** [cite: 26]

  * [cite\_start]**resultMsg (결과메세지)**: 결과메시지 (예: NORMAL SERVICE) [cite: 27]
  * [cite\_start]**numOfRows (한 페이지 결과 수)**: 한 페이지 결과 수 (예: 10) [cite: 27]
  * [cite\_start]**pageNo (페이지 번호)**: 페이지 번호 (예: 1) [cite: 27]
  * [cite\_start]**totalCount (데이터 총 개수)**: 데이터 총 개수 (예: 14) [cite: 27]
  * [cite\_start]**hrNo (마번)**: 마번 (예: 0044233) [cite: 27]
  * [cite\_start]**hrName (마명)**: 마명 (예: 은혜) [cite: 27]
  * [cite\_start]**age (연령)**: 연령 (예: 3) [cite: 27]
  * [cite\_start]**sex (성별)**: 성별 (예: 수) [cite: 27]
  * [cite\_start]**wgBudam (부담중량)**: 부담중량 (예: 56) [cite: 27]
  * [cite\_start]**jkName (기수명)**: 기수명 (예: 안토니오) [cite: 27]
  * [cite\_start]**trName (조교사명)**: 조교사명 (예: 최용구) [cite: 27]
  * [cite\_start]**owName (마주명)**: 마주명 (예: 강태구) [cite: 27]
  * [cite\_start]**rcTime (경주기록)**: 경주기록 (예: 75.9) [cite: 27]
  * [cite\_start]**wgHr (마체중)**: 마체중 (예: 502(-2)) [cite: 27]
  * [cite\_start]**winOdds (단승식 배당율)**: 단승식 배당율 (예: 4.6) [cite: 27]
  * [cite\_start]**plcOdds (복승식 배당율)**: 복승식 배당율 (예: 1.7) [cite: 27]
  * [cite\_start]**weather (날씨)**: 날씨 (예: 맑음) [cite: 27]
  * [cite\_start]**track (주로)**: 주로 (예: 건조 (2%)) [cite: 27]
  * [cite\_start]**rcName (경주명)**: 경주명 (예: 일반) [cite: 27]
  * [cite\_start]**chaksun1 (1착상금)**: 1착상금 (예: 22000000) [cite: 27]
  * [cite\_start]**meet (시행경마장명)**: 시행경마장명(서울, 제주, 부산경남) (예: 서울) [cite: 27]
  * [cite\_start]**rcDate (경주일자)**: 경주일자 (예: 20220220) [cite: 27]
  * [cite\_start]**rcNo (경주번호)**: 경주번호 (예: 1) [cite: 27]
  * [cite\_start]**rcDist (경주거리)**: 경주거리 (예: 1200) [cite: 27]
  * [cite\_start]**ord (순위)**: 순위 (예: 1) [cite: 27]
  * *(...이하 생략)*

[cite\_start]**4) 요청/응답 메시지 예제** [cite: 29]

  * **요청메시지**

    ```
    http://apis.data.go.kr/B551015/API4_3/raceResult_3?ServiceKey=인증키(URL Encode)&numOfRows=10&pageNo=1&meet=1&rc_year=2022&rc_month=202202&rc_date=20220220&rc_no=1
    ```

    [cite\_start][cite: 30]

  * **응답메시지**

    ```xml
    <response>
        <header>
            <resultCode>00</resultCode>
            <resultMsg>NORMAL SERVICE.</resultMsg>
        </header>
        <body>
            <items>
                <item>
                    <age>3</age>
                    <hrName>은혜</hrName>
                    <hrNo>0044233</hrNo>
                    <jkName>안토니오</jkName>
                    <meet>서울</meet>
                    <ord>1</ord>
                    <owName>강태구</owName>
                    <plcOdds>1.7</plcOdds>
                    <rcDate>20220220</rcDate>
                    <rcDist>1200</rcDist>
                    <rcTime>75.9</rcTime>
                    <trName>최용구</trName>
                    <wgHr>502(-2)</wgHr>
                    <winOdds>4.6</winOdds>
                </item>
            </items>
            <numOfRows>10</numOfRows>
            <pageNo>1</pageNo>
            <totalCount>14</totalCount>
        </body>
    </response>
    ```

    [cite\_start][cite: 30]

-----

### **3. [cite\_start]OpenAPI 에러 코드정리** [cite: 31]

  * [cite\_start]**1: APPLICATION\_ERROR** - 어플리케이션 에러 [cite: 32]
  * [cite\_start]**10: INVALID\_REQUEST\_PARAMETER\_ERROR** - 잘못된 요청 파라메터 에러 [cite: 32]
  * [cite\_start]**12: NO\_OPENAPI\_SERVICE\_ERROR** - 해당 오픈API서비스가 없거나 폐기됨 [cite: 32]
  * [cite\_start]**20: SERVICE\_ACCESS\_DENIED\_ERROR** - 서비스 접근거부 [cite: 32]
  * [cite\_start]**22: LIMITED\_NUMBER\_OF\_SERVICE\_REQUESTS\_EXCEEDS\_ERROR** - 서비스 요청제한횟수 초과에러 [cite: 32]
  * [cite\_start]**30: SERVICE\_KEY\_IS\_NOT\_REGISTERED\_ERROR** - 등록되지 않은 서비스키 [cite: 32]
  * [cite\_start]**31: DEADLINE\_HAS\_EXPIRED\_ERROR** - 기한만료된 서비스키 [cite: 32]
  * [cite\_start]**32: UNREGISTERED\_IP\_ERROR** - 등록되지 않은 IP [cite: 32]
  * [cite\_start]**99: UNKNOWN\_ERROR** - 기타에러 [cite: 32]
````
