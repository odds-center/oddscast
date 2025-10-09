import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Result } from './entities/result.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(
    @InjectRepository(Result)
    private resultsRepository: Repository<Result>
  ) {}

  async findAll(): Promise<Result[]> {
    return this.resultsRepository.find({
      order: { rcDate: 'DESC', rcNo: 'ASC' },
    });
  }

  async findById(resultId: string): Promise<Result | null> {
    return this.resultsRepository.findOne({
      where: { resultId },
    });
  }

  async findByRaceId(raceId: string): Promise<Result[]> {
    return this.resultsRepository.find({
      where: { raceId },
      order: { ord: 'ASC' },
    });
  }

  async findByDate(date: string): Promise<Result[]> {
    return this.resultsRepository.find({
      where: { rcDate: date },
      order: { rcNo: 'ASC', ord: 'ASC' },
    });
  }

  async create(resultData: Partial<Result>): Promise<Result> {
    const result = this.resultsRepository.create(resultData);
    return this.resultsRepository.save(result);
  }

  async update(
    resultId: string,
    resultData: Partial<Result>
  ): Promise<Result | null> {
    await this.resultsRepository.update(resultId, resultData);
    return this.findById(resultId);
  }

  async delete(resultId: string): Promise<void> {
    await this.resultsRepository.delete(resultId);
  }

  /**
   * 전체 데이터 개수 조회
   */
  async count(): Promise<number> {
    return this.resultsRepository.count();
  }

  /**
   * 데이터 날짜 범위 조회
   */
  async getDateRange(): Promise<{ minDate: string; maxDate: string } | null> {
    try {
      const result = await this.resultsRepository
        .createQueryBuilder('result')
        .select('MIN(result.rcDate)', 'minDate')
        .addSelect('MAX(result.rcDate)', 'maxDate')
        .getRawOne();

      return result;
    } catch (error) {
      this.logger.error('날짜 범위 조회 실패:', error);
      return null;
    }
  }

  /**
   * KRA API 데이터로부터 경주 결과 생성
   */
  async createFromKraData(kraData: any): Promise<Result> {
    try {
      // 기존 데이터 확인
      const existingResult = await this.resultsRepository.findOne({
        where: {
          resultId: `${kraData.meet}_${kraData.rc_date}_${kraData.rc_no}_${kraData.ord}`,
        },
      });

      if (existingResult) {
        this.logger.log(`경주 결과 업데이트: ${existingResult.resultId}`);
        return await this.update(
          existingResult.resultId,
          this.mapKraDataToResult(kraData)
        );
      }

      // 새 데이터 생성
      const resultData = this.mapKraDataToResult(kraData);
      const result = this.resultsRepository.create(resultData);

      this.logger.log(`새 경주 결과 생성: ${result.resultId}`);
      return await this.resultsRepository.save(result);
    } catch (error) {
      this.logger.error(`경주 결과 저장 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * KRA 데이터를 Result 엔티티로 매핑
   */
  private mapKraDataToResult(kraData: any): Partial<Result> {
    return {
      resultId: `${kraData.meet}_${kraData.rc_date}_${kraData.rc_no}_${kraData.ord}`,
      raceId: `${kraData.meet}_${kraData.rc_date}_${kraData.rc_no}`,
      meet: kraData.meet,
      meetName: kraData.meet_name,
      rcDate: kraData.rc_date,
      rcNo: kraData.rc_no,
      rcName: kraData.rc_name,
      rcDist: kraData.rc_dist,
      rcGrade: kraData.rc_grade,
      rcCondition: kraData.rc_condition,
      ord: kraData.ord,
      hrName: kraData.hr_name,
      hrNo: kraData.hr_no,
      hrNameEn: kraData.hr_name_en,
      hrNationality: kraData.hr_nationality,
      hrAge: kraData.hr_age,
      hrGender: kraData.hr_gender,
      hrWeight: kraData.hr_weight,
      hrRating: kraData.hr_rating,
      jkName: kraData.jk_name,
      jkNo: kraData.jk_no,
      jkNameEn: kraData.jk_name_en,
      trName: kraData.tr_name,
      trNo: kraData.tr_no,
      trNameEn: kraData.tr_name_en,
      owName: kraData.ow_name,
      owNo: kraData.ow_no,
      owNameEn: kraData.ow_name_en,
      rcRank: kraData.rc_rank,
      rcTime: kraData.rc_time,
      rcPrize: kraData.rc_prize ? parseInt(kraData.rc_prize) : null,
      rcPrize2: kraData.rc_prize_2 ? parseInt(kraData.rc_prize_2) : null,
      rcPrize3: kraData.rc_prize_3 ? parseInt(kraData.rc_prize_3) : null,
      rcPrize4: kraData.rc_prize_4 ? parseInt(kraData.rc_prize_4) : null,
      rcPrize5: kraData.rc_prize_5 ? parseInt(kraData.rc_prize_5) : null,
      rcDay: kraData.rc_day,
      rcWeekday: kraData.rc_weekday,
      rcAgeCondition: kraData.rc_age_condition,
      rcSexCondition: kraData.rc_sex_condition,
      rcTrackCondition: kraData.rc_track_condition,
      rcPrizeBonus1: kraData.rc_prize_bonus1
        ? parseInt(kraData.rc_prize_bonus1)
        : null,
      rcPrizeBonus2: kraData.rc_prize_bonus2
        ? parseInt(kraData.rc_prize_bonus2)
        : null,
      rcPrizeBonus3: kraData.rc_prize_bonus3
        ? parseInt(kraData.rc_prize_bonus3)
        : null,
      rcTime400: kraData.rc_time_400,
      rcTime600: kraData.rc_time_600,
      rcTime800: kraData.rc_time_800,
      rcTime1000: kraData.rc_time_1000,
      rcTime1200: kraData.rc_time_1200,
      rcTime1400: kraData.rc_time_1400,
      rcTime1600: kraData.rc_time_1600,
      rcTime1800: kraData.rc_time_1800,
      rcTime2000: kraData.rc_time_2000,
      rcGap: kraData.rc_gap,
      rcGap400: kraData.rc_gap_400,
      rcGap600: kraData.rc_gap_600,
      rcGap800: kraData.rc_gap_800,
      rcGap1000: kraData.rc_gap_1000,
      rcGap1200: kraData.rc_gap_1200,
      rcGap1400: kraData.rc_gap_1400,
      rcGap1600: kraData.rc_gap_1600,
      rcGap1800: kraData.rc_gap_1800,
      rcGap2000: kraData.rc_gap_2000,
      hrWeightBefore: kraData.hr_weight_before,
      hrWeightAfter: kraData.hr_weight_after,
      hrWeightChange: kraData.hr_weight_change,
      apiVersion: kraData.api_version || 'API4_3',
      dataSource: kraData.data_source || 'KRA',
      speedRating: kraData.speed_rating
        ? parseFloat(kraData.speed_rating)
        : null,
      performanceGrade: kraData.performance_grade,
    };
  }

  /**
   * 오래된 데이터 삭제
   */
  async deleteOldData(cutoffDate: string): Promise<void> {
    try {
      const result = await this.resultsRepository
        .createQueryBuilder()
        .delete()
        .from(Result)
        .where('rc_date < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `${cutoffDate} 이전 경주 결과 ${result.affected}개 삭제 완료`
      );
    } catch (error) {
      this.logger.error(`오래된 경주 결과 삭제 실패: ${error.message}`);
      throw error;
    }
  }
}
