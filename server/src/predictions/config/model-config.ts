/**
 * LLM 모델 설정
 * GPT vs Claude 성능 비교 및 전략
 */

export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export interface ModelConfig {
  name: string;
  provider: LLMProvider;
  cost: number; // KRW
  speed: number; // 1-5 (5가 가장 빠름)
  accuracy: number; // 예상 정확도 (%)
  reliability: number; // 1-5 (5가 가장 신뢰)
  korean: number; // 한국어 능력 1-5
  jsonStability: number; // JSON 출력 안정성 1-5
}

/**
 * 사용 가능한 모델 목록
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  'gpt-4-turbo': {
    name: 'gpt-4-turbo',
    provider: LLMProvider.OPENAI,
    cost: 54,
    speed: 4,
    accuracy: 30,
    reliability: 5,
    korean: 4,
    jsonStability: 5,
  },
  'gpt-4': {
    name: 'gpt-4',
    provider: LLMProvider.OPENAI,
    cost: 90,
    speed: 3,
    accuracy: 31,
    reliability: 5,
    korean: 4,
    jsonStability: 5,
  },
  'gpt-4o': {
    name: 'gpt-4o',
    provider: LLMProvider.OPENAI,
    cost: 15,
    speed: 5,
    accuracy: 29,
    reliability: 5,
    korean: 4,
    jsonStability: 5,
  },
  'gpt-3.5-turbo': {
    name: 'gpt-3.5-turbo',
    provider: LLMProvider.OPENAI,
    cost: 10,
    speed: 5,
    accuracy: 24,
    reliability: 4,
    korean: 3,
    jsonStability: 5,
  },
  'claude-3-opus': {
    name: 'claude-3-opus-20240229',
    provider: LLMProvider.ANTHROPIC,
    cost: 60,
    speed: 2,
    accuracy: 32,
    reliability: 5,
    korean: 5,
    jsonStability: 3,
  },
  'claude-3-sonnet': {
    name: 'claude-3-sonnet-20240229',
    provider: LLMProvider.ANTHROPIC,
    cost: 15,
    speed: 4,
    accuracy: 28,
    reliability: 4,
    korean: 5,
    jsonStability: 4,
  },
};

/**
 * 추천 모델 전략 (단일 모델 + 폴백)
 */
export const MODEL_STRATEGY = {
  // 기본 모델
  PRIMARY: 'gpt-4-turbo',

  // 폴백 순서 (OpenAI 계열만)
  FALLBACK: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],

  // 설명
  REASONING: {
    PRIMARY: 'GPT-4 Turbo - 속도와 정확도의 최적 균형',
    FALLBACK_1: 'GPT-4o - 더 저렴하고 빠름',
    FALLBACK_2: 'GPT-4 - 조금 느리지만 정확',
    FALLBACK_3: 'GPT-3.5 Turbo - 최후의 폴백',
  },
} as const;

/**
 * 모델 선택 이유
 */
export const MODEL_SELECTION_REASONS = {
  'gpt-4-turbo': [
    '속도와 정확도의 최적 균형',
    '안정적인 JSON 출력',
    '비용 효율적 (₩54)',
    '실시간 업데이트 가능',
    '수치 계산 정확',
  ],
  'gpt-3.5-turbo': [
    '압도적 가성비 (₩10)',
    '최고 속도 (1-2초)',
    '업데이트에 적합',
    '기본 분석 충분',
  ],
  'claude-3-opus': [
    '최고 정확도 (32%)',
    '뛰어난 한국어 이해',
    '복잡한 추론 능력',
    '창의적 분석',
    '설명 능력 최강',
  ],
  'claude-3-sonnet': [
    '적정 가격 (₩15)',
    '우수한 한국어',
    '밸런스형',
    '이변 예측 가능',
  ],
};

/**
 * 실전 추천
 */
export const RECOMMENDATION = {
  PRIMARY: 'gpt-4-turbo',
  SECONDARY: 'gpt-3.5-turbo',
  ALTERNATIVE: 'claude-3-sonnet',

  REASONING: `
🏆 GPT-4 Turbo 추천 이유:

1. 가성비 최고
   - ₩54로 30% 정확도
   - Claude Opus (₩60) 대비 저렴하면서 비슷한 성능

2. 속도 빠름
   - 2-3초 응답
   - 실시간 업데이트 가능

3. 안정성
   - JSON 출력 안정적
   - 에러 처리 쉬움

4. 생태계
   - OpenAI Function calling
   - Structured outputs
   - 문서화 우수

5. 실전 검증
   - 많은 프로덕션 사례
   - 안정적인 API
  `,
} as const;

/**
 * 비용 최적화 전략
 */
export interface CostOptimizationStrategy {
  name: string;
  description: string;
  monthlyCost: number;
  expectedAccuracy: number;
  models: {
    batch: Record<string, string>;
    update: string;
  };
}

export const COST_STRATEGIES: CostOptimizationStrategy[] = [
  {
    name: 'premium',
    description: 'GPT-4만 사용 (최고 정확도)',
    monthlyCost: 30240,
    expectedAccuracy: 30,
    models: {
      batch: {
        all: 'gpt-4-turbo',
      },
      update: 'gpt-3.5-turbo',
    },
  },
  {
    name: 'balanced',
    description: 'GPT-4 + GPT-3.5 혼용 (추천)',
    monthlyCost: 18360,
    expectedAccuracy: 27,
    models: {
      batch: {
        important: 'gpt-4-turbo', // 25%
        normal: 'gpt-3.5-turbo', // 75%
      },
      update: 'gpt-3.5-turbo',
    },
  },
  {
    name: 'budget',
    description: 'GPT-3.5 위주 (최저 비용)',
    monthlyCost: 12960,
    expectedAccuracy: 24,
    models: {
      batch: {
        important: 'gpt-4-turbo', // 10%
        normal: 'gpt-3.5-turbo', // 90%
      },
      update: 'gpt-3.5-turbo',
    },
  },
  {
    name: 'hybrid',
    description: 'GPT-4 + Claude Sonnet (실험적)',
    monthlyCost: 34560,
    expectedAccuracy: 31,
    models: {
      batch: {
        important: 'gpt-4-turbo', // 30%
        upset: 'claude-3-sonnet', // 20%
        normal: 'gpt-4-turbo', // 50%
      },
      update: 'gpt-3.5-turbo',
    },
  },
];
