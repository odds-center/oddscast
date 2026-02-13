#!/usr/bin/env node
/**
 * 샘플 경주 데이터 적재 (KRA API 키 없이 개발용)
 *
 * 용도: KRA_SERVICE_KEY가 없을 때 로컬 개발을 위한 샘플 Race + RaceEntry 데이터
 * 실행: server 디렉토리에서
 *   pnpm run seed:sample-races [YYYYMMDD]
 *
 * 기본: 오늘 또는 최근 주말(금/토/일)
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL 미설정. server/.env에 DATABASE_URL을 추가하세요.');
  }
  const isAccelerate = url.startsWith('prisma://') || url.startsWith('prisma+postgres://');
  if (isAccelerate) {
    return new PrismaClient({ accelerateUrl: url });
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

function getTargetDate() {
  const arg = process.argv[2];
  if (arg) {
    const normalized = arg.replace(/-/g, '').slice(0, 8);
    if (normalized.length === 8) return normalized;
  }
  const d = new Date();
  const day = d.getDay();
  const offset = day >= 5 ? 0 : day === 0 ? -2 : 5 - day;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const MEETS = [
  { name: '서울' },
  { name: '부산경남' },
];

const SAMPLE_ENTRIES = [
  { hrNo: '001', hrName: '다크호스', jkName: '김기수', trName: '이조교', wgBudam: 56 },
  { hrNo: '002', hrName: '썬더볼트', jkName: '박기수', trName: '최조교', wgBudam: 55 },
  { hrNo: '003', hrName: '스타더스트', jkName: '정기수', trName: '김조교', wgBudam: 57 },
  { hrNo: '004', hrName: '라이팅킹', jkName: '강기수', trName: '박조교', wgBudam: 56 },
  { hrNo: '005', hrName: '실버문', jkName: '조기수', trName: '정조교', wgBudam: 54 },
  { hrNo: '006', hrName: '골든에이스', jkName: '윤기수', trName: '강조교', wgBudam: 55 },
  { hrNo: '007', hrName: '블루스카이', jkName: '이기수', trName: '윤조교', wgBudam: 56 },
  { hrNo: '008', hrName: '레드스타', jkName: '한기수', trName: '이조교', wgBudam: 57 },
];

async function main() {
  const rcDate = getTargetDate();
  console.log(`\n📥 샘플 경주 데이터 적재 (rcDate: ${rcDate})\n`);

  let raceCount = 0;
  let entryCount = 0;

  for (const meet of MEETS) {
    for (let r = 1; r <= 6; r++) {
      const rcNo = String(r).padStart(2, '0');
      const rcName = `${r}장 경주`;
      const rcDist = [1000, 1200, 1400, 1600, 1800, 2000][r % 6].toString();

      let race = await prisma.race.findFirst({
        where: { meet: meet.name, rcDate, rcNo },
      });
      if (!race) {
        race = await prisma.race.create({
          data: {
            meet: meet.name,
            meetName: meet.name,
            rcDate,
            rcNo,
            rcDist: rcDist || '1200',
            rcName: rcName || `${r}장`,
            rank: '일반',
            rcCondition: '일반',
            rcPrize: 5000000,
            weather: '맑음',
            track: '보통',
          },
        });
      } else {
        await prisma.race.update({
          where: { id: race.id },
          data: {
            rcDist: rcDist || '1200',
            rcName: rcName || `${r}장`,
            rank: '일반',
            rcPrize: 5000000,
            meetName: meet.name,
          },
        });
      }

      raceCount++;

      for (const e of SAMPLE_ENTRIES) {
        const existing = await prisma.raceEntry.findFirst({
          where: { raceId: race.id, hrNo: e.hrNo },
        });
        const entryData = {
          raceId: race.id,
          hrNo: e.hrNo,
          hrName: e.hrName,
          jkName: e.jkName,
          trName: e.trName,
          wgBudam: e.wgBudam,
          chulNo: e.hrNo,
          dusu: SAMPLE_ENTRIES.length,
          age: 4,
          sex: '거',
          prd: '국산',
          chaksun1: 3000000,
          chaksunT: BigInt(50000000),
          rcCntT: 20,
          ord1CntT: 3,
        };
        if (existing) {
          await prisma.raceEntry.update({
            where: { id: existing.id },
            data: entryData,
          });
        } else {
          await prisma.raceEntry.create({ data: entryData });
        }
        entryCount++;
      }
    }
  }

  console.log(`  ✅ 경주 ${raceCount}건, 출전마 ${entryCount}건 적재 완료`);
  console.log(`  📅 날짜: ${rcDate.slice(0, 4)}-${rcDate.slice(4, 6)}-${rcDate.slice(6, 8)}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
