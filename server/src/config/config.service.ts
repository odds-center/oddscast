import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GlobalConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * 전체 설정을 key-value 맵으로 반환
   */
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.globalConfig.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  }

  /**
   * 단일 키 조회
   */
  async get(key: string): Promise<string | null> {
    const row = await this.prisma.globalConfig.findUnique({
      where: { key: key },
    });
    return row?.value ?? null;
  }

  /**
   * 키에 해당하는 boolean 값 (show_google_login 등)
   */
  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const val = await this.get(key);
    if (val === null || val === undefined) return defaultValue;
    return val === 'true' || val === '1' || val === 'yes';
  }

  /**
   * 설정 upsert (Admin용)
   */
  async set(key: string, value: string): Promise<void> {
    await this.prisma.globalConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
