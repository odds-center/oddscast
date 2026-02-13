import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Race } from './entities/race.entity';

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  constructor(
    @InjectRepository(Race)
    private racesRepository: Repository<Race>
  ) {}

  async findAll(): Promise<Race[]> {
    return this.racesRepository.find({
      order: { rcDate: 'DESC' },
    });
  }

  async findById(id: string): Promise<Race | null> {
    return this.racesRepository.findOne({
      where: { id },
    });
  }

  async findByDate(date: string): Promise<Race[]> {
    this.logger.log(`Received date parameter: ${date}`);

    // YYYYMMDD 형식인지 확인
    if (/^\d{8}$/.test(date)) {
      this.logger.log(`Using YYYYMMDD format: ${date}`);
      return this.racesRepository.find({
        where: {
          rcDate: date,
        },
        order: { rcNo: 'ASC' },
      });
    }

    // YYYY-MM-DD 형식인지 확인
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const yyyymmdd = date.replace(/-/g, '');
      this.logger.log(
        `Converting YYYY-MM-DD to YYYYMMDD: ${date} -> ${yyyymmdd}`
      );
      return this.racesRepository.find({
        where: {
          rcDate: yyyymmdd,
        },
        order: { rcNo: 'ASC' },
      });
    }

    this.logger.warn(
      `Invalid date format: ${date}, expected YYYYMMDD or YYYY-MM-DD`
    );
    return [];
  }

  async create(raceData: Partial<Race>): Promise<Race> {
    const race = this.racesRepository.create(raceData);
    return this.racesRepository.save(race);
  }

  async update(id: string, raceData: Partial<Race>): Promise<Race | null> {
    await this.racesRepository.update(id, raceData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.racesRepository.delete(id);
  }

  /**
   * 전체 데이터 개수 조회
   */
  async count(): Promise<number> {
    return this.racesRepository.count();
  }

  /**
   * 데이터 날짜 범위 조회
   */
  async getDateRange(): Promise<{ minDate: string; maxDate: string } | null> {
    try {
      const result = await this.racesRepository
        .createQueryBuilder('race')
        .select('MIN(race.rcDate)', 'minDate')
        .addSelect('MAX(race.rcDate)', 'maxDate')
        .getRawOne();

      return result;
    } catch (error) {
      this.logger.error('날짜 범위 조회 실패:', error);
      return null;
    }
  }
}
