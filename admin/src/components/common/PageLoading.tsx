import LoadingSpinner from './LoadingSpinner';

interface PageLoadingProps {
  /** 추가 설명 (예: "데이터를 불러오는 중...") */
  label?: string;
  /** 패딩 크기 */
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = {
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-16',
};

/**
 * 전체 페이지 로딩 시 사용하는 로딩 영역
 * LoadingSpinner + optional label
 */
export default function PageLoading({ label = '로딩 중...', padding = 'md' }: PageLoadingProps) {
  return (
    <div className={`flex items-center justify-center w-full ${paddingMap[padding]}`}>
      <LoadingSpinner size='lg' label={label} />
    </div>
  );
}
