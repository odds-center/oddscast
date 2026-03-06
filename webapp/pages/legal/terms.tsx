import Layout from '@/components/Layout';
import BackLink from '@/components/page/BackLink';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function TermsPage() {
  return (
    <Layout title='서비스 이용 약관 | OddsCast'>
      <div className='max-w-2xl mx-auto pb-12'>
        <CompactPageTitle title='서비스 이용 약관' backHref={routes.home} />
        <div className='card space-y-6 text-sm text-foreground leading-relaxed'>
          <p className='text-text-tertiary text-xs'>
            시행일: 2025년 1월 1일 | 최종 수정일: 2025년 1월 1일
          </p>
          <p className='text-text-secondary text-xs'>
            본 약관은 「전자상거래 등에서의 소비자보호에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「콘텐츠산업 진흥법」 등 관련 법령을 준수합니다.
          </p>

          {/* Article 1: Purpose */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제1조 (목적)</h2>
            <p className='text-text-secondary'>
              본 약관은 OddsCast(이하 &quot;회사&quot;)가 제공하는 AI 기반 경마 예측 정보 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차, 회사와 이용자 간의 권리·의무, 기타 필요한 사항을 규정함을 목적으로 합니다. 이용자는 본 약관에 동의한 후 서비스를 이용할 수 있으며, 약관에 동의하지 않을 경우 서비스 이용이 제한됩니다.
            </p>
          </section>

          {/* Article 2: Definitions */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제2조 (정의)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>&quot;서비스&quot;: 회사가 제공하는 AI 경마 예측 정보, 구독 서비스, 웹·모바일 애플리케이션 및 관련 부가 서비스를 의미합니다.</li>
              <li>&quot;이용자&quot;: 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li>&quot;회원&quot;: 회사에 가입하여 회원제 서비스를 이용하는 자를 말합니다.</li>
              <li>&quot;예측권&quot;: AI 예측 정보 열람을 위한 구독 또는 개별 구매에 따라 지급되는 디지털 콘텐츠 열람권을 말합니다.</li>
              <li>&quot;구독&quot;: 월 정기 결제를 통해 예측권을 받는 유료 서비스를 말합니다.</li>
              <li>&quot;디지털 콘텐츠&quot;: 전자적 형태로 제공되는 AI 예측 정보를 말하며, 「콘텐츠산업 진흥법」에서 정한 디지털 콘텐츠에 해당합니다.</li>
              <li>&quot;회원정보&quot;: 이용자가 회원가입 시 입력한 이메일, 비밀번호, 닉네임 등 회사가 수집·관리하는 정보를 말합니다.</li>
            </ol>
          </section>

          {/* Article 3: Nature of Service */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제3조 (서비스의 성격)</h2>
            <p className='text-text-secondary mb-2'>
              본 서비스는 <strong>정보 제공 서비스</strong>이며, 다음과 같이 운영됩니다.
            </p>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>AI 기반 경주 결과 예측 정보 제공 (참고용)</li>
              <li>구독 및 개별 구매를 통한 예측권 제공</li>
              <li>본 서비스는 실제 마권 구매·베팅을 중개하지 않습니다. 마권 구매는 한국마사회 공식 채널에서만 가능합니다.</li>
            </ul>
          </section>

          {/* Article 4: Effectiveness and Amendment of Terms */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제4조 (약관의 효력 및 변경)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 적용일자 7일 전부터 공지합니다. 이용자에게 불리한 변경은 30일 전 공지합니다.</li>
              <li>변경된 약관에 동의하지 않으면 서비스 이용을 중단하고 탈퇴할 수 있습니다. 변경 후에도 계속 이용한 경우 동의한 것으로 봅니다.</li>
            </ol>
          </section>

          {/* Article 5: User Agreement */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제5조 (이용계약의 성립)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>이용계약은 이용자가 약관에 동의하고 회원가입(이메일·비밀번호 등 필수정보 입력 및 가입 완료)을 완료한 시점에 성립합니다.</li>
              <li>회사는 다음 각 호에 해당하는 경우 가입을 거부하거나, 가입 후라도 사전 통지 없이 이용계약을 해지할 수 있습니다: (1) 타인의 명의·정보 도용, (2) 허위 정보 기재, (3) 미성년자가 법정대리인 동의 없이 가입한 경우, (4) 과거 약관 위반 등으로 이용 제한된 자가 재가입 시도하는 경우, (5) 관계법령 또는 공서양속에 위배되는 행위, (6) 부정한 목적이나 방법으로 서비스를 이용하는 경우, (7) 기타 회사가 합리적으로 판단하여 부적절하다고 인정하는 사유.</li>
              <li>이용자는 회원정보를 성실히 유지·관리하여야 하며, 변경 시 즉시 수정하여야 합니다. 부정확한 정보로 인한 불이익은 이용자 책임입니다.</li>
            </ol>
          </section>

          {/* Article 5-2: User Obligations */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제5조의2 (이용자의 의무)</h2>
            <p className='text-text-secondary mb-2'>이용자는 다음 행위를 하여서는 아니 됩니다.</p>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>타인의 계정·비밀번호 도용 또는 이를 제3자에게 알선·대여하는 행위</li>
              <li>서비스 내 콘텐츠를 무단으로 복제·배포·전송·개작하는 행위</li>
              <li>회사의 서버·시스템을 침해하거나 부당한 부하를 가하는 행위</li>
              <li>역공학, 디컴파일, 디스어셈블리 등 서비스를 부정하게 분석하는 행위</li>
              <li>관련 법령 또는 약관을 위반하는 행위</li>
            </ul>
          </section>

          {/* Article 6: Service Usage */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제6조 (서비스 이용)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>서비스는 연중무휴 1일 24시간 제공을 원칙으로 하며, 시스템 점검 등 불가피한 사유로 일시 중단될 수 있습니다.</li>
              <li>회사는 서비스의 일부를 유료로 제공할 수 있으며, 유료 서비스 이용 시 별도 약관이나 결제 화면의 안내에 따릅니다.</li>
              <li>AI 예측 정보는 참고용이며, 예측 정확도를 보장하지 않습니다.</li>
            </ol>
          </section>

          {/* Article 7: Payment and Fees */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제7조 (결제 및 요금)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>유료 서비스 이용 시 표시된 요금을 결제하여야 합니다. 요금에는 부가가치세가 포함됩니다.</li>
              <li>결제는 신용카드, 체크카드 등 회사가 안내하는 수단으로 가능합니다.</li>
              <li>구독 서비스는 결제일로부터 1개월 단위로 자동 갱신되며, 이용자가 해지하지 않으면 연속 결제됩니다.</li>
              <li>예측권 개별 구매 시 구매 시점에 요금이 결제되며, 즉시 예측권이 지급됩니다.</li>
            </ol>
          </section>

          {/* Article 8: Refund Policy (Detailed) */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제8조 (환불 정책)</h2>
            <p className='text-text-secondary mb-2'>
              「전자상거래 등에서의 소비자보호에 관한 법률」 및 「콘텐츠산업 진흥법」에 따라 다음 환불 정책을 적용합니다.
            </p>
            <ol className='list-decimal list-inside text-text-secondary space-y-2'>
              <li><strong>구독 서비스 (7일 이내):</strong> 최초 결제일로부터 7일 이내 해지 요청 시 전액 환불합니다. 단, 이미 사용한 예측권(해당 기간 내 소비한 예측권 수)에 상응하는 금액을 공제할 수 있으며, 이 경우 「콘텐츠산업 진흥법」 제22조 및 동법 시행령의 이용분 공제 기준을 따릅니다.</li>
              <li><strong>구독 서비스 (7일 초과 후):</strong> 당해 결제月度 내 미사용 예측권에 해당하는 금액만 환불합니다. 사용한 예측권은 환불 대상에서 제외됩니다. 월 구독료에서 (사용한 예측권 수 ÷ 해당 월 제공 예측권 수) × 월 구독료를 공제한 잔액을 환불합니다.</li>
              <li><strong>예측권 개별 구매:</strong> 구매 후 사용하지 않은 예측권에 한해 구매일로부터 7일 이내 전액 환불이 가능합니다. 이미 사용한 예측권은 환불되지 않습니다. 여러 장 구매 시 미사용 장 수만큼만 환불됩니다.</li>
              <li><strong>환불 불가 사유:</strong> 다음의 경우 환불하지 않습니다. (1) 구독 또는 개별 구매 후 7일이 경과한 경우 중 사용한 예측권에 해당하는 금액, (2) 이용자의 귀책사유(약관 위반, 부정 이용 등)로 서비스 이용이 제한된 경우, (3) 관계 법령상 환불이 금지된 경우, (4) 이용자가 콘텐츠의 전부 또는 상당 부분을 이미 이용한 경우.</li>
              <li><strong>환불 절차:</strong> 환불 요청은 고객센터(support@oddscast.com) 또는 앱 내 문의를 통해 접수합니다. 접수 후 영업일 5일 이내 환불 처리를 완료하며, 카드사·PG사 사정에 따라 실제 환불 crediting은 7~14영업일 소요될 수 있습니다. 환불 시 결제 수단(신용카드 등)으로 환불하며, 원 결제 수단이 불가한 경우 회사가 지정한 방법으로 환불합니다.</li>
              <li><strong>부분 이용 시 공제:</strong> 디지털 콘텐츠의 특성상 이용한 부분에 대한 환불은 하지 않으며, 미이용 부분에 한해 환불합니다. 이용 여부는 서버 로그(예측 상세 열람 이력)를 기준으로 판단합니다.</li>
            </ol>
          </section>

          {/* Article 9: Termination and Usage Restrictions */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제9조 (해지 및 이용 제한)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>이용자는 언제든지 회원 탈퇴를 통해 이용계약을 해지할 수 있습니다.</li>
              <li>회사는 이용자가 약관을 위반하거나 부정 이용이 확인된 경우 사전 통지 없이 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
              <li>구독 해지 시 당해 월 말일까지 서비스가 유지되며, 익월부터 자동 결제가 중단됩니다.</li>
            </ol>
          </section>

          {/* Article 10: Limitations and Disclaimer of Prediction Information */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제10조 (예측 정보의 한계 및 면책)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>회사가 제공하는 AI 예측 정보는 참고용이며, 예측의 정확성·적시성·완전성을 보장하지 않습니다. 이용자는 이를 인지하고 판단에 반영하여야 합니다.</li>
              <li>이용자가 예측 정보를 참고하여 행한 어떠한 결정(실제 마권 구매 포함)으로 인한 손익에 대해 회사는 일체의 책임을 지지 않습니다. 모든 투자·결정의 책임은 이용자 본인에게 있습니다.</li>
              <li>본 서비스는 마권 구매·베팅을 중개하지 않으며, 실제 베팅은 한국마사회 등 합법적 채널에서 이용자가 직접 수행합니다. 회사는 이용자가 외부에서 행한 베팅 결과에 대해 책임지지 않습니다.</li>
              <li>회사는 천재지변, 전쟁, 테러, 시스템 장애, 네트워크 장애, 제3자의 불법 행위 등 불가항력적 사유로 인한 서비스 중단·지연·손해에 대해 책임지지 않습니다.</li>
              <li>회사의 귀책사유로 인한 손해에 대해 회사가 배상할 경우, 그 배상 범위는 이용자가 해당 사유로 인해 직접 입은 실제 발생한 손해(이용자가 지급한 해당 월 구독료 또는 해당 결제 건 금액을 초과하지 않음)로 한정하며, 간접 손해, 특별 손해, 징벌적 배상, 영업기회 상실 등에 대해서는 배상하지 않습니다.</li>
            </ol>
          </section>

          {/* Article 11: Copyright and Intellectual Property Rights */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제11조 (저작권 및 지식재산권)</h2>
            <p className='text-text-secondary'>
              서비스 내 콘텐츠(텍스트, 이미지, 분석 결과 등)에 대한 저작권 및 지식재산권은 회사에 귀속됩니다. 이용자는 회사의 동의 없이 상업적 목적으로 복제·배포·전송·개작할 수 없습니다.
            </p>
          </section>

          {/* Article 12: Privacy Protection */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제12조 (개인정보 보호)</h2>
            <p className='text-text-secondary'>
              회사는 이용자의 개인정보를 개인정보처리방침에 따라 수집·이용·보관하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다. 자세한 내용은{' '}
              <Link href={routes.legal.privacy} className='text-primary underline'>
                개인정보처리방침
              </Link>
              을 참고하세요.
            </p>
          </section>

          {/* Article 12-2: Company Information and Contact */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제12조의2 (회사 정보 및 연락처)</h2>
            <p className='text-text-secondary mb-2'>
              「전자상거래 등에서의 소비자보호에 관한 법률」 제6조에 따라 회사 정보를 다음과 같이 공지합니다.
            </p>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>상호: OddsCast (주식회사 오즈캐스트)</li>
              <li>대표자: (대표자명)</li>
              <li>사업자등록번호: (사업자등록번호)</li>
              <li>통신판매업 신고번호: (신고번호)</li>
              <li>주소: (회사 주소)</li>
              <li>고객센터: support@oddscast.com</li>
              <li>결제·환불 문의: billing@oddscast.com</li>
            </ul>
          </section>

          {/* Article 12-3: Notices and Announcements */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제12조의3 (통지 및 공지)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>회사가 이용자에게 통지할 때는 이용자가 등록한 이메일, 앱 내 알림, 서비스 화면 공지 등으로 할 수 있습니다.</li>
              <li>이용자에게 불리한 약관 변경 시 적용일 30일 전까지 제1항의 방법으로 공지합니다.</li>
              <li>이용자가 연락처를 잘못 기재하거나 변경 후 수정하지 않아 통지를 받지 못한 경우 회사는 책임지지 않습니다.</li>
            </ol>
          </section>

          {/* Article 13: Dispute Resolution */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제13조 (분쟁 해결 및 관할)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>서비스 이용으로 발생한 분쟁에 대해서는 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.</li>
              <li>전자상거래 등에서의 소비자 보호에 관한 법률에 따라 소비자분쟁해결기준이 적용되는 경우 해당 기준을 따릅니다.</li>
            </ol>
          </section>

          {/* Article 14: Governing Law */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제14조 (준거법)</h2>
            <p className='text-text-secondary'>
              본 약관 및 서비스 이용 관계에는 대한민국 법률이 적용됩니다.
            </p>
          </section>

          {/* Supplementary Provisions */}
          <section>
            <h2 className='text-base font-semibold mb-2'>부칙</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>본 약관은 2025년 1월 1일부터 시행합니다.</li>
              <li>본 약관 시행 이전에 가입한 회원에 대해서도 본 약관을 적용합니다. 다만, 시행일 이전에 발생한 사항에 대해서는 종전 약관에 따릅니다.</li>
            </ol>
          </section>

          <p className='text-text-tertiary text-xs pt-4 border-t border-border'>
            본 약관에 대한 문의: support@oddscast.com | 법적 분쟁 시 관할: 회사 본사 소재지 관할 법원
          </p>
        </div>
        <BackLink href={routes.profile.index} label='내 정보로' />
      </div>
    </Layout>
  );
}
