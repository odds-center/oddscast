import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { SubscriptionPlanEntity } from '../src/subscriptions/entities/subscription-plan.entity';

/**
 * 구독 플랜 초기 데이터 설정
 */
async function initSubscriptionPlans() {
  console.log('🚀 구독 플랜 초기 데이터 설정을 시작합니다...');

  let app: any = null;
  try {
    // NestJS 앱 생성
    app = await NestFactory.createApplicationContext(AppModule);
    console.log('✅ NestJS 앱 생성 성공');

    const subscriptionPlanRepository = app.get(
      getRepositoryToken(SubscriptionPlanEntity)
    );

    // 기존 데이터 삭제
    await subscriptionPlanRepository.clear();
    console.log('🧹 기존 구독 플랜 데이터 삭제 완료');

    // 라이트 플랜
    const lightPlan = subscriptionPlanRepository.create({
      planId: 'LIGHT',
      name: '라이트 구독',
      description: '가벼운 사용을 위한 기본 플랜',
      price: 9900,
      ticketsPerMonth: 15,
      pricePerTicket: 660,
      discountPercentage: 34,
      isActive: true,
      isRecommended: false,
      features: [
        '월 15장 AI 예측권',
        '장당 660원 (34% 할인)',
        '평균 70%+ 정확도 목표',
        '자동 갱신',
      ],
    });

    // 프리미엄 플랜
    const premiumPlan = subscriptionPlanRepository.create({
      planId: 'PREMIUM',
      name: '프리미엄 구독',
      description: '전체 기능을 사용할 수 있는 최고 플랜',
      price: 19800,
      ticketsPerMonth: 35,
      pricePerTicket: 566,
      discountPercentage: 43,
      isActive: true,
      isRecommended: true,
      features: [
        '월 35장 AI 예측권',
        '장당 566원 (43% 할인)',
        '평균 70%+ 정확도 목표',
        '자동 갱신',
      ],
    });

    // 데이터 저장
    await subscriptionPlanRepository.save([lightPlan, premiumPlan]);
    console.log('✅ 구독 플랜 데이터 저장 완료');

    // 저장된 데이터 확인
    const savedPlans = await subscriptionPlanRepository.find();
    console.log('📊 저장된 구독 플랜:');
    savedPlans.forEach(plan => {
      console.log(
        `  - ${plan.name}: ${plan.price.toLocaleString()}원/월 (${plan.ticketsPerMonth}장)`
      );
      console.log(
        `    할인율: ${plan.getDiscountPercentage()}%, 월 절약: ${plan.getMonthlySavings().toLocaleString()}원`
      );
    });

    console.log('🎉 구독 플랜 초기 데이터 설정 완료!');
  } catch (error) {
    console.error('❌ 구독 플랜 초기 데이터 설정 실패:', error);
    throw error;
  } finally {
    // NestJS 앱 종료
    if (app) {
      await app.close();
      console.log('🔌 NestJS 앱 종료');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  initSubscriptionPlans()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { initSubscriptionPlans };
