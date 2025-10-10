import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prediction } from './entities/prediction.entity';
import { LlmService, LlmProviderType } from '../llm';
import { Race } from '../races/entities/race.entity';
import { EntryDetail } from '../races/entities/entry-detail.entity';
import { PromptBuilder } from './utils/prompt-builder';
import { ResponseParser } from './utils/response-parser';
import { CreatePredictionDto, PredictionResultDto } from './dto';

/**
 * 예측 서비스
 */
@Injectable()
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepo: Repository<Prediction>,
    @InjectRepository(Race)
    private readonly raceRepo: Repository<Race>,
    @InjectRepository(EntryDetail)
    private readonly entryRepo: Repository<EntryDetail>,
    private readonly llmService: LlmService
  ) {}

  /**
   * AI 예측 생성
   */
  async generatePrediction(
    dto: CreatePredictionDto
  ): Promise<PredictionResultDto> {
    this.logger.log(`Generating prediction for race: ${dto.raceId}`);

    // 1. 경주 데이터 조회
    const race = await this.raceRepo.findOne({ where: { id: dto.raceId } });
    if (!race) {
      throw new NotFoundException(`Race not found: ${dto.raceId}`);
    }

    // 2. 출전마 데이터 조회
    const entries = await this.entryRepo.find({
      where: { race: { id: dto.raceId } },
      order: { hrNo: 'ASC' },
    });

    if (entries.length === 0) {
      throw new BadRequestException('No horses found for this race');
    }

    // 3. 기존 예측 확인 (캐싱)
    const existingPrediction = await this.findByRaceId(dto.raceId);
    if (existingPrediction) {
      this.logger.log(`Using cached prediction for race: ${dto.raceId}`);
      return this.toDto(existingPrediction);
    }

    // 4. 프롬프트 생성
    const prompt = PromptBuilder.buildPrompt(race, entries);
    this.logger.debug(`Prompt length: ${prompt.length} characters`);

    // 5. LLM 호출
    const llmProvider = this.getProvider(dto.llmProvider);
    const llmResponse = await this.llmService.predict(
      prompt,
      {
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 800,
      },
      llmProvider
    );

    // 6. 응답 파싱
    const parsed = ResponseParser.parse(llmResponse.content);

    // 7. 예측 저장
    const prediction = this.predictionRepo.create({
      raceId: dto.raceId,
      firstPlace: parsed.firstPlace,
      secondPlace: parsed.secondPlace,
      thirdPlace: parsed.thirdPlace,
      analysis: parsed.analysis,
      confidence: parsed.confidence,
      warnings: parsed.warnings,
      llmModel: llmResponse.model,
      inputTokens: llmResponse.inputTokens,
      outputTokens: llmResponse.outputTokens,
      totalTokens: llmResponse.totalTokens,
      llmCost: llmResponse.cost,
      responseTime: llmResponse.responseTime,
    });

    const saved = await this.predictionRepo.save(prediction);

    this.logger.log(
      `Prediction saved: ${saved.id} | Cost: ₩${saved.llmCost} | Time: ${saved.responseTime}ms`
    );

    return this.toDto(saved);
  }

  /**
   * 경주 ID로 예측 조회 (캐싱용)
   */
  async findByRaceId(raceId: string): Promise<Prediction | null> {
    return this.predictionRepo.findOne({
      where: { raceId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * ID로 예측 조회
   */
  async findOne(id: string): Promise<PredictionResultDto> {
    const prediction = await this.predictionRepo.findOne({ where: { id } });

    if (!prediction) {
      throw new NotFoundException(`Prediction not found: ${id}`);
    }

    return this.toDto(prediction);
  }

  /**
   * 모든 예측 조회
   */
  async findAll(limit = 50, offset = 0): Promise<PredictionResultDto[]> {
    const predictions = await this.predictionRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return predictions.map(p => this.toDto(p));
  }

  /**
   * 예측 검증 (경주 종료 후)
   */
  async verifyPrediction(
    raceId: string,
    first: number,
    second: number,
    third: number
  ): Promise<void> {
    const prediction = await this.findByRaceId(raceId);

    if (!prediction) {
      this.logger.warn(`No prediction found for race: ${raceId}`);
      return;
    }

    prediction.verifyPrediction(first, second, third);
    await this.predictionRepo.save(prediction);

    this.logger.log(
      `Prediction verified for race ${raceId}: accuracy=${prediction.accuracyScore}%`
    );
  }

  /**
   * 평균 정확도 조회
   */
  async getAverageAccuracy(): Promise<number> {
    const result = await this.predictionRepo
      .createQueryBuilder('prediction')
      .select('AVG(prediction.accuracyScore)', 'avgAccuracy')
      .where('prediction.accuracyScore IS NOT NULL')
      .getRawOne();

    return result?.avgAccuracy ? parseFloat(result.avgAccuracy) : 0;
  }

  /**
   * 총 비용 조회
   */
  async getTotalCost(): Promise<number> {
    const result = await this.predictionRepo
      .createQueryBuilder('prediction')
      .select('SUM(prediction.llmCost)', 'totalCost')
      .getRawOne();

    return result?.totalCost ? parseFloat(result.totalCost) : 0;
  }

  /**
   * Provider 타입 변환
   */
  private getProvider(provider?: string): LlmProviderType | undefined {
    if (provider === 'claude') return LlmProviderType.CLAUDE;
    if (provider === 'openai') return LlmProviderType.OPENAI;
    return undefined; // 기본값 사용
  }

  /**
   * Entity → DTO 변환
   */
  private toDto(prediction: Prediction): PredictionResultDto {
    return {
      id: prediction.id,
      raceId: prediction.raceId,
      firstPlace: prediction.firstPlace,
      secondPlace: prediction.secondPlace,
      thirdPlace: prediction.thirdPlace,
      analysis: prediction.analysis,
      confidence: prediction.confidence,
      warnings: prediction.warnings,
      llmModel: prediction.llmModel,
      llmCost: prediction.llmCost,
      responseTime: prediction.responseTime,
      isAccurate: prediction.isAccurate,
      accuracyScore: prediction.accuracyScore,
      createdAt: prediction.createdAt,
    };
  }
}
