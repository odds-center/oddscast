import { useEffect } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { adminAIConfigApi } from '@/lib/api/admin';
import { Bot, Zap, DollarSign, Settings as SettingsIcon } from 'lucide-react';

// Zod 스키마 (OpenAI 전용)
const aiConfigSchema = z.object({
  llmProvider: z.enum(['openai']),
  primaryModel: z.enum(['gpt-4-turbo', 'gpt-4', 'gpt-4o', 'gpt-3.5-turbo']),
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

// 모델 정보 (OpenAI 전용)
const MODEL_INFO = {
  'gpt-4-turbo': { cost: 54, speed: 4, accuracy: 30, provider: 'openai' },
  'gpt-4': { cost: 90, speed: 3, accuracy: 31, provider: 'openai' },
  'gpt-4o': { cost: 15, speed: 5, accuracy: 29, provider: 'openai' },
  'gpt-3.5-turbo': { cost: 10, speed: 5, accuracy: 24, provider: 'openai' },
};

// 비용 전략 (OpenAI 전용)
const COST_STRATEGIES = {
  premium: {
    name: 'Premium',
    cost: 30240,
    accuracy: 30,
    description: 'GPT-4만 사용 (최고 정확도)',
  },
  balanced: {
    name: 'Balanced',
    cost: 18360,
    accuracy: 27,
    description: 'GPT-4 + GPT-3.5 혼용 (추천)',
  },
  budget: { name: 'Budget', cost: 12960, accuracy: 24, description: 'GPT-3.5 위주 (최저 비용)' },
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
      llmProvider: 'openai',
      primaryModel: 'gpt-4-turbo',
      fallbackModels: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
      costStrategy: 'balanced',
      temperature: 0.7,
      maxTokens: 1000,
      enableCaching: true,
      cacheTTL: 3600,
      enableBatchPrediction: true,
      batchCronSchedule: '0 9 * * *',
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
        llmProvider: configData.llmProvider || 'openai',
        primaryModel: configData.primaryModel || 'gpt-4-turbo',
        fallbackModels: configData.fallbackModels || ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
        costStrategy: configData.costStrategy || 'balanced',
        temperature: configData.temperature || 0.7,
        maxTokens: configData.maxTokens || 1000,
        enableCaching: configData.enableCaching !== undefined ? configData.enableCaching : true,
        cacheTTL: configData.cacheTTL || 3600,
        enableBatchPrediction:
          configData.enableBatchPrediction !== undefined ? configData.enableBatchPrediction : true,
        batchCronSchedule: configData.batchCronSchedule || '0 9 * * *',
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

  // Provider는 항상 OpenAI (변경 불필요)

  if (configLoading) {
    return (
      <>
        <Head>
          <title>AI 설정 | GoldenRace Admin</title>
        </Head>
        <Layout>
          <div className='p-8'>로딩 중...</div>
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
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>AI 예측 설정</h1>
            <p className='mt-2 text-sm text-gray-600'>
              LLM 모델, 비용 전략, 캐싱 등의 AI 시스템 설정을 관리합니다 (DB 저장)
            </p>
          </div>

          {/* 통계 카드 */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white'>
              <div className='flex items-center gap-3 mb-4'>
                <DollarSign className='w-8 h-8' />
                <h3 className='text-lg font-semibold'>예상 비용</h3>
              </div>
              <div className='space-y-3'>
                <div>
                  <div className='text-sm opacity-90'>
                    월간 (캐싱 {watchedEnableCaching ? 'ON' : 'OFF'})
                  </div>
                  <div className='text-3xl font-bold'>₩{estimatedMonthlyCost.toLocaleString()}</div>
                </div>
                <div className='text-sm opacity-90'>전략: {selectedStrategy.name}</div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white'>
              <div className='flex items-center gap-3 mb-4'>
                <Zap className='w-8 h-8' />
                <h3 className='text-lg font-semibold'>예상 정확도</h3>
              </div>
              <div className='space-y-3'>
                <div>
                  <div className='text-sm opacity-90'>1위 예측 정확도</div>
                  <div className='text-3xl font-bold'>{selectedStrategy.accuracy}%</div>
                </div>
                <div className='text-sm opacity-90'>
                  모델:{' '}
                  {MODEL_INFO[
                    watchedPrimaryModel as keyof typeof MODEL_INFO
                  ].provider.toUpperCase()}
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white'>
              <div className='flex items-center gap-3 mb-4'>
                <Bot className='w-8 h-8' />
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
              {/* LLM Provider (OpenAI 전용) */}
              <div>
                <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                  <Bot className='w-5 h-5' />
                  LLM Provider (OpenAI 전용)
                </h3>
                <div className='bg-blue-50 border-2 border-blue-500 rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-semibold text-blue-900'>OpenAI GPT-4o</div>
                      <div className='text-sm text-blue-700'>GPT-4 Turbo, GPT-4, GPT-3.5</div>
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
                  <SettingsIcon className='w-5 h-5' />
                  모델 설정
                </h3>
                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>주 모델</label>
                    <select
                      {...register('primaryModel')}
                      className='w-full px-4 py-2 border rounded-lg'
                    >
                      <option value='gpt-4-turbo'>GPT-4 Turbo (추천, ₩54)</option>
                      <option value='gpt-4o'>GPT-4o (빠름, ₩15)</option>
                      <option value='gpt-4'>GPT-4 (느림, ₩90)</option>
                      <option value='gpt-3.5-turbo'>GPT-3.5 Turbo (저렴, ₩10)</option>
                    </select>
                    <div className='mt-2 text-sm text-gray-500'>
                      비용: ₩{MODEL_INFO[watchedPrimaryModel as keyof typeof MODEL_INFO].cost} /
                      예상 정확도:{' '}
                      {MODEL_INFO[watchedPrimaryModel as keyof typeof MODEL_INFO].accuracy}%
                    </div>
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
                    <p className='text-xs text-gray-500 mt-1'>0 9 * * * = 매일 오전 9시</p>
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

          {/* 도움말 */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
            <h4 className='font-semibold text-blue-900 mb-3'>💡 설정 가이드 (OpenAI 전용)</h4>
            <div className='space-y-2 text-sm text-blue-800'>
              <p>
                <strong>• Premium 전략:</strong> GPT-4만 사용, 최고 정확도 (30%), 월 ₩30,240
              </p>
              <p>
                <strong>• Balanced 전략 (추천):</strong> GPT-4 + GPT-3.5 혼용, 정확도 27%, 월
                ₩18,360
              </p>
              <p>
                <strong>• Budget 전략:</strong> GPT-3.5 위주, 정확도 24%, 월 ₩12,960
              </p>
              <p className='mt-3 pt-3 border-t border-blue-200'>
                <strong>⚠️ 캐싱 활성화 시:</strong> 실제 비용은 1% 수준 (월 ₩300 내외)
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
