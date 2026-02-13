# 📋 경마 승부예측 서비스 필수 API 명세서 (KRA Open API)

## 1. 개요

- **목적:** 한국마사회 공공데이터를 활용하여 실시간 경마 정보 제공 및 AI 기반 승부 예측 분석 수행.
- **전략:** 기본 정보 외에 **훈련, 체중, 구간별 기록, 장구 변경** 등 승패에 결정적 영향을 미치는
  '변수 데이터'를 수집하여 예측 모델의 정확도를 극대화함.

---

## 2. API 선정 리스트 (우선순위별 분류)

API는 크게 **①기본/서비스용**, **②심화 분석용(AI 학습)**, **③실시간 정보** 3가지 그룹으로 나뉩니다.

### Group A. 서비스 구동 및 기본 분석 (필수)

> 앱의 뼈대가 되는 데이터입니다. 사용자가 볼 화면 구성과 가장 기초적인 전적 분석에 사용됩니다.

| API 명칭 (키워드)                 | 주요 데이터 필드                          | 활용 용도 & 개발 포인트                                                             |
| --------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| **한국마사회\_출전표 상세정보**   | 마명, 기수, 부담중량, 조교사, 마번        | **[이번 주 경기]** 앱 메인 화면 구성. 예측의 대상이 되는 기준 데이터. → [KRA_ENTRY_SHEET_SPEC.md](KRA_ENTRY_SHEET_SPEC.md) |
| **한국마사회\_경주성적정보**      | 순위, 경주기록(초), 착차, 3F(라스트) 기록 | **[과거 데이터]** 머신러닝의 핵심 학습 데이터(Training Set). 말의 기본 능력치 계산. → [KRA_RACE_RESULT_SPEC.md](KRA_RACE_RESULT_SPEC.md) |
| **한국마사회\_경주마 상세정보**   | 성별, 연령, 모색, 부마/모마               | **[기본 스펙]** 나이(성장세/노쇠화) 및 혈통 분석 기초 자료. → [KRA_RACE_HORSE_INFO_SPEC.md](KRA_RACE_HORSE_INFO_SPEC.md) |
| **한국마사회\_기수 통산성적비교** | 기수 승률, 복승률, 전적                   | **[기수 역량]** "이 기수는 승률 15%의 에이스다" 판단용. → [KRA_JOCKEY_RESULT_SPEC.md](KRA_JOCKEY_RESULT_SPEC.md), [KRA_ANALYSIS_STRATEGY.md](KRA_ANALYSIS_STRATEGY.md) |

### Group B. AI 고도화/정밀 분석용 (핵심 차별화)

> **중요:** 단순 기록 비교를 넘어, 승패를 뒤집을 수 있는 **'히든 팩터(Hidden Factor)'**를 찾아내는
> API입니다. Python 분석 로직에 필수적입니다.

| API 명칭 (키워드)                              | 주요 데이터 필드                | Python 분석 / AI 프롬프트 활용 전략                                                              |
| ---------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| **한국마사회\_출전마 체중 정보**               | 마체중, 체중 증감(전번 대비)    | **[컨디션 분석]** "체중이 -15kg 급격히 빠졌다" → 컨디션 난조로 판단하여 감점 요인 적용. → [KRA_HORSE_WEIGHT_SPEC.md](KRA_HORSE_WEIGHT_SPEC.md) |
| **한국마사회\_경주 구간별 성적 정보**          | S1F(초반), G1F, G3F(후반) 기록  | **[각질 분석]** 초반 기록이 빠른 '선행마'인지, 막판 스퍼트가 좋은 '추입마'인지 분류. → [KRA_SECTIONAL_RECORD_SPEC.md](KRA_SECTIONAL_RECORD_SPEC.md) |
| **한국마사회\_경주로정보**                     | 함수율(%), 주로 상태(건조/포화) | **[환경 변수]** "오늘은 비가 와서(함수율 15%) 주로가 빠르다" → 선행마 가산점 부여. → [KRA_TRACK_INFO_SPEC.md](KRA_TRACK_INFO_SPEC.md) |
| **한국마사회\_말훈련내역**                     | 훈련일자, 훈련시간, 훈련강도    | **[승부 의지]** 최근 일주일간 강도 높은 훈련을 소화했는지 확인. → [KRA_TRAINING_SPEC.md](KRA_TRAINING_SPEC.md) |
| **한국마사회\_출전마 장구사용 및 폐출혈 정보** | 가면, 눈가리개, 폐출혈 이력     | **[장비/건강]** "눈가리개를 처음 착용했다" → 집중력 향상 기대. 폐출혈 이력 시 감점. → [KRA_EQUIPMENT_BLEEDING_SPEC.md](KRA_EQUIPMENT_BLEEDING_SPEC.md) |
| **한국마사회\_경주마 레이팅 정보**             | 레이팅 점수 (능력 평가 지수)    | **[핸디캡 분석]** 마사회 공식 능력치와 실제 배당 간의 괴리(저평가된 말) 포착. → [KRA_RATING_SPEC.md](KRA_RATING_SPEC.md) |

