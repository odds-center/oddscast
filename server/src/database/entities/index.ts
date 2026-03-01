/**
 * TypeORM entities. Export all entities so TypeOrmModule can register them.
 * Add new entities here when created.
 */
export { User } from './user.entity';
export { Favorite } from './favorite.entity';
export { AdminUser } from './admin-user.entity';
export { PasswordResetToken } from './password-reset-token.entity';
export { EmailVerificationToken } from './email-verification-token.entity';
export { PredictionTicket } from './prediction-ticket.entity';
export { ReferralCode } from './referral-code.entity';
export { ReferralClaim } from './referral-claim.entity';
export { Race } from './race.entity';
export { RaceEntry } from './race-entry.entity';
export { RaceResult } from './race-result.entity';
export { Prediction } from './prediction.entity';
export { Training } from './training.entity';
export { JockeyResult } from './jockey-result.entity';
export { TrainerResult } from './trainer-result.entity';
export { KraSyncLog } from './kra-sync-log.entity';
export { GlobalConfig } from './global-config.entity';
export { WeeklyPreview } from './weekly-preview.entity';
export { UserDailyFortune } from './user-daily-fortune.entity';
