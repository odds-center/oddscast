/**
 * Toss Payments (토스페이먼츠) billing API client.
 * - Issue billing key from authKey (after payment window success).
 * - Request billing payment (first payment + recurring).
 * @see docs/features/SUBSCRIPTION_PG_TOSSPAYMENTS.md
 */

const TOSS_BILLING_BASE = 'https://api.tosspayments.com/v1/billing';

export interface TossBillingKeyResponse {
  billingKey: string;
  customerKey: string;
  method: string;
  authenticatedAt: string;
  card?: { number?: string; cardType?: string; ownerType?: string };
  cardCompany?: string;
  cardNumber?: string;
}

export interface TossBillingPaymentRequest {
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail: string;
  customerName: string;
  taxFreeAmount?: number;
}

export interface TossBillingPaymentResponse {
  paymentKey: string;
  status: string;
  orderId: string;
  orderName: string;
  totalAmount: number;
  approvedAt?: string;
  method?: string;
  card?: { number?: string; approveNo?: string };
}

export interface TossErrorBody {
  code?: string;
  message?: string;
}

export class TossPaymentsBillingClient {
  private secretKey: string;
  private authHeader: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.authHeader =
      'Basic ' + Buffer.from(this.secretKey + ':', 'utf8').toString('base64');
  }

  /**
   * Exchange authKey (from payment window success redirect) for billingKey.
   * POST /v1/billing/authorizations/issue
   */
  async issueBillingKey(
    customerKey: string,
    authKey: string,
  ): Promise<TossBillingKeyResponse> {
    const res = await fetch(`${TOSS_BILLING_BASE}/authorizations/issue`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerKey, authKey }),
    });

    if (!res.ok) {
      const err: TossErrorBody = await res.json().catch(() => ({}));
      throw new Error(
        err?.message || `Toss billing key issue failed: ${res.status}`,
      );
    }

    return res.json() as Promise<TossBillingKeyResponse>;
  }

  /**
   * Cancel (refund) a payment using its paymentKey.
   * POST /v1/payments/{paymentKey}/cancel
   * @see https://docs.tosspayments.com/reference#결제-취소
   */
  async cancelPayment(
    paymentKey: string,
    cancelAmount: number,
    cancelReason: string,
  ): Promise<unknown> {
    const res = await fetch(
      `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancelReason, cancelAmount }),
      },
    );

    if (!res.ok) {
      const err: TossErrorBody = await res.json().catch(() => ({}));
      throw new Error(err?.message || `Toss cancel payment failed: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Request a billing payment with existing billingKey.
   * POST /v1/billing/{billingKey}
   */
  async requestBillingPayment(
    billingKey: string,
    body: TossBillingPaymentRequest,
  ): Promise<TossBillingPaymentResponse> {
    const res = await fetch(
      `${TOSS_BILLING_BASE}/${encodeURIComponent(billingKey)}`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey: body.customerKey,
          amount: body.amount,
          orderId: body.orderId,
          orderName: body.orderName,
          customerEmail: body.customerEmail,
          customerName: body.customerName,
          taxFreeAmount: body.taxFreeAmount ?? 0,
        }),
      },
    );

    if (!res.ok) {
      const err: TossErrorBody = await res.json().catch(() => ({}));
      throw new Error(
        err?.message || `Toss billing payment failed: ${res.status}`,
      );
    }

    return res.json() as Promise<TossBillingPaymentResponse>;
  }
}
