import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class AnalysisService {
  private readonly scriptPath = path.join(
    process.cwd(),
    'scripts',
    'analysis.py',
  );

  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceEntry)
    private readonly entryRepo: Repository<RaceEntry>,
    @InjectRepository(RaceResult)
    private readonly resultRepo: Repository<RaceResult>,
    @InjectRepository(JockeyResult)
    private readonly jockeyResultRepo: Repository<JockeyResult>,
  ) {}

  private runPythonScript(input: object): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const pythonBin = process.env.PYTHON_BIN || 'python3';
      const pythonProcess = spawn(pythonBin, [this.scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      pythonProcess.on('error', (err) => {
        reject(
          new Error(
            `Python process spawn error: ${err.message} (code: ${(err as NodeJS.ErrnoException).code ?? 'unknown'})`,
          ),
        );
      });

      pythonProcess.on('close', (code, signal) => {
        if (code !== 0) {
          const detail = errorString || dataString || 'no output';
          const signalInfo = signal ? `, signal: ${signal}` : '';
          reject(
            new Error(
              `Python script failed (exit: ${code}${signalInfo}): ${detail}`,
            ),
          );
        } else {
          try {
            resolve(JSON.parse(dataString));
          } catch {
            reject(new Error(`Failed to parse Python output: ${dataString}`));
          }
        }
      });

      pythonProcess.stdin.write(JSON.stringify(input));
      pythonProcess.stdin.end();
    });
  }

  async calculateScore(raceData: {
    entries: Array<{ hrNo?: string; rating?: number }>;
  }): Promise<unknown> {
    return this.runPythonScript(raceData);
  }

  async analyzeJockey(raceId: number): Promise<{
    entriesWithScores: Array<{
      hrNo: string;
      hrName: string;
      jkNo: string;
      jkName: string;
      horseScore: number;
      jockeyScore: number;
      combinedScore: number;
    }>;
    weightRatio: { horse: number; jockey: number };
    topPickByJockey: {
      hrNo: string;
      hrName: string;
      jkNo: string;
      jkName: string;
      jockeyScore: number;
    } | null;
  }> {
    const race = await this.raceRepo.findOne({
      where: { id: raceId },
      select: [
        'id',
        'meet',
        'meetName',
        'rcDate',
        'rcNo',
        'rcDist',
        'weather',
        'track',
      ],
    });
    if (!race) throw new NotFoundException('경주를 찾을 수 없습니다');

    const entries = await this.entryRepo.find({
      where: { raceId },
      select: ['hrNo', 'hrName', 'jkNo', 'jkName', 'rating'],
    });

    const results = await this.resultRepo
      .createQueryBuilder('rr')
      .select(['rr.rcTime', 'rr.ord'])
      .where('rr.raceId = :raceId', { raceId })
      .andWhere('(rr.ordInt IS NOT NULL OR rr.ordType IS NOT NULL)')
      .orderBy('rr.ordInt', 'ASC')
      .addOrderBy('rr.ord', 'ASC')
      .getMany();

    const meetMap: Record<string, string> = {
      서울: '1',
      제주: '2',
      부산경남: '3',
      부산: '3',
      부경: '3',
      Seoul: '1',
      Jeju: '2',
      Busan: '3',
    };
    const meet =
      meetMap[String(race.meet)] ??
      (String(race.meet).replace(/[^123]/g, '') || '1');
    const jockeyNos = [
      ...new Set(entries.map((e) => e.jkNo).filter(Boolean)),
    ] as string[];
    let jockeys: Array<{
      meet: string;
      jkNo: string;
      winRateTsum: number;
      quRateTsum: number;
      rcCntT: number;
    }> = [];
    if (jockeyNos.length > 0) {
      const jockeyRows = await this.jockeyResultRepo.find({
        where: { meet, jkNo: In(jockeyNos) },
        select: ['meet', 'jkNo', 'winRateTsum', 'quRateTsum', 'rcCntT'],
      });
      jockeys = jockeyRows.map((j) => ({
        meet: j.meet,
        jkNo: j.jkNo,
        winRateTsum: j.winRateTsum,
        quRateTsum: j.quRateTsum,
        rcCntT: j.rcCntT,
      }));
    }

    const jockeyMap: Record<
      string,
      { winRateTsum: number; quRateTsum: number; rcCntT: number }
    > = {};
    for (const j of jockeys) {
      jockeyMap[`${j.meet}_${j.jkNo}`] = {
        winRateTsum: j.winRateTsum,
        quRateTsum: j.quRateTsum,
        rcCntT: j.rcCntT,
      };
    }

    const input = {
      command: 'analyze_jockey',
      race: {
        meet: race.meet,
        meetName: race.meetName,
        rcDate: race.rcDate,
        rcNo: race.rcNo,
        rcDist: race.rcDist,
        weather: race.weather,
        track: race.track ?? undefined,
      },
      entries: entries.map((e) => ({
        hrNo: e.hrNo,
        hrName: e.hrName,
        jkNo: e.jkNo,
        jkName: e.jkName,
        rating: e.rating,
      })),
      jockeyMap,
      results: results.map((r) => ({ rcTime: r.rcTime, ord: r.ord })),
    };

    const result = (await this.runPythonScript(input)) as {
      entriesWithScores?: Array<{
        hrNo: string;
        hrName: string;
        jkNo: string;
        jkName: string;
        horseScore: number;
        jockeyScore: number;
        combinedScore: number;
      }>;
      weightRatio?: { horse: number; jockey: number };
      topPickByJockey?: {
        hrNo: string;
        hrName: string;
        jkNo: string;
        jkName: string;
        jockeyScore: number;
      } | null;
      error?: string;
    };

    if (result && typeof result === 'object' && 'error' in result) {
      throw new Error(`Analysis error: ${result.error}`);
    }

    return {
      entriesWithScores: result.entriesWithScores || [],
      weightRatio: result.weightRatio || { horse: 0.7, jockey: 0.3 },
      topPickByJockey: result.topPickByJockey ?? null,
    };
  }
}
