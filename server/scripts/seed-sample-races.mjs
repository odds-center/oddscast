#!/usr/bin/env node
/**
 * Sample race data seed (dev without KRA API key).
 * Uses pg only; no Prisma.
 *
 * Run from server dir: pnpm run seed:sample-races [YYYYMMDD]
 * Or use Admin API: POST /api/admin/kra/seed-sample?date=YYYYMMDD
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

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

const MEETS = [{ name: '서울' }, { name: '부산경남' }];

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
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL not set. Add it to server/.env');
  }

  const rcDate = getTargetDate();
  console.log(`\n📥 Sample race seed (rcDate: ${rcDate})\n`);

  let raceCount = 0;
  let entryCount = 0;

  for (const meet of MEETS) {
    for (let r = 1; r <= 6; r++) {
      const rcNo = String(r).padStart(2, '0');
      const rcName = `${r}장 경주`;
      const rcDist = [1000, 1200, 1400, 1600, 1800, 2000][r % 6].toString();

      const existing = await pool.query(
        `SELECT id FROM oddscast.races WHERE meet = $1 AND "rcDate" = $2 AND "rcNo" = $3`,
        [meet.name, rcDate, rcNo],
      );
      let raceId;
      if (existing.rows.length === 0) {
        const ins = await pool.query(
          `INSERT INTO oddscast.races (meet, "meetName", "rcDate", "rcNo", "rcDist", "rcName", rank, "rcCondition", "rcPrize", weather, track, status)
           VALUES ($1, $2, $3, $4, $5, $6, '일반', '일반', 5000000, '맑음', '보통', 'SCHEDULED')
           RETURNING id`,
          [meet.name, meet.name, rcDate, rcNo, rcDist || '1200', rcName || `${r}장`],
        );
        raceId = ins.rows[0].id;
      } else {
        raceId = existing.rows[0].id;
        await pool.query(
          `UPDATE oddscast.races SET "rcDist" = $1, "rcName" = $2, rank = '일반', "rcPrize" = 5000000, "meetName" = $3, "updatedAt" = NOW() WHERE id = $4`,
          [rcDist || '1200', rcName || `${r}장`, meet.name, raceId],
        );
      }

      raceCount++;

      for (const e of SAMPLE_ENTRIES) {
        const exEntry = await pool.query(
          `SELECT id FROM oddscast.race_entries WHERE "raceId" = $1 AND "hrNo" = $2`,
          [raceId, e.hrNo],
        );
        const entryPayload = [
          raceId,
          e.hrNo,
          e.hrName,
          e.jkName,
          e.trName,
          e.wgBudam,
          e.hrNo,
          SAMPLE_ENTRIES.length,
          4,
          '거',
          '국산',
          3000000,
          '50000000',
          20,
          3,
        ];
        if (exEntry.rows.length === 0) {
          await pool.query(
            `INSERT INTO oddscast.race_entries ("raceId", "hrNo", "hrName", "jkName", "trName", "wgBudam", "chulNo", dusu, age, sex, prd, chaksun1, "chaksunT", "rcCntT", "ord1CntT")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::bigint, $14, $15)`,
            entryPayload,
          );
        } else {
          await pool.query(
            `UPDATE oddscast.race_entries SET "hrName" = $1, "jkName" = $2, "trName" = $3, "wgBudam" = $4, "chulNo" = $5, dusu = $6, age = $7, sex = $8, prd = $9, chaksun1 = $10, "chaksunT" = $11::bigint, "rcCntT" = $12, "ord1CntT" = $13 WHERE id = $14`,
            [
              e.hrName,
              e.jkName,
              e.trName,
              e.wgBudam,
              e.hrNo,
              SAMPLE_ENTRIES.length,
              4,
              '거',
              '국산',
              3000000,
              '50000000',
              20,
              3,
              exEntry.rows[0].id,
            ],
          );
        }
        entryCount++;
      }
    }
  }

  console.log(`  ✅ Races ${raceCount}, entries ${entryCount}`);
  console.log(`  📅 ${rcDate.slice(0, 4)}-${rcDate.slice(4, 6)}-${rcDate.slice(6, 8)}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
