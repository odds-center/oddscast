import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY', '');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY not configured — email sending disabled',
      );
    }
    this.fromAddress = this.config.get<string>(
      'MAIL_FROM',
      'OddsCast <onboarding@resend.dev>',
    );
  }

  /**
   * Send a 6-digit email verification code.
   */
  async sendVerificationCode(
    to: string,
    code: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      this.logger.warn('Email not sent (Resend not configured)');
      return { success: false, error: 'Mail service not configured' };
    }
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: '[OddsCast] 이메일 인증 코드',
        html: this.buildVerificationHtml(code),
      });
      if (error) {
        this.logger.error(`Resend error: ${error.message}`);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Send failed: ${msg}`);
      return { success: false, error: msg };
    }
  }

  /**
   * Send a password reset email with a reset link.
   */
  async sendPasswordResetEmail(
    to: string,
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      this.logger.warn('Email not sent (Resend not configured)');
      return { success: false, error: 'Mail service not configured' };
    }
    const webappUrl =
      this.config.get<string>('WEBAPP_URL') ||
      this.config.get<string>('NEXT_PUBLIC_WEBAPP_URL') ||
      'https://oddscast-webapp.vercel.app';
    const resetLink = `${webappUrl}/auth/reset-password?token=${token}`;
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: '[OddsCast] 비밀번호 재설정',
        html: this.buildPasswordResetHtml(resetLink),
      });
      if (error) {
        this.logger.error(`Resend error: ${error.message}`);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Send failed: ${msg}`);
      return { success: false, error: msg };
    }
  }

  private buildPasswordResetHtml(resetLink: string): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#16a34a;padding:24px 32px;">
      <h1 style="color:#ffffff;font-size:20px;margin:0;">OddsCast</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 8px;">비밀번호 재설정</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        아래 버튼을 클릭하여 비밀번호를 재설정하세요.<br/>
        링크는 <strong>1시간</strong> 동안 유효합니다.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetLink}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;text-decoration:none;">
          비밀번호 재설정
        </a>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.5;margin:24px 0 0;">
        본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
      </p>
    </div>
    <div style="background:#fafafa;padding:16px 32px;border-top:1px solid #eee;">
      <p style="color:#aaa;font-size:11px;margin:0;text-align:center;">
        &copy; OddsCast - AI 경마 예측 서비스
      </p>
    </div>
  </div>
</body>
</html>`.trim();
  }

  private buildVerificationHtml(code: string): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#16a34a;padding:24px 32px;">
      <h1 style="color:#ffffff;font-size:20px;margin:0;">OddsCast</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 8px;">이메일 인증</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        아래 인증 코드를 입력하여 회원가입을 완료하세요.<br/>
        코드는 <strong>10분</strong> 동안 유효합니다.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:16px 32px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#16a34a;">
          ${code}
        </span>
      </div>
      <p style="color:#999;font-size:12px;line-height:1.5;margin:24px 0 0;">
        본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
      </p>
    </div>
    <div style="background:#fafafa;padding:16px 32px;border-top:1px solid #eee;">
      <p style="color:#aaa;font-size:11px;margin:0;text-align:center;">
        &copy; OddsCast - AI 경마 예측 서비스
      </p>
    </div>
  </div>
</body>
</html>`.trim();
  }
}
