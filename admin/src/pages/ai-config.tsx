import { useEffect } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import PageLoading from '@/components/common/PageLoading';
import { adminAIConfigApi } from '@/lib/api/admin';
import { Bot, Zap, DollarSign, Settings as SettingsIcon } from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';

// Zod 스키마 (Gemini 전용)
const aiConfigSchema = z.object({
  llmProvider: z.enum(['gemini']),
  primaryModel: z.string().min(1, '모델을 선택하세요'),
  fallbackModels: z.array(z.string()),
  costStrategy: z.enum(['premium', 'balanced', 'budget']),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().min(100).max(4000),
  enableCaching: z.boolean(),
  cacheTTL: z.number().int().min(0),
  enableBatchPrediction: z.boolean(),
  batchCronSchedule: z.string(),
  enableAutoUpdate: z.boolean(),
  updateIntervalMinutes: z.number().int().min(1),
  oddsChangeThreshold: z.number().min(0).max(100),
  promptVersion: z.string(),
  systemPromptTemplate: z.string().optional(),
});

type AIConfigFormData = z.infer<typeof aiConfigSchema>;

// 모델 정보 (Gemini - Admin에서 선택 가능)
const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (권장)', cost: 5, accuracy: 29 },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (실험)', cost: 5, accuracy: 28 },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', cost: 12, accuracy: 30 },
  { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro 002', cost: 12, accuracy: 30 },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', cost: 4, accuracy: 27 },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', cost: 2, accuracy: 24 },
  { id: 'gemini-pro', name: 'Gemini Pro (레거시)', cost: 8, accuracy: 25 },
] as const;

const MODEL_INFO: Record<string, { cost: number; speed: number; accuracy: number; provider: string }> = {
  'gemini-2.5-flash': { cost: 5, speed: 5, accuracy: 29, provider: 'gemini' },
  'gemini-2.0-flash-exp': { cost: 5, speed: 5, accuracy: 28, provider: 'gemini' },
  'gemini-1.5-pro': { cost: 12, speed: 4, accuracy: 30, provider: 'gemini' },
  'gemini-1.5-pro-002': { cost: 12, speed: 4, accuracy: 30, provider: 'gemini' },
  'gemini-1.5-flash': { cost: 4, speed: 5, accuracy: 27, provider: 'gemini' },
  'gemini-1.5-flash-8b': { cost: 2, speed: 5, accuracy: 24, provider: 'gemini' },
  'gemini-pro': { cost: 8, speed: 4, accuracy: 25, provider: 'gemini' },
};

/** 예상 비용 계산 설명 텍스트 */
function getCostCalculationText(
  primaryModel: string,
  enableCaching: boolean,
  estimatedMonthly: number
): string {
  const modelCost = MODEL_INFO[primaryModel]?.cost ?? 5; // 기본 gemini-2.5-flash
  const racesPerMonth = 50; // 금/토/일 × 4주 ≈ 50경기
  const rawMonthly = modelCost * racesPerMonth;
  if (enableCaching) {
    return `경주당 ₩${modelCost} × ${racesPerMonth}경기/월 × 1%(캐싱) ≈ ₩${estimatedMonthly.toLocaleString()}`;
  }
  return `경주당 ₩${modelCost} × ${racesPerMonth}경기/월 ≈ ₩${rawMonthly.toLocaleString()} (캐싱 ON 시 99%↓)`;
}

// 비용 전략 (Gemini 전용) — 기본 gemini-2.5-flash
const COST_STRATEGIES = {
  premium: {
    name: 'Premium',
    cost: 7200,
    accuracy: 30,
    description: 'Gemini 1.5 Pro (최고 정확도)',
  },
  balanced: {
    name: 'Balanced',
    cost: 3600,
    accuracy: 29,
    description: 'Gemini 2.5 Flash 기본 (권장)',
  },
  budget: {
    name: 'Budget',
    cost: 1200,
    accuracy: 25,
    description: 'Gemini Flash 위주 (최저 비용)',
  },
};

