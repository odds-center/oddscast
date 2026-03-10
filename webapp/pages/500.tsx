import Layout from '@/components/Layout';
import Link from 'next/link';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';

export default function ServerErrorPage() {
  return (
    <Layout title='서버 오류 | OddsCast'>
      <div className='flex flex-col items-center justify-center min-h-[50vh] text-center px-4'>
        <Icon name='AlertCircle' size={64} className='text-error mb-4' />
        <p className='text-5xl font-bold text-error mb-4'>500</p>
        <h1 className='text-xl md:text-2xl font-bold text-foreground mb-2'>
          서버에서 오류가 발생했습니다
        </h1>
        <p className='text-text-secondary text-sm mb-6 max-w-md'>
          일시적인 오류입니다. 잠시 후 다시 시도해 주세요.
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Button onClick={() => window.location.reload()}>
            <Icon name='RefreshCw' size={18} />
            다시 시도
          </Button>
          <Button variant='outline' asChild>
            <Link href={routes.home}>
              <Icon name='Flag' size={18} />
              홈으로
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
