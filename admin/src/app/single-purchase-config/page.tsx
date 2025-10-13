'use client';

import { useState, useEffect } from 'react';

interface SinglePurchaseConfig {
  id: string;
  configName: string;
  displayName: string;
  description: string;
  originalPrice: number;
  vat: number;
  totalPrice: number;
  isActive: boolean;
}

export default function SinglePurchaseConfigPage() {
  const [config, setConfig] = useState<SinglePurchaseConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // TODO: API 호출
      // const response = await fetch('/api/single-purchase-config');
      // const data = await response.json();
      // setConfig(data);

      // 임시 데이터
      setConfig({
        id: '1',
        configName: 'SINGLE_TICKET',
        displayName: '개별 예측권',
        description: 'AI 예측 1회 사용 가능',
        originalPrice: 1000,
        vat: 100,
        totalPrice: 1100,
        isActive: true,
      });
      setLoading(false);
    } catch (error) {
      console.error('설정 조회 실패:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      // TODO: API 호출
      // await fetch(`/api/single-purchase-config/${config.id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(config),
      // });

      alert('저장되었습니다');
      fetchConfig();
    } catch (error) {
      alert('저장 실패');
    }
  };

  if (loading || !config) {
    return <div className='p-8'>로딩 중...</div>;
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>개별 구매 설정</h1>

        <div className='bg-white rounded-lg shadow p-8'>
          <div className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>설정 이름</label>
              <input
                type='text'
                value={config.displayName}
                onChange={(e) => setConfig({ ...config, displayName: e.target.value })}
                className='w-full px-4 py-2 border rounded-lg'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>설명</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className='w-full px-4 py-2 border rounded-lg'
                rows={3}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  원가 (VAT 제외)
                </label>
                <input
                  type='number'
                  value={config.originalPrice}
                  onChange={(e) => {
                    const original = parseFloat(e.target.value);
                    const vat = Math.round(original * 0.1);
                    const total = original + vat;
                    setConfig({
                      ...config,
                      originalPrice: original,
                      vat,
                      totalPrice: total,
                    });
                  }}
                  className='w-full px-4 py-2 border rounded-lg'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>부가세 (10%)</label>
                <input
                  type='number'
                  value={config.vat}
                  disabled
                  className='w-full px-4 py-2 border rounded-lg bg-gray-100'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  최종 가격 (VAT 포함)
                </label>
                <input
                  type='number'
                  value={config.totalPrice}
                  disabled
                  className='w-full px-4 py-2 border rounded-lg bg-gray-100 font-bold text-lg'
                />
              </div>
            </div>

            <div className='bg-blue-50 p-6 rounded-lg'>
              <h3 className='font-semibold text-gray-900 mb-4'>💰 가격 미리보기</h3>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>1장 구매:</span>
                  <span className='font-bold'>₩{config.totalPrice.toLocaleString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span>5장 구매:</span>
                  <span className='font-bold'>₩{(config.totalPrice * 5).toLocaleString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span>10장 구매:</span>
                  <span className='font-bold'>₩{(config.totalPrice * 10).toLocaleString()}</span>
                </div>
              </div>
              <p className='text-sm text-gray-500 mt-4'>※ 대량 구매 할인 없음 (고정 가격)</p>
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                checked={config.isActive}
                onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                className='w-4 h-4 text-blue-600'
              />
              <label className='ml-2 text-sm text-gray-700'>활성화</label>
            </div>
          </div>

          <div className='flex gap-4 mt-8'>
            <button
              onClick={handleSave}
              className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold'
            >
              저장
            </button>
            <button
              onClick={() => window.history.back()}
              className='flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold'
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
