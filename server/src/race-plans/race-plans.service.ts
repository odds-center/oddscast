import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RacePlan } from '../entities/race-plan.entity';

@Injectable()
export class RacePlansService {
  private readonly logger = new Logger(RacePlansService.name);

  constructor(
    @InjectRepository(RacePlan)
    private racePlansRepository: Repository<RacePlan>
  ) {}

  async findAll(): Promise<RacePlan[]> {
    return this.racePlansRepository.find({
      order: { rcDate: 'DESC', rcNo: 'ASC' },
    });
  }

  async findById(planId: string): Promise<RacePlan | null> {
    return this.racePlansRepository.findOne({
      where: { planId },
    });
  }

  async findByDate(date: string): Promise<RacePlan[]> {
    return this.racePlansRepository.find({
      where: { rcDate: date },
      order: { rcNo: 'ASC' },
    });
  }

  async findByMeet(meet: string): Promise<RacePlan[]> {
    return this.racePlansRepository.find({
      where: { meet },
      order: { rcDate: 'DESC', rcNo: 'ASC' },
    });
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
}
