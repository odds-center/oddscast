/**
 * KRA API raw 응답 타입
 * camelCase / snake_case 혼재 대응
 */

/** KRA API 공통 item (출전표, 경주결과 등) - 필드명 변동 가능 */
export interface KraApiItem {
  meet?: string;
  rcDate?: string;
  rc_date?: string;
  rcNo?: string;
  rc_no?: string;
  rcDay?: string;
  rc_day?: string;
  rcName?: string;
  rc_name?: string;
  raceName?: string;
  race_name?: string;
  rcDist?: string;
  rc_dist?: string;
  stTime?: string;
  st_time?: string;
  rank?: string;
  weather?: string;
  track?: string;
  trackState?: string;
  hrNo?: string;
  hr_no?: string;
  hrName?: string;
  hr_name?: string;
  hrNameEn?: string;
  hr_name_en?: string;
  chulNo?: string;
  chul_no?: string;
  jkNo?: string;
  jk_no?: string;
  jkName?: string;
  jk_name?: string;
  jkNameEn?: string;
  jk_name_en?: string;
  trNo?: string;
  tr_no?: string;
  trName?: string;
  tr_name?: string;
  owNo?: string;
  ow_no?: string;
  owName?: string;
  ow_name?: string;
  wgBudam?: string | number;
  wg_budam?: string | number;
  wgHr?: string;
  wg_hr?: string;
  sex?: string;
  age?: string | number;
  prd?: string;
  budam?: string;
  chaksun1?: string | number;
  chaksun_1?: string | number;
  chaksunT?: string | number;
  chaksun_t?: string | number;
  rcCntT?: string | number;
  rc_cnt_t?: string | number;
  ord1CntT?: string | number;
  ord1_cnt_t?: string | number;
  dusu?: string | number;
  ord?: string;
  rcTime?: string;
  rcPrize?: string | number;
  hrTool?: string;
  hr_tool?: string;
  diffUnit?: string;
  diff_unit?: string;
  winOdds?: string | number;
  plcOdds?: string | number;
  seS1fAccTime?: string | number;
  seG3fAccTime?: string | number;
  seG1fAccTime?: string | number;
  buS1fAccTime?: string | number;
  buG3fAccTime?: string | number;
  buG1fAccTime?: string | number;
  jeS1fAccTime?: string | number;
  jeG3fAccTime?: string | number;
  jeG1fAccTime?: string | number;
  moisture?: string | number;
  [key: string]: unknown;
}

export interface KraSyncAllOutput {
  message: string;
  entrySheet?: { races: number; entries: number };
  results?: { totalResults: number };
  details?: string;
  jockeys?: string;
}
