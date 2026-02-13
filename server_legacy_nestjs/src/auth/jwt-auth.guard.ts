import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_CONSTANTS } from '../common/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    this.logger.log(
      `🔐 JWT Guard: Checking token for ${request.method} ${request.url}`
    );
    if (token) {
      this.logger.log(`🔐 Token preview: ${token.substring(0, 30)}...`);
    } else {
      this.logger.warn('⚠️ No token found in request');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.error(`❌ JWT Guard error: ${err.message}`);
      throw new UnauthorizedException(
        JWT_CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN
      );
    }

    if (!user) {
      this.logger.error('❌ JWT Guard: No user found');
      throw new UnauthorizedException(
        JWT_CONSTANTS.ERROR_MESSAGES.INVALID_TOKEN
      );
    }

    this.logger.log(`✅ JWT Guard: User authenticated: ${user.email}`);
    return user;
  }
}
