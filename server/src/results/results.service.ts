import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from '../entities/result.entity';

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
}
