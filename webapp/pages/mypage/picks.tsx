import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';

/**
 * My picks (Picks) — Excluded from service according to SERVICE_SPEC.
 * Not shown in menu, shows "preparing" message on direct URL access.
 */
export default function PicksPage() {
  return (
    <Layout title='GOLDEN RACE'>
      <CompactPageTitle title='내가 고른 말' backHref={routes.profile.index} />
      <SectionCard className='mt-4'>
        <div className='text-center py-8'>
          <Icon name='Bookmark' size={48} className='mx-auto mb-4 text-text-tertiary' />
          <h2 className='text-lg font-semibold text-foreground mb-2'>서비스 준비 중입니다</h2>
          <p className='text-text-secondary text-sm mb-6'>
            내가 고른 말 기능은 현재 준비 중입니다.
            <br />
            이용해 주셔서 감사합니다.
          </p>
          <Link href={routes.profile.index} className='btn-primary px-4 py-2 text-sm inline-flex items-center gap-2'>
            <Icon name='ChevronLeft' size={16} />
            내 정보로
          </Link>
        </div>
      </SectionCard>
    </Layout>
  );
}
