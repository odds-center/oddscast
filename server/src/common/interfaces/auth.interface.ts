// JwtPayload is now defined as a class in ../decorators/current-user.decorator.ts
// to avoid TS1272 errors with isolatedModules + emitDecoratorMetadata.
// Import from there: import { JwtPayload } from '../common/decorators/current-user.decorator';
export { JwtPayload } from '../decorators/current-user.decorator';