### Group C. 실시간 배당 & 결과 (Live)

> 경기 당일 실시간으로 호출하여 앱에 깜빡거리며 보여줄 데이터입니다.

| API 명칭 (키워드)                          | 주요 데이터 필드              | 활용 용도                                                                                  |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------ |
| **한국마사회*경마시행당일*확정배당율종합** | 단승, 연승, 복승, 쌍승 배당률 | **[실시간 배당]** 경기 30분 전부터 1분 단위 갱신. → [KRA_ODDS_SPEC.md](KRA_ODDS_SPEC.md) |
| **한국마사회\_경주마 출전취소 정보**       | 취소 사유, 취소 마번          | **[긴급 알림]** 경기 직전 갑자기 출전 취소된 말을 앱에서 제외 처리. → [KRA_HORSE_CANCEL_SPEC.md](KRA_HORSE_CANCEL_SPEC.md) |
| **한국마사회*경마시행당일*경주결과종합**   | 최종 순위, 확정 배당금        | **[결과 통보]** 경기 종료 5~10분 후 결과 업데이트 및 적중 여부 판단. → [KRA_RACE_RESULT_SPEC.md](KRA_RACE_RESULT_SPEC.md) |

---

## 3. 데이터베이스(DB) 저장 구조 (실제 구현)

> **참고:** 전체 스키마는 [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) 참고.  
> KRA API 데이터는 NestJS Cron → KraService → Prisma로 저장됨.

### 3.1 KRA API → DB 테이블/컬럼 매핑

| KRA API (키워드) | DB 테이블 | 저장 컬럼 | 비고 |
| ----------------- | --------- | --------- | ---- |
| [출전표 상세정보](KRA_ENTRY_SHEET_SPEC.md) | `races` | `meet`, `rcDate`, `rcNo`, `rcDist`, `rcGrade`, `rcCondition` | 경기 기본 정보 |
| [출전표 상세정보](KRA_ENTRY_SHEET_SPEC.md) | `race_entries` | `hrNo`, `hrName`, `jkNo`, `jkName`, `trName`, `owName`, `weight`, `chulNo`, `sex`, `age`, `origin`, `prize1`, `prizeT`, `totalRuns`, `totalWins` | 출전마 기본 |
| [경주로정보](KRA_TRACK_INFO_SPEC.md) | `races` | `weather`, `trackState` | 주로 상태, 함수율 |
| [경주성적정보](KRA_RACE_RESULT_SPEC.md) | `race_entries` | `recentRanks` (Json) | 과거 경주 착순 `[1,5,2]` |
| [경주성적정보](KRA_RACE_RESULT_SPEC.md) | `race_results` | `rcRank`, `rcTime`, `sectionalTimes`, `winOdds`, `plcOdds` | 경주 종료 후 결과 |
| [경주마 상세정보](KRA_RACE_HORSE_INFO_SPEC.md) | `race_entries` | `sex`, `age`, `origin` | 나이·혈통 기초 |
| [기수 통산성적비교](KRA_JOCKEY_RESULT_SPEC.md) | `jockey_results` | `jkNo`, `jkName`, `rcCntT`, `ord1CntT`, `winRateTsum`, `quRateTsum` | 기수별 통산 (별도 테이블) |
| [출전마 체중 정보](KRA_HORSE_WEIGHT_SPEC.md) | `race_entries` | `horseWeight` | 예: `"502(-2)"` |
| [장구사용·폐출혈 정보](KRA_EQUIPMENT_BLEEDING_SPEC.md) | `race_entries` | `equipment`, `bleedingInfo` (Json) | 가면, 눈가리개, 폐출혈 이력 |
| [경주마 레이팅 정보](KRA_RATING_SPEC.md) | `race_entries` | `rating` | 능력 지수 |
| [말훈련내역](KRA_TRAINING_SPEC.md) | `trainings` | `horseNo`, `date`, `time`, `intensity` | 1:N, `raceEntryId` 연결 |
| [말훈련내역](KRA_TRAINING_SPEC.md) | `race_entries` | `trainingData` (Json) | 요약·캐시용 (선택) |
| [경주 구간별 성적](KRA_SECTIONAL_RECORD_SPEC.md) | `race_results` | `sectionalTimes` (Json) | 경주 **결과** 시 S1F/G3F/G1F 저장. 예측 시점에는 과거 경주 RaceResult에서 조회 |
| [출전취소 정보](KRA_HORSE_CANCEL_SPEC.md) | `race_entries` | `isScratched` | 경기 직전 갱신 |
| [경주결과종합](KRA_RACE_RESULT_SPEC.md) | `race_results` | 전체 결과 필드 | 확정 결과 |

