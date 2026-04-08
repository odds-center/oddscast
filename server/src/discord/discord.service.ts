import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DISCORD_API = 'https://discord.com/api/v10';
const NOTIFICATION_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1489147195264467054/8HZYzgNrVznP5cxoVw42v4LIPbrQTxmjCoT6h0Rjr3k6xMpeljmQX6-M9eotnVGaUYeX';
const PROD_ERROR_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1480146385008594944/S8-3F_oRx3aIux2eprKtri8aq-gRuqRCbi-RTBRlZLmItLmTtBjG7M32NztsRSLg6T6X';
const DEV_ERROR_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1485520539350073364/8QtL-Uyc2OQqGV2FPK7ox-OIrU6wVCKRIyPorDBcaroT3GxtL5j8yUNAgaOTA5zdb29h';

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
  footer?: { text: string };
}

// ─── Dev Error Notification Classes ───

abstract class DevNotification {
  abstract toEmbed(): DiscordEmbed;
}

export class DevServerError extends DevNotification {
  constructor(
    readonly method: string,
    readonly url: string,
    readonly status: number,
    readonly message: string,
    readonly stack?: string,
  ) {
    super();
  }

  toEmbed(): DiscordEmbed {
    const desc = this.stack
      ? `\`\`\`\n${this.stack.slice(0, 1000)}\n\`\`\``
      : this.message;

    return {
      title: `🚨 [DEV] 서버 에러 (${this.status})`,
      description: desc,
      color: 0xb91c1c,
      fields: [
        {
          name: '요청',
          value: `\`${this.method} ${this.url}\``,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'OddsCast DEV' },
    };
  }
}

export class DevClientError extends DevNotification {
  private static readonly STATUS_LABELS: Record<number, string> = {
    429: '⚠️ [DEV] Rate Limit (429)',
    401: '🔒 [DEV] Unauthorized (401)',
    403: '🚫 [DEV] Forbidden (403)',
    400: '❌ [DEV] Bad Request (400)',
    404: '🔍 [DEV] Not Found (404)',
  };

  constructor(
    readonly method: string,
    readonly url: string,
    readonly status: number,
    readonly message: string,
    readonly ip?: string,
  ) {
    super();
  }

  toEmbed(): DiscordEmbed {
    const title =
      DevClientError.STATUS_LABELS[this.status] ??
      `⚠️ [DEV] Client Error (${this.status})`;
    const color = this.status === 429 ? 0xea580c : 0xd97706;

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '요청', value: `\`${this.method} ${this.url}\``, inline: false },
      { name: '메시지', value: this.message.slice(0, 200), inline: false },
    ];
    if (this.ip) {
      fields.push({ name: 'IP', value: `\`${this.ip}\``, inline: true });
    }

    return {
      title,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: 'OddsCast DEV' },
    };
  }
}

export class DevSignupNotification extends DevNotification {
  constructor(
    readonly email: string,
    readonly nickname?: string,
  ) {
    super();
  }

  toEmbed(): DiscordEmbed {
    return {
      title: '🎉 [DEV] 새 회원가입',
      color: 0x16a34a,
      fields: [
        { name: '이메일', value: this.email, inline: true },
        ...(this.nickname
          ? [{ name: '닉네임', value: this.nickname, inline: true }]
          : []),
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'OddsCast DEV' },
    };
  }
}

