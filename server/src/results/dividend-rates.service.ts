import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DividendRate } from './entities/dividend-rate.entity';

@Injectable()
export class DividendRatesService {
  private readonly logger = new Logger(DividendRatesService.name);

  constructor(
    @InjectRepository(DividendRate)
    private dividendRatesRepository: Repository<DividendRate>
  ) {}

  async findAll(): Promise<DividendRate[]> {
    return this.dividendRatesRepository.find({
      order: { rcDate: 'DESC', rcNo: 'ASC' },
    });
  }

  async findById(dividendId: string): Promise<DividendRate | null> {
    return this.dividendRatesRepository.findOne({
      where: { dividend_id: dividendId },
    });
  }

  async findByRaceId(raceId: string): Promise<DividendRate[]> {
    return this.dividendRatesRepository.find({
      where: { raceId },
      order: { pool: 'ASC' },
    });
  }

  async findByDate(date: string): Promise<DividendRate[]> {
    return this.dividendRatesRepository.find({
      where: { rcDate: date },
      order: { rcNo: 'ASC', pool: 'ASC' },
    });
  }

  async create(dividendData: Partial<DividendRate>): Promise<DividendRate> {
    const dividend = this.dividendRatesRepository.create(dividendData);
    return this.dividendRatesRepository.save(dividend);
  }

  async update(
    dividendId: string,
    dividendData: Partial<DividendRate>
  ): Promise<DividendRate | null> {
    await this.dividendRatesRepository.update(
      { dividend_id: dividendId },
      dividendData
    );
    return this.findById(dividendId);
  }

  async delete(dividendId: string): Promise<void> {
    await this.dividendRatesRepository.delete({ dividend_id: dividendId });
  }

  /**
   * KRA API 데이터로부터 확정 배당율 생성
   */
  async createFromKraData(kraData: any): Promise<DividendRate> {
    try {
      const dividendId = `${kraData.meet}_${kraData.rc_date}_${kraData.rc_no}_${kraData.pool}`;

      // 기존 데이터 확인
      const existingDividend = await this.dividendRatesRepository.findOne({
        where: {
          dividend_id: dividendId,
        },
      });

      if (existingDividend) {
        this.logger.log(
          `확정 배당율 업데이트: ${existingDividend.dividend_id}`
        );
        return await this.update(
          existingDividend.dividend_id,
          this.mapKraDataToDividendRate(kraData)
        );
      }

      // 새 데이터 생성
      const dividendData = this.mapKraDataToDividendRate(kraData);
      const dividend = this.dividendRatesRepository.create(dividendData);

      this.logger.log(`새 확정 배당율 생성: ${dividend.dividend_id}`);
      return await this.dividendRatesRepository.save(dividend);
    } catch (error) {
      this.logger.error(`확정 배당율 저장 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * KRA 데이터를 DividendRate 엔티티로 매핑
   */
  private mapKraDataToDividendRate(kraData: any): Partial<DividendRate> {
    // 안전한 값 변환 함수
    const safeParseFloat = (value: any): number | null => {
      if (!value) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const safeParseInt = (value: any): number | null => {
      if (!value) return null;
      const parsed = parseInt(value);
      return isNaN(parsed) ? null : parsed;
    };

    return {
      dividend_id: `${kraData.meet}_${kraData.rc_date}_${kraData.rc_no}_${kraData.pool}`,
      raceId: `${kraData.meet}_${kraData.rc_date}_${kraData.rc_no}`,
      meet: kraData.meet || '',
      meetName: kraData.meet_name || '',
      rcDate: kraData.rc_date || '',
      rcNo: kraData.rc_no || '',
      pool: kraData.pool || '',
      poolName: kraData.pool_name || '',
      odds: safeParseFloat(kraData.odds),
      chulNo: kraData.chul_no || null,
      chulNo2: kraData.chul_no2 || null,
      chulNo3: kraData.chul_no3 || null,
      raceName: kraData.race_name || null,
      raceDistance: kraData.race_distance || null,
      raceGrade: kraData.race_grade || null,
      raceCondition: kraData.race_condition || null,
      weather: kraData.weather || null,
      track: kraData.track || null,
      trackCondition: kraData.track_condition || null,
      totalEntries: safeParseInt(kraData.total_entries),
      winningCombinations: safeParseInt(kraData.winning_combinations),
      apiVersion: kraData.api_version || 'API160_1',
      dataSource: kraData.data_source || 'KRA',
      impliedProbability: safeParseFloat(kraData.implied_probability),
      profitMargin: kraData.profit_margin || null,
    };
  }

  /**
   * 오래된 데이터 삭제
   */
  async deleteOldData(cutoffDate: string): Promise<void> {
    try {
      const result = await this.dividendRatesRepository
        .createQueryBuilder()
        .delete()
        .from(DividendRate)
        .where('rc_date < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `${cutoffDate} 이전 확정 배당율 ${result.affected}개 삭제 완료`
      );
    } catch (error) {
      this.logger.error(`오래된 확정 배당율 삭제 실패: ${error.message}`);
      throw error;
    }
  }
}
