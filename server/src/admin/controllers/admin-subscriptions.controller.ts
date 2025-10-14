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
    try {
      return await this.subscriptionsService.getPlans();
    } catch (error) {
      return {
        success: false,
        message: '구독 플랜 조회에 실패했습니다.',
        error: error.message,
      };
    }
  }

  @Get('plans/:planId')
  async findOnePlan(@Param('planId') planId: string) {
    try {
      const plans = await this.subscriptionsService.getPlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        return { success: false, message: '해당 플랜을 찾을 수 없습니다.' };
      }
      return plan;
    } catch (error) {
      return {
        success: false,
        message: '플랜 조회에 실패했습니다.',
        error: error.message,
      };
    }
  }

  @Post('plans')
  async createPlan(@Body() createPlanDto: any) {
    // 구독 플랜 생성 (DB에 직접 저장 필요)
    return {
      success: false,
      message: '구독 플랜 생성 기능은 추후 구현 예정입니다.',
    };
  }

  @Patch('plans/:planId')
  async updatePlan(
    @Param('planId') planId: string,
    @Body() updatePlanDto: any
  ) {
    return {
      success: false,
      message: '구독 플랜 수정 기능은 추후 구현 예정입니다.',
    };
  }

  @Delete('plans/:planId')
  async removePlan(@Param('planId') planId: string) {
    return {
      success: false,
      message: '구독 플랜 삭제 기능은 추후 구현 예정입니다.',
    };
  }

  // 사용자 구독 관리
  @Get('users')
  async findAllUserSubscriptions(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('status') status?: string
  ) {
    try {
      const page = pageStr ? parseInt(pageStr, 10) : 1;
      const limit = limitStr ? parseInt(limitStr, 10) : 20;
      const validPage = isNaN(page) ? 1 : page;
      const validLimit = isNaN(limit) ? 20 : limit;

      return {
        data: [],
        meta: {
          total: 0,
          page: validPage,
          limit: validLimit,
          totalPages: 0,
        },
        message: '사용자 구독 목록 조회 기능은 추후 구현 예정입니다.',
      };
    } catch (error) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        error: error.message,
      };
    }
  }

  @Get('users/:userId')
  async findUserSubscription(@Param('userId') userId: string) {
    try {
      const status = await this.subscriptionsService.getStatus(userId);
      return status;
    } catch (error) {
      return {
        success: false,
        message: '사용자 구독 조회에 실패했습니다.',
        error: error.message,
      };
    }
  }

  @Patch('users/:userId/cancel')
  async cancelUserSubscription(
    @Param('userId') userId: string,
    @Body() body: any
  ) {
    try {
      return await this.subscriptionsService.cancelSubscription(userId, body);
    } catch (error) {
      return {
        success: false,
        message: '구독 취소에 실패했습니다.',
        error: error.message,
      };
    }
  }

  @Patch('users/:userId/extend')
  async extendUserSubscription(
    @Param('userId') userId: string,
    @Body('days') days: number
  ) {
    return {
      success: false,
      message: '구독 연장 기능은 추후 구현 예정입니다.',
    };
  }
}
