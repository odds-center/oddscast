import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet, BetStatus, BetResult } from './entities/bet.entity';
import { Race } from '../races/entities/race.entity';
import { Result } from '../results/entities/result.entity';
import { BetValidatorService } from './bet-validator.service';
import * as moment from 'moment-timezone';

/**
 * 베팅 결과 자동 확인 서비스
 *
 * 경주 종료 후 베팅 결과 자동 확인 및 통계 업데이트
 */
@Injectable()
export class BetResultCheckerService {
  private readonly logger = new Logger(BetResultCheckerService.name);

  constructor(
    @InjectRepository(Bet)
    private readonly betRepo: Repository<Bet>,
    @InjectRepository(Race)
    private readonly raceRepo: Repository<Race>,
    @InjectRepository(Result)
    private readonly resultRepo: Repository<Result>,
    private readonly validator: BetValidatorService
  ) {}

  /**
   * 5분마다 - 경주 종료 후 베팅 결과 확인
   */
  @Cron('*/5 * * * *', {
    name: 'check-bet-results',
    timeZone: 'Asia/Seoul',
  })
  async checkPendingBets() {
    this.logger.log('🔍 [베팅 결과 확인] 시작');

    const now = moment().tz('Asia/Seoul');
    const fiveMinutesAgo = moment(now).subtract(5, 'minutes');

    // 5분 전에 종료된 경주 조회
    const finishedRaces = await this.raceRepo
      .createQueryBuilder('race')
      .where('race.rcDate = :date', { date: now.format('YYYY-MM-DD') })
      .andWhere('race.rcTime BETWEEN :start AND :end', {
        start: fiveMinutesAgo.format('HH:mm:ss'),
        end: now.format('HH:mm:ss'),
      })
      .getMany();

    if (finishedRaces.length === 0) {
      this.logger.debug('[베팅 결과 확인] 확인 대상 경주 없음');
      return;
    }

    this.logger.log(`[베팅 결과 확인] ${finishedRaces.length}개 경주 확인`);

    let checkedCount = 0;

    for (const race of finishedRaces) {
      try {
        await this.checkRaceBets(race.id);
        checkedCount++;
      } catch (error) {
        this.logger.error(`❌ 경주 결과 확인 실패: ${race.id}`, error.stack);
      }
    }

    this.logger.log(`✅ [베팅 결과 확인] 완료: ${checkedCount}개 경주`);
  }

  /**
   * 특정 경주의 모든 베팅 결과 확인
   */
  async checkRaceBets(raceId: string): Promise<void> {
    this.logger.log(`경주 ${raceId} 베팅 결과 확인 시작`);

    // 1. 경주 결과 조회
    const results = await this.resultRepo.find({
      where: { raceId },
      order: { ord: 'ASC' },
    });

    if (results.length < 3) {
      this.logger.warn(`결과 부족 (${results.length}개): ${raceId}`);
      return;
    }

    // 2. 1,2,3위 마번 추출
    const actualResult = results.slice(0, 3).map(r => parseInt(r.hrNo, 10));

    this.logger.log(`경주 ${raceId} 결과: [${actualResult.join(', ')}]`);

    // 3. 대기 중인 베팅 조회
    const pendingBets = await this.betRepo.find({
      where: { raceId, betStatus: BetStatus.PENDING },
    });

    if (pendingBets.length === 0) {
      this.logger.debug(`대기 중인 베팅 없음: ${raceId}`);
      return;
    }

    this.logger.log(`${pendingBets.length}개 베팅 결과 확인`);

    let wonCount = 0;
    let lostCount = 0;

    // 4. 각 베팅 결과 확인
    for (const bet of pendingBets) {
      try {
        const isWon = this.validator.validate(
          bet.betType,
          bet.selections.horses,
          actualResult
        );

        bet.betStatus = BetStatus.COMPLETED;
        bet.betResult = isWon ? BetResult.WIN : BetResult.LOSE;
        bet.resultTime = new Date();

        // 경주 결과 저장
        bet.raceResult = {
          winner: actualResult[0].toString(),
          second: actualResult[1].toString(),
          third: actualResult[2].toString(),
          finishOrder: actualResult.map(n => n.toString()),
        };

        if (isWon) {
          wonCount++;
          this.logger.log(
            `✅ 당첨: ${bet.id} | ${bet.betType} | ${bet.selections.horses.join('-')}`
          );
        } else {
          lostCount++;
          this.logger.debug(
            `❌ 낙첨: ${bet.id} | ${bet.betType} | ${bet.selections.horses.join('-')}`
          );
        }

        await this.betRepo.save(bet);
      } catch (error) {
        this.logger.error(`베팅 확인 실패: ${bet.id}`, error.stack);
      }
    }

    this.logger.log(`경주 ${raceId} 완료: 당첨 ${wonCount}, 낙첨 ${lostCount}`);
  }

  /**
   * 수동 결과 확인 (특정 경주)
   */
  async manualCheck(raceId: string): Promise<{
    checked: number;
    won: number;
    lost: number;
  }> {
    await this.checkRaceBets(raceId);

    const bets = await this.betRepo.find({ where: { raceId } });
    const won = bets.filter(b => b.betResult === BetResult.WIN).length;
    const lost = bets.filter(b => b.betResult === BetResult.LOSE).length;

    return {
      checked: bets.length,
      won,
      lost,
    };
  }
}
