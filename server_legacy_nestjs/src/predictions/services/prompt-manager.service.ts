import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelPerformance, Prediction } from '../entities';
import * as _ from 'lodash';

/**
 * 프롬프트 템플릿
 */
export interface PromptTemplate {
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
  description: string;
}

/**
 * 프롬프트 관리 서비스
 * - 프롬프트 버전 관리
 * - A/B 테스트
 * - 최적 프롬프트 자동 선택
 */
@Injectable()
export class PromptManagerService {
  private readonly logger = new Logger(PromptManagerService.name);

  // 프롬프트 라이브러리
  private readonly PROMPTS: Record<string, PromptTemplate> = {
    'v1.0': {
      version: 'v1.0',
      systemPrompt: `당신은 20년 경력의 경마 전문가입니다.
과거 데이터를 분석하여 정확한 예측을 제공합니다.

분석 시 중요도 순서:
1. 최근 폼 (35%) - 최근 5경주 성적
2. 거리 적성 (25%) - 해당 거리 성적
3. 기수 능력 (20%) - 기수 승률 및 말과의 궁합
4. 주로 상태 (12%) - 날씨 및 트랙 컨디션
5. 체중 상태 (8%) - 체중 변화

불확실성이 높으면 신뢰도를 낮게 표시하세요.`,
      userPromptTemplate: `다음 경주를 분석하여 1위부터 3위까지 예측해주세요:

경주 정보:
- 경마장: {{meetName}} ({{meet}})
- 거리: {{distance}}m
- 등급: {{grade}}
- 상금: {{prize}}원

출전마 정보:
{{#horses}}
{{number}}번 {{name}}
- 최근 5경주: {{recentRanks}}
- 승률: {{winRate}}%
- 기수: {{jockey}} (승률 {{jockeyWinRate}}%)
- 조교사: {{trainer}}
- 이 거리 성적: {{distancePerformance}}
{{/horses}}

JSON 형식으로만 답변:
{
  "firstPlace": 번호,
  "secondPlace": 번호,
  "thirdPlace": 번호,
  "confidence": 0-100,
  "analysis": "근거 설명",
  "warnings": ["주의사항1", "주의사항2"],
  "factors": {
    "recentForm": 0.0-1.0,
    "distanceAptitude": 0.0-1.0,
    "jockeyCompatibility": 0.0-1.0
  }
}`,
      temperature: 0.7,
      maxTokens: 800,
      description: '기본 프롬프트',
    },

    'v2.0': {
      version: 'v2.0',
      systemPrompt: `당신은 AI 경마 예측 전문가입니다.
데이터 기반으로 정확하게 예측하며, 과신을 피합니다.

핵심 원칙:
1. 데이터가 명확하면 높은 신뢰도
2. 변수가 많으면 낮은 신뢰도
3. 이변 가능성 항상 고려
4. 다크호스 요인 체크

과거 이변 패턴:
- 배당률 급변 (15% 이상)
- 기수 교체
- 체중 급변 (5kg 이상)
- 날씨/주로 급변`,
      userPromptTemplate: `{{#horses}}마다 최근 폼을 분석하고, 이변 가능성을 체크하세요:

경주: {{meetName}} {{distance}}m G{{grade}}

출전마:
{{#horses}}
{{number}}. {{name}} ({{jockey}})
  최근: {{recent5}} | 승률: {{winRate}}%
  거리: {{distanceRecord}} | 체중: {{weight}}kg
  배당: {{currentOdds}}배
{{/horses}}

예측 (JSON):
{
  "firstPlace": 번호,
  "secondPlace": 번호,
  "thirdPlace": 번호,
  "confidence": 60-95,
  "analysis": "상세 분석",
  "warnings": ["이변 가능성", "변수"],
  "darkHorse": 번호,
  "factors": {...}
}`,
      temperature: 0.6,
      maxTokens: 1000,
      description: '이변 감지 강화',
    },
  };

  constructor(
    @InjectRepository(ModelPerformance)
    private readonly performanceRepo: Repository<ModelPerformance>,
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>
  ) {}

  /**
   * 최적 프롬프트 선택
   */
  async getOptimalPrompt(context: {
    raceGrade?: number;
    hasUpset?: boolean; // 최근 이변 많았는지
  }): Promise<PromptTemplate> {
    // 이변이 많은 경주 → v2.0 (이변 감지 강화)
    if (context.hasUpset || context.raceGrade === 3) {
      return this.PROMPTS['v2.0'];
    }

    // 기본: v1.0
    return this.PROMPTS['v1.0'];
  }

  /**
   * 프롬프트 버전별 성과
   */
  async getPromptPerformance() {
    const versions = ['v1.0', 'v2.0'];
    const performance = [];

    for (const version of versions) {
      const stats = await this.predictionRepo
        .createQueryBuilder('prediction')
        .select('COUNT(*)', 'total')
        .addSelect('AVG(prediction.accuracy_score)', 'avgAccuracy')
        .addSelect('AVG(prediction.cost)', 'avgCost')
        .where('prediction.prompt_version = :version', { version })
        .andWhere('prediction.verified_at IS NOT NULL')
        .getRawOne();

      const avgAccuracy = _.toNumber(stats?.avgAccuracy) || 0;
      const avgCost = _.toNumber(stats?.avgCost) || 54;
      const efficiency =
        avgAccuracy > 0 ? _.round(avgAccuracy / avgCost, 4) : 0;

      performance.push({
        version,
        total: _.toInteger(stats?.total) || 0,
        avgAccuracy: _.round(avgAccuracy, 2),
        avgCost: _.round(avgCost, 2),
        efficiency,
      });
    }

    return performance;
  }

  /**
   * 프롬프트 템플릿 렌더링 (lodash template)
   */
  renderPrompt(template: string, data: Record<string, any>): string {
    // lodash template 사용
    const compiled = _.template(template, {
      interpolate: /{{([\s\S]+?)}}/g,
    });

    return compiled(data);
  }
}
