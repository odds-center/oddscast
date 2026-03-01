/**
 * DB enums (previously from @prisma/client). Use for guards, DTOs, and type safety.
 */

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum RaceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PredictionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TicketStatus {
  AVAILABLE = 'AVAILABLE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

export enum TicketType {
  RACE = 'RACE',
  MATRIX = 'MATRIX',
}

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  RACE = 'RACE',
  PREDICTION = 'PREDICTION',
  PROMOTION = 'PROMOTION',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum NotificationCategory {
  GENERAL = 'GENERAL',
  URGENT = 'URGENT',
  INFO = 'INFO',
  MARKETING = 'MARKETING',
}

export enum FavoriteType {
  HORSE = 'HORSE',
  JOCKEY = 'JOCKEY',
  TRAINER = 'TRAINER',
  RACE = 'RACE',
  MEET = 'MEET',
}

export enum FavoritePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum PointTransactionType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  REFUNDED = 'REFUNDED',
  BONUS = 'BONUS',
  PROMOTION = 'PROMOTION',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  EXPIRED = 'EXPIRED',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

export enum PointStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PROCESSING = 'PROCESSING',
}

export enum BetType {
  WIN = 'WIN',
  PLACE = 'PLACE',
  QUINELLA = 'QUINELLA',
  QUINELLA_PLACE = 'QUINELLA_PLACE',
  EXACTA = 'EXACTA',
  TRIFECTA = 'TRIFECTA',
  TRIPLE = 'TRIPLE',
}

export enum BetStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  WON = 'WON',
  LOST = 'LOST',
}

export enum BetResult {
  PENDING = 'PENDING',
  WIN = 'WIN',
  LOSE = 'LOSE',
  PARTIAL_WIN = 'PARTIAL_WIN',
  VOID = 'VOID',
}

export enum PickType {
  SINGLE = 'SINGLE',
  PLACE = 'PLACE',
  QUINELLA = 'QUINELLA',
  EXACTA = 'EXACTA',
  QUINELLA_PLACE = 'QUINELLA_PLACE',
  TRIFECTA = 'TRIFECTA',
  TRIPLE = 'TRIPLE',
}

/** JSON column type when using raw SQL (replaces Prisma.InputJsonValue). */
export type InputJsonValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

/** Compatibility namespace for code still referencing Prisma.* types (no runtime Prisma). */
export namespace Prisma {
  export type InputJsonValue = string | number | boolean | null | Record<string, unknown> | unknown[];
  export type RaceUpdateInput = Record<string, unknown>;
  export type DbNull = null;
  export type PredictionWhereInput = Record<string, unknown>;
  export type PredictionUpdateInput = Record<string, unknown>;
  export type EnumPredictionStatusFilter = string;
  export type EnumPredictionStatusFieldUpdateOperationsInput = { set?: string };
  export type RaceWhereInput = Record<string, unknown>;
  export type EnumRaceStatusFilter = string;
  export type RaceResultWhereInput = Record<string, unknown>;
  export type RaceResultUpdateInput = Record<string, unknown>;
}

/** Stub types (previously from Prisma generated client). Define row shapes when using raw SQL. */
export interface SubscriptionPlanRow {
  id: number;
  planName: string;
  displayName: string;
  description: string | null;
  totalPrice: number;
  totalTickets: number;
  matrixTickets: number;
  isActive: boolean;
}

export interface SubscriptionRow {
  id: number;
  userId: number;
  planId: number;
  status: string;
  customerKey: string | null;
  billingKey: string | null;
  nextBillingDate: Date | null;
}
