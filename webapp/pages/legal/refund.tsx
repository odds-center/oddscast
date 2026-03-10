import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function RefundPage() {
  return (
    <Layout title='환불 및 결제 정책 | OddsCast'>
      <div className='max-w-2xl mx-auto pb-12'>
        <CompactPageTitle title='환불 및 결제 정책' backHref={routes.home} />
        <div className='rounded-[10px] border border-border bg-card p-4 md:px-5 md:py-[1.125rem] space-y-6 text-sm text-foreground leading-relaxed'>
          <p className='text-text-tertiary text-xs'>
            시행일: 2025년 1월 1일 | 최종 수정일: 2025년 1월 1일
          </p>
          <p className='text-text-secondary'>
            본 정책은 OddsCast(이하 &quot;회사&quot;)가 제공하는 유료 서비스의 결제 및 환불에 관한 사항을 규정합니다. 「전자상거래 등에서의 소비자보호에 관한 법률」, 「콘텐츠산업 진흥법」 등을 준수합니다.
          </p>

          {/* 1. Payment Policy */}
          <section>
            <h2 className='text-base font-semibold mb-2'>1. 결제 정책</h2>
            <h3 className='text-sm font-medium mt-3 mb-1'>1.1 구독 서비스</h3>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>구독은 월 단위 정기 결제 방식으로 제공됩니다.</li>
              <li>결제일로부터 1개월간 해당 월의 예측권이 제공되며, 만료 시 자동 갱신됩니다.</li>
              <li>구독 요금에는 부가가치세가 포함되어 있습니다.</li>
              <li>결제 수단: 신용카드, 체크카드 등 회사가 지정한 PG사를 통한 결제만 가능합니다.</li>
              <li>자동 갱신 해지 시: 당해 월 말일까지 서비스가 유지되며, 익월부터 결제가 중단됩니다.</li>
            </ul>
            <h3 className='text-sm font-medium mt-3 mb-1'>1.2 예측권 개별 구매</h3>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>예측권은 1장 단위 또는 패키지로 개별 구매할 수 있습니다.</li>
              <li>결제 완료 시 즉시 예측권이 계정에 지급됩니다.</li>
              <li>개별 구매 예측권은 별도 유효기간이 있으면 해당 기간 내에만 사용 가능합니다.</li>
            </ul>
            <h3 className='text-sm font-medium mt-3 mb-1'>1.3 결제 실패 및 재시도</h3>
            <p className='text-text-secondary'>
              결제 실패(카드 한도 초과, 잔액 부족 등) 시 재시도 안내를 드립니다. 반복 실패 시 고객센터로 문의 바랍니다.
            </p>
          </section>

          {/* 2. Refund Policy */}
          <section>
            <h2 className='text-base font-semibold mb-2'>2. 환불 정책</h2>
            <h3 className='text-sm font-medium mt-3 mb-1'>2.1 구독 서비스 환불</h3>
            <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm my-2'>
              <table className='data-table w-full text-xs'>
                <thead>
                  <tr className='bg-stone-50 border-b border-border text-text-secondary'>
                    <th className='p-3 font-semibold text-left'>기간</th>
                    <th className='p-3 font-semibold text-left'>환불 기준</th>
                  </tr>
                </thead>
                <tbody className='text-text-secondary'>
                  <tr className='border-b border-stone-100 last:border-0'>
                    <td className='p-3'>최초 결제 후 7일 이내</td>
                    <td className='p-3'>전액 환불. 다만, 이미 사용한 예측권에 상응하는 금액은 공제할 수 있음</td>
                  </tr>
                  <tr className='border-b border-stone-100 last:border-0'>
                    <td className='p-3'>7일 초과 후</td>
                    <td className='p-3'>당해 월 내 미사용 예측권에 해당하는 금액만 환불. 사용한 예측권은 환불 제외</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className='text-text-secondary mt-2'>
              환불액 = 월 구독료 × (미사용 예측권 수 ÷ 해당 월 제공 예측권 수)
            </p>

            <h3 className='text-sm font-medium mt-3 mb-1'>2.2 예측권 개별 구매 환불</h3>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>구매일로부터 7일 이내, 사용하지 않은 예측권에 한해 전액 또는 해당 미사용분만 환불 가능합니다.</li>
              <li>이미 사용한 예측권은 환불 대상에서 제외됩니다.</li>
              <li>여러 장 구매 시: 미사용 장 수 × (총 결제액 ÷ 구매 장 수) 로 환불합니다.</li>
            </ul>

            <h3 className='text-sm font-medium mt-3 mb-1'>2.3 환불 불가 사유</h3>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>이미 전부 또는 상당 부분 사용한 콘텐츠</li>
              <li>구매일 또는 결제일로부터 7일이 경과한 후 사용한 분에 해당하는 금액</li>
              <li>이용자의 귀책사유(약관 위반, 부정 이용 등)로 서비스 이용이 제한된 경우</li>
              <li>관계 법령에서 환불을 금지하는 경우</li>
            </ul>

            <h3 className='text-sm font-medium mt-3 mb-1'>2.4 환불 절차</h3>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>환불 요청: support@oddscast.com 또는 앱 내 고객문의로 접수합니다.</li>
              <li>필요 시 본인 확인 및 거래 확인을 위해 추가 정보를 요청할 수 있습니다.</li>
              <li>접수 후 영업일 5일 이내 환불 처리. PG사·카드사 사정에 따라 실제 환불 crediting은 7~14영업일 소요될 수 있습니다.</li>
              <li>원 결제 수단(신용카드 등)으로 환불합니다. 해당 수단이 불가한 경우 회사가 지정한 방법으로 환불합니다.</li>
            </ol>
          </section>

          {/* 3. User Protection */}
          <section>
            <h2 className='text-base font-semibold mb-2'>3. 이용자 보호 (전자상거래법)</h2>
            <p className='text-text-secondary mb-2'>
              「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 다음 사항을 안내합니다.
            </p>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>청약 철회: 디지털 콘텐츠의 경우 제공이 개시된 후에는 「콘텐츠산업 진흥법」 제22조에 따라 이용한 부분에 대해서는 청약 철회가 제한됩니다. 단, 7일 이내 미사용분은 환불 가능합니다.</li>
              <li>소비자 피해 보상: 회사는 소비자 분쟁해결 기준(공정거래위원회 고시)을 준수합니다.</li>
              <li>분쟁 해결: 결제·환불 관련 분쟁은 고객센터를 통해 조정하며, 소비자분쟁조정위원회, 한국소비자원 등에 분쟁 조정을 신청할 수 있습니다.</li>
            </ul>
          </section>

          {/* 4. Contact */}
          <section>
            <h2 className='text-base font-semibold mb-2'>4. 문의처</h2>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>결제·환불 문의: billing@oddscast.com</li>
              <li>고객센터: support@oddscast.com</li>
            </ul>
            <p className='text-text-secondary mt-2'>
              상세한 이용약관은 <Link href={routes.legal.terms} className='text-primary underline'>서비스 이용 약관</Link>을 참고하세요.
            </p>
          </section>

          <p className='text-text-tertiary text-xs pt-4 border-t border-border'>
            본 정책은 2025년 1월 1일부터 시행됩니다.
          </p>
        </div>
      </div>
    </Layout>
  );
}