### 3.2 핵심 모델 요약

- **Race**: 경기 메타데이터. `weather`, `trackState`는 [경주로정보](KRA_TRACK_INFO_SPEC.md)에서.
- **RaceEntry**: 출전마 1건. Group B API(체중·장구·폐출혈·레이팅)는 모두 여기에 통합.
- **Training**: [말훈련내역](KRA_TRAINING_SPEC.md) 전용. `horseNo`로 출전마와 개념적 연결.
- **RaceResult**: 경주 종료 후 결과. `sectionalTimes`는 구간별 기록 포함.
- **JockeyResult**: [기수 통산성적비교](KRA_JOCKEY_RESULT_SPEC.md) 전용. `meet`, `jkNo`로 조회.

---

## 4. KRA API → DB → 분석 데이터 흐름

> **목적:** 어떤 DB 데이터가 Python/Gemini 분석에 사용되는지 명확히 정리.

### 4.1 예측 생성 파이프라인 (Cron: 경기 3시간 전)

```
KRA API 수집 → Race + RaceEntry + Training + JockeyResult 저장
     ↓
Python analysis.py (scripts/analysis.py)
     ↓  입력: Race, RaceEntry, JockeyResult (DB 조회)
     ↓  출력: horseScore, momentumScore, experienceBonus, jockeyScore, weightRatio
     ↓
Gemini API (constructPrompt)
     ↓  입력: raceContext, entries(정제), horseScores, jockeyAnalysis
     ↓  출력: analysis, preview
     ↓
Prediction 테이블에 scores, analysis, preview 저장
```

### 4.2 분석 단계별 사용 DB 테이블

| 분석 단계 | 사용 DB | 사용 컬럼 | 역할 |
| --------- | ------ | --------- | ---- |
| **Python (말 기준)** | `races` | `rcDist`, `weather` | 거리·날씨 기반 보정 |
| | `race_entries` | `recentRanks`, `rating`, `totalRuns`, `totalWins` | Speed/Momentum/경험 점수 |
| **Python (기수 분석)** | `races` | `meet`, `rcDist`, `weather` | 가중치 비율 (혼전/특수/일반) |
| | `race_entries` | `hrNo`, `hrName`, `jkNo`, `jkName`, `rating` | 기수-말 매칭 |
| | `jockey_results` | `winRateTsum`, `quRateTsum`, `rcCntT` | 기수 점수 산출 |
| | `race_results` | `rcTime`, `rcRank` | 혼전 판별 (과거 경주 있을 때) |
| **Gemini 프롬프트** | `races` | `rcDate`, `rcNo`, `rcDist`, `weather`, `trackState` | 경주 환경 설명 |
| | `race_entries` | `hrNo`, `hrName`, `jkName`, `weight`, `rating`, `recentRanks`, `horseWeight`, `equipment`, `totalRuns`, `totalWins`, `isScratched` | 출전마 통계 |
| | (Python 결과) | `horseScore`, `momentumScore`, `jockeyScore`, `combinedScore`, `weightRatio` | 점수 통합 |
| **정확도 계산** | `race_results` | `rcRank`, `hrNo` | 예측 vs 실제 비교 |

### 4.3 분석 활용 현황 (구현 완료)

