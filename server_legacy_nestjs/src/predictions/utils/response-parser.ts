import { Logger, BadRequestException } from '@nestjs/common';

/**
 * LLM 응답 파싱
 */
export interface ParsedPrediction {
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  confidence: number;
  analysis: string;
  warnings: string[];
  factors?: Record<string, number>;
}

export class ResponseParser {
  private static readonly logger = new Logger(ResponseParser.name);

  /**
   * JSON 응답 파싱
   */
  static parse(content: string): ParsedPrediction {
    try {
      // JSON 파싱
      const data = JSON.parse(content);

      // 필수 필드 검증
      this.validate(data);

      return {
        firstPlace: data.firstPlace,
        secondPlace: data.secondPlace,
        thirdPlace: data.thirdPlace,
        confidence: data.confidence,
        analysis: data.analysis || '',
        warnings: data.warnings || [],
        factors: data.factors || {},
      };
    } catch (error) {
      this.logger.error(`Failed to parse LLM response: ${error.message}`);
      this.logger.debug(`Content: ${content}`);

      // JSON 파싱 실패 시 텍스트에서 추출 시도
      return this.extractFromText(content);
    }
  }

  /**
   * 데이터 검증
   */
  private static validate(data: any): void {
    const requiredFields = [
      'firstPlace',
      'secondPlace',
      'thirdPlace',
      'confidence',
    ];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    // 마번 유효성 검사 (1-18번 사이)
    const places = [data.firstPlace, data.secondPlace, data.thirdPlace];
    for (const place of places) {
      if (!Number.isInteger(place) || place < 1 || place > 18) {
        throw new BadRequestException(`Invalid horse number: ${place}`);
      }
    }

    // 중복 검사
    const uniquePlaces = new Set(places);
    if (uniquePlaces.size !== 3) {
      throw new BadRequestException('Duplicate horse numbers in prediction');
    }

    // 신뢰도 검사 (0-100)
    if (data.confidence < 0 || data.confidence > 100) {
      throw new BadRequestException(`Invalid confidence: ${data.confidence}`);
    }
  }

  /**
   * 텍스트에서 예측 추출 (fallback)
   */
  private static extractFromText(content: string): ParsedPrediction {
    this.logger.warn('Attempting to extract prediction from text...');

    try {
      // JSON 블록 찾기
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        this.validate(data);
        return {
          firstPlace: data.firstPlace,
          secondPlace: data.secondPlace,
          thirdPlace: data.thirdPlace,
          confidence: data.confidence,
          analysis: data.analysis || '',
          warnings: data.warnings || [],
          factors: data.factors || {},
        };
      }

      // 숫자 패턴 찾기 (최후의 수단)
      const numbers = content.match(/\d+/g);
      if (numbers && numbers.length >= 3) {
        this.logger.warn('Using fallback number extraction');
        return {
          firstPlace: parseInt(numbers[0], 10),
          secondPlace: parseInt(numbers[1], 10),
          thirdPlace: parseInt(numbers[2], 10),
          confidence: 50, // 낮은 신뢰도
          analysis: '자동 추출된 예측 (신뢰도 낮음)',
          warnings: ['AI 응답 형식이 올바르지 않아 자동으로 추출했습니다.'],
          factors: {},
        };
      }
    } catch (error) {
      this.logger.error(`Text extraction failed: ${error.message}`);
    }

    throw new BadRequestException(
      'Unable to parse prediction from LLM response'
    );
  }
}
