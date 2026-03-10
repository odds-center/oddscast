import Layout from '@/components/Layout';
import Link from 'next/link';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';

export default function NotFoundPage() {
  return (
    <Layout title='페이지를 찾을 수 없습니다 | OddsCast'>
      <div className='flex flex-col items-center justify-center min-h-[50vh] text-center px-4'>
        <Icon name='AlertCircle' size={64} className='text-text-tertiary mb-4' />
        <h1 className='text-xl md:text-2xl font-bold text-foreground mb-2'>
          페이지를 찾을 수 없습니다
        </h1>
        <p className='text-text-secondary text-sm mb-6 max-w-md'>
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Button asChild>
            <Link href={routes.home}>
              <Icon name='Flag' size={18} />
              홈으로
            </Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href={routes.races.list}>
              <Icon name='Calendar' size={18} />
              경주 목록
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
