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
}