| 데이터 | DB 저장 | 분석 활용 | 구현 상태 |
| ------ | ------- | --------- | --------- |
| [구간별 성적](KRA_SECTIONAL_RECORD_SPEC.md) | 경주 결과 시 `RaceResult.sectionalTimes` | 과거 경주에서 S1F/G1F 조회 → 선행마/추입마 태깅 → Gemini 프롬프트 `sectionalTag` | ✅ 구현 |
| [훈련](KRA_TRAINING_SPEC.md) | `trainings` 테이블, `RaceEntry.trainingData` | `trainings`/`trainingData` 요약 → `trainingSummary` → Gemini 프롬프트 | ✅ 구현 |
| [경주로 함수율](KRA_TRACK_INFO_SPEC.md) | `races.trackState` (주로 상태) | `trackState`로 Gemini에 전달 | ✅ 적용 |

---

## 5. 개발 시 주의사항 (Developer Notes)

1. **배당률 API 선택:**

- 목록에 `1착마`, `2착마`, `복승식` 등 배당률 API가 쪼개져 있는데,
  **`한국마사회_경마시행당일_확정배당율종합`** 또는 **`확정배당율 통합 정보`** ([KRA_ODDS_SPEC.md](KRA_ODDS_SPEC.md)) 하나만 써서 호출
  횟수를 줄이는 것이 서버 부하 관리에 유리합니다.

2. **훈련 데이터 파싱:**

- [`말훈련내역`](KRA_TRAINING_SPEC.md)은 데이터 양이 많을 수 있습니다. 전체를 다 긁어오지 말고, **'이번 주 출전하는 말'**의
  마번을 리스트업 한 뒤, 해당 말들의 최근 2주 치 훈련 데이터만 조회(Filtering)하는 로직이
  필요합니다.

3. **제외한 API:**

- `육성마`, `씨수말` 등 번식/육성 관련 정보는 승부 예측과 직접적 연관이 적어 초기 MVP(최소 기능
  제품) 단계에서는 제외했습니다.
- `입장인원`, `매출액`, `문화센터` 등은 서비스 본질과 무관하여 제외했습니다.

## 6. 결론: AI 분석 프롬프트 예시

위 API들을 모두 연동하면 Gemini에게 다음과 같은 **고급 질문**이 가능해집니다.

> "Gemini야, 이번 서울 7경주 분석해줘.
>
> 1. **7번마**는 최근 **체중이 10kg 빠졌고**([체중API](KRA_HORSE_WEIGHT_SPEC.md)),
> 2. 어제 **강도 높은 수영 훈련**([훈련API](KRA_TRAINING_SPEC.md))을 소화했어.
> 3. 오늘은 비가 와서 **함수율이 15%**([경주로API](KRA_TRACK_INFO_SPEC.md))인데,
> 4. 이 말의 **초반 200m 기록(S1F)**([구간성적API](KRA_SECTIONAL_RECORD_SPEC.md))은 전체 1등이야.
>
> **분석:** 주로가 빨라진 상황에서 감량된 체중으로 선행 승부수를 띄울 가능성이 높을까?"

---

## 7. NestJS 구현 가이드 (Implementation Guide)

### 1. 사전 준비 (패키지 설치)

NestJS 프로젝트 터미널에서 HTTP 통신을 위한 패키지를 설치합니다.

```bash
npm install --save @nestjs/axios axios
npm install --save @nestjs/config
```

### 2. 환경 변수 설정 (.env)

코드에 키를 그대로 적으면 보안상 위험하므로, 프로젝트 루트의 `.env` 파일에 키를 저장합니다.
(공유해주신 키 중 **Decoding** 키를 복사해서 넣으세요.)

```env
# .env 파일
KRA_API_KEY=yyRDa/aXc9SsDdY67IqkdXJmZgZXOzsKqnf+R/SZjR6iAxYLzKiq+gXTmdUj/Fe+FtEsMXnMYrLaiX6PZ/emsQ==
KRA_API_BASE_URL=https://apis.data.go.kr/B551015
```

### 3. NestJS 모듈 설정 (app.module.ts)

`HttpModule`과 `ConfigModule`을 등록합니다.

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { KraService } from './kra.service'; // 아래에서 만들 서비스
import { KraController } from './kra.controller'; // 아래에서 만들 컨트롤러

