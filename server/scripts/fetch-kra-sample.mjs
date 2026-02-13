#!/usr/bin/env node
/**
 * KRA 공공데이터 API 실제 호출 테스트 스크립트
 *
 * 용도: specs 문서화된 각 KRA API endpoint를 실제 호출해 응답 구조를 검증
 * 실행: server 디렉토리에서
 *   KRA_SERVICE_KEY=xxx node scripts/fetch-kra-sample.mjs [YYYYMMDD]
 *
 * 인증키: https://www.data.go.kr/ → "한국마사회" API 활용신청 후 발급
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// server/.env 수동 로드 (standalone 스크립트용)
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {}
}
loadEnv();

const BASE_URL = 'http://apis.data.go.kr/B551015';
const SERVICE_KEY = process.env.KRA_SERVICE_KEY;
const OUTPUT_DIR = path.resolve(__dirname, 'kra-sample-responses');

// 기본 테스트 날짜: 최근 주말 (금/토/일)
function getDefaultDate() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const offset = day <= 3 ? day - 3 : day >= 5 ? 0 : 1; // Wed 이전이면 지난주, Fri~Sun이면 오늘
  d.setDate(d.getDate() - Math.abs(offset) - (day >= 5 ? 0 : 7));
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const rcDate = process.argv[2] || getDefaultDate();

const ENDPOINTS = [
  {
    name: 'entrySheet',
    url: `${BASE_URL}/API26_2/entrySheet_2`,
    params: { meet: '1', rc_date: rcDate, rc_month: rcDate.slice(0, 6), numOfRows: 20, pageNo: 1, _type: 'json' },
    desc: '출전표 상세정보',
  },
  {
    name: 'raceResult',
    url: `${BASE_URL}/getRaceResult`,
    params: { meet: '1', rc_date: rcDate, numOfRows: 50, pageNo: 1, _type: 'json' },
    desc: '경주결과 (getRaceResult)',
  },
  {
    name: 'raceDetailResult',
    url: `${BASE_URL}/API214_1/RaceDetailResult`,
    params: { meet: '1', rc_date: rcDate, numOfRows: 50, pageNo: 1, _type: 'json' },
    desc: '경주성적정보 (API214 RaceDetailResult)',
  },
  {
    name: 'jockeyResult',
    url: `${BASE_URL}/jktresult/getjktresult`,
    params: { meet: '1', numOfRows: 50, pageNo: 1, _type: 'json' },
    desc: '기수 통산성적비교',
  },
  {
    name: 'trackInfo',
    url: `${BASE_URL}/API189_1/Track_1`,
    params: { meet: '1', rc_date_fr: rcDate, rc_date_to: rcDate, numOfRows: 20, pageNo: 1, _type: 'json' },
    desc: '경주로정보',
  },
  {
    name: 'horseWeight',
    url: `${BASE_URL}/API25_1/entryHorseWeightInfo_1`,
    params: { meet: '1', rc_date: rcDate, numOfRows: 50, pageNo: 1, _type: 'json' },
    desc: '출전마 체중정보',
  },
  {
    name: 'equipmentBleeding',
    url: `${BASE_URL}/API24_1/horseMedicalAndEquipment_1`,
    params: { meet: '1', rc_date: rcDate, numOfRows: 50, pageNo: 1, _type: 'json' },
    desc: '장구사용·폐출혈 정보',
  },
  {
    name: 'horseCancel',
    url: `${BASE_URL}/API9_1/raceHorseCancelInfo_1`,
    params: { meet: '1', rc_date: rcDate, numOfRows: 20, pageNo: 1, _type: 'json' },
    desc: '출전취소 정보',
  },
  {
    name: 'training',
    url: `https://apis.data.go.kr/B551015/trcontihi/gettrcontihi`,
    params: { hrno: '0015447', tr_date_fr: '20231001', tr_date_to: '20231015', numOfRows: 10, pageNo: 1, _type: 'json' },
    desc: '말훈련내역 (hrno 샘플)',
  },
];

async function fetchOne(endpoint, key) {
  const decoded = decodeURIComponent(key);
  const url = new URL(endpoint.url);
  Object.entries(endpoint.params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  url.searchParams.set('serviceKey', decoded);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { _raw: text.slice(0, 500), _note: 'Response is not JSON (maybe XML)' };
  }

  return { status: res.status, data };
}

async function main() {
  if (!SERVICE_KEY) {
    console.error('❌ KRA_SERVICE_KEY가 설정되지 않았습니다.');
    console.error('   server/.env에 KRA_SERVICE_KEY를 추가하거나, 환경변수로 전달하세요.');
    console.error('   예: KRA_SERVICE_KEY=xxx node scripts/fetch-kra-sample.mjs 20240210');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\n📡 KRA API 호출 테스트 (rc_date: ${rcDate})\n`);

  for (const ep of ENDPOINTS) {
    process.stdout.write(`  ${ep.name.padEnd(20)} ... `);
    try {
      const { status, data } = await fetchOne(ep, SERVICE_KEY);
      const resultCode = data?.response?.header?.resultCode;
      const resultMsg = data?.response?.header?.resultMsg;

      if (status !== 200) {
        console.log(`HTTP ${status}`);
      } else if (resultCode && resultCode !== '00') {
        console.log(`API 오류: ${resultCode} - ${resultMsg || 'unknown'}`);
      } else {
        const itemCount = data?.response?.body?.items?.item;
        const count = Array.isArray(itemCount) ? itemCount.length : itemCount ? 1 : 0;
        console.log(`OK (items: ${count})`);
      }

      const outPath = path.join(OUTPUT_DIR, `${ep.name}-${rcDate}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.log(`실패: ${e.message}`);
    }
  }

  console.log(`\n📁 샘플 저장 위치: ${OUTPUT_DIR}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
