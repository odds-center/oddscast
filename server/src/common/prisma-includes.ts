/**
 * Race 조회 시 공통 include 패턴
 * 경주(race) + 출전마(entries: 경주말·기수·조교사)를 항상 함께 조회
 *
 * @see docs/specs/KRA_DB_LINKAGE_SPEC.md
 */
import type { Prisma } from '@prisma/client';

/** 경주 + 출전마 (목록용: hrNo, hrName만) */
export const RACE_INCLUDE_ENTRIES: Prisma.RaceInclude = {
  entries: { select: { hrNo: true, hrName: true } },
};

/** 출전취소 제외 출전마 (목록용: hrNo, hrName만) */
export const RACE_INCLUDE_ENTRIES_ACTIVE: Prisma.RaceInclude = {
  entries: {
    where: { isScratched: false },
    select: { hrNo: true, hrName: true },
  },
};

/** 경주 + 출전마 + 결과 + 예측 — 상세 조회용 (렌더링 필수 필드만) */
export const RACE_INCLUDE_FULL: Prisma.RaceInclude = {
  entries: {
    select: {
      id: true,
      raceId: true,
      hrNo: true,
      hrName: true,
      jkName: true,
      chulNo: true,
      wgBudam: true,
      horseWeight: true,
      trName: true,
    },
  },
  results: {
    select: {
      id: true,
      ord: true,
      chulNo: true,
      hrNo: true,
      hrName: true,
      jkName: true,
      rcTime: true,
    },
  },
  predictions: {
    select: {
      id: true,
      scores: true,
      analysis: true,
      preview: true,
      status: true,
    },
  },
};

/** AI 예측용 — 출전마 + 훈련 내역 */
export const RACE_INCLUDE_FOR_ANALYSIS: Prisma.RaceInclude = {
  entries: {
    include: {
      trainings: { orderBy: { trDate: 'desc' }, take: 10 },
    },
  },
};
