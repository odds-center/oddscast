import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DISCORD_API = 'https://discord.com/api/v10';

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
        { name: '요청', value: `\`${this.method} ${this.url}\``, inline: false },
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
      DevClientError.STATUS_LABELS[this.status] ?? `⚠️ [DEV] Client Error (${this.status})`;
    const color = this.status === 429 ? 0xea580c : 0xd97706;

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '요청', value: `\`${this.method} ${this.url}\``, inline: false },
      { name: '메시지', value: this.message.slice(0, 200), inline: false },
    ];
    if (this.ip) {
      fields.push({ name: 'IP', value: `\`${this.ip}\``, inline: true });
    }

    return { title, color, fields, timestamp: new Date().toISOString(), footer: { text: 'OddsCast DEV' } };
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
        ...(this.nickname ? [{ name: '닉네임', value: this.nickname, inline: true }] : []),
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
  private readonly devWebhookUrl: string;
  private readonly isProduction: boolean;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('DISCORD_BOT_TOKEN', '');
    this.signupChannelId = this.config.get<string>('DISCORD_SIGNUP_CHANNEL_ID', '');
    this.errorChannelId = this.config.get<string>('DISCORD_ERROR_CHANNEL_ID', '');
    this.devWebhookUrl = this.config.get<string>('DISCORD_DEV_WEBHOOK_URL', '');
    this.isProduction = this.config.get<string>('NODE_ENV', '') === 'production';
  }

  private get botEnabled(): boolean {
    return this.botToken.length > 0;
  }

  private get devEnabled(): boolean {
    return !this.isProduction && this.devWebhookUrl.length > 0;
  }

  /**
   * Send embed message to a Discord channel via Bot API (production).
   */
  private async sendToChannel(channelId: string, embeds: DiscordEmbed[]): Promise<void> {
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
   * Send dev notification via webhook (non-production only).
   */
  async sendDevNotification(notification: DevNotification): Promise<void> {
    if (!this.devEnabled) return;
    try {
      await axios.post(
        this.devWebhookUrl,
        { embeds: [notification.toEmbed()] },
        { timeout: 5000 },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Discord dev webhook failed: ${msg}`);
    }
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
          ...(nickname ? [{ name: '닉네임', value: nickname, inline: true }] : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ];
    await this.sendToChannel(this.signupChannelId, embeds);
    await this.sendDevNotification(new DevSignupNotification(email, nickname));
  }

  /**
   * Notify server error (5xx).
   */
  async notifyError(
    method: string,
    url: string,
    status: number,
    message: string,
    stack?: string,
  ): Promise<void> {
    const desc = stack
      ? `\`\`\`\n${stack.slice(0, 1000)}\n\`\`\``
      : message;

    const embeds: DiscordEmbed[] = [
      {
        title: `🚨 서버 에러 (${status})`,
        description: desc,
        color: 0xb91c1c,
        fields: [
          { name: '요청', value: `\`${method} ${url}\``, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ];
    await this.sendToChannel(this.errorChannelId, embeds);
    await this.sendDevNotification(new DevServerError(method, url, status, message, stack));
  }

  /**
   * Notify client error (4xx).
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
    const title = STATUS_LABELS[status] ?? `⚠️ Client Error (${status})`;
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
        footer: { text: 'OddsCast' },
      },
    ];
    await this.sendToChannel(this.errorChannelId, embeds);
    await this.sendDevNotification(new DevClientError(method, url, status, message, ip));
  }
}
