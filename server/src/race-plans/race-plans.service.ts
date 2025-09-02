import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RacePlan } from '../races/entities/race-plan.entity';
import { DataSourceService } from '../data-source/data-source.service';
import { isEmpty, isArray } from 'lodash';

@Injectable()
export class RacePlansService {
  private readonly logger = new Logger(RacePlansService.name);

  constructor(
    @InjectRepository(RacePlan)
    private racePlansRepository: Repository<RacePlan>,
    private readonly dataSourceService: DataSourceService
  ) {}

  async findAll(): Promise<RacePlan[]> {
    // 로컬 DB에서 먼저 조회
    const localData = await this.racePlansRepository.find({
      order: { rcDate: 'DESC', rcNo: 'ASC' },
    });

    if (localData && localData.length > 0) {
      this.logger.log(
        `로컬 DB에서 경주계획 데이터 조회: ${localData.length}건`
      );
      return localData;
    }

    // 로컬 DB에 데이터가 없으면 데이터 소스 서비스 사용
    this.logger.log('로컬 DB에 데이터가 없어 데이터 소스 서비스 사용');
    const response = await this.dataSourceService.getRacePlans();

    if (
      response.success &&
      response.data &&
      isArray(response.data) &&
      !isEmpty(response.data)
    ) {
      return response.data as RacePlan[];
    }

    return [];
  }

  async findById(planId: string): Promise<RacePlan | null> {
    return this.racePlansRepository.findOne({
      where: { planId },
    });
  }

  async findByDate(date: string): Promise<RacePlan[]> {
    // 로컬 DB에서 먼저 조회
    const localData = await this.racePlansRepository.find({
      where: { rcDate: date },
      order: { rcNo: 'ASC' },
    });

    if (localData && localData.length > 0) {
      this.logger.log(
        `로컬 DB에서 ${date} 경주계획 데이터 조회: ${localData.length}건`
      );
      return localData;
    }

    // 로컬 DB에 데이터가 없으면 데이터 소스 서비스 사용
    this.logger.log(`로컬 DB에 ${date} 데이터가 없어 데이터 소스 서비스 사용`);
    const response = await this.dataSourceService.getRacePlans(date);

    if (
      response.success &&
      response.data &&
      isArray(response.data) &&
      !isEmpty(response.data)
    ) {
      return response.data as RacePlan[];
    }

    return [];
  }

  async findByMeet(meet: string): Promise<RacePlan[]> {
    // 로컬 DB에서 먼저 조회
    const localData = await this.racePlansRepository.find({
      where: { meet },
      order: { rcDate: 'DESC', rcNo: 'ASC' },
    });

    if (localData && localData.length > 0) {
      this.logger.log(
        `로컬 DB에서 ${meet} 경주계획 데이터 조회: ${localData.length}건`
      );
      return localData;
    }

    // 로컬 DB에 데이터가 없으면 데이터 소스 서비스 사용
    this.logger.log(`로컬 DB에 ${meet} 데이터가 없어 데이터 소스 서비스 사용`);
    const response = await this.dataSourceService.getRacePlans(undefined, meet);

    if (
      response.success &&
      response.data &&
      isArray(response.data) &&
      !isEmpty(response.data)
    ) {
      return response.data as RacePlan[];
    }

    return [];
  }

  async create(racePlanData: Partial<RacePlan>): Promise<RacePlan> {
    const racePlan = this.racePlansRepository.create(racePlanData);
    return this.racePlansRepository.save(racePlan);
  }

  async update(
    planId: string,
    racePlanData: Partial<RacePlan>
  ): Promise<RacePlan | null> {
    await this.racePlansRepository.update(planId, racePlanData);
    return this.findById(planId);
  }

  async delete(planId: string): Promise<void> {
    await this.racePlansRepository.delete(planId);
  }

  /**
   * 고급 검색 기능
   */
  async searchRacePlans(
    searchCriteria: {
      meet?: string;
      rcDate?: string;
      rcNo?: string;
      rcName?: string;
      minDistance?: number;
      maxDistance?: number;
      grade?: string;
      minPrize?: number;
      maxPrize?: number;
      minRating?: number;
      maxRating?: number;
      ageCondition?: string;
      sexCondition?: string;
    },
    pageNo: number = 1,
    numOfRows: number = 100
  ): Promise<RacePlan[]> {
    const queryBuilder =
      this.racePlansRepository.createQueryBuilder('racePlan');

    if (searchCriteria.meet) {
      queryBuilder.andWhere('racePlan.meet = :meet', {
        meet: searchCriteria.meet,
      });
    }

    if (searchCriteria.rcDate) {
      queryBuilder.andWhere('racePlan.rcDate = :rcDate', {
        rcDate: searchCriteria.rcDate,
      });
    }

    if (searchCriteria.rcNo) {
      queryBuilder.andWhere('racePlan.rcNo = :rcNo', {
        rcNo: searchCriteria.rcNo,
      });
    }

    if (searchCriteria.rcName) {
      queryBuilder.andWhere('racePlan.rcName LIKE :rcName', {
        rcName: `%${searchCriteria.rcName}%`,
      });
    }

    if (searchCriteria.minDistance) {
      queryBuilder.andWhere('racePlan.distance >= :minDistance', {
        minDistance: searchCriteria.minDistance,
      });
    }

    if (searchCriteria.maxDistance) {
      queryBuilder.andWhere('racePlan.distance <= :maxDistance', {
        maxDistance: searchCriteria.maxDistance,
      });
    }

    if (searchCriteria.grade) {
      queryBuilder.andWhere('racePlan.grade = :grade', {
        grade: searchCriteria.grade,
      });
    }

    if (searchCriteria.minPrize) {
      queryBuilder.andWhere('racePlan.prize >= :minPrize', {
        minPrize: searchCriteria.minPrize,
      });
    }

    if (searchCriteria.maxPrize) {
      queryBuilder.andWhere('racePlan.prize <= :maxPrize', {
        maxPrize: searchCriteria.maxPrize,
      });
    }

    if (searchCriteria.minRating) {
      queryBuilder.andWhere('racePlan.rating >= :minRating', {
        minRating: searchCriteria.minRating,
      });
    }

    if (searchCriteria.maxRating) {
      queryBuilder.andWhere('racePlan.rating <= :maxRating', {
        maxRating: searchCriteria.maxRating,
      });
    }

    if (searchCriteria.ageCondition) {
      queryBuilder.andWhere('racePlan.ageCondition = :ageCondition', {
        ageCondition: searchCriteria.ageCondition,
      });
    }

    if (searchCriteria.sexCondition) {
      queryBuilder.andWhere('racePlan.sexCondition = :sexCondition', {
        sexCondition: searchCriteria.sexCondition,
      });
    }

    return await queryBuilder
      .skip((pageNo - 1) * numOfRows)
      .take(numOfRows)
      .orderBy('racePlan.rcDate', 'DESC')
      .addOrderBy('racePlan.rcNo', 'ASC')
      .getMany();
  }

