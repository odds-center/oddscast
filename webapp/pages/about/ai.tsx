/**
 * AI System Introduction Page — explains OddsCast's 15-factor AI prediction system
 */
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import Icon from '@/components/icons';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { ALL_FACTOR_KEYS, FACTOR_TERMS } from '@/lib/utils/factorTerms';

/** Step card for the usage guide */
function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className='flex gap-4 items-start'>
      <div className='shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
        {icon}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-xs text-primary font-semibold mb-0.5'>STEP {step}</p>
        <p className='text-sm font-semibold text-foreground mb-1'>{title}</p>
        <p className='text-xs text-text-secondary leading-relaxed'>{description}</p>
      </div>
    </div>
  );
}

/** Factor bar with weight visualization */
function FactorBar({ factorKey, maxWeight }: { factorKey: string; maxWeight: number }) {
  const term = FACTOR_TERMS[factorKey];
  if (!term) return null;
  const widthPct = (term.weight / maxWeight) * 100;
  const isHigh = term.weight >= 0.1;
  const isMedium = term.weight >= 0.05;

  return (
    <div className='group'>
      <div className='flex items-center justify-between mb-1'>
        <div className='flex items-center gap-2'>
          <span className={`text-sm font-medium ${isHigh ? 'text-foreground' : 'text-text-secondary'}`}>
            {term.label}
          </span>
          <span className='text-[11px] text-text-tertiary tabular-nums'>
            {(term.weight * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <div className='h-2.5 rounded-full bg-stone-100 overflow-hidden mb-1'>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? 'bg-emerald-500' : isMedium ? 'bg-teal-400' : 'bg-stone-400'
          }`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <p className='text-[11px] text-text-tertiary leading-relaxed'>{term.tooltip}</p>
    </div>
  );
}

export default function AboutAiPage() {
  const maxWeight = Math.max(...Object.values(FACTOR_TERMS).map((f) => f.weight));

  return (
    <Layout
      title='AI 예측 시스템 | OddsCast'
      description='OddsCast AI는 15가지 분석 요소를 종합하여 경마 예측을 제공합니다. 분석 방법과 사용법을 알아보세요.'
    >
      <CompactPageTitle title='AI 예측 시스템' backHref={routes.home} />

      {/* Hero */}
      <div className='rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-50 to-teal-50 border border-primary/10 p-5 mb-6'>
        <div className='flex items-center gap-3 mb-3'>
          <div className='w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center'>
            <Icon name='Sparkles' size={20} className='text-primary' />
          </div>
          <div>
            <h2 className='text-lg font-bold text-foreground'>OddsCast AI</h2>
            <p className='text-xs text-text-secondary'>15-Factor Prediction System</p>
          </div>
        </div>
        <p className='text-sm text-text-secondary leading-relaxed'>
          KRA 공식 경주 데이터를 기반으로 <span className='font-semibold text-foreground'>15가지 핵심 분석 요소</span>를
          종합 평가하고, Google Gemini AI의 정성적 분석을 더해 경주별 예측을 제공합니다.
        </p>
      </div>

      {/* How it works — 3 pillars */}
      <SectionCard title='분석 구조' icon='BarChart2' className='mb-6'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='rounded-xl border border-border p-4 text-center'>
            <div className='w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-2'>
              <Icon name='BarChart2' size={18} className='text-blue-600' />
            </div>
            <p className='text-sm font-semibold text-foreground mb-1'>수학적 분석</p>
            <p className='text-xs text-text-secondary leading-relaxed'>
              Python 기반 15가지 요소별 점수 산출. 가중 합산으로 종합 점수 0~100 도출.
            </p>
          </div>
          <div className='rounded-xl border border-border p-4 text-center'>
            <div className='w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-2'>
              <Icon name='Sparkles' size={18} className='text-violet-600' />
            </div>
            <p className='text-sm font-semibold text-foreground mb-1'>AI 정성 분석</p>
            <p className='text-xs text-text-secondary leading-relaxed'>
              Gemini AI가 기수-마필 궁합, 페이스 전개, 주로 바이어스 등 수치화 어려운 요소를 평가합니다.
            </p>
          </div>
          <div className='rounded-xl border border-border p-4 text-center'>
            <div className='w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2'>
              <Icon name='TrendingUp' size={18} className='text-amber-600' />
            </div>
            <p className='text-sm font-semibold text-foreground mb-1'>실시간 반영</p>
            <p className='text-xs text-text-secondary leading-relaxed'>
              경주 당일 마체중, 장비 변경, 출전 취소 등 실시간 데이터를 반영하여 예측을 갱신합니다.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 15 Factor breakdown */}
      <SectionCard title='15가지 분석 요소' icon='Target' description='가중치 높은 순' className='mb-6'>
        <p className='text-xs text-text-secondary mb-4 leading-relaxed'>
          각 요소는 경주 결과에 미치는 영향력에 따라 가중치가 배분됩니다.
          가중치 합계는 100%이며, 모든 출전마에 동일 기준으로 적용됩니다.
        </p>
        <div className='space-y-4'>
          {ALL_FACTOR_KEYS.map((key) => (
            <FactorBar key={key} factorKey={key} maxWeight={maxWeight} />
          ))}
        </div>
      </SectionCard>

      {/* Usage guide — Steps */}
      <SectionCard title='사용법 가이드' icon='ClipboardList' className='mb-6'>
        <div className='space-y-5'>
          <StepCard
            step={1}
            title='경주 선택'
            description='홈 화면이나 경주 목록에서 관심 있는 경주를 선택합니다. 경주 상세 페이지에서 출전마, 기수, 레이팅 등 기본 정보를 확인할 수 있습니다.'
            icon={<Icon name='Flag' size={18} className='text-primary' />}
          />
          <StepCard
            step={2}
            title='AI 예측 확인'
            description='예측권을 사용하면 AI 종합 점수, 추천 순위, 승식별 추천, AI 상세 분석을 확인할 수 있습니다. 경주 종료 후에는 무료로 공개됩니다.'
            icon={<Icon name='Sparkles' size={18} className='text-primary' />}
          />
          <StepCard
            step={3}
            title='세부 점수 분석'
            description='막대 차트에서 말 이름을 탭하면 15가지 요소별 세부 점수를 확인할 수 있습니다. 강점(초록)과 약점(회색)이 한눈에 보입니다.'
            icon={<Icon name='BarChart2' size={18} className='text-primary' />}
          />
          <StepCard
            step={4}
            title='시뮬레이터로 직접 분석'
            description='시뮬레이터에서 분석 요소의 가중치를 직접 조절하여 나만의 예측을 만들어볼 수 있습니다. AI 점수와 비교하며 감각을 키워보세요.'
            icon={<Icon name='Target' size={18} className='text-primary' />}
          />
        </div>
      </SectionCard>

      {/* Limitations disclaimer */}
      <SectionCard title='AI 예측의 한계' icon='AlertCircle' className='mb-6'>
        <div className='space-y-3 text-sm text-text-secondary leading-relaxed'>
          <p>
            OddsCast AI는 과거 데이터에 기반한 <span className='font-medium text-foreground'>통계적 분석 도구</span>이며,
            경주 결과를 보장하지 않습니다.
          </p>
          <div className='rounded-lg bg-stone-50 border border-border/50 p-3 space-y-2'>
            <p className='font-medium text-foreground text-xs'>AI가 예측할 수 없는 요소:</p>
            <ul className='text-xs space-y-1 text-text-secondary'>
              <li className='flex items-start gap-2'>
                <span className='text-stone-400 mt-0.5'>&#x2022;</span>
                <span>경주 당일 경주마와 기수의 컨디션 변화</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-stone-400 mt-0.5'>&#x2022;</span>
                <span>갑작스러운 날씨 변화와 주로 상태 급변</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-stone-400 mt-0.5'>&#x2022;</span>
                <span>출발 게이트에서의 돌발 상황 (출발 불량, 낙마 등)</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-stone-400 mt-0.5'>&#x2022;</span>
                <span>경주 데이터가 부족한 신예마(데뷔 1~2전)의 능력</span>
              </li>
            </ul>
          </div>
          <p>
            AI의 수학적 분석과 함께 <span className='font-medium text-foreground'>당일 마체중 변화, 예시장 움직임</span> 등을
            직접 확인하시면 더 정확한 판단에 도움이 됩니다.
          </p>
        </div>
      </SectionCard>

      {/* CTA buttons */}
      <div className='flex flex-col sm:flex-row gap-3 mb-8'>
        <Link href={routes.predictions.accuracy} className='flex-1'>
          <button type='button' className='btn-secondary w-full'>
            <Icon name='TrendingUp' size={16} />
            적중률 확인
          </button>
        </Link>
        <Link href={routes.races.list} className='flex-1'>
          <button type='button' className='btn-primary w-full'>
            <Icon name='Sparkles' size={16} />
            AI 예측 보러가기
          </button>
        </Link>
      </div>
    </Layout>
  );
}