@Module({
  imports: [
    ConfigModule.forRoot(), // .env 사용
    HttpModule, // HTTP 요청 사용
  ],
  controllers: [KraController],
  providers: [KraService],
})
export class AppModule {}
```

### 4. 실제 API 호출 서비스 (kra.service.ts)

여기가 핵심입니다. 가장 기본이 되는 **'출전표 상세정보'** ([KRA_ENTRY_SHEET_SPEC.md](KRA_ENTRY_SHEET_SPEC.md))와 **'경주마 상세정보'** ([KRA_RACE_HORSE_INFO_SPEC.md](KRA_RACE_HORSE_INFO_SPEC.md))를 가져오는 예시입니다.

**주의:** 공공데이터포털은 기본 응답이 XML인 경우가 많습니다. 반드시 `_type=json` 파라미터를 붙여야
편합니다.

```typescript
// src/kra.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KraService {
  private readonly logger = new Logger(KraService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('KRA_API_KEY');
    this.baseUrl = this.configService.get<string>('KRA_API_BASE_URL');
  }

  /**
   * 1. 출전표 상세정보 가져오기
   * Endpoint: /API26_2/entrySheet_2
   * 활용: 이번 주 경마 출전 리스트 확인
   */
  async getEntrySheet(meet: string = '1') {
    // meet: 1(서울), 2(제주), 3(부산경남)
    const url = `${this.baseUrl}/API26_2/entrySheet_2`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            serviceKey: this.apiKey, // Decoding Key 사용
            meet: meet,
            _type: 'json', // JSON으로 응답 요청 (필수!)
            numOfRows: 20, // 가져올 데이터 수
            pageNo: 1,
          },
        }),
      );

      // 공공데이터포털 특성상 response.data.response.body.items 에 데이터가 있음
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching EntrySheet: ${error.message}`);
      throw error;
    }
  }

  /**
   * 2. 경주마 상세정보 가져오기
   * Endpoint: /API8_2/raceHorseInfo_2
   * 활용: 말의 상세 스펙 확인
   */
  async getHorseInfo(horseNo: string) {
    const url = `${this.baseUrl}/API8_2/raceHorseInfo_2`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            serviceKey: this.apiKey,
            hrNo: horseNo, // 마번 (예: 001234)
            _type: 'json',
            numOfRows: 10,
            pageNo: 1,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching HorseInfo: ${error.message}`);
      throw error;
    }
  }
}
```

### 5. 테스트용 컨트롤러 (kra.controller.ts)

브라우저나 Postman에서 테스트하기 위해 컨트롤러를 만듭니다.

```typescript
// src/kra.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { KraService } from './kra.service';

@Controller('kra')
export class KraController {
  constructor(private readonly kraService: KraService) {}

  @Get('entry')
  async getEntry(@Query('meet') meet: string) {
    // 접속 주소: http://localhost:3001/api/kra/entry?meet=1
    return await this.kraService.getEntrySheet(meet || '1');
  }

  @Get('horse')
  async getHorse(@Query('no') no: string) {
    // 접속 주소: http://localhost:3001/api/kra/horse?no=038291
    return await this.kraService.getHorseInfo(no);
  }
}
```

### 🚨 트러블 슈팅 (에러가 난다면?)

공공데이터포털 API 연동 시 90% 확률로 겪게 되는 문제들입니다.

**1. `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`**

- **원인:** 승인이 났어도 실제 서버에 동기화되는 데 **최소 1시간 ~ 24시간**이 걸립니다.
- **해결:** 방금 승인받으셨다면 내일 다시 해보시거나, 1~2시간 뒤에 호출해보세요.

**2. 인증키 에러 (OpenAPI Key Error)**

- **원인:** 키가 인코딩 문제로 깨져서 서버에 도착함.
- **해결:** `.env`에 저장한 키가 **Decoding(디코딩)** 키인지 다시 확인하세요. 끝에 `%3D`가 있으면
  인코딩된 것이고, `==`로 끝나면 디코딩된 것입니다. **`==`로 끝나는 것을 써야 합니다.**

**3. 데이터가 XML로 옴**

- **원인:** `_type=json` 파라미터가 제대로 안 먹힘.
- **해결:** 요청 코드 `params` 객체 안에 `_type: 'json'`이 정확히 있는지 확인하세요. 만약 그래도
  XML로 온다면 Node.js의 `xml2js` 라이브러리를 써서 파싱해야 합니다. (하지만 마사회 API는 대부분
  JSON을 잘 지원합니다.)
