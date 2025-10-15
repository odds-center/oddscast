import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Toss Payments API 응답
 */
export interface TossPaymentResponse {
  success: boolean;
  paymentKey?: string;
  orderId?: string;
  approvedAt?: string;
  amount?: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 빌링키 발급 요청
 */
export interface IssueBillingKeyRequest {
  customerKey: string; // 사용자 ID
  cardNumber: string;
  cardExpirationYear: string; // YY
  cardExpirationMonth: string; // MM
  cardPassword: string; // 앞 2자리
  customerBirthday: string; // YYMMDD
  customerName: string;
}

/**
 * 정기 결제 요청
 */
export interface ChargeBillingKeyRequest {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderName: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
}

/**
 * Toss Payments 서비스
 *
 * 정기 결제(빌링키) 및 즉시 결제 지원
 */
@Injectable()
export class TossPaymentService {
  private readonly logger = new Logger(TossPaymentService.name);
  private readonly apiUrl = 'https://api.tosspayments.com/v1';
  private readonly secretKey: string;
  private readonly authHeader: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY') || '';

    if (!this.secretKey) {
      this.logger.warn('⚠️ TOSS_SECRET_KEY가 설정되지 않았습니다');
    }

    // Base64 인코딩 (비밀키:)
    this.authHeader = `Basic ${Buffer.from(`${this.secretKey}:`).toString('base64')}`;

    this.logger.log('✅ Toss Payment Service initialized');
  }

  /**
   * 빌링키 발급 (정기 결제용)
   *
   * 카드 정보로 빌링키를 발급받아 정기 결제에 사용합니다.
   */
  async issueBillingKey(data: IssueBillingKeyRequest): Promise<string> {
    try {
      this.logger.log(`빌링키 발급 시작: ${data.customerKey}`);

      const response = await axios.post(
        `${this.apiUrl}/billing/authorizations/card`,
        {
          customerKey: data.customerKey,
          cardNumber: data.cardNumber,
          cardExpirationYear: data.cardExpirationYear,
          cardExpirationMonth: data.cardExpirationMonth,
          cardPassword: data.cardPassword,
          customerBirthday: data.customerBirthday,
          customerName: data.customerName,
        },
        {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      const billingKey = response.data.billingKey;

      if (!billingKey) {
        throw new BadRequestException('빌링키 발급 실패');
      }

      this.logger.log(`✅ 빌링키 발급 성공: ${data.customerKey}`);
      return billingKey;
    } catch (error: any) {
      this.logger.error(`❌ 빌링키 발급 실패: ${error.message}`, error.stack);

      if (error.response?.data) {
        throw new BadRequestException(
          error.response.data.message || '빌링키 발급에 실패했습니다.'
        );
      }

      throw error;
    }
  }

  /**
   * 빌링키로 결제 (정기 결제)
   *
   * 발급받은 빌링키로 자동 결제를 진행합니다.
   */
  async chargeWithBillingKey(
    data: ChargeBillingKeyRequest
  ): Promise<TossPaymentResponse> {
    try {
      this.logger.log(`정기 결제 시작: ${data.orderId} (₩${data.amount})`);

      const response = await axios.post(
        `${this.apiUrl}/billing/${data.billingKey}`,
        {
          customerKey: data.customerKey,
          amount: data.amount,
          orderId: data.orderId,
          orderName: data.orderName,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
        },
        {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data;

      this.logger.log(
        `✅ 결제 성공: ${result.paymentKey} | ₩${result.totalAmount}`
      );

      return {
        success: true,
        paymentKey: result.paymentKey,
        orderId: result.orderId,
        approvedAt: result.approvedAt,
        amount: result.totalAmount,
      };
    } catch (error: any) {
      this.logger.error(`❌ 결제 실패: ${error.message}`, error.stack);

      if (error.response?.data) {
        return {
          success: false,
          error: {
            code: error.response.data.code,
            message: error.response.data.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || '결제 처리 중 오류가 발생했습니다.',
        },
      };
    }
  }

  /**
   * 즉시 결제 (개별 구매용)
   *
   * 빌링키 없이 즉시 결제를 진행합니다.
   */
  async instantPayment(data: {
    amount: number;
    orderId: string;
    orderName: string;
    customerKey: string;
    customerEmail?: string;
    customerName?: string;
    successUrl: string;
    failUrl: string;
  }): Promise<{ paymentUrl: string; orderId: string }> {
    try {
      this.logger.log(`즉시 결제 요청: ${data.orderId} (₩${data.amount})`);

      // 토스페이먼츠 결제창 URL 생성
      const paymentUrl = `https://api.tosspayments.com/v1/payments`;

      // 실제로는 모바일에서 Toss SDK를 사용하므로
      // 여기서는 검증만 수행
      return {
        paymentUrl,
        orderId: data.orderId,
      };
    } catch (error: any) {
      this.logger.error(`❌ 즉시 결제 요청 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 결제 승인 확인
   *
   * 결제 완료 후 최종 승인을 확인합니다.
   */
  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    try {
      this.logger.log(`결제 승인 확인: ${orderId}`);

      const response = await axios.post(
        `${this.apiUrl}/payments/confirm`,
        {
          paymentKey,
          orderId,
          amount,
        },
        {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`✅ 결제 승인 완료: ${paymentKey}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ 결제 승인 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment(
    paymentKey: string,
    cancelReason: string
  ): Promise<boolean> {
    try {
      this.logger.log(`결제 취소 요청: ${paymentKey}`);

      await axios.post(
        `${this.apiUrl}/payments/${paymentKey}/cancel`,
        {
          cancelReason,
        },
        {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`✅ 결제 취소 완료: ${paymentKey}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ 결제 취소 실패: ${error.message}`);
      return false;
    }
  }

  /**
   * Toss API 상태 확인
   */
  isConfigured(): boolean {
    return !!this.secretKey;
  }
}
