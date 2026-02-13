import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PicksService } from './picks.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CreatePickDto } from './dto/pick.dto';

@ApiTags('Picks')
@Controller('picks')
export class PicksController {
  constructor(private picksService: PicksService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내가 고른 말 저장' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePickDto) {
    return this.picksService.create(user.sub, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내가 고른 말 목록' })
  findByUser(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.picksService.findByUser(user.sub, page, limit);
  }

  @Get('race/:raceId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '해당 경주에 대한 내 선택' })
  findByRace(
    @Param('raceId') raceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.picksService.findByRace(raceId, user.sub);
  }

  @Delete('race/:raceId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '선택 삭제' })
  delete(
    @Param('raceId') raceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.picksService.delete(user.sub, raceId);
  }
}