  /**
   * KRA API 데이터로부터 경주 계획 생성
   */
  async createFromKraData(kraData: any): Promise<RacePlan> {
    try {
      // 기존 데이터 확인
      const existingPlan = await this.racePlansRepository.findOne({
        where: {
          planId: `${kraData.meet}_${kraData.rc_date}_${kraData.rc_no}`,
        },
      });

      if (existingPlan) {
        this.logger.log(`경주 계획 업데이트: ${existingPlan.planId}`);
        return await this.update(
          existingPlan.planId,
          this.mapKraDataToRacePlan(kraData)
        );
      }

      // 새 데이터 생성
      const planData = this.mapKraDataToRacePlan(kraData);
      const plan = this.racePlansRepository.create(planData);

      this.logger.log(`새 경주 계획 생성: ${plan.planId}`);
      return await this.racePlansRepository.save(plan);
    } catch (error) {
      this.logger.error(`경주 계획 저장 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * KRA 데이터를 RacePlan 엔티티로 매핑
   */
  private mapKraDataToRacePlan(kraData: any): Partial<RacePlan> {
    return {
      planId: `${kraData.meet}_${kraData.rc_date}_${kraData.rc_no}`,
      meet: kraData.meet,
      meetName: kraData.meet_name,
      rcDate: kraData.rc_date,
      rcNo: kraData.rc_no,
      rcName: kraData.rc_name,
      rcDist: kraData.rc_dist,
      rcGrade: kraData.rc_grade,
      rcPrize: kraData.rc_prize ? parseInt(kraData.rc_prize) : null,
      rcCondition: kraData.rc_condition,
      rcPrize2: kraData.rc_prize_2 ? parseInt(kraData.rc_prize_2) : null,
      rcPrize3: kraData.rc_prize_3 ? parseInt(kraData.rc_prize_3) : null,
      rcPrize4: kraData.rc_prize_4 ? parseInt(kraData.rc_prize_4) : null,
      rcPrize5: kraData.rc_prize_5 ? parseInt(kraData.rc_prize_5) : null,
      rcPrizeBonus1: kraData.rc_prize_bonus1
        ? parseInt(kraData.rc_prize_bonus1)
        : null,
      rcPrizeBonus2: kraData.rc_prize_bonus2
        ? parseInt(kraData.rc_prize_bonus2)
        : null,
      rcPrizeBonus3: kraData.rc_prize_bonus3
        ? parseInt(kraData.rc_prize_bonus3)
        : null,
      rcRatingMin: kraData.rc_rating_min,
      rcRatingMax: kraData.rc_rating_max,
      rcAgeCondition: kraData.rc_age_condition,
      rcSexCondition: kraData.rc_sex_condition,
      rcStartTime: kraData.rc_start_time,
      rcEndTime: kraData.rc_end_time,
      rcDay: kraData.rc_day,
      rcWeekday: kraData.rc_weekday,
      rcWeather: kraData.rc_weather,
      rcTrack: kraData.rc_track,
      rcTrackCondition: kraData.rc_track_condition,
      rcRemarks: kraData.rc_remarks,
      apiVersion: kraData.api_version || 'API72_2',
      dataSource: kraData.data_source || 'KRA',
      totalPrize: kraData.total_prize ? parseInt(kraData.total_prize) : null,
      expectedEntries: kraData.expected_entries
        ? parseInt(kraData.expected_entries)
        : null,
      planStatus: kraData.plan_status || 'DRAFT',
      raceCategory: kraData.race_category,
      surfaceType: kraData.surface_type,
      trackConditionForecast: kraData.track_condition_forecast,
    };
  }

  /**
   * 오래된 데이터 삭제
   */
  async deleteOldData(cutoffDate: string): Promise<void> {
    try {
      const result = await this.racePlansRepository
        .createQueryBuilder()
        .delete()
        .from(RacePlan)
        .where('rc_date < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(
        `${cutoffDate} 이전 경주 계획 ${result.affected}개 삭제 완료`
      );
    } catch (error) {
      this.logger.error(`오래된 경주 계획 삭제 실패: ${error.message}`);
      throw error;
    }
  }
}
