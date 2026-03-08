/**
 * DB enums and shared types. Use for guards, DTOs, entities, and type safety.
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

export enum PromotionType {
  SIGNUP_BONUS = 'SIGNUP_BONUS',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  DAILY_LOGIN = 'DAILY_LOGIN',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
  CUSTOM = 'CUSTOM',
}

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
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

/** Batch job schedule status (DB table batch_schedules). */
export enum BatchScheduleStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/** JSON column type for API/DB (e.g. metadata, data fields). */
export type InputJsonValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

/** Stub row types for raw SQL or DTO mapping. */
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
