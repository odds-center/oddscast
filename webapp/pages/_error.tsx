import type { NextPageContext } from 'next';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Icon from '@/components/icons';
import { routes } from '@/lib/routes';

interface ErrorPageProps {
  statusCode: number | null;
}

function getErrorContent(statusCode: number | null) {
  switch (statusCode) {
    case 400:
      return {
        icon: 'AlertCircle' as const,
        title: '잘못된 요청입니다',
        description: '요청 형식이 올바르지 않습니다. 다시 시도해 주세요.',
        color: 'text-warning',
      };
    case 401:
      return {
        icon: 'Lock' as const,
        title: '로그인이 필요합니다',
        description: '이 페이지는 로그인 후 이용할 수 있습니다.',
        color: 'text-warning',
      };
    case 403:
      return {
        icon: 'ShieldCheck' as const,
        title: '접근 권한이 없습니다',
        description: '이 페이지에 접근할 권한이 없습니다.',
        color: 'text-warning',
      };
    case 408:
      return {
        icon: 'Clock' as const,
        title: '요청 시간이 초과되었습니다',
        description: '네트워크 상태를 확인하고 다시 시도해 주세요.',
        color: 'text-warning',
      };
    case 502:
      return {
        icon: 'WifiOff' as const,
        title: '서버에 연결할 수 없습니다',
        description: '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.',
        color: 'text-error',
      };
    case 503:
      return {
        icon: 'WifiOff' as const,
        title: '서비스를 이용할 수 없습니다',
        description: '서비스가 점검 중이거나 일시 중단되었습니다. 잠시 후 다시 시도해 주세요.',
        color: 'text-error',
      };
    case 504:
      return {
        icon: 'Clock' as const,
        title: '서버 응답 시간이 초과되었습니다',
        description: '서버가 응답하는 데 너무 오래 걸리고 있습니다. 잠시 후 다시 시도해 주세요.',
        color: 'text-error',
      };
    default:
      return {
        icon: 'AlertCircle' as const,
        title: '오류가 발생했습니다',
        description: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        color: 'text-error',
      };
  }
}

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  const { icon, title, description, color } = getErrorContent(statusCode);

  return (
    <Layout title={`${statusCode ?? '오류'} | OddsCast`}>
      <div className='flex flex-col items-center justify-center min-h-[50vh] text-center px-4'>
        <Icon name={icon} size={64} className={`${color} mb-4`} />
        {statusCode && (
          <p className={`text-5xl font-bold ${color} mb-4`}>{statusCode}</p>
        )}
        <h1 className='text-xl md:text-2xl font-bold text-foreground mb-2'>{title}</h1>
        <p className='text-text-secondary text-sm mb-6 max-w-md'>{description}</p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <button
            onClick={() => window.location.reload()}
            className='btn-primary inline-flex items-center gap-2'
          >
            <Icon name='RefreshCw' size={18} />
            다시 시도
          </button>
          <Link href={routes.home} className='btn-secondary inline-flex items-center gap-2'>
            <Icon name='Flag' size={18} />
            홈으로
          </Link>
        </div>
      </div>
    </Layout>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorPageProps => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? null;
  return { statusCode };
};
