import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  LlmProvider,
  LlmPredictOptions,
  LlmResponse,
} from '../interfaces/llm-provider.interface';

/**
 * Claude 3.5 Sonnet 서비스 (백업)
 */
@Injectable()
export class ClaudeService implements LlmProvider {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly client: Anthropic;
  private readonly model = 'claude-3-5-sonnet-20241022';

  // 토큰당 비용 (USD)
  private readonly INPUT_COST_PER_1K = 0.003;
  private readonly OUTPUT_COST_PER_1K = 0.015;
  private readonly USD_TO_KRW = 1350; // 환율

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured');
    }

    this.client = new Anthropic({
      apiKey: apiKey || 'dummy-key',
    });
  }

  get modelName(): string {
    return this.model;
  }

  /**
   * AI 예측 생성
   */
  async predict(
    prompt: string,
    options?: LlmPredictOptions
  ): Promise<LlmResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`Requesting prediction from ${this.model}`);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens ?? 800,
        temperature: options?.temperature ?? 0.7,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseTime = Date.now() - startTime;

      const content =
        message.content[0].type === 'text' ? message.content[0].text : '';
      const inputTokens = message.usage.input_tokens;
      const outputTokens = message.usage.output_tokens;
      const totalTokens = inputTokens + outputTokens;

      const cost = this.calculateCost(inputTokens, outputTokens);

      this.logger.log(
        `Prediction completed in ${responseTime}ms | Tokens: ${totalTokens} | Cost: ₩${cost.toFixed(0)}`
      );

      return {
        content,
        model: this.model,
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        responseTime,
      };
    } catch (error) {
      this.logger.error(`Claude API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 비용 계산 (KRW)
   */
  calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCostUSD = (inputTokens / 1000) * this.INPUT_COST_PER_1K;
    const outputCostUSD = (outputTokens / 1000) * this.OUTPUT_COST_PER_1K;
    const totalCostUSD = inputCostUSD + outputCostUSD;

    return Math.round(totalCostUSD * this.USD_TO_KRW);
  }

  /**
   * 시스템 프롬프트
   */
  private getSystemPrompt(): string {
    return `당신은 경마 전문 분석가입니다.
과거 경주 데이터, 출전마 정보, 기수/조교사 통계 등을 종합적으로 분석하여 정확한 예측을 제공합니다.

분석 시 고려해야 할 요소:
1. 최근 경주 성적 (최근 5경주 중요도 높음)
2. 거리 적성 (오늘 경주 거리와 과거 성적 비교)
3. 주로 상태 적성 (양호/다습/불량)
4. 기수 능력 (승률, 해당 말과의 호흡)
5. 조교사 능력 (승률, 조교 방식)
6. 마체중 변화
7. 출전 간격

예측은 데이터에 기반하되, 불확실성이 높으면 신뢰도를 낮게 표시하세요.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "firstPlace": 마번,
  "secondPlace": 마번,
  "thirdPlace": 마번,
  "confidence": 신뢰도(0-100),
  "analysis": "상세 분석 내용",
  "warnings": ["주의사항1", "주의사항2"]
}`;
  }
}
