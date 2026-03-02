import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalConfig } from '../database/entities/global-config.entity';

@Injectable()
export class GlobalConfigService {
  constructor(
    @InjectRepository(GlobalConfig)
    private readonly configRepo: Repository<GlobalConfig>,
  ) {}

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.configRepo.find({ select: ['key', 'value'] });
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  }

  async get(key: string): Promise<string | null> {
    const row = await this.configRepo.findOne({
      where: { key },
      select: ['value'],
    });
    return row?.value ?? null;
  }

  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const val = await this.get(key);
    if (val === null || val === undefined) return defaultValue;
    return val === 'true' || val === '1' || val === 'yes';
  }

  async set(key: string, value: string): Promise<void> {
    await this.configRepo.upsert(
      { key, value, updatedAt: new Date() },
      { conflictPaths: ['key'] },
    );
  }
}
