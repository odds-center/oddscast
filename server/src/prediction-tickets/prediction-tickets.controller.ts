import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PredictionTicketsService } from './prediction-tickets.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { UseTicketDto } from '../common/dto/payment.dto';

@ApiTags('Prediction Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prediction-tickets')
export class PredictionTicketsController {
  constructor(private ticketsService: PredictionTicketsService) {}

  @Post('use')
  @ApiOperation({ summary: '예측권 사용' })
  useTicket(@CurrentUser() user: JwtPayload, @Body() dto: UseTicketDto) {
    return this.ticketsService.useTicket(user.sub, dto);
  }

  @Get('balance')
  @ApiOperation({ summary: '예측권 잔여 수량' })
  getBalance(@CurrentUser() user: JwtPayload) {
    return this.ticketsService.getBalance(user.sub);
  }

  @Get('history')
  @ApiOperation({ summary: '예측권 사용 이력' })
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ticketsService.getHistory(user.sub, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '예측권 상세 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }
}
