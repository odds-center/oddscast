/**
 * KRA API 응답 데이터를 우리 DB 엔티티에 맞게 매핑하는 유틸리티
 *
 * KRA API 응답: snake_case (rc_date, rc_no, rc_name)
 * 우리 DB 엔티티: camelCase (rcDate, rcNo, rcName)
 */

import BigNumber from 'bignumber.js';
import { KraRacePlan } from '../external-apis/kra/dto/kra-race-plans.dto';
import { KraRaceRecord } from '../external-apis/kra/dto/kra-race-records.dto';
import { KraDividendItem } from '../external-apis/kra/dto/kra-dividend.dto';

/**
 * KRA 경주계획 데이터를 우리 RacePlan 엔티티에 매핑
 *
 * KRA API 응답: rc_date, rc_no, rc_name, rc_dist, rc_grade, rc_prize
 * 우리 DB: rcDate, rcNo, rcName, rcDist, rcGrade, rcPrize
 */
export function mapKraRacePlanToRacePlan(kraPlan: KraRacePlan) {
  return {
    planId: `${kraPlan.rc_date}_${kraPlan.meet}_${kraPlan.rc_no}`,
    meet: kraPlan.meet,
    meetName: kraPlan.meet_name,
    rcDate: kraPlan.rc_date,
    rcNo: kraPlan.rc_no,
    rcName: kraPlan.rc_name,
    rcDist: kraPlan.rc_dist,
    rcGrade: kraPlan.rc_grade,
    rcCondition: kraPlan.rc_condition,
    rcPrize: new BigNumber(kraPlan.rc_prize || 0).toNumber(),
    rcPrize2: kraPlan.rc_prize_2
      ? new BigNumber(kraPlan.rc_prize_2).toNumber()
      : undefined,
    rcPrize3: kraPlan.rc_prize_3
      ? new BigNumber(kraPlan.rc_prize_3).toNumber()
      : undefined,
    rcPrize4: kraPlan.rc_prize_4
      ? new BigNumber(kraPlan.rc_prize_4).toNumber()
      : undefined,
    rcPrize5: kraPlan.rc_prize_5
      ? new BigNumber(kraPlan.rc_prize_5).toNumber()
      : undefined,
    rcPrizeBonus1: kraPlan.rc_prize_bonus1
      ? new BigNumber(kraPlan.rc_prize_bonus1).toNumber()
      : undefined,
    rcPrizeBonus2: kraPlan.rc_prize_bonus2
      ? new BigNumber(kraPlan.rc_prize_bonus2).toNumber()
      : undefined,
    rcPrizeBonus3: kraPlan.rc_prize_bonus3
      ? new BigNumber(kraPlan.rc_prize_bonus3).toNumber()
      : undefined,
    rcRatingMin: kraPlan.rc_rating_min,
    rcRatingMax: kraPlan.rc_rating_max,
    rcAgeCondition: kraPlan.rc_age_condition,
    rcSexCondition: kraPlan.rc_sex_condition,
    rcStartTime: kraPlan.rc_start_time,
    rcEndTime: kraPlan.rc_end_time,
    rcDay: kraPlan.rc_day,
    rcWeekday: kraPlan.rc_weekday,
    rcWeather: kraPlan.rc_weather,
    rcTrack: kraPlan.rc_track,
    rcTrackCondition: kraPlan.rc_track_condition,
    rcRemarks: kraPlan.rc_remarks,
    apiVersion: 'API72_2',
    dataSource: 'KRA',
  };
}

/**
 * KRA 경주기록 데이터를 우리 RaceHorseResult 엔티티에 매핑
 *
 * KRA API 응답: rc_date, rc_no, hr_no, hr_name, ord, rc_time
 * 우리 DB: rcDate, rcNo, hrNumber, hrName, rcRank, rcTime
 */
