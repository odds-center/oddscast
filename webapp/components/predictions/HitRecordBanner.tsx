/**
 * Hit record banner — Yongsan comprehensive style
 * Top rolling/announcement banner
 */
import type { HitRecordDto } from '@/lib/api/predictionMatrixApi';
import Icon from '@/components/icons';

export interface HitRecordBannerProps {
  records: HitRecordDto[];
}

export default function HitRecordBanner({ records }: HitRecordBannerProps) {
  if (!records.length) return null;

  return (
    <div className='rounded-xl border border-stone-200 bg-stone-50 overflow-hidden mb-4'>
      <div className='flex items-center gap-2.5 px-4 py-2.5 border-b border-border'>
        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm'>
          <Icon name='Trophy' size={13} />
          HIT
        </span>
        <span className='font-semibold text-stone-700 text-sm'>최근 적중 기록</span>
      </div>
      <div className='divide-y divide-border'>
        {records.map((r) => (
          <div key={r.id} className='px-4 py-2.5 text-sm'>
            <p className='font-medium text-foreground'>{r.description}</p>
            {r.details && (
              <p className='text-text-secondary text-xs mt-0.5'>{r.details}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
