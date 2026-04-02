import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';
import { RefundRequestStatus } from '../database/entities/refund-request.entity';
import { RefundsService } from './refunds.service';
import { CreateRefundRequestDto, ProcessRefundDto } from './dto/refund.dto';

@ApiTags('Refunds')
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  /**
   * User submits a refund request for a billing history entry.
   * Rate-limited to 3 requests per minute to prevent abuse.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a refund request (user)' })
  async requestRefund(
    @Body() dto: CreateRefundRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.refundsService.requestRefund(user.sub, dto);
  }

  /**
   * User retrieves their own refund requests.
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's refund requests" })
  async myRefunds(@CurrentUser() user: JwtPayload) {
    return this.refundsService.findByUser(user.sub);
  }

  /**
   * Admin: list all refund requests with optional status filter.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'List all refund requests (admin)' })
  async findAll(@Query('status') status?: RefundRequestStatus) {
    return this.refundsService.findAll(status);
  }

  /**
   * Admin: approve a refund request, optionally overriding the amount.
   * Calls TossPayments cancel API and expires unused tickets.
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Approve a refund request (admin)' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ProcessRefundDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.refundsService.approveRefund(user.sub, id, dto);
  }

  /**
   * Admin: reject a refund request with an optional reason.
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @SkipThrottle()
  @ApiOperation({ summary: 'Reject a refund request (admin)' })
  async reject(
    @Param('id') id: string,
    @Body() dto: ProcessRefundDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.refundsService.rejectRefund(user.sub, id, dto);
  }
}
