import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Controller('admin/subscriptions')
@UseGuards(AdminGuard)
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // 구독 플랜 관리
  @Get('plans')
  async findAllPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('plans/:planId')
  async findOnePlan(@Param('planId') planId: string) {
    const plans = await this.subscriptionsService.getPlans();
    return plans.find(plan => plan.planId === planId);
  }

  @Post('plans')
  async createPlan(@Body() createPlanDto: any) {
    // SubscriptionsService에 createPlan 메서드가 없으므로 임시 응답
    return { message: '구독 플랜 생성 기능은 추후 구현 예정입니다.' };
  }

  @Patch('plans/:planId')
  async updatePlan(
    @Param('planId') planId: string,
    @Body() updatePlanDto: any
  ) {
    return { message: '구독 플랜 수정 기능은 추후 구현 예정입니다.' };
  }

  @Delete('plans/:planId')
  async removePlan(@Param('planId') planId: string) {
    return { message: '구독 플랜 삭제 기능은 추후 구현 예정입니다.' };
  }

  // 사용자 구독 관리
  @Get('users')
  async findAllUserSubscriptions(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('status') status?: string
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    return {
      message: '사용자 구독 목록 조회 기능은 추후 구현 예정입니다.',
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
    };
  }

  @Get('users/:userId')
  async findUserSubscription(@Param('userId') userId: string) {
    // getUserSubscription 메서드가 없으므로 임시 응답
    return { message: '사용자 구독 조회 기능은 추후 구현 예정입니다.' };
  }

  @Patch('users/:userId/cancel')
  async cancelUserSubscription(
    @Param('userId') userId: string,
    @Body() body: any
  ) {
    return this.subscriptionsService.cancelSubscription(userId, body);
  }

  @Patch('users/:userId/extend')
  async extendUserSubscription(
    @Param('userId') userId: string,
    @Body('days') days: number
  ) {
    // 구독 연장은 새 구독 생성으로 처리
    return { message: '구독 연장 기능은 추후 구현 예정입니다.' };
  }
}
