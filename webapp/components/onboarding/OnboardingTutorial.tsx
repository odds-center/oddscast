'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Icon, { type IconName } from '@/components/icons';
import { setOnboardingDoneLocal } from './onboardingUtils';

interface Slide {
  icon: IconName;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'Flag',
    title: '경주',
    description: '날짜별 경주 목록과 출전마 정보를 확인하세요.',
  },
  {
    icon: 'ClipboardList',
    title: '종합 예측',
    description: 'AI 종합 예상표로 하루 경주를 한눈에 볼 수 있습니다. 종합 예측권 1장으로 해당 날짜 전체 열람.',
  },
  {
    icon: 'Trophy',
    title: '결과',
    description: '경주 결과와 순위를 확인하고, AI 예측 정확도도 함께 볼 수 있습니다.',
  },
  {
    icon: 'User',
    title: '정보',
    description: '예측권, 구독을 관리하고 알림 설정을 할 수 있습니다.',
  },
];

const SWIPE_THRESHOLD = 50;

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export default function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const finish = useCallback(() => {
    setOnboardingDoneLocal();
    onComplete();
  }, [onComplete]);

  const goNext = useCallback(() => {
    if (index < SLIDES.length - 1) {
      setIndex((i) => i + 1);
    } else {
      finish();
    }
  }, [index, finish]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = touchStartX.current;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) >= SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, [goNext, goPrev]);

  // Keyboard: Arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, finish]);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className='fixed inset-0 z-9999 flex flex-col bg-background text-foreground'
      style={{ touchAction: 'pan-y' }}
      role='dialog'
      aria-modal='true'
      aria-label='첫 이용 가이드'
    >
      <div className='flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-12'>
        <button
          type='button'
          onClick={finish}
          className='absolute right-4 top-4 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-stone-200 hover:text-foreground'
          aria-label='건너뛰기'
        >
          건너뛰기
        </button>

        <div
          className='flex w-full max-w-sm flex-1 flex-col items-center justify-center'
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className='mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-muted'>
            <Icon name={slide.icon} size={48} className='text-primary' />
          </div>
          <h2 className='mb-3 text-center text-xl font-bold text-foreground'>{slide.title}</h2>
          <p className='text-center text-base text-text-secondary'>{slide.description}</p>
        </div>

        <div className='mt-6 flex w-full max-w-sm flex-col gap-3'>
          <div className='flex justify-center gap-2'>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type='button'
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-primary' : 'w-2 bg-stone-300'
                }`}
                aria-label={`${i + 1}번째 슬라이드`}
                aria-current={i === index ? 'true' : undefined}
              />
            ))}
          </div>
          <div className='flex gap-3'>
            {index > 0 ? (
              <button
                type='button'
                onClick={goPrev}
                className='flex-1 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground'
              >
                이전
              </button>
            ) : null}
            <button
              type='button'
              onClick={goNext}
              className='flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white hover:bg-primary-dark'
            >
              {isLast ? '시작하기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
