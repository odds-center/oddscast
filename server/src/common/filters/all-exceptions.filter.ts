import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { appLogger } from '../logger/winston.config';
import { DiscordService } from '../../discord/discord.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(DiscordService) private readonly discordService: DiscordService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as { message?: string } | string)
        : 'Internal server error';

    const errorMessage =
      typeof message === 'string'
        ? message
        : (message.message ?? 'Internal server error');

    const logMeta = {
      method: request.method,
      url: request.url,
      statusCode: status,
      userAgent: request.headers['user-agent'],
    };

    // Log 5xx errors as error, 4xx as warn (client errors are expected)
    if (status >= 500) {
      appLogger.error(
        `[${request.method}] ${request.url} → ${status} ${errorMessage}`,
        {
          ...logMeta,
          stack: exception instanceof Error ? exception.stack : undefined,
        },
      );

      // Capture to Sentry only for server errors
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(exception, {
          extra: logMeta,
        });
      }

      // Discord notification for server errors (fire-and-forget)
      this.discordService
        .notifyError(
          request.method,
          request.url,
          status,
          errorMessage,
          exception instanceof Error ? exception.stack : undefined,
        )
        .catch(() => {});
    } else if (status >= 400) {
      appLogger.warn(
        `[${request.method}] ${request.url} → ${status} ${errorMessage}`,
      );

      // Skip Discord for 404 (mostly bot/scanner noise) and 405
      if (status !== 404 && status !== 405) {
        this.discordService
          .notifyClientError(
            request.method,
            request.url,
            status,
            errorMessage,
            (request.headers['x-forwarded-for'] as string) ?? request.ip,
          )
          .catch(() => {});
      }
    }

    response.status(status).json({
      data: null,
      status,
      message: errorMessage,
    });
  }
}
