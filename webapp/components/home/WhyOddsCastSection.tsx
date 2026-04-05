/**
 * "Why OddsCast" value proposition section — shown only for non-logged-in users.
 * 3-column feature highlights to explain the service.
 */
import Icon from '@/components/icons';
import Link from 'next/link';
import { routes } from '@/lib/routes';

const FEATURES = [
  {
    icon: 'BarChart2' as const,
    title: 'AI 데이터 분석',
    desc: '수학 기반 경주 분석으로 객관적인 예측 정보를 제공합니다.',
  },
  {
    icon: 'Target' as const,
    title: '예측률 공개',
    desc: '모든 예측 결과를 투명하게 공개하고, 정확도를 실시간 집계합니다.',
  },
  {
    icon: 'RefreshCw' as const,
    title: '자동 업데이트',
    desc: 'KRA 공식 데이터 기반으로 경주 정보와 결과를 자동 반영합니다.',
  },
] as const;

export default function WhyOddsCastSection() {
  return (
    <section className='rounded-[10px] border border-primary/15 bg-primary/4 p-4 md:p-5'>
      <h3 className='text-base font-bold text-foreground mb-3 flex items-center gap-1.5'>
        <Icon name='Sparkles' size={18} className='text-primary' />
        OddsCast는 이런 서비스입니다
      </h3>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        {FEATURES.map((f) => (
          <div key={f.title} className='flex gap-3 items-start'>
            <div className='w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5'>
              <Icon name={f.icon} size={18} className='text-primary' />
            </div>
            <div>
              <p className='text-sm font-bold text-foreground leading-snug'>{f.title}</p>
              <p className='text-xs text-text-secondary mt-0.5 leading-relaxed'>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className='flex items-center gap-2 mt-4 pt-3 border-t border-primary/10'>
        <Link
          href={routes.auth.register}
          className='inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark active:opacity-90 transition-colors touch-manipulation'
        >
          <Icon name='UserPlus' size={15} />
          무료 회원가입
        </Link>
        <Link
          href={routes.auth.login}
          className='inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white border border-stone-200 text-stone-700 text-sm font-semibold hover:border-stone-300 active:bg-stone-50 transition-colors touch-manipulation'
        >
          <Icon name='LogIn' size={15} />
          로그인
        </Link>
      </div>
    </section>
  );
}
