import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './providers/openai.service';
import {
  LlmProvider,
  LlmResponse,
  LlmPredictOptions,
} from './interfaces/llm-provider.interface';

/**
 * LLM 서비스 (OpenAI 전용)
 *
 * OpenAI GPT-4o만 사용합니다.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly configService: ConfigService
  ) {
    this.logger.log('LLM Service initialized with OpenAI GPT-4o');
  }

  /**
   * AI 예측 생성 (OpenAI 전용)
   *
   * @param prompt 프롬프트 텍스트
   * @param options 옵션
   */
  async predict(
    prompt: string,
    options?: LlmPredictOptions
  ): Promise<LlmResponse> {
    try {
      this.logger.log(
        `Generating prediction with ${this.openAIService.modelName}`
      );
      const response = await this.openAIService.predict(prompt, options);
      this.logger.log(
        `Prediction successful | Cost: ₩${response.cost} | Time: ${response.responseTime}ms`
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Prediction failed with ${this.openAIService.modelName}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * 비용 계산 (OpenAI 전용)
   */
  calculateCost(inputTokens: number, outputTokens: number): number {
    return this.openAIService.calculateCost(inputTokens, outputTokens);
  }

  /**
   * API 키 설정 여부 확인
   */
  isConfigured(): boolean {
    return !!this.configService.get<string>('OPENAI_API_KEY');
  }
}
