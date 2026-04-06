import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import RequireLogin from '@/components/page/RequireLogin';
import { TabBar, Toggle } from '@/components/ui';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';
import { useAccessibilityStore, type FontSizeLevel } from '@/lib/store/accessibilityStore';
import AuthApi from '@/lib/api/authApi';
import Link from 'next/link';

const menuItemClass =
  'flex items-center gap-4 py-4 px-4 rounded-xl text-foreground hover:bg-stone-50 active:bg-stone-100 transition-colors min-h-[56px] touch-manipulation font-medium text-[16px]';

export default function SettingsPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const logout = useAuthStore((s) => s.logout);
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  const setHighContrast = useAccessibilityStore((s) => s.setHighContrast);
  const fontSize = useAccessibilityStore((s) => s.fontSize);
  const setFontSize = useAccessibilityStore((s) => s.setFontSize);

  const handleLogout = async () => {
    try {
      await AuthApi.logout();
    } catch {
      // Proceed to clear local state even if server call fails
    }
    logout();
    router.push(routes.home);
  };

  return (
    <Layout title='설정 | OddsCast'>
      <div className='space-y-6'>
        <CompactPageTitle title='설정' backHref={routes.profile.index} />

        <SectionCard title='보기 설정' icon='Settings' description='고대비·글자 크기 (접근성)'>
          <div className='space-y-4'>
            <Toggle
              checked={highContrast}
              onChange={setHighContrast}
              label='고대비 모드'
              description='테두리와 글자 대비를 높여 가독성을 높입니다.'
              aria-label='고대비 모드'
            />
            <div>
              <p className='text-sm font-medium text-foreground mb-2'>글자 크기</p>
              <TabBar<FontSizeLevel>
                options={[
                  { value: 'small', label: '작게' },
                  { value: 'medium', label: '보통' },
                  { value: 'large', label: '크게' },
                ]}
                value={fontSize}
                onChange={setFontSize}
                variant='subtle'
                size='sm'
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title='메뉴' icon='Settings' description='알림·약관 등'>
          {isLoggedIn ? (
            <div className='divide-y divide-border'>
              <Link href={routes.profile.edit} className={menuItemClass}>
                <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                  <Icon name='User' size={20} strokeWidth={2} className='text-stone-500' />
                </span>
                <span className='flex-1'>프로필 수정</span>
                <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
              </Link>
              <Link href={routes.settingsNotifications} className={menuItemClass}>
                <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                  <Icon name='Bell' size={20} strokeWidth={2} className='text-stone-500' />
                </span>
                <span className='flex-1'>알림 설정</span>
                <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
              </Link>
              <Link href={routes.updateLog} className={menuItemClass}>
                <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0'>
                  <Icon name='Sparkles' size={20} strokeWidth={2} className='text-primary' />
                </span>
                <span className='flex-1'>업데이트 내역</span>
                <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
              </Link>
              <Link href={routes.legal.terms} className={menuItemClass}>
                <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                  <Icon name='ScrollText' size={20} strokeWidth={2} className='text-stone-500' />
                </span>
                <span className='flex-1'>이용약관</span>
                <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
              </Link>
              <Link href={routes.legal.privacy} className={menuItemClass}>
                <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                  <Icon name='ShieldCheck' size={20} strokeWidth={2} className='text-stone-500' />
                </span>
                <span className='flex-1'>개인정보처리방침</span>
                <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
              </Link>
              <Link href={routes.legal.refund} className={menuItemClass}>
                <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                  <Icon name='ReceiptText' size={20} strokeWidth={2} className='text-stone-500' />
                </span>
                <span className='flex-1'>환불 및 결제 정책</span>
                <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
              </Link>
            </div>
          ) : (
            <>
              <RequireLogin suffix='설정할 수 있습니다' showLoginButton={false} className='mb-4' />
              <div className='divide-y divide-border'>
                <Link href={routes.updateLog} className={menuItemClass}>
                  <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0'>
                    <Icon name='Sparkles' size={20} strokeWidth={2} className='text-primary' />
                  </span>
                  <span className='flex-1'>업데이트 내역</span>
                  <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
                </Link>
                <Link href={routes.legal.terms} className={menuItemClass}>
                  <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                    <Icon name='ScrollText' size={20} strokeWidth={2} className='text-stone-500' />
                  </span>
                  <span className='flex-1'>이용약관</span>
                  <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
                </Link>
                <Link href={routes.legal.privacy} className={menuItemClass}>
                  <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                    <Icon name='ShieldCheck' size={20} strokeWidth={2} className='text-stone-500' />
                  </span>
                  <span className='flex-1'>개인정보처리방침</span>
                  <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
                </Link>
                <Link href={routes.legal.refund} className={menuItemClass}>
                  <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                    <Icon name='ReceiptText' size={20} strokeWidth={2} className='text-stone-500' />
                  </span>
                  <span className='flex-1'>환불 및 결제 정책</span>
                  <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
                </Link>
              </div>
            </>
          )}
        </SectionCard>

        {isLoggedIn && (
          <SectionCard title='계정' icon='User' description='로그아웃 및 회원탈퇴'>
            <div className='divide-y divide-border'>
              <Button
                type='button'
                variant='ghost'
                onClick={handleLogout}
                className={`${menuItemClass} w-full text-left`}
              >
                <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                  <Icon name='LogOut' size={20} strokeWidth={2} className='text-stone-500' />
                </span>
                <span className='flex-1'>로그아웃</span>
              </Button>
              <Link href={routes.settingsDeleteAccount} className={menuItemClass}>
                <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-stone-50 shrink-0'>
                  <Icon name='UserMinus' size={20} strokeWidth={2} className='text-stone-500' />
                </span>
                <span className='flex-1'>회원탈퇴</span>
                <Icon name='ChevronRight' size={16} className='text-stone-500 shrink-0' />
              </Link>
            </div>
          </SectionCard>
        )}

      </div>
    </Layout>
  );
}
