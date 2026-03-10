/**
 * Toss billing auth fail redirect.
 * Query: code, message (Toss appends), optionally subscriptionId.
 */
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';

export default function SubscriptionCheckoutFailPage() {
  const router = useRouter();
  const { code, message } = router.query;

  const msg =
    typeof message === 'string'
      ? message
      : Array.isArray(message)
        ? message[0]
        : code
          ? `결제 등록에 실패했습니다. (${code})`
          : '카드 등록 또는 본인인증이 취소되었거나 실패했습니다.';

  return (
    <Layout title='구독 결제 실패 | OddsCast'>
      <div className='max-w-md mx-auto'>
        <CompactPageTitle title='결제 실패' backHref={routes.mypage.subscriptions} />
        <EmptyState
          icon='AlertCircle'
          title='결제 등록 실패'
          description={msg}
        />
        <p className='text-text-secondary text-sm mt-2'>카드를 다시 등록하거나 다른 결제 수단을 이용해 주세요.</p>
        <div className='flex flex-col gap-2 mt-4'>
          <Button asChild className='w-full py-2.5'>
            <Link href={routes.mypage.subscriptions}>
              구독 플랜으로
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