export default function AIConfigPage() {
  const queryClient = useQueryClient();

  // AI 설정 조회
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => adminAIConfigApi.getConfig(),
  });

  // react-hook-form 설정
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<AIConfigFormData>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      llmProvider: 'gemini',
      primaryModel: 'gemini-2.5-flash',
      fallbackModels: ['gemini-2.0-flash-exp', 'gemini-1.5-flash'],
      costStrategy: 'balanced',
      temperature: 0.7,
      maxTokens: 1000,
      enableCaching: true,
      cacheTTL: 3600,
      enableBatchPrediction: true,
      batchCronSchedule: '0 9 * * 5,6,0',
      enableAutoUpdate: true,
      updateIntervalMinutes: 10,
      oddsChangeThreshold: 10,
      promptVersion: 'v1.0.0',
      systemPromptTemplate: '',
    },
  });

  // 서버에서 데이터 로드 시 폼에 설정
  useEffect(() => {
    if (configData) {
      reset({
        llmProvider: configData.llmProvider || 'gemini',
        primaryModel: configData.primaryModel || 'gemini-2.5-flash',
        fallbackModels: configData.fallbackModels || ['gemini-2.0-flash-exp', 'gemini-1.5-flash'],
        costStrategy: configData.costStrategy || 'balanced',
        temperature: configData.temperature || 0.7,
        maxTokens: configData.maxTokens || 1000,
        enableCaching: configData.enableCaching !== undefined ? configData.enableCaching : true,
        cacheTTL: configData.cacheTTL || 3600,
        enableBatchPrediction:
          configData.enableBatchPrediction !== undefined ? configData.enableBatchPrediction : true,
        batchCronSchedule: configData.batchCronSchedule || '0 9 * * 5,6,0',
        enableAutoUpdate:
          configData.enableAutoUpdate !== undefined ? configData.enableAutoUpdate : true,
        updateIntervalMinutes: configData.updateIntervalMinutes || 10,
        oddsChangeThreshold: configData.oddsChangeThreshold || 10,
        promptVersion: configData.promptVersion || 'v1.0.0',
        systemPromptTemplate: configData.systemPromptTemplate || '',
      });
    }
  }, [configData, reset]);

  // watch
  const watchedPrimaryModel = watch('primaryModel');
  const watchedCostStrategy = watch('costStrategy');
  const watchedEnableCaching = watch('enableCaching');

  // 비용 계산
  const selectedStrategy = COST_STRATEGIES[watchedCostStrategy];
  const estimatedMonthlyCost = watchedEnableCaching
    ? Math.round(selectedStrategy.cost * 0.01) // 99% 절감
    : selectedStrategy.cost;

  // 설정 저장 mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: AIConfigFormData) => adminAIConfigApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      toast.success('설정이 저장되었습니다');
    },
    onError: (error) => {
      console.error('저장 실패:', error);
      toast.error('저장에 실패했습니다');
    },
  });

  // 폼 제출
  const onSubmit = (data: AIConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  // Provider는 항상 Gemini (변경 불필요)

  if (configLoading) {
    return (
      <>
        <Head>
          <title>AI 설정 | GoldenRace Admin</title>
        </Head>
        <Layout>
          <PageLoading label='AI 설정을 불러오는 중...' />
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>AI 설정 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='AI 예측 설정'
            description='LLM 모델, 비용 전략, 캐싱 등의 AI 시스템 설정을 관리합니다 (DB 저장)'
          />

          {/* 통계 카드 */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            <div className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-md shadow p-4 text-white'>
              <div className='flex items-center gap-3 mb-4'>
                <AdminIcon icon={DollarSign} className='w-8 h-8' />
                <h3 className='text-lg font-semibold'>예상 비용</h3>
              </div>
              <div className='space-y-3'>
                <div>
                  <div className='text-sm opacity-90'>
                    월간 (캐싱 {watchedEnableCaching ? 'ON' : 'OFF'})
                  </div>
                  <div className='text-lg font-bold'>₩{estimatedMonthlyCost.toLocaleString()}</div>
                </div>
                <div className='text-sm opacity-90'>전략: {selectedStrategy.name}</div>
                <div className='text-xs opacity-80 pt-2 border-t border-white/30'>
                  {getCostCalculationText(
                    watchedPrimaryModel,
                    watchedEnableCaching,
                    estimatedMonthlyCost
                  )}
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-green-500 to-green-600 rounded-md shadow p-4 text-white'>
              <div className='flex items-center gap-3 mb-4'>
                <AdminIcon icon={Zap} className='w-8 h-8' />
                <h3 className='text-lg font-semibold'>예상 정확도</h3>
              </div>
              <div className='space-y-3'>
                <div>
                  <div className='text-sm opacity-90'>1위 예측 정확도</div>
                  <div className='text-lg font-bold'>{selectedStrategy.accuracy}%</div>
                </div>
                <div className='text-sm opacity-90'>
                  모델:{' '}
                  {MODEL_INFO[watchedPrimaryModel]?.provider?.toUpperCase() ?? 'GEMINI'}
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-purple-500 to-purple-600 rounded-md shadow p-4 text-white'>
              <div className='flex items-center gap-3 mb-4'>
                <AdminIcon icon={Bot} className='w-8 h-8' />
                <h3 className='text-lg font-semibold'>시스템 상태</h3>
              </div>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span>배치 예측</span>
                  <span className='font-bold'>{watch('enableBatchPrediction') ? 'ON' : 'OFF'}</span>
                </div>
                <div className='flex justify-between'>
                  <span>자동 업데이트</span>
                  <span className='font-bold'>{watch('enableAutoUpdate') ? 'ON' : 'OFF'}</span>
                </div>
                <div className='flex justify-between'>
                  <span>캐싱</span>
                  <span className='font-bold'>{watch('enableCaching') ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 설정 폼 */}
          <div className='bg-white rounded-lg shadow p-8'>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
              {/* LLM Provider (Gemini 전용) */}
              <div>
                <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                  <AdminIcon icon={Bot} className='w-5 h-5' />
                  LLM Provider (Google Gemini)
                </h3>
                <div className='bg-blue-50 border-2 border-blue-500 rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-semibold text-blue-900'>Google Gemini</div>
                      <div className='text-sm text-blue-700'>
                        Gemini 1.5 Pro, 1.5 Flash, Pro (무료 tier + 저비용)
                      </div>
                    </div>
                    <div className='px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full'>
                      활성화
                    </div>
                  </div>
                </div>
              </div>

              {/* 모델 설정 */}
              <div className='border-t pt-8'>
                <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                  <AdminIcon icon={SettingsIcon} className='w-5 h-5' />
                  모델 설정
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>주 모델</label>
                    <select
                      {...register('primaryModel')}
                      className='w-full px-4 py-2 border rounded-lg'
                    >
                      {GEMINI_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (₩{m.cost} / 정확도 {m.accuracy}%)
                        </option>
                      ))}
                    </select>
                    <div className='mt-2 text-sm text-gray-500'>
                      {MODEL_INFO[watchedPrimaryModel] ? (
                        <>
                          비용: ₩{MODEL_INFO[watchedPrimaryModel].cost} / 예상 정확도:{' '}
                          {MODEL_INFO[watchedPrimaryModel].accuracy}%
                        </>
                      ) : (
                        '선택한 모델: ' + watchedPrimaryModel
                      )}
                    </div>
                    {errors.primaryModel && (
                      <p className='text-red-500 text-sm mt-1'>{errors.primaryModel.message}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Temperature
                    </label>
                    <input
                      type='number'
                      step='0.1'
                      {...register('temperature', { valueAsNumber: true })}
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      0.7 권장 (낮을수록 일관성, 높을수록 창의성)
                    </p>
                    {errors.temperature && (
                      <p className='text-red-500 text-sm mt-1'>{errors.temperature.message}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Max Tokens
                    </label>
                    <input
                      type='number'
                      {...register('maxTokens', { valueAsNumber: true })}
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                    <p className='text-xs text-gray-500 mt-1'>1000 권장</p>
                    {errors.maxTokens && (
                      <p className='text-red-500 text-sm mt-1'>{errors.maxTokens.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 비용 최적화 전략 */}
              <div className='border-t pt-8'>
                <h3 className='text-lg font-semibold mb-4'>비용 최적화 전략 (서버 기반)</h3>
                <div className='grid grid-cols-2 gap-4'>
                  {Object.entries(COST_STRATEGIES).map(([key, strategy]) => (
                    <label
                      key={key}
                      className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer ${
                        watch('costStrategy') === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type='radio'
                        {...register('costStrategy')}
                        value={key}
                        className='sr-only'
                      />
                      <div className='flex items-start justify-between mb-2'>
                        <div className='font-semibold'>{strategy.name}</div>
                        {watch('costStrategy') === key && (
                          <div className='w-4 h-4 bg-blue-500 rounded-full'></div>
                        )}
                      </div>
                      <div className='text-sm text-gray-600 mb-3'>{strategy.description}</div>
                      <div className='space-y-1 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>월 비용:</span>
                          <span className='font-semibold'>₩{strategy.cost.toLocaleString()}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>예상 정확도:</span>
                          <span className='font-semibold'>{strategy.accuracy}%</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 캐싱 설정 */}
              <div className='border-t pt-8'>
                <h3 className='text-lg font-semibold mb-4'>캐싱 설정 (99% 비용 절감)</h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-yellow-50 rounded-lg'>
                    <div>
                      <div className='font-medium text-yellow-900'>캐싱 활성화 (필수 권장)</div>
                      <div className='text-sm text-yellow-700'>
                        같은 경주 중복 예측 방지 → 비용 99% 절감
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        {...register('enableCaching')}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      캐시 TTL (초)
                    </label>
                    <input
                      type='number'
                      {...register('cacheTTL', { valueAsNumber: true })}
                      disabled={!watch('enableCaching')}
                      className='w-full px-4 py-2 border rounded-lg disabled:bg-gray-100'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      권장: 3600초 (1시간) - 경주 시작 전까지 캐시 유지
                    </p>
                  </div>
                </div>
              </div>

              {/* 배치 예측 */}
              <div className='border-t pt-8'>
                <h3 className='text-lg font-semibold mb-4'>배치 예측 (사전 생성)</h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>배치 예측 활성화</div>
                      <div className='text-sm text-gray-500'>
                        오전 9시 자동 예측 → 사용자 응답 속도 100배 향상
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        {...register('enableBatchPrediction')}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Cron 스케줄
                    </label>
                    <input
                      type='text'
                      {...register('batchCronSchedule')}
                      disabled={!watch('enableBatchPrediction')}
                      className='w-full px-4 py-2 border rounded-lg font-mono disabled:bg-gray-100'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      0 9 * * 5,6,0 = 금/토/일 09:00 (경기일)
                    </p>
                  </div>
                </div>
              </div>

              {/* 자동 업데이트 */}
              <div className='border-t pt-8'>
                <h3 className='text-lg font-semibold mb-4'>자동 업데이트</h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>자동 업데이트 활성화</div>
                      <div className='text-sm text-gray-500'>배당률 급변 시 예측 자동 갱신</div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        {...register('enableAutoUpdate')}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        업데이트 간격 (분)
                      </label>
                      <input
                        type='number'
                        {...register('updateIntervalMinutes', { valueAsNumber: true })}
                        disabled={!watch('enableAutoUpdate')}
                        className='w-full px-4 py-2 border rounded-lg disabled:bg-gray-100'
                      />
                      <p className='text-xs text-gray-500 mt-1'>10분 권장</p>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        배당률 변화 임계값 (%)
                      </label>
                      <input
                        type='number'
                        {...register('oddsChangeThreshold', { valueAsNumber: true })}
                        disabled={!watch('enableAutoUpdate')}
                        className='w-full px-4 py-2 border rounded-lg disabled:bg-gray-100'
                      />
                      <p className='text-xs text-gray-500 mt-1'>10% 권장</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 프롬프트 설정 */}
              <div className='border-t pt-8'>
                <h3 className='text-lg font-semibold mb-4'>프롬프트 설정</h3>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      프롬프트 버전
                    </label>
                    <input
                      type='text'
                      {...register('promptVersion')}
                      className='w-full px-4 py-2 border rounded-lg'
                      placeholder='v1.0.0'
                    />
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className='flex gap-4 pt-8 border-t'>
                <button
                  type='submit'
                  disabled={updateConfigMutation.isPending || !isDirty}
                  className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {updateConfigMutation.isPending ? '저장 중...' : '설정 저장 (DB에 저장)'}
                </button>
                <button
                  type='button'
                  onClick={() => window.location.reload()}
                  className='px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold'
                >
                  초기화
                </button>
              </div>
            </form>
          </div>

          {/* 도움말 & 예상 비용 계산 */}
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
            <h4 className='font-semibold text-blue-900 mb-3'>💡 설정 가이드 & 예상 비용 계산</h4>
            <div className='space-y-2 text-sm text-blue-800'>
              <p>
                <strong>• Premium 전략:</strong> Gemini 1.5 Pro만 사용, 최고 정확도 (30%), 월 ₩7,200
              </p>
              <p>
                <strong>• Balanced 전략 (추천):</strong> Gemini 2.5 Flash 기본, 정확도 29%, 월 ₩3,600
              </p>
              <p>
                <strong>• Budget 전략:</strong> Flash 위주, 정확도 25%, 월 ₩1,200
              </p>
              <div className='mt-3 pt-3 border-t border-blue-200'>
                <strong>📊 예상 비용 계산식</strong>
                <pre className='mt-2 p-2 bg-white rounded text-xs overflow-x-auto'>
{`경주당 비용(모델별) × 월 경기 수(≈50) = 월 비용(캐싱 OFF)
  - gemini-2.5-flash (권장): ₩5 × 50 = ₩250
  - gemini-1.5-pro: ₩12 × 50 = ₩600
  - gemini-1.5-flash: ₩4 × 50 = ₩200

캐싱 ON 시: 위 금액 × 1% ≈ 월 ₩2~₩6 (99% 절감)
무료 tier(1,500 RPD) 내면 $0`}
                </pre>
              </div>
              <p className='mt-2'>
                <strong>⚠️ 캐싱 활성화 시:</strong> 실제 비용은 1% 수준. 무료 tier (1,500 RPD)
                활용 가능
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
