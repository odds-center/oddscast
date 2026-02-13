import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * KRA API 기반 통계·분석 서비스 (KRA_ANALYSIS_STRATEGY.md 연동)
 * Python analysis.py 호출하여 기수 점수, 말 vs 기수 가중치, 2단계 필터링 수행
 */
@Injectable()
export class AnalysisService {
  private readonly scriptPath = path.join(
    process.cwd(),
    'scripts',
    'analysis.py',
  );

  constructor(private prisma: PrismaService) {}

  /**
   * Python 스크립트 실행 (stdin JSON → stdout JSON)
   */
  private runPythonScript(input: object): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [this.scriptPath], {
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

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(`Python script failed (${code}): ${errorString || dataString}`),
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

  /**
   * 기존 calculate_score (말 기준) — PredictionsService 호환
   */
  async calculateScore(raceData: {
    entries: Array<{ hrNo?: string; rating?: number }>;
  }): Promise<unknown> {
    return this.runPythonScript(raceData);
  }

  /**
   * 2단계 필터링 분석 (마칠기삼·기수 점수·가중치)
   * Race + Entries + JockeyResult + RaceResult 활용
   */
  async analyzeJockey(raceId: string): Promise<{
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
    const race = await this.prisma.race.findUnique({
      where: { id: raceId },
      include: {
        entries: true,
        results: { orderBy: { rcRank: 'asc' } },
      },
    });

    if (!race) throw new NotFoundException('경주를 찾을 수 없습니다');

    // JockeyResult.meet: "1"=서울, "2"=제주, "3"=부경 | Race.meet: "Seoul","Jeju","Busan"
    const meetMap: Record<string, string> = {
      Seoul: '1',
      Jeju: '2',
      Busan: '3',
      서울: '1',
      제주: '2',
      부산: '3',
      부경: '3',
    };
    const meet =
      meetMap[String(race.meet)] ?? (String(race.meet).replace(/[^123]/g, '') || '1');
    const jockeyNos = [...new Set(race.entries.map((e) => e.jkNo).filter(Boolean))] as string[];

    const jockeys = await this.prisma.jockeyResult.findMany({
      where: {
        meet,
        jkNo: { in: jockeyNos },
      },
    });

    const jockeyMap: Record<string, object> = {};
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
      },
      entries: race.entries.map((e) => ({
        hrNo: e.hrNo,
        hrName: e.hrName,
        jkNo: e.jkNo,
        jkName: e.jkName,
        rating: e.rating,
      })),
      jockeyMap,
      results: race.results.map((r) => ({
        rcTime: r.rcTime,
        rcRank: r.rcRank,
      })),
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
    };

    if (result && typeof result === 'object' && 'error' in result) {
      throw new Error(`Analysis error: ${(result as { error: string }).error}`);
    }

    return {
      entriesWithScores: result.entriesWithScores || [],
      weightRatio: result.weightRatio || { horse: 0.7, jockey: 0.3 },
      topPickByJockey: result.topPickByJockey ?? null,
    };
  }
}
