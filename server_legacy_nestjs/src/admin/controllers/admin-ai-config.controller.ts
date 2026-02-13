import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIConfigEntity } from '../../llm/entities/ai-config.entity';
import { UpdateAIConfigDto } from '../../llm/dto/update-ai-config.dto';

/**
 * AI 설정 관리 컨트롤러
 */
@Controller('admin/ai')
@UseGuards(AdminGuard)
export class AdminAIConfigController {
  constructor(
    @InjectRepository(AIConfigEntity)
    private readonly aiConfigRepository: Repository<AIConfigEntity>
  ) {}

  /**
   * AI 설정 조회
   * GET /admin/ai/config
   */
  @Get('config')
  async getConfig() {
    let config = await this.aiConfigRepository.findOne({
      where: { configKey: 'DEFAULT' },
    });

    // 설정이 없으면 기본값 생성
    if (!config) {
      config = this.aiConfigRepository.create({
        configKey: 'DEFAULT',
        llmProvider: 'openai',
        primaryModel: 'gpt-4-turbo',
        fallbackModels: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
        costStrategy: 'balanced',
        temperature: 0.7,
        maxTokens: 1000,
        enableCaching: true,
        cacheTTL: 3600,
        enableBatchPrediction: true,
        batchCronSchedule: '0 9 * * *',
        enableAutoUpdate: true,
        updateIntervalMinutes: 10,
        oddsChangeThreshold: 10.0,
        dailyCostLimit: 5000.0,
        monthlyCostLimit: 100000.0,
        promptVersion: 'v1.0.0',
      });
      await this.aiConfigRepository.save(config);
    }

    return config;
  }

  /**
   * AI 설정 업데이트
   * POST /admin/ai/config
   */
  @Post('config')
  async updateConfig(@Body() updateDto: UpdateAIConfigDto) {
    let config = await this.aiConfigRepository.findOne({
      where: { configKey: 'DEFAULT' },
    });

    if (!config) {
      // 없으면 생성
      config = this.aiConfigRepository.create({
        configKey: 'DEFAULT',
        ...updateDto,
      });
    } else {
      // 있으면 업데이트
      config = Object.assign(config, updateDto);
    }

    const savedConfig = await this.aiConfigRepository.save(config);

    return {
      success: true,
      message: 'AI 설정이 저장되었습니다',
      config: savedConfig,
    };
  }

  /**
   * 모델별 예상 비용 계산
   * GET /admin/ai/estimate-cost
   */
  @Get('estimate-cost')
  async estimateCost() {
    const config = await this.getConfig();

    const modelCosts: Record<string, number> = {
      'gpt-4-turbo': 54,
      'gpt-4': 90,
      'gpt-4o': 15,
      'gpt-3.5-turbo': 10,
      'claude-3-opus': 60,
      'claude-3-sonnet': 15,
    };

    const strategyCosts: Record<string, { cost: number; accuracy: number }> = {
      premium: { cost: 30240, accuracy: 30 },
      balanced: { cost: 18360, accuracy: 27 },
      budget: { cost: 12960, accuracy: 24 },
      hybrid: { cost: 34560, accuracy: 31 },
    };

    const baseCost = modelCosts[config.primaryModel] || 54;
    const strategyCost = strategyCosts[config.costStrategy]?.cost || 30240;

    // 캐싱 활성화 시 99% 절감
    const actualCost = config.enableCaching
      ? Math.round(strategyCost * 0.01)
      : strategyCost;

    return {
      modelCost: baseCost,
      strategyCost: strategyCost,
      actualMonthlyCost: actualCost,
      savingsPercentage: config.enableCaching ? 99 : 0,
      estimatedAccuracy: strategyCosts[config.costStrategy]?.accuracy || 30,
    };
  }
}
