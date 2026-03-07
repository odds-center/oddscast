import * as Sentry from '@sentry/nextjs';
import Layout from '@/components/Layout';

export default function SentryExamplePage() {
  return (
    <Layout title="Sentry Test - OddsCast">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <h1 className="text-2xl font-bold">Sentry Test</h1>
        <p className="text-secondary">아래 버튼을 눌러 테스트 에러를 Sentry로 전송하세요.</p>

        <button
          className="btn-primary"
          onClick={() => {
            Sentry.captureException(new Error('Sentry test error from OddsCast webapp'));
            throw new Error('myUndefinedFunction is not a function');
          }}
        >
          테스트 에러 발생
        </button>

        <button
          className="btn-secondary"
          onClick={async () => {
            await Sentry.flush(2000);
            alert('Sentry에 에러를 전송했습니다. Issues 탭을 확인하세요.');
          }}
        >
          Sentry 전송 확인
        </button>
      </div>
    </Layout>
  );
}