// ─── Discord Service ───

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly botToken: string;
  private readonly signupChannelId: string;
  private readonly errorChannelId: string;
  private readonly isProduction: boolean;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('DISCORD_BOT_TOKEN', '');
    this.signupChannelId = this.config.get<string>(
      'DISCORD_SIGNUP_CHANNEL_ID',
      '',
    );
    this.errorChannelId = this.config.get<string>(
      'DISCORD_ERROR_CHANNEL_ID',
      '',
    );
    this.isProduction =
      this.config.get<string>('NODE_ENV', '') === 'production';
  }

  private get botEnabled(): boolean {
    return this.botToken.length > 0;
  }

  private get errorWebhookUrl(): string {
    return this.isProduction ? PROD_ERROR_WEBHOOK_URL : DEV_ERROR_WEBHOOK_URL;
  }

  /**
   * Send embed message to a Discord channel via Bot API (production).
   */
  private async sendToChannel(
    channelId: string,
    embeds: DiscordEmbed[],
  ): Promise<void> {
    if (!this.botEnabled || !channelId) return;
    try {
      await axios.post(
        `${DISCORD_API}/channels/${channelId}/messages`,
        { embeds },
        {
          headers: { Authorization: `Bot ${this.botToken}` },
          timeout: 5000,
        },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Discord message failed (channel ${channelId}): ${msg}`);
    }
  }

  /**
   * Send embed message via webhook URL.
   */
  private async sendToWebhook(
    webhookUrl: string,
    embeds: DiscordEmbed[],
  ): Promise<void> {
    if (!webhookUrl) return;
    try {
      await axios.post(webhookUrl, { embeds }, { timeout: 5000 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Discord webhook failed: ${msg}`);
    }
  }

  /**
   * Send error notification to the environment-appropriate webhook.
   */
  private async sendErrorToWebhook(embeds: DiscordEmbed[]): Promise<void> {
    await this.sendToWebhook(this.errorWebhookUrl, embeds);
  }

  /**
   * Notify new user registration.
   */
  async notifySignup(email: string, nickname?: string): Promise<void> {
    const embeds: DiscordEmbed[] = [
      {
        title: '🎉 새 회원가입',
        color: 0x16a34a,
        fields: [
          { name: '이메일', value: email, inline: true },
          ...(nickname
            ? [{ name: '닉네임', value: nickname, inline: true }]
            : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ];
    await this.sendToChannel(this.signupChannelId, embeds);
  }

  /**
   * Notify server error (5xx).
   * Production → prod error webhook, Dev → dev error webhook.
   */
  async notifyError(
    method: string,
    url: string,
    status: number,
    message: string,
    stack?: string,
  ): Promise<void> {
    const desc = stack ? `\`\`\`\n${stack.slice(0, 1000)}\n\`\`\`` : message;
    const env = this.isProduction ? 'PROD' : 'DEV';

    const embeds: DiscordEmbed[] = [
      {
        title: `🚨 [${env}] 서버 에러 (${status})`,
        description: desc,
        color: 0xb91c1c,
        fields: [
          { name: '요청', value: `\`${method} ${url}\``, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `OddsCast ${env}` },
      },
    ];

    if (this.isProduction) {
      await this.sendToChannel(this.errorChannelId, embeds);
    }
    await this.sendErrorToWebhook(embeds);
  }

  /**
   * Notify a new bug report submission.
   * Sends to the DISCORD_BUG_WEBHOOK_URL channel if configured.
   */
  async notifyBugReport(report: {
    id: string;
    title: string;
    description: string;
    category: string;
    pageUrl?: string | null;
    userId?: number | null;
  }): Promise<void> {
    const webhookUrl = this.config.get<string>('DISCORD_BUG_WEBHOOK_URL', '');
    if (!webhookUrl) return;

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '분류', value: report.category, inline: true },
      {
        name: '사용자',
        value: report.userId ? `#${report.userId}` : '비로그인',
        inline: true,
      },
    ];
    if (report.pageUrl) {
      fields.push({
        name: '페이지',
        value: report.pageUrl.substring(0, 200),
        inline: false,
      });
    }
    fields.push({
      name: '내용',
      value: report.description.substring(0, 500),
      inline: false,
    });

    const embeds: DiscordEmbed[] = [
      {
        title: `🐛 버그 신고: ${report.title}`,
        color: 0xf59e0b,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: `ID: ${report.id}` },
      },
    ];

    await this.sendToWebhook(webhookUrl, embeds);
  }

  /**
   * Send to the general notification webhook (DISCORD_NOTIFICATION_WEBHOOK_URL).
   */
  private async sendNotification(embeds: DiscordEmbed[]): Promise<void> {
    await this.sendToWebhook(NOTIFICATION_WEBHOOK_URL, embeds);
  }

  /**
   * Notify subscription payment success.
   */
  async notifySubscriptionPayment(data: {
    userId: number;
    email: string;
    planName: string;
    amount: number;
    paymentKey: string;
    orderId: string;
  }): Promise<void> {
    await this.sendNotification([
      {
        title: '💳 구독 결제 완료',
        color: 0x16a34a,
        fields: [
          {
            name: '사용자',
            value: `#${data.userId} ${data.email}`,
            inline: true,
          },
          { name: '플랜', value: data.planName, inline: true },
          {
            name: '금액',
            value: `${data.amount.toLocaleString()}원`,
            inline: true,
          },
          { name: 'OrderId', value: data.orderId, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ]);
  }

  /**
   * Notify recurring billing success.
   */
  async notifyRecurringBilling(data: {
    userId: number;
    subscriptionId: number;
    planName: string;
    amount: number;
  }): Promise<void> {
    await this.sendNotification([
      {
        title: '🔄 정기 결제 완료',
        color: 0x0ea5e9,
        fields: [
          { name: '사용자', value: `#${data.userId}`, inline: true },
          { name: '플랜', value: data.planName, inline: true },
          {
            name: '금액',
            value: `${data.amount.toLocaleString()}원`,
            inline: true,
          },
          { name: '구독 ID', value: String(data.subscriptionId), inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ]);
  }

  /**
   * Notify ticket (예측권) single purchase.
   */
  async notifyTicketPurchase(data: {
    userId: number;
    quantity: number;
    totalAmount: number;
    pgTransactionId?: string | null;
  }): Promise<void> {
    await this.sendNotification([
      {
        title: '🎟️ 예측권 구매',
        color: 0x7c3aed,
        fields: [
          { name: '사용자', value: `#${data.userId}`, inline: true },
          { name: '수량', value: `${data.quantity}장`, inline: true },
          {
            name: '결제금액',
            value: `${data.totalAmount.toLocaleString()}원`,
            inline: true,
          },
          ...(data.pgTransactionId
            ? [
                {
                  name: 'PG 거래ID',
                  value: data.pgTransactionId,
                  inline: false,
                },
              ]
            : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ]);
  }

  /**
   * Notify prediction ticket (RACE) used.
   */
  async notifyRaceTicketUsed(data: {
    userId: number;
    raceId: number;
    predictionId?: number | null;
  }): Promise<void> {
    await this.sendNotification([
      {
        title: '🏇 예측권 사용',
        color: 0x16a34a,
        fields: [
          { name: '사용자', value: `#${data.userId}`, inline: true },
          { name: '경주 ID', value: String(data.raceId), inline: true },
          ...(data.predictionId != null
            ? [
                {
                  name: '예측 ID',
                  value: String(data.predictionId),
                  inline: true,
                },
              ]
            : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ]);
  }

  /**
   * Notify matrix ticket (종합예상) used.
   */
  async notifyMatrixTicketUsed(data: {
    userId: number;
    date: string;
  }): Promise<void> {
    await this.sendNotification([
      {
        title: '📊 종합예상권 사용',
        color: 0x7c3aed,
        fields: [
          { name: '사용자', value: `#${data.userId}`, inline: true },
          { name: '날짜', value: data.date, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ]);
  }

  /**
   * Notify refund request submitted by user.
   */
  async notifyRefundRequest(data: {
    requestId: string;
    userId: number;
    originalAmount: number;
    requestedAmount: number;
    isEligible: boolean;
    ineligibilityReason: string | null;
    userReason?: string | null;
  }): Promise<void> {
    const eligibilityText = data.isEligible
      ? `✅ 환불 가능 (${data.requestedAmount.toLocaleString()}원)`
      : `❌ 환불 불가 — ${data.ineligibilityReason ?? '사유 없음'}`;

    await this.sendNotification([
      {
        title: '📋 환불 요청 접수',
        color: 0xf59e0b,
        fields: [
          { name: '사용자', value: `#${data.userId}`, inline: true },
          {
            name: '원 결제금액',
            value: `${data.originalAmount.toLocaleString()}원`,
            inline: true,
          },
          {
            name: '요청금액',
            value: `${data.requestedAmount.toLocaleString()}원`,
            inline: true,
          },
          { name: '자격 여부', value: eligibilityText, inline: false },
          ...(data.userReason
            ? [
                {
                  name: '사용자 사유',
                  value: data.userReason.substring(0, 300),
                  inline: false,
                },
              ]
            : []),
          { name: '요청 ID', value: data.requestId, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast — 어드민에서 처리 필요' },
      },
    ]);
  }

  /**
   * Notify refund approved or rejected by admin.
   */
  async notifyRefundProcessed(data: {
    requestId: string;
    userId: number;
    status: 'APPROVED' | 'REJECTED';
    approvedAmount?: number | null;
    adminNote?: string | null;
  }): Promise<void> {
    const isApproved = data.status === 'APPROVED';
    await this.sendNotification([
      {
        title: isApproved ? '✅ 환불 승인' : '🚫 환불 거절',
        color: isApproved ? 0x16a34a : 0xb91c1c,
        fields: [
          { name: '사용자', value: `#${data.userId}`, inline: true },
          ...(isApproved && data.approvedAmount != null
            ? [
                {
                  name: '승인금액',
                  value: `${data.approvedAmount.toLocaleString()}원`,
                  inline: true,
                },
              ]
            : []),
          ...(data.adminNote
            ? [
                {
                  name: '관리자 메모',
                  value: data.adminNote.substring(0, 300),
                  inline: false,
                },
              ]
            : []),
          { name: '요청 ID', value: data.requestId, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ]);
  }

  /**
   * Notify client error (4xx).
   * Production → prod error webhook, Dev → dev error webhook.
   */
  async notifyClientError(
    method: string,
    url: string,
    status: number,
    message: string,
    ip?: string,
  ): Promise<void> {
    const STATUS_LABELS: Record<number, string> = {
      429: '⚠️ Rate Limit (429)',
      401: '🔒 Unauthorized (401)',
      403: '🚫 Forbidden (403)',
      400: '❌ Bad Request (400)',
      404: '🔍 Not Found (404)',
    };
    const env = this.isProduction ? 'PROD' : 'DEV';
    const baseTitle = STATUS_LABELS[status] ?? `⚠️ Client Error (${status})`;
    const title = `[${env}] ${baseTitle}`;
    const color = status === 429 ? 0xea580c : 0xd97706;

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '요청', value: `\`${method} ${url}\``, inline: false },
      { name: '메시지', value: message.slice(0, 200), inline: false },
    ];
    if (ip) {
      fields.push({ name: 'IP', value: `\`${ip}\``, inline: true });
    }

    const embeds: DiscordEmbed[] = [
      {
        title,
        color,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: `OddsCast ${env}` },
      },
    ];

    if (this.isProduction) {
      await this.sendToChannel(this.errorChannelId, embeds);
    }
    await this.sendErrorToWebhook(embeds);
  }
}
