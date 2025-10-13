import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 예측권 데코레이터
 * - TicketRequiredGuard에서 설정한 예측권 가져오기
 */
export const UseTicket = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.ticket;
  }
);
