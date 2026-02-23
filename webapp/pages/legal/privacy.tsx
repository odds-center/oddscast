import Layout from '@/components/Layout';
import BackLink from '@/components/page/BackLink';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function PrivacyPage() {
  return (
    <Layout title='개인정보 처리방침 | OddsCast'>
      <div className='max-w-2xl mx-auto pb-12'>
        <CompactPageTitle title='개인정보 처리방침' backHref={routes.home} />
        <div className='card space-y-6 text-sm text-foreground leading-relaxed'>
          <p className='text-text-tertiary text-xs'>
            시행일: 2025년 1월 1일 | 최종 수정일: 2025년 1월 1일
          </p>
          <p className='text-text-secondary text-xs'>
            OddsCast(이하 &quot;회사&quot;)는 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하고 있습니다.
          </p>

          {/* Article 1: General Provisions */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제1조 (총칙)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>본 개인정보처리방침은 회사가 제공하는 서비스 이용 시 수집·이용·보관·파기되는 개인정보에 대해 규정합니다.</li>
              <li>회사는 이용자의 개인정보를 최소한으로 수집하며, 수집 목적 달성 시 지체 없이 파기합니다.</li>
              <li>이용자는 본 방침에 따른 개인정보 처리에 대해 「개인정보 보호법」 제35조부터 제38조까지에 따른 권리(열람·정정·삭제·처리정지 요청)를 행사할 수 있습니다.</li>
            </ol>
          </section>

          {/* Article 2: Personal Information Processor */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제2조 (개인정보의 처리 책임자)</h2>
            <p className='text-text-secondary mb-2'>
              회사는 개인정보 처리에 관한 업무를 총괄하는 책임자를 두어 개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.
            </p>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>개인정보 보호 책임자: (담당자명) / privacy@oddscast.com</li>
              <li>개인정보 보호 담당부서: (부서명) / support@oddscast.com</li>
              <li>이용자는 서비스 이용 과정에서 발생한 개인정보 관련 문의·불만·피해구제에 대해 위 담당자에게 연락할 수 있습니다.</li>
            </ul>
          </section>

          {/* Article 3: Personal Information Collected */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제3조 (수집하는 개인정보의 항목 및 수집 방법)</h2>
            <h3 className='text-sm font-medium mt-3 mb-1'>1. 수집 항목</h3>
            <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm my-2'>
              <table className='data-table w-full text-xs'>
                <thead>
                  <tr className='bg-stone-50 border-b border-border text-text-secondary'>
                    <th className='p-3 font-semibold text-left'>구분</th>
                    <th className='p-3 font-semibold text-left'>수집 항목</th>
                    <th className='p-3 font-semibold text-left'>수집 시점</th>
                    <th className='p-3 font-semibold text-left'>보유 기간</th>
                  </tr>
                </thead>
                <tbody className='text-text-secondary'>
                  <tr className='border-b border-stone-100 last:border-0'>
                    <td className='p-3'>필수</td>
                    <td className='p-3'>이메일, 비밀번호, 닉네임</td>
                    <td className='p-3'>회원가입 시</td>
                    <td className='p-3'>탈퇴 시까지 (관계법령 보존의무 있는 경우 해당 기간)</td>
                  </tr>
                  <tr className='border-b border-stone-100 last:border-0'>
                    <td className='p-3'>선택</td>
                    <td className='p-3'>프로필 이미지</td>
                    <td className='p-3'>프로필 수정 시</td>
                    <td className='p-3'>탈퇴 시까지</td>
                  </tr>
                  <tr className='border-b border-stone-100 last:border-0'>
                    <td className='p-3'>자동</td>
                    <td className='p-3'>기기정보, IP주소, 접속 로그, 쿠키</td>
                    <td className='p-3'>서비스 이용 시</td>
                    <td className='p-3'>서비스 이용 종료 시 또는 법정 보존기간</td>
                  </tr>
                  <tr className='border-b border-stone-100 last:border-0'>
                    <td className='p-3'>제3자 로그인</td>
                    <td className='p-3'>Google: 이메일, 프로필 이미지</td>
                    <td className='p-3'>소셜 로그인 시</td>
                    <td className='p-3'>탈퇴 시까지</td>
                  </tr>
                  <tr className='border-b border-stone-100 last:border-0'>
                    <td className='p-3'>결제</td>
                    <td className='p-3'>결제 정보(카드사, PG사 전달용), 거래내역</td>
                    <td className='p-3'>결제 시</td>
                    <td className='p-3'>전자상거래법에 따른 5년</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h3 className='text-sm font-medium mt-3 mb-1'>2. 수집 방법</h3>
            <p className='text-text-secondary'>
              회원가입, 서비스 이용, 고객문의, 이벤트 참여, 제휴사 제공, 자동 수집(접속 로그, 쿠키 등)을 통해 수집합니다.
            </p>
            <h3 className='text-sm font-medium mt-3 mb-1'>3. 수집 거부 권리</h3>
            <p className='text-text-secondary'>
              필수 항목 수집에 동의하지 않으면 회원가입 및 서비스 이용이 불가합니다. 선택 항목은 거부 가능하며, 거부 시 해당 기능만 제한됩니다.
            </p>
          </section>

          {/* Article 4: Purpose of Use */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제4조 (개인정보의 처리 목적)</h2>
            <p className='text-text-secondary mb-2'>회사는 수집한 개인정보를 다음의 목적으로만 이용합니다.</p>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>회원 가입·관리, 본인 확인, 부정 이용 방지</li>
              <li>서비스 제공(예측권 지급, 구독 관리, 결제 처리)</li>
              <li>고객 문의 응대, 분쟁 조정, 민원 처리</li>
              <li>서비스 개선, 신규 서비스 개발, 맞춤형 서비스 제공</li>
              <li>마케팅·광고(동의한 경우에 한함), 이벤트 당첨자 연락</li>
              <li>법령 상 의무 이행, 통계·분석(비식별 처리 후)</li>
            </ul>
            <p className='text-text-secondary mt-2'>
              이용 목적이 변경되는 경우 별도 동의를 받거나 본 방침을 개정하여 공지합니다.
            </p>
          </section>

          {/* Article 5: Retention Period */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제5조 (개인정보의 보유 및 이용 기간)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>회사는 이용 목적 달성 시까지 개인정보를 보유합니다. 단, 다음의 경우 해당 기간 동안 보유합니다.</li>
              <li><strong>전자상거래 등에서의 소비자보호에 관한 법률:</strong> 대금결제 및 재화 등 공급 기록 5년, 소비자 불만·분쟁처리 기록 3년, 표시·광고 기록 6개월, 계약·청약철회 등 기록 5년</li>
              <li><strong>전자금융거래법:</strong> 전자금융 거래 기록 5년</li>
              <li><strong>통신비밀보호법:</strong> 통신사실확인자료 12개월, 로그기록·접속지 추적자료 3개월</li>
              <li><strong>정보통신망법:</strong> 본인확인에 관한 기록 6개월</li>
              <li>회원 탈퇴 시 지체 없이 파기하되, 관계법령에 따라 보존할 의무가 있는 경우 해당 기간 동안 별도 보관합니다. 보관 기간 만료 후에는 지체 없이 파기합니다.</li>
            </ol>
          </section>

          {/* Article 6: Third-Party Disclosure */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제6조 (개인정보의 제3자 제공)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.</li>
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              <li>결제 처리: PG사·카드사 등에 결제에 필요한 최소한의 정보만 전달하며, 이는 서비스 이용을 위한 필수적 절차입니다.</li>
              <li>제3자 제공 시 제공받는 자, 제공 목적, 제공 항목, 보유 기간을 명시하고 동의를 받습니다.</li>
            </ol>
          </section>

          {/* Article 7: Processing Entrustment */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제7조 (개인정보 처리의 위탁)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>회사는 원활한 서비스 제공을 위해 개인정보 처리를 위탁할 수 있으며, 「개인정보 보호법」 제26조에 따라 위탁 받은 자에 대한 관리·감독을 합니다.</li>
              <li>위탁 업무와 수탁자를 아래와 같이 안내합니다. (실제 수탁자에 맞게 수정 필요)</li>
              <ul className='list-disc list-inside ml-4 mt-1 space-y-1'>
                <li>결제 처리: PG사 (토스페이먼츠, KG이니시스 등)</li>
                <li>이메일 발송: 이메일 발송 서비스 업체</li>
                <li>클라우드·호스팅: AWS, GCP 등</li>
              </ul>
              <li>위탁 계약 시 수탁자가 개인정보를 안전하게 처리하도록 문서에 명시하며, 위탁 업무 내용이나 수탁자가 변경되는 경우 본 방침을 통해 공지합니다.</li>
            </ol>
          </section>

          {/* Article 8: Rights of Data Subjects */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제8조 (정보주체의 권리·의무 및 행사 방법)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>이용자는 「개인정보 보호법」 제35조에 따라 다음의 권리를 행사할 수 있습니다: (1) 개인정보 열람 요청, (2) 오류 등이 있을 경우 정정 요청, (3) 삭제 요청, (4) 처리 정지 요청.</li>
              <li>위 권리 행사는 privacy@oddscast.com 또는 support@oddscast.com으로 서면·전자우편 등으로 요청할 수 있으며, 회사는 10일 이내 조치하고 결과를 통지합니다.</li>
              <li>법정대리인이나 위임을 받은 자 등 대리인을 통해서도 권리 행사가 가능하며, 이 경우 위임장 등을 제출하여야 합니다.</li>
              <li>개인정보의 정정 또는 삭제를 요청한 경우 해당 정보를 다른 법률에 따라 사용하는 등 정당한 사유가 없는 한 정정·삭제합니다.</li>
              <li>다만, 「개인정보 보호법」 제35조 제4항에 따라 삭제 요청이 제한되는 경우(법령에서 보존 의무, 타인의 권리 침해 우려 등) 해당 사유를 이용자에게 알립니다.</li>
            </ol>
          </section>

          {/* Article 9: Security Measures */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제9조 (개인정보의 안전성 확보 조치)</h2>
            <p className='text-text-secondary mb-2'>회사는 「개인정보 보호법」 제29조에 따라 다음과 같은 안전성 확보 조치를 하고 있습니다.</p>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육, 개인정보 접근 권한 최소화</li>
              <li>기술적 조치: 개인정보 암호화, 비밀번호 암호화 저장, 접근통제, 해킹 등에 대비한 보안 프로그램 설치</li>
              <li>물리적 조치: 전산실·자료보관실 등의 접근 통제</li>
              <li>개인정보 처리 직원의 최소화 및 비밀 유지 서약</li>
            </ul>
          </section>

          {/* Article 10: Destruction */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제10조 (개인정보의 파기 절차 및 방법)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>회사는 개인정보 보유 기간의 경과, 처리 목적 달성, 개인정보 파기 요청 등 그 개인정보가 불필요하게 되었을 때에는 지체 없이 파기합니다.</li>
              <li>파기 절차: 이용자가 입력한 정보는 목적 달성 후 별도 DB로 옮겨져 내부 방침 및 기타 관계 법령에 따라 일정 기간 저장된 후 혹은 즉시 파기됩니다.</li>
              <li>파기 방법: 전자적 파일은 복구 불가능한 방법으로 영구 삭제하며, 종이 문서는 분쇄기로 분쇄하거나 소각합니다.</li>
              <li>법령에 의해 보존되는 개인정보는 해당 법령이 정한 기간 동안 보관 후 파기합니다.</li>
            </ol>
          </section>

          {/* Article 11: Cookies, etc. */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제11조 (쿠키의 설치·운영 및 거부)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다.</li>
              <li>쿠키는 웹사이트가 이용자의 컴퓨터 브라우저에 전송하는 소량의 정보이며, 로그인 유지, 서비스 이용 통계 등에 활용됩니다.</li>
              <li>이용자는 쿠키 설치에 대한 선택권을 가지며, 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.</li>
            </ol>
          </section>

          {/* Article 12: Children Under 14 */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제12조 (만 14세 미만 아동의 개인정보)</h2>
            <p className='text-text-secondary'>
              회사는 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 만 14세 미만 아동이 회원가입을 시도할 경우 가입을 거부하며, 부득이하게 수집된 경우 즉시 파기합니다.
            </p>
          </section>

          {/* Article 13: Access Logs */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제13조 (접속 로그 및 방문 기록)</h2>
            <p className='text-text-secondary'>
              회사는 서비스 이용 과정에서 IP주소, 쿠키, 방문 일시, 서비스 이용 기록 등을 자동으로 수집할 수 있으며, 이는 「통신비밀보호법」, 「정보통신망법」에 따라 일정 기간 보존 후 파기합니다.
            </p>
          </section>

          {/* Article 14: Policy Changes */}
          <section>
            <h2 className='text-base font-semibold mb-2'>제14조 (개인정보처리방침의 변경)</h2>
            <ol className='list-decimal list-inside text-text-secondary space-y-1'>
              <li>본 방침은 법령 및 방침에 따라 변경될 수 있으며, 변경 시 서비스 화면 공지 또는 이메일로 안내합니다.</li>
              <li>이용자에게 불리한 변경의 경우 적용일 30일 전에 공지합니다. 중요한 변경은 별도의 고지(앱 푸시, 이메일 등)로 안내할 수 있습니다.</li>
              <li>변경된 방침은 공지 후 적용일부터 효력이 발생합니다.</li>
            </ol>
          </section>

          {/* Contact */}
          <section>
            <h2 className='text-base font-semibold mb-2'>개인정보 관련 문의</h2>
            <p className='text-text-secondary'>
              본 방침에 관한 문의사항이 있으시면 개인정보 보호 담당자에게 연락해 주시기 바랍니다. 또한 「개인정보 보호법」 제35조에 따른 개인정보 열람·정정·삭제·처리정지 요구는 privacy@oddscast.com으로 접수하시면 됩니다. 개인정보 침해에 대한 신고나 상담이 필요하신 경우에는 개인정보침해신고센터(국번없이 118), 개인정보분쟁조정위원회(1833-6972), 대검찰청 사이버수사과(국번없이 1301), 경찰청 사이버안전국(국번없이 182) 등으로 문의하실 수 있습니다.
            </p>
          </section>

          <p className='text-text-tertiary text-xs pt-4 border-t border-border'>
            본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다. 이용약관은 <Link href={routes.legal.terms} className='text-primary underline'>서비스 이용 약관</Link>을 참고하세요.
          </p>
        </div>
        <BackLink href={routes.home} label='홈으로' />
      </div>
    </Layout>
  );
}
