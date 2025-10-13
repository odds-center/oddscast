'use client';

import { useState, useEffect } from 'react';

interface SubscriptionPlan {
  id: string;
  planName: string;
  displayName: string;
  description: string;
  originalPrice: number;
  vat: number;
  totalPrice: number;
  baseTickets: number;
  bonusTickets: number;
  totalTickets: number;
  isActive: boolean;
  sortOrder: number;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // TODO: API 호출
      // const response = await fetch('/api/subscription-plans');
      // const data = await response.json();
      // setPlans(data);

      // 임시 데이터
      setPlans([
        {
          id: '1',
          planName: 'LIGHT',
          displayName: '라이트 플랜',
          description: '매월 11장 (10장 + 보너스 1장)',
          originalPrice: 9000,
          vat: 900,
          totalPrice: 9900,
          baseTickets: 10,
          bonusTickets: 1,
          totalTickets: 11,
          isActive: true,
          sortOrder: 1,
        },
        {
          id: '2',
          planName: 'PREMIUM',
          displayName: '프리미엄 플랜',
          description: '매월 24장 (20장 + 보너스 4장)',
          originalPrice: 18000,
          vat: 1800,
          totalPrice: 19800,
          baseTickets: 20,
          bonusTickets: 4,
          totalTickets: 24,
          isActive: true,
          sortOrder: 2,
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('플랜 조회 실패:', error);
      setLoading(false);
    }
  };

  const handleSave = async (plan: SubscriptionPlan) => {
    try {
      // TODO: API 호출
      // await fetch(`/api/subscription-plans/${plan.id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(plan),
      // });

      alert('저장되었습니다');
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      alert('저장 실패');
    }
  };

  if (loading) {
    return <div className='p-8'>로딩 중...</div>;
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>구독 플랜 관리</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {plans.map((plan) => (
            <div key={plan.id} className='bg-white rounded-lg shadow p-6'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>{plan.displayName}</h2>
                  <p className='text-sm text-gray-500'>{plan.planName}</p>
                </div>
                <button
                  onClick={() => setEditingPlan(plan)}
                  className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                >
                  수정
                </button>
              </div>

              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>원가</span>
                  <span className='font-semibold'>₩{plan.originalPrice.toLocaleString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>부가세 (10%)</span>
                  <span className='font-semibold'>₩{plan.vat.toLocaleString()}</span>
                </div>
                <div className='flex justify-between border-t pt-2'>
                  <span className='text-gray-900 font-bold'>최종 가격</span>
                  <span className='text-xl font-bold text-blue-600'>
                    ₩{plan.totalPrice.toLocaleString()}
                  </span>
                </div>

                <div className='border-t pt-3 mt-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>기본 예측권</span>
                    <span className='font-semibold'>{plan.baseTickets}장</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>보너스</span>
                    <span className='font-semibold text-green-600'>+{plan.bonusTickets}장</span>
                  </div>
                  <div className='flex justify-between border-t pt-2 mt-2'>
                    <span className='text-gray-900 font-bold'>총 예측권</span>
                    <span className='text-lg font-bold'>{plan.totalTickets}장</span>
                  </div>
                </div>

                <div className='flex justify-between border-t pt-2 mt-2'>
                  <span className='text-gray-600'>장당 가격</span>
                  <span className='font-semibold'>
                    ₩{Math.round(plan.totalPrice / plan.totalTickets).toLocaleString()}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span className='text-gray-600'>개별 구매 대비</span>
                  <span className='font-semibold text-green-600'>
                    {Math.round(
                      ((plan.totalTickets * 1100 - plan.totalPrice) / (plan.totalTickets * 1100)) *
                        100
                    )}
                    % 할인
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 수정 모달 */}
        {editingPlan && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4'>
            <div className='bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto'>
              <h2 className='text-2xl font-bold mb-6'>{editingPlan.displayName} 수정</h2>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    원가 (VAT 제외)
                  </label>
                  <input
                    type='number'
                    value={editingPlan.originalPrice}
                    onChange={(e) => {
                      const original = parseFloat(e.target.value);
                      const vat = Math.round(original * 0.1);
                      const total = original + vat;
                      setEditingPlan({
                        ...editingPlan,
                        originalPrice: original,
                        vat,
                        totalPrice: total,
                      });
                    }}
                    className='w-full px-4 py-2 border rounded-lg'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    부가세 (10%)
                  </label>
                  <input
                    type='number'
                    value={editingPlan.vat}
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
                    value={editingPlan.totalPrice}
                    disabled
                    className='w-full px-4 py-2 border rounded-lg bg-gray-100 font-bold text-lg'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      기본 예측권
                    </label>
                    <input
                      type='number'
                      value={editingPlan.baseTickets}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          baseTickets: parseInt(e.target.value),
                          totalTickets: parseInt(e.target.value) + editingPlan.bonusTickets,
                        })
                      }
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      보너스 예측권
                    </label>
                    <input
                      type='number'
                      value={editingPlan.bonusTickets}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          bonusTickets: parseInt(e.target.value),
                          totalTickets: editingPlan.baseTickets + parseInt(e.target.value),
                        })
                      }
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>총 예측권</label>
                  <input
                    type='number'
                    value={editingPlan.totalTickets}
                    disabled
                    className='w-full px-4 py-2 border rounded-lg bg-gray-100 font-bold'
                  />
                </div>

                <div className='bg-blue-50 p-4 rounded-lg'>
                  <div className='flex justify-between mb-2'>
                    <span>장당 가격:</span>
                    <span className='font-bold'>
                      ₩
                      {Math.round(
                        editingPlan.totalPrice / editingPlan.totalTickets
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>개별 구매 대비 할인:</span>
                    <span className='font-bold text-green-600'>
                      {Math.round(
                        ((editingPlan.totalTickets * 1100 - editingPlan.totalPrice) /
                          (editingPlan.totalTickets * 1100)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex gap-4 mt-8'>
                <button
                  onClick={() => handleSave(editingPlan)}
                  className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold'
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingPlan(null)}
                  className='flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold'
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
