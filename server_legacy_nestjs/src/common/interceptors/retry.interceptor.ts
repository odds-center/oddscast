import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, timer } from 'rxjs';
import { retryWhen, mergeMap, take } from 'rxjs/operators';

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

@Injectable()
export class RetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RetryInterceptor.name);
  private readonly defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    retryCondition: this.defaultRetryCondition,
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.getRetryOptions(context);
    
    return next.handle().pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryCount = index + 1;
            
            if (retryCount > options.maxRetries) {
              this.logger.error(
                `Max retries (${options.maxRetries}) exceeded for ${context.getClass().name}.${context.getHandler().name}`,
                error,
              );
              return throwError(() => error);
            }

            if (!options.retryCondition(error)) {
              this.logger.warn(
                `Error does not meet retry condition for ${context.getClass().name}.${context.getHandler().name}`,
                error,
              );
              return throwError(() => error);
            }

            const delay = options.delayMs * Math.pow(options.backoffMultiplier, retryCount - 1);
            
            this.logger.warn(
              `Retrying ${context.getClass().name}.${context.getHandler().name} (${retryCount}/${options.maxRetries}) after ${delay}ms`,
              { error: error.message, retryCount, delay },
            );

            return timer(delay);
          }),
          take(options.maxRetries + 1),
        ),
      ),
    );
  }

  private getRetryOptions(context: ExecutionContext): Required<RetryOptions> {
    // 메타데이터에서 재시도 옵션을 가져올 수 있음
    const metadata = Reflect.getMetadata('retry', context.getHandler());
    
    if (metadata) {
      return { ...this.defaultOptions, ...metadata };
    }

    return this.defaultOptions;
  }

  private defaultRetryCondition(error: any): boolean {
    // 기본적으로 네트워크 오류나 5xx 서버 오류만 재시도
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    if (error.response) {
      const status = error.response.status;
      return status >= 500 && status < 600; // 5xx 서버 오류
    }

    return false;
  }
}

/**
 * 재시도 옵션을 메타데이터로 설정하는 데코레이터
 */
export function Retry(options: RetryOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('retry', options, descriptor.value);
    return descriptor;
  };
}

/**
 * KRA API 전용 재시도 옵션
 */
export const KraApiRetry = Retry({
  maxRetries: 5,
  delayMs: 2000,
  backoffMultiplier: 1.5,
  retryCondition: (error: any) => {
    // KRA API 특화 재시도 조건
    if (error.response) {
      const status = error.response.status;
      // 429 (Too Many Requests) 또는 5xx 오류 시 재시도
      return status === 429 || (status >= 500 && status < 600);
    }
    
    // 네트워크 오류 시 재시도
    return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
  },
});
