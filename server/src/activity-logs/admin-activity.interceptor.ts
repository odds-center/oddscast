import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogsService } from './activity-logs.service';
import { Request } from 'express';

/**
 * Automatically logs every admin controller action.
 * Applied to admin controllers to create an audit trail.
 */
@Injectable()
export class AdminActivityInterceptor implements NestInterceptor {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    const method = req.method;
    const url = req.originalUrl;

    // Skip GET requests to avoid logging read-only actions
    if (method === 'GET') return next.handle();

    const action = `${controller}.${handler}`;
    const target = this.buildTarget(url, req.query as Record<string, string>, req.params as Record<string, string>);
    const details = this.sanitizeBody(req.body as Record<string, unknown>);
    const adminInfo = this.extractAdminInfo(req);

    return next.handle().pipe(
      tap({
        next: () => {
          void this.activityLogsService.logAdminActivity({
            adminUserId: adminInfo.id,
            adminEmail: adminInfo.email,
            action,
            target,
            details: { method, url, body: details },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          });
        },
        error: (err: Error) => {
          void this.activityLogsService.logAdminActivity({
            adminUserId: adminInfo.id,
            adminEmail: adminInfo.email,
            action: `${action}:FAILED`,
            target,
            details: {
              method,
              url,
              body: details,
              error: err.message?.slice(0, 500),
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          });
        },
      }),
    );
  }

  private buildTarget(
    url: string,
    query: Record<string, string>,
    params: Record<string, string>,
  ): string {
    const parts = [url];
    if (params.id) parts.push(`id:${params.id}`);
    if (query.date) parts.push(`date:${query.date}`);
    if (query.year) parts.push(`year:${query.year}`);
    return parts.join(' ');
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body || typeof body !== 'object') return {};
    const sanitized = { ...body };
    const sensitiveKeys = ['password', 'token', 'secret', 'billingKey'];
    for (const key of sensitiveKeys) {
      if (key in sanitized) sanitized[key] = '[REDACTED]';
    }
    return sanitized;
  }

  private extractAdminInfo(req: Request): { id?: number; email?: string } {
    try {
      const user = (req as Request & { user?: { sub?: number; email?: string } }).user;
      if (user) return { id: user.sub, email: user.email };

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return {};
      const token = authHeader.slice(7);
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      ) as { sub?: number; email?: string };
      return { id: payload.sub, email: payload.email };
    } catch {
      return {};
    }
  }
}
