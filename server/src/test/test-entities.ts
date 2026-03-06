/**
 * Factory functions for test data with sensible defaults.
 * Each factory accepts partial overrides.
 */

import {
  UserRole,
  RaceStatus,
  PredictionStatus,
  TicketType,
  TicketStatus,
  SubscriptionStatus,
  PointTransactionType,
  PointStatus,
} from '../database/db-enums';

export function createTestUser(overrides?: Record<string, unknown>) {
  const now = new Date();
  return {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test User',
    nickname: null,
    avatar: null,
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: false,
    favoriteMeet: null,
    lastLoginAt: null,
    lastDailyBonusAt: null,
    lastConsecutiveLoginDate: null,
    consecutiveLoginDays: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestAdminUser(overrides?: Record<string, unknown>) {
  const now = new Date();
  return {
    id: 1,
    loginId: 'admin',
    password: '$2b$10$hashedpassword',
    name: 'Admin User',
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestRace(overrides?: Record<string, unknown>) {
  const now = new Date();
  return {
    id: 1,
    meet: '서울',
    meetName: '서울',
    rcDate: '20250301',
    rcDay: '토',
    rcNo: '1',
    rcName: 'Test Race',
    stTime: '11:00',
    rcDist: '1200',
    rank: 'A',
    rcCondition: null,
    rcPrize: 50000000,
    weather: null,
    track: null,
    status: RaceStatus.SCHEDULED,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestRaceEntry(overrides?: Record<string, unknown>) {
  return {
    id: 'entry-1',
    raceId: 1,
    hrNo: '1',
    hrName: 'Thunder',
    chulNo: '1',
    jkNo: '101',
    jkName: 'Kim',
    trName: 'Park',
    owNo: null,
    owName: null,
    wgBudam: 57,
    isScratched: false,
    ...overrides,
  };
}

export function createTestRaceResult(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    raceId: 1,
    ord: '1',
    ordInt: 1,
    ordType: 'NORMAL',
    chulNo: '3',
    hrNo: '1',
    hrName: 'Thunder',
    jkNo: '101',
    jkName: 'Kim',
    trName: 'Park',
    owName: null,
    wgBudam: 57,
    wgHr: null,
    rcTime: '72.3',
    diffUnit: null,
    winOdds: 3.5,
    plcOdds: 1.8,
    chaksun1: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestPrediction(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    raceId: 1,
    status: PredictionStatus.COMPLETED,
    scores: {
      horseScores: [
        { hrNo: '1', hrName: 'Thunder', score: 85 },
        { hrNo: '2', hrName: 'Lightning', score: 78 },
        { hrNo: '3', hrName: 'Storm', score: 72 },
      ],
    },
    analysis: 'Test analysis',
    preview: 'Test preview',
    accuracy: null,
    previewApproved: false,
    postRaceSummary: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestPredictionTicket(
  overrides?: Record<string, unknown>,
) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);
  return {
    id: 'ticket-1',
    userId: 1,
    type: TicketType.RACE,
    status: TicketStatus.AVAILABLE,
    expiresAt,
    issuedAt: now,
    usedAt: null,
    predictionId: null,
    raceId: null,
    subscriptionId: null,
    matrixDate: null,
    ...overrides,
  };
}

export function createTestSubscriptionPlan(
  overrides?: Record<string, unknown>,
) {
  return {
    id: 1,
    planName: 'STANDARD',
    displayName: 'Standard',
    description: 'Standard plan',
    originalPrice: 11000,
    vat: 1100,
    totalPrice: 9900,
    baseTickets: 8,
    bonusTickets: 2,
    totalTickets: 10,
    matrixTickets: 5,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestSubscription(overrides?: Record<string, unknown>) {
  const now = new Date();
  const nextBilling = new Date(now);
  nextBilling.setDate(nextBilling.getDate() + 30);
  return {
    id: 1,
    userId: 1,
    planId: 1,
    price: 9900,
    customerKey: 'uuid-key',
    billingKey: null,
    status: SubscriptionStatus.PENDING,
    startedAt: now,
    nextBillingDate: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createTestPointTransaction(
  overrides?: Record<string, unknown>,
) {
  const now = new Date();
  return {
    id: 1,
    userId: 1,
    transactionType: PointTransactionType.BONUS,
    amount: 10,
    balanceAfter: 10,
    description: 'Daily login bonus',
    metadata: null,
    status: PointStatus.ACTIVE,
    transactionTime: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
