import Link from 'next/link';

export default function AdminHome() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <h1 className='text-4xl font-bold text-gray-900 mb-8'>Golden Race 관리자</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {/* 구독 플랜 관리 */}
          <Link
            href='/subscription-plans'
            className='block p-6 bg-white rounded-lg shadow hover:shadow-lg transition'
          >
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>📋 구독 플랜 관리</h2>
            <p className='text-gray-600'>라이트/프리미엄 플랜 가격 및 구성 수정</p>
          </Link>

          {/* 개별 구매 설정 */}
          <Link
            href='/single-purchase-config'
            className='block p-6 bg-white rounded-lg shadow hover:shadow-lg transition'
          >
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>🎫 개별 구매 설정</h2>
            <p className='text-gray-600'>개별 예측권 가격 및 할인 정책 관리</p>
          </Link>

          {/* AI 모델 설정 */}
          <Link
            href='/ai-config'
            className='block p-6 bg-white rounded-lg shadow hover:shadow-lg transition'
          >
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>🤖 AI 설정</h2>
            <p className='text-gray-600'>모델 선택, 프롬프트, 비용 관리</p>
          </Link>

          {/* 예측 통계 */}
          <Link
            href='/analytics'
            className='block p-6 bg-white rounded-lg shadow hover:shadow-lg transition'
          >
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>📊 AI 통계</h2>
            <p className='text-gray-600'>정확도, 비용, ROI 분석</p>
          </Link>

          {/* 사용자 관리 */}
          <Link
            href='/users'
            className='block p-6 bg-white rounded-lg shadow hover:shadow-lg transition'
          >
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>👥 사용자 관리</h2>
            <p className='text-gray-600'>구독자, 예측권, 베팅 내역</p>
          </Link>

          {/* 수익 대시보드 */}
          <Link
            href='/revenue'
            className='block p-6 bg-white rounded-lg shadow hover:shadow-lg transition'
          >
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>💰 수익 대시보드</h2>
            <p className='text-gray-600'>매출, 비용, 마진 분석</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
