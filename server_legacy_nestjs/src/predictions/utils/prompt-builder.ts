import { Race } from '../../races/entities/race.entity';
import { EntryDetail } from '../../races/entities/entry-detail.entity';
import { buildPredictionPrompt, RaceData, HorseData } from '../../llm';

/**
 * 경주 데이터를 LLM 프롬프트용 데이터로 변환
 */
export class PromptBuilder {
  /**
   * 경주 엔티티를 RaceData로 변환
   */
  static buildRaceData(race: Race, entries: EntryDetail[]): RaceData {
    return {
      raceName: race.rcName || `${race.rcNo}R`,
      raceDate: race.rcDate,
      trackName: race.meet || '서울',
      distance: parseInt(race.rcDist || '1200', 10),
      trackCondition: this.getTrackCondition(race),
      weather: this.getWeather(race),
      horses: entries.map(entry => this.buildHorseData(entry)),
    };
  }

  /**
   * 출전마 데이터 변환
   */
  private static buildHorseData(entry: EntryDetail): HorseData {
    // 최근 성적 파싱 (실제 필드는 없으므로 빈 배열)
    const recentRanks = this.parseRecentRanks('');
    const recentTimes = this.parseRecentTimes('');

    // 마번 파싱
    const horseNumber = parseInt(entry.hrNo || '0', 10);

    return {
      number: horseNumber,
      name: entry.hrName || '미상',
      age: parseInt(entry.hrAge || '3', 10),
      sex: entry.hrGender || '수',
      weight: parseInt(entry.hrWeightBefore || '450', 10),
      jockey: entry.jkName || '미상',
      trainer: entry.trName || '미상',

      // 최근 성적 (TODO: 실제 데이터 연동)
      recentRanks,
      recentTimes,

      // 통계 (TODO: 실제 통계 데이터 연동)
      wins: 0,
      places: 0,
      shows: 0,
      totalRaces: 0,
      winRate: 0,

      // 적성
      distancePerformance: this.getDistancePerformance(entry),
      trackConditionPerformance: this.getTrackConditionPerformance(entry),

      // 기수/조교사 승률 (TODO: 실제 데이터 연동)
      jockeyWinRate: 15.5,
      trainerWinRate: 18.2,
    };
  }

  /**
   * 최근 순위 파싱 (예: "1-3-2-4-5" -> [1, 3, 2, 4, 5])
   */
  private static parseRecentRanks(rankString: string): number[] {
    if (!rankString) return [];

    return rankString
      .split('-')
      .map(r => parseInt(r, 10))
      .filter(n => !isNaN(n))
      .slice(0, 5); // 최근 5경주
  }

  /**
   * 최근 기록 파싱 (예: "1:12.3-1:13.5-1:11.8")
   */
  private static parseRecentTimes(timeString: string): string[] {
    if (!timeString) return [];

    return timeString
      .split('-')
      .filter(t => t.length > 0)
      .slice(0, 5);
  }

  /**
   * 주로 상태 가져오기
   */
  private static getTrackCondition(race: Race): string {
    // TODO: 실제 데이터 매핑
    return '양호';
  }

  /**
   * 날씨 가져오기
   */
  private static getWeather(race: Race): string {
    // TODO: 실제 데이터 매핑
    return '맑음';
  }

  /**
   * 거리 적성 정보
   */
  private static getDistancePerformance(entry: EntryDetail): string {
    // TODO: 실제 성적 데이터 연동
    return '데이터 없음';
  }

  /**
   * 주로 상태 적성 정보
   */
  private static getTrackConditionPerformance(entry: EntryDetail): string {
    // TODO: 주로 상태별 성적 데이터가 있다면 활용
    return '양호';
  }

  /**
   * 프롬프트 생성
   */
  static buildPrompt(race: Race, entries: EntryDetail[]): string {
    const raceData = this.buildRaceData(race, entries);
    return buildPredictionPrompt(raceData);
  }
}
