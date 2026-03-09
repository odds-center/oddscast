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

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly botToken: string;
  private readonly signupChannelId: string;
  private readonly errorChannelId: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('DISCORD_BOT_TOKEN', '');
    this.signupChannelId = this.config.get<string>('DISCORD_SIGNUP_CHANNEL_ID', '');
    this.errorChannelId = this.config.get<string>('DISCORD_ERROR_CHANNEL_ID', '');
  }

  private get enabled(): boolean {
    return this.botToken.length > 0;
  }

  /**
   * Send embed message to a Discord channel via Bot API.
   * Bot does NOT need to be running 24/7 — just needs to be invited to the server.
   */
  private async sendToChannel(channelId: string, embeds: DiscordEmbed[]): Promise<void> {
    if (!this.enabled || !channelId) return;
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
   * Notify new user registration → signup channel.
   */
  async notifySignup(email: string, nickname?: string): Promise<void> {
    await this.sendToChannel(this.signupChannelId, [
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
    ]);
  }

  /**
   * Notify server error (5xx) → error channel.
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

    await this.sendToChannel(this.errorChannelId, [
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
    ]);
  }

  /**
   * Notify client error (4xx) → error channel.
   * Covers 429 (rate limit), 401, 403, 400, 404, etc.
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

    // Orange for rate limit, yellow for others
    const color = status === 429 ? 0xea580c : 0xd97706;

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: '요청', value: `\`${method} ${url}\``, inline: false },
      { name: '메시지', value: message.slice(0, 200), inline: false },
    ];
    if (ip) {
      fields.push({ name: 'IP', value: `\`${ip}\``, inline: true });
    }

    await this.sendToChannel(this.errorChannelId, [
      {
        title,
        color,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: 'OddsCast' },
      },
    ]);
  }
}
