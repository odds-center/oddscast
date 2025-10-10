import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './providers/openai.service';
import { ClaudeService } from './providers/claude.service';
import {
  LlmProvider,
  LlmResponse,
  LlmPredictOptions,
} from './interfaces/llm-provider.interface';

export enum LlmProviderType {
  OPENAI = 'openai',
  CLAUDE = 'claude',
}

/**
 * LLM 서비스 (메인)
 *
 * OpenAI 또는 Claude를 선택하여 사용할 수 있습니다.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly defaultProvider: LlmProviderType;

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly claudeService: ClaudeService,
    private readonly configService: ConfigService
  ) {
    // 기본 제공자 설정 (환경 변수로 선택 가능)
    const provider = this.configService.get<string>('LLM_PROVIDER', 'openai');
    this.defaultProvider =
      provider === 'claude' ? LlmProviderType.CLAUDE : LlmProviderType.OPENAI;

    this.logger.log(`Default LLM provider: ${this.defaultProvider}`);
  }

  /**
   * AI 예측 생성
   *
   * @param prompt 프롬프트 텍스트
   * @param options 옵션
   * @param providerType 제공자 (미지정 시 기본 제공자 사용)
   */
  async predict(
    prompt: string,
    options?: LlmPredictOptions,
    providerType?: LlmProviderType
  ): Promise<LlmResponse> {
    const provider = this.getProvider(providerType || this.defaultProvider);

    try {
      this.logger.log(`Generating prediction with ${provider.modelName}`);
      const response = await provider.predict(prompt, options);
      this.logger.log(
        `Prediction successful | Cost: ₩${response.cost} | Time: ${response.responseTime}ms`
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Prediction failed with ${provider.modelName}: ${error.message}`
      );

      // 실패 시 다른 제공자로 재시도
      if (!providerType) {
        this.logger.log('Retrying with alternative provider...');
        const alternativeProvider =
          this.defaultProvider === LlmProviderType.OPENAI
            ? LlmProviderType.CLAUDE
            : LlmProviderType.OPENAI;

        try {
          return await this.predict(prompt, options, alternativeProvider);
        } catch (retryError) {
          this.logger.error(`Retry failed: ${retryError.message}`);
          throw retryError;
        }
      }

      throw error;
    }
  }

  /**
   * 제공자 선택
   */
  private getProvider(providerType: LlmProviderType): LlmProvider {
    switch (providerType) {
      case LlmProviderType.CLAUDE:
        return this.claudeService;
      case LlmProviderType.OPENAI:
      default:
        return this.openAIService;
    }
  }

  /**
   * 비용 계산
   */
  calculateCost(
    inputTokens: number,
    outputTokens: number,
    providerType?: LlmProviderType
  ): number {
    const provider = this.getProvider(providerType || this.defaultProvider);
    return provider.calculateCost(inputTokens, outputTokens);
  }

  /**
   * 사용 가능한 제공자 목록
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];

    if (this.configService.get<string>('OPENAI_API_KEY')) {
      providers.push('openai');
    }

    if (this.configService.get<string>('ANTHROPIC_API_KEY')) {
      providers.push('claude');
    }

    return providers;
  }
}
