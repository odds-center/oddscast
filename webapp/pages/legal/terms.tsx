import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import BackLink from '@/components/page/BackLink';
import { routes } from '@/lib/routes';

export default function TermsPage() {
  return (
    <Layout title='서비스 이용 약관 — GOLDEN RACE'>
      <div className='max-w-2xl mx-auto'>
        <PageHeader
          icon='AlertCircle'
          title='서비스 이용 약관'
          description='GOLDEN RACE AI 경마 예측 서비스 이용 약관입니다.'
        />

        <div className='card space-y-6 text-sm text-foreground'>
          <section>
            <h2 className='text-base font-semibold mb-2'>1. 서비스 개요</h2>
            <p className='text-text-secondary'>
              본 서비스는 AI 기반 경마 예측 정보 제공 서비스입니다. 실제 마권 구매는 한국마사회 공식 채널에서만 가능하며, 본 앱에서는 베팅을 중개하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className='text-base font-semibold mb-2'>2. 예측 정보의 성격</h2>
            <p className='text-text-secondary'>
              AI 예측은 참고 정보일 뿐이며, 예측 정확도를 보장하지 않습니다. 투자 손실 책임은 사용자 본인에게 있습니다.
            </p>
          </section>

          <section>
            <h2 className='text-base font-semibold mb-2'>3. 구독 서비스</h2>
            <p className='text-text-secondary'>
              예측권은 정보 열람권으로, 구독료는 정보 서비스 이용료입니다. 예측권은 현금 가치가 없으며 환불/교환이 제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className='text-base font-semibold mb-2'>4. 금지 사항</h2>
            <p className='text-text-secondary'>
              앱 내 마권 구매, 베팅 중개, 배당금 수령 등 사행성 행위는 금지됩니다.
            </p>
          </section>

          <section>
            <h2 className='text-base font-semibold mb-2'>5. 면책</h2>
            <p className='text-text-secondary'>
              본 서비스는 예측 정보의 정확성을 보장하지 않으며, 예측 정보 사용으로 인한 손실에 대해 책임지지 않습니다.
            </p>
          </section>

          <p className='text-text-tertiary text-xs pt-4'>
            상세 내용은 docs/legal/LEGAL_NOTICE.md를 참조하세요.
          </p>
        </div>

        <BackLink href={routes.home} label='홈으로' />
      </div>
    </Layout>
  );
}
