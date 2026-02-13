import Layout from '@/components/Layout';
import Link from 'next/link';
import Icon from '@/components/icons';
import { routes } from '@/lib/routes';

export default function NotFoundPage() {
  return (
    <Layout title='GOLDEN RACE'>
      <div className='flex flex-col items-center justify-center min-h-[50vh] text-center px-4'>
        <Icon name='AlertCircle' size={64} className='text-text-tertiary mb-4' />
        <h1 className='text-xl md:text-2xl font-bold text-foreground mb-2'>
          페이지를 찾을 수 없습니다
        </h1>
        <p className='text-text-secondary text-sm mb-6 max-w-md'>
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link href={routes.home} className='btn-primary inline-flex items-center gap-2'>
          <Icon name='Flag' size={18} />
          홈으로
        </Link>
      </div>
    </Layout>
  );
}
