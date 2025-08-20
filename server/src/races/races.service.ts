import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Race } from '../entities/race.entity';

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  constructor(
    @InjectRepository(Race)
    private racesRepository: Repository<Race>
  ) {}

  async findAll(): Promise<Race[]> {
    return this.racesRepository.find({
      order: { date: 'DESC' },
    });
  }

  async findById(id: string): Promise<Race | null> {
    return this.racesRepository.findOne({
      where: { id },
    });
  }

  async findByDate(date: string): Promise<Race[]> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    return this.racesRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: { raceNumber: 'ASC' },
    });
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
}