export function mapKraRaceRecordToRaceHorseResult(kraRecord: KraRaceRecord) {
  return {
    result_id: `${kraRecord.rc_date}_${kraRecord.meet}_${kraRecord.rc_no}_${kraRecord.hr_no}`,
    meet: kraRecord.meet,
    meetName: kraRecord.meet_name,
    hrName: kraRecord.hr_name,
    hrNumber: kraRecord.hr_no,
    rcDate: kraRecord.rc_date,
    rcNo: kraRecord.rc_no,
    rcRank: kraRecord.ord, // KRA API의 'ord' 필드가 순위
    rcTime: kraRecord.rc_time, // KRA API의 'rc_time' 필드가 경주기록
    // 추가 필드들
    rcName: kraRecord.rc_name,
    rcDist: kraRecord.rc_dist,
    rcGrade: kraRecord.rc_grade,
    rcPrize: new BigNumber(kraRecord.rc_prize || 0).toNumber(),
    rcWeather: kraRecord.rc_weather,
    rcTrack: kraRecord.rc_track,
    rcStartTime: kraRecord.rc_start_time,
    rcEndTime: kraRecord.rc_end_time,
    // 출전마 정보
    hrNameEn: kraRecord.hr_name_en,
    hrNationality: kraRecord.hr_nationality,
    hrAge: kraRecord.hr_age,
    hrGender: kraRecord.hr_gender,
    hrWeight: new BigNumber(kraRecord.hr_weight || 0).toNumber(),
    hrRating: kraRecord.hr_rating,
    // 기수/조교사 정보
    jkName: kraRecord.jk_name,
    jkNameEn: kraRecord.jk_name_en,
    jkNo: kraRecord.jk_no,
    trName: kraRecord.tr_name,
    trNameEn: kraRecord.tr_name_en,
    trNo: kraRecord.tr_no,
    // 마주 정보
    owName: kraRecord.ow_name,
    owNameEn: kraRecord.ow_name_en,
    owNo: kraRecord.ow_no,
    // 추가 상금 정보
    rcPrize2: kraRecord.rc_prize_2
      ? new BigNumber(kraRecord.rc_prize_2).toNumber()
      : undefined,
    rcPrize3: kraRecord.rc_prize_3
      ? new BigNumber(kraRecord.rc_prize_3).toNumber()
      : undefined,
    rcPrize4: kraRecord.rc_prize_4
      ? new BigNumber(kraRecord.rc_prize_4).toNumber()
      : undefined,
    rcPrize5: kraRecord.rc_prize_5
      ? new BigNumber(kraRecord.rc_prize_5).toNumber()
      : undefined,
    rcPrizeBonus1: kraRecord.rc_prize_bonus1
      ? new BigNumber(kraRecord.rc_prize_bonus1).toNumber()
      : undefined,
    rcPrizeBonus2: kraRecord.rc_prize_bonus2
      ? new BigNumber(kraRecord.rc_prize_bonus2).toNumber()
      : undefined,
    rcPrizeBonus3: kraRecord.rc_prize_bonus3
      ? new BigNumber(kraRecord.rc_prize_bonus3).toNumber()
      : undefined,
    // 구간별 기록
    rcTime400: kraRecord.rc_time_400,
    rcTime600: kraRecord.rc_time_600,
    rcTime800: kraRecord.rc_time_800,
    rcTime1000: kraRecord.rc_time_1000,
    rcTime1200: kraRecord.rc_time_1200,
    rcTime1400: kraRecord.rc_time_1400,
    rcTime1600: kraRecord.rc_time_1600,
    rcTime1800: kraRecord.rc_time_1800,
    rcTime2000: kraRecord.rc_time_2000,
    // 착차 정보
    rcGap: kraRecord.rc_gap,
    rcGap400: kraRecord.rc_gap_400,
    rcGap600: kraRecord.rc_gap_600,
    rcGap800: kraRecord.rc_gap_800,
    rcGap1000: kraRecord.rc_gap_1000,
    rcGap1200: kraRecord.rc_gap_1200,
    rcGap1400: kraRecord.rc_gap_1400,
    rcGap1600: kraRecord.rc_gap_1600,
    rcGap1800: kraRecord.rc_gap_1800,
  };
}

/**
 * KRA 확정배당율 데이터를 우리 DividendRate 엔티티에 매핑
 *
 * KRA API 응답: rcDate, meet, rcNo, pool, odds, chulNo, chulNo2, chulNo3
 * 우리 DB: rcDate, meet, rcNo, pool, odds
 */
export function mapKraDividendToDividendRate(kraDividend: KraDividendItem) {
  return {
    rcDate: kraDividend.rcDate,
    meet: kraDividend.meet,
    rcNo: kraDividend.rcNo,
    pool: kraDividend.pool,
    odds: new BigNumber(kraDividend.odds || 0).toNumber(),
    // 추가 정보
    chulNo: kraDividend.chulNo,
    chulNo2: kraDividend.chulNo2,
    chulNo3: kraDividend.chulNo3,
  };
}

/**
 * KRA 출마표 데이터를 우리 EntryDetail 엔티티에 매핑
 *
 * 실제 KRA API 응답 구조에 맞춰 수정 필요
 * 현재는 KraRaceRecord의 출전마 정보를 활용
 */
export function mapKraEntryToEntryDetail(kraRecord: KraRaceRecord) {
  return {
    rcDate: kraRecord.rc_date,
    meet: kraRecord.meet,
    rcNo: kraRecord.rc_no,
    hrNo: kraRecord.hr_no,
    hrName: kraRecord.hr_name,
    hrNameEn: kraRecord.hr_name_en,
    hrNationality: kraRecord.hr_nationality,
    hrAge: kraRecord.hr_age,
    hrGender: kraRecord.hr_gender,
    hrWeight: kraRecord.hr_weight,
    hrRating: kraRecord.hr_rating,
    // 기수/조교사 정보
    jkName: kraRecord.jk_name,
    jkNameEn: kraRecord.jk_name_en,
    jkNo: kraRecord.jk_no,
    trName: kraRecord.tr_name,
    trNameEn: kraRecord.tr_name_en,
    trNo: kraRecord.tr_no,
    // 마주 정보
    owName: kraRecord.ow_name,
    owNameEn: kraRecord.ow_name_en,
    owNo: kraRecord.ow_no,
  };
}
