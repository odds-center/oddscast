import { Injectable, Logger } from '@nestjs/common';

/**
 * 베팅 승패 판정 서비스
 *
 * 7가지 승식별 승패 판정 로직
 */
@Injectable()
export class BetValidatorService {
  private readonly logger = new Logger(BetValidatorService.name);

  /**
   * 베팅 승패 판정
   *
   * @param betType 승식
   * @param selectedHorses 선택한 말 (배열 또는 문자열)
   * @param actualResult 실제 결과 (1,2,3위 마번 배열)
   * @returns 승/패 여부
   */
  validate(
    betType: string,
    selectedHorses: string | string[],
    actualResult: number[]
  ): boolean {
    // 문자열을 배열로 변환
    const selected =
      typeof selectedHorses === 'string'
        ? selectedHorses.split('-').map(n => parseInt(n.trim(), 10))
        : selectedHorses.map(n =>
            typeof n === 'string' ? parseInt(n, 10) : n
          );

    this.logger.debug(
      `Validating bet: ${betType} | Selected: [${selected}] | Result: [${actualResult}]`
    );

    switch (betType) {
      case '단승':
      case '단승식':
      case 'WIN':
        return this.validateWin(selected, actualResult);

      case '복승':
      case '복승식':
      case 'PLACE':
        return this.validatePlace(selected, actualResult);

      case '연승':
      case '연승식':
      case 'QUINELLA':
        return this.validateQuinella(selected, actualResult);

      case '복연승':
      case '복연승식':
      case 'QUINELLA_PLACE':
        return this.validateQuinellaPlace(selected, actualResult);

      case '쌍승':
      case '쌍승식':
      case 'EXACTA':
        return this.validateExacta(selected, actualResult);

      case '삼복승':
      case '삼복승식':
      case 'TRIO':
        return this.validateTrio(selected, actualResult);

      case '삼쌍승':
      case '삼쌍승식':
      case 'TRIFECTA':
        return this.validateTrifecta(selected, actualResult);

      default:
        this.logger.warn(`Unknown bet type: ${betType}`);
        return false;
    }
  }

  /**
   * 단승식: 1마리가 1등
   */
  private validateWin(selected: number[], actual: number[]): boolean {
    return selected[0] === actual[0];
  }

  /**
   * 복승식: 1마리가 1~3등
   */
  private validatePlace(selected: number[], actual: number[]): boolean {
    return actual.slice(0, 3).includes(selected[0]);
  }

  /**
   * 연승식: 2마리가 1~2등 (순서 무관)
   */
  private validateQuinella(selected: number[], actual: number[]): boolean {
    const top2 = actual.slice(0, 2);
    return selected.every(horse => top2.includes(horse));
  }

  /**
   * 복연승식: 2마리가 1~3등 (순서 무관)
   */
  private validateQuinellaPlace(selected: number[], actual: number[]): boolean {
    const top3 = actual.slice(0, 3);
    return selected.every(horse => top3.includes(horse));
  }

  /**
   * 쌍승식: 2마리가 1~2등 (순서 O)
   */
  private validateExacta(selected: number[], actual: number[]): boolean {
    return selected[0] === actual[0] && selected[1] === actual[1];
  }

  /**
   * 삼복승식: 3마리가 1~3등 (순서 무관)
   */
  private validateTrio(selected: number[], actual: number[]): boolean {
    const top3 = actual.slice(0, 3);
    return selected.every(horse => top3.includes(horse));
  }

  /**
   * 삼쌍승식: 3마리가 1~3등 (순서 O)
   */
  private validateTrifecta(selected: number[], actual: number[]): boolean {
    return (
      selected[0] === actual[0] &&
      selected[1] === actual[1] &&
      selected[2] === actual[2]
    );
  }

  /**
   * 베팅 타입 정규화
   *
   * 다양한 표기를 표준 형식으로 변환
   */
  normalizeBetType(betType: string): string {
    const normalized = betType.toLowerCase().trim();

    const typeMap: Record<string, string> = {
      단승: 'WIN',
      단승식: 'WIN',
      win: 'WIN',

      복승: 'PLACE',
      복승식: 'PLACE',
      place: 'PLACE',

      연승: 'QUINELLA',
      연승식: 'QUINELLA',
      quinella: 'QUINELLA',

      복연승: 'QUINELLA_PLACE',
      복연승식: 'QUINELLA_PLACE',
      'quinella place': 'QUINELLA_PLACE',

      쌍승: 'EXACTA',
      쌍승식: 'EXACTA',
      exacta: 'EXACTA',

      삼복승: 'TRIO',
      삼복승식: 'TRIO',
      trio: 'TRIO',

      삼쌍승: 'TRIFECTA',
      삼쌍승식: 'TRIFECTA',
      trifecta: 'TRIFECTA',
    };

    return typeMap[normalized] || betType;
  }
}
