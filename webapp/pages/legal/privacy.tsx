import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import BackLink from '@/components/page/BackLink';
import { routes } from '@/lib/routes';

export default function PrivacyPage() {
  return (
    <Layout title='개인정보 처리방침 — GOLDEN RACE'>
      <div className='max-w-2xl mx-auto'>
        <PageHeader
          icon='AlertCircle'
          title='개인정보 처리방침'
          description='GOLDEN RACE 서비스의 개인정보 수집 및 이용에 관한 안내입니다.'
        />

        <div className='card space-y-6 text-sm text-foreground'>
          <section>
            <h2 className='text-base font-semibold mb-2'>1. 수집하는 개인정보</h2>
            <p className='text-text-secondary mb-2'>다음 정보를 수집할 수 있습니다:</p>
            <ul className='list-disc list-inside text-text-secondary space-y-1'>
              <li>이메일, 비밀번호 (회원가입 시)</li>
              <li>이름, 닉네임 (프로필)</li>
              <li>구글 로그인 시: 이메일, 프로필 이미지</li>
              <li>서비스 이용 기록 (경주 조회, 예측 이력 등)</li>
            </ul>
          </section>

          <section>
            <h2 className='text-base font-semibold mb-2'>2. 이용 목적</h2>
            <p className='text-text-secondary'>
              서비스 제공, 회원 관리, 결제 처리, 고객 문의 응대, 서비스 개선을 위해 이용합니다.
            </p>
          </section>

          <section>
            <h2 className='text-base font-semibold mb-2'>3. 보관 기간</h2>
            <p className='text-text-secondary'>
              회원 탈퇴 시 또는 이용 목적 달성 시까지 보관하며, 관계 법령에 따라 보존할 의무가 있는 경우 해당 기간 동안 보관합니다.
            </p>
          </section>

          <section>
            <h2 className='text-base font-semibold mb-2'>4. 제3자 제공</h2>
            <p className='text-text-secondary'>
              사용자 동의 없이 제3자에게 개인정보를 제공하지 않습니다. 결제 처리를 위해 PG사에 필요한 정보만 전달합니다.
            </p>
          </section>

          <section>
            <h2 className='text-base font-semibold mb-2'>5. 권리 및 문의</h2>
            <p className='text-text-secondary'>
              개인정보 열람·정정·삭제를 요청하실 수 있습니다. 문의: support@goldenrace.com
            </p>
          </section>

          <p className='text-text-tertiary text-xs pt-4'>
            시행일: 2025년 1월 1일
          </p>
        </div>

        <BackLink href={routes.home} label='홈으로' />
      </div>
    </Layout>
  );
}
