import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import AuthCard from '@/components/page/AuthCard';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import AuthApi from '@/lib/api/authApi';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuthStore } from '@/lib/store/authStore';

const CODE_LENGTH = 6;

export default function VerifyEmail() {
  const router = useRouter();
  const email = router.isReady ? ((router.query.email as string) || '') : '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === CODE_LENGTH - 1 && newDigits.every((d) => d) && !isSubmitting) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const newDigits = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { newDigits[i] = d; });
    setDigits(newDigits);
    setError('');

    if (pasted.length === CODE_LENGTH) {
      submitCode(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const submitCode = async (code: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await AuthApi.verifyEmail(code);
      if (res.accessToken && res.user) {
        setAuth(res.accessToken, res.user, res.refreshToken);
        router.push(routes.home);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      await AuthApi.resendVerificationEmail(email);
      setResendMessage('인증 코드가 재발송되었습니다.');
      setResendCooldown(60);
      setTimeout(() => setResendMessage(''), 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const handleManualSubmit = () => {
    if (isSubmitting) return;
    const code = digits.join('');
    if (code.length === CODE_LENGTH) {
      submitCode(code);
    }
  };

  if (!router.isReady) {
    return (
      <Layout title='이메일 인증 | OddsCast'>
        <div className='max-w-[400px] mx-auto px-4 py-6 sm:py-8'>
          <CompactPageTitle title='이메일 인증' backHref={routes.auth.register} />
          <div className='py-16 flex justify-center'>
            <Icon name='Loader2' size={24} className='animate-spin text-text-secondary' />
          </div>
        </div>
      </Layout>
    );
  }

  if (!email) {
    return (
      <Layout title='이메일 인증 | OddsCast'>
        <div className='max-w-[400px] mx-auto px-4 py-6 sm:py-8'>
          <CompactPageTitle title='이메일 인증' backHref={routes.auth.register} />
          <AuthCard title='이메일 인증'>
            <p className='text-text-secondary text-sm mb-4'>
              잘못된 접근입니다. 회원가입부터 진행해 주세요.
            </p>
          </AuthCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title='이메일 인증 | OddsCast'>
      <div className='max-w-[400px] mx-auto px-4 py-6 sm:py-8'>
        <CompactPageTitle title='이메일 인증' backHref={routes.auth.register} />
        <AuthCard
          title='이메일 인증'
          description={`${email}로 발송된 6자리 인증 코드를 입력하세요.`}
        >
          {/* 6-digit code input */}
          <div className='flex justify-center gap-2 sm:gap-3 mb-6' onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                autoFocus={i === 0}
                type='text'
                inputMode='numeric'
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={isSubmitting}
                className='w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-semibold
                  border-2 border-border rounded-lg
                  focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
                  disabled:opacity-50 bg-background text-foreground
                  transition-colors'
                aria-label={`인증 코드 ${i + 1}번째 자리`}
              />
            ))}
          </div>

          {error && (
            <p className='text-error text-sm text-center mb-4'>{error}</p>
          )}

          {resendMessage && (
            <p className='text-success text-sm text-center mb-4'>{resendMessage}</p>
          )}

          <Button
            type='button'
            onClick={handleManualSubmit}
            disabled={isSubmitting || digits.some((d) => !d)}
            className='w-full py-3 rounded-lg text-[16px] mb-4'
          >
            {isSubmitting ? (
              <>
                <Icon name='Loader2' size={20} className='animate-spin' />
                확인 중...
              </>
            ) : (
              <>
                <Icon name='ShieldCheck' size={20} />
                인증 확인
              </>
            )}
          </Button>

          <div className='text-center'>
            <p className='text-text-secondary text-sm mb-2'>
              코드를 받지 못하셨나요?
            </p>
            <Button
              type='button'
              variant='link'
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `재발송 (${resendCooldown}초)`
                : '인증 코드 재발송'}
            </Button>
          </div>
        </AuthCard>

      </div>
    </Layout>
  );
}
